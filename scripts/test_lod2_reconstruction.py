import json, math, struct
import numpy as np
import laspy
from shapely.geometry import Polygon, Point, box
import trimesh

LAZ_PATH = r'C:\Dev Drive\Bhu3D\f8601d6d-142b-4343-abd0-84d85e09b02b.laz'
OSM_PATH = 'scripts/la_osm_buildings.json'

CENTER_LON = -118.260903
CENTER_LAT = 34.037095

def wgs84_to_mercator(lon, lat):
    mx = lon * 20037508.34 / 180.0
    my = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) / (math.pi / 180.0)
    my = my * 20037508.34 / 180.0
    return mx, my

CENTER_MX, CENTER_MY = wgs84_to_mercator(CENTER_LON, CENTER_LAT)
cos_lat0 = math.cos(math.radians(CENTER_LAT))

def mercator_to_local_enu(mx, my):
    dx = (mx - CENTER_MX) * cos_lat0
    dy = (my - CENTER_MY) * cos_lat0
    return dx, dy

print("Loading LAZ points...")
las = laspy.read(LAZ_PATH)
x_3857 = np.array(las.x, dtype=np.float64)
y_3857 = np.array(las.y, dtype=np.float64)
z_vals = np.array(las.z, dtype=np.float32)
classes = np.array(las.classification, dtype=np.uint8)

ground_pts_mask = (classes == 2)
ground_x = x_3857[ground_pts_mask]
ground_y = y_3857[ground_pts_mask]
ground_z = z_vals[ground_pts_mask]

with open(OSM_PATH, 'r') as f:
    osm_data = json.load(f)

nodes = {el['id']: (el['lon'], el['lat']) for el in osm_data.get('elements', []) if el['type'] == 'node'}
ways = [el for el in osm_data.get('elements', []) if el['type'] == 'way' and 'building' in el.get('tags', {})]

target_ids = [428128017, 428383020, 428128033, 491697756]

for w in ways:
    if w['id'] not in target_ids:
        continue
    coords_wgs84 = [nodes[nid] for nid in w['nodes'] if nid in nodes]
    coords_3857 = [wgs84_to_mercator(lon, lat) for lon, lat in coords_wgs84]
    poly_3857 = Polygon(coords_3857)
    if not poly_3857.is_valid:
        poly_3857 = poly_3857.buffer(0)
    
    # 1. Outward ring buffer ground estimation (2m to 15m)
    ring_outer = poly_3857.buffer(15.0)
    ring_inner = poly_3857.buffer(2.0)
    ground_ring = ring_outer.difference(ring_inner)
    
    minx, miny, maxx, maxy = ring_outer.bounds
    sub_g_mask = (ground_x >= minx) & (ground_x <= maxx) & (ground_y >= miny) & (ground_y <= maxy)
    cand_gx = ground_x[sub_g_mask]
    cand_gy = ground_y[sub_g_mask]
    cand_gz = ground_z[sub_g_mask]
    
    ring_pts = [Point(px, py) for px, py in zip(cand_gx, cand_gy)]
    in_ring = np.array([ground_ring.contains(pt) for pt in ring_pts])
    ring_gz = cand_gz[in_ring]
    
    if len(ring_gz) >= 5:
        # 15th percentile ground
        local_ground = float(np.percentile(ring_gz, 15))
    else:
        local_ground = float(np.median(cand_gz)) if len(cand_gz) > 0 else 72.17
        
    # 2. Extract building LiDAR points
    b_minx, b_miny, b_maxx, b_maxy = poly_3857.bounds
    sub_b_mask = (x_3857 >= b_minx) & (x_3857 <= b_maxx) & (y_3857 >= b_miny) & (y_3857 <= b_maxy)
    b_x = x_3857[sub_b_mask]
    b_y = y_3857[sub_b_mask]
    b_z = z_vals[sub_b_mask]
    b_cls = classes[sub_b_mask]
    
    b_pts = [Point(px, py) for px, py in zip(b_x, b_y)]
    inside_poly = np.array([poly_3857.contains(pt) for pt in b_pts])
    
    in_x = b_x[inside_poly]
    in_y = b_y[inside_poly]
    in_z = b_z[inside_poly]
    in_cls = b_cls[inside_poly]
    
    # Filter roof points: >= local_ground + 2.0m, exclude noise (cls==7)
    roof_filter = (in_z >= local_ground + 2.0) & (in_cls != 7)
    r_z = in_z[roof_filter]
    r_x = in_x[roof_filter]
    r_y = in_y[roof_filter]
    
    # Statistical Outlier Removal on roof points
    if len(r_z) > 20:
        p99 = np.percentile(r_z, 99.5)
        clean_mask = (r_z <= p99)
        r_z = r_z[clean_mask]
        r_x = r_x[clean_mask]
        r_y = r_y[clean_mask]
        
    rel_h = r_z - local_ground
    bld_h = float(np.max(rel_h)) if len(rel_h) > 0 else 5.0
    
    # 3. Multi-tier detection: 1D histogram clustering
    hist, edges = np.histogram(rel_h, bins=max(5, int((np.max(rel_h) - np.min(rel_h)) / 1.0)))
    peaks = []
    for i in range(len(hist)):
        is_left_smaller = (i == 0) or (hist[i] >= hist[i-1])
        is_right_smaller = (i == len(hist) - 1) or (hist[i] >= hist[i+1])
        if is_left_smaller and is_right_smaller and hist[i] >= len(r_z) * 0.05 and hist[i] >= 15:
            tier_h = (edges[i] + edges[i+1]) / 2.0
            peaks.append((tier_h, hist[i]))
            
    print(f"\nBuilding Way {w['id']}: Area={poly_3857.area * (cos_lat0**2):.1f}m2, Ground={local_ground:.2f}m, Peak H={bld_h:.2f}m, RoofPts={len(r_z)}")
    print(f"  Detected Roof Tiers ({len(peaks)}):")
    for t_h, cnt in peaks:
        print(f"    Tier H = {t_h:.2f}m ({cnt} pts, {cnt/len(r_z)*100:.1f}%)")
