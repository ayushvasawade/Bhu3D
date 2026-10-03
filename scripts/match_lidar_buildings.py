import laspy
import json
import numpy as np
from shapely.geometry import Polygon, Point
from shapely.strtree import STRtree
import math

laz_path = r'C:\Dev Drive\Bhu3D\f8601d6d-142b-4343-abd0-84d85e09b02b.laz'
las = laspy.read(laz_path)
n_pts = len(las.points)

# Read coordinates
x = np.array(las.x)
y = np.array(las.y)
z = np.array(las.z)
classes = np.array(las.classification)
intensities = np.array(las.intensity)

print(f"Loaded {n_pts} points. X range: [{x.min():.1f}, {x.max():.1f}], Y range: [{y.min():.1f}, {y.max():.1f}], Z range: [{z.min():.2f}, {z.max():.2f}]")

# Load OSM buildings
with open('scripts/la_osm_buildings.json', 'r', encoding='utf-8') as f:
    osm_data = json.load(f)

nodes = {el['id']: (el['lon'], el['lat']) for el in osm_data.get('elements', []) if el['type'] == 'node'}
ways = [el for el in osm_data.get('elements', []) if el['type'] == 'way' and 'building' in el.get('tags', {})]

def wgs84_to_mercator(lon, lat):
    mx = lon * 20037508.34 / 180.0
    my = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) / (math.pi / 180.0)
    my = my * 20037508.34 / 180.0
    return mx, my

buildings = []
for w in ways:
    nd_refs = w.get('nodes', [])
    if len(nd_refs) < 3:
        continue
    coords_wgs84 = [nodes[nid] for nid in nd_refs if nid in nodes]
    if len(coords_wgs84) < 3:
        continue
    coords_3857 = [wgs84_to_mercator(lon, lat) for lon, lat in coords_wgs84]
    poly_3857 = Polygon(coords_3857)
    if not poly_3857.is_valid:
        poly_3857 = poly_3857.buffer(0)
    if poly_3857.is_empty:
        continue
    tags = w.get('tags', {})
    name = tags.get('name', tags.get('addr:housenumber', '') + ' ' + tags.get('addr:street', f"Building {w['id']}"))
    buildings.append({
        'id': w['id'],
        'name': name.strip() or f"Building {w['id']}",
        'poly_3857': poly_3857,
        'coords_wgs84': coords_wgs84,
        'tags': tags,
        'bounds': poly_3857.bounds
    })

print(f"Filtering points for {len(buildings)} buildings...")

# Test points in bounding boxes
polys = [b['poly_3857'] for b in buildings]
tree = STRtree(polys)

# For performance, sample or batch check
building_point_counts = {b['id']: 0 for b in buildings}
building_z_stats = {b['id']: [] for b in buildings}

# Quick bounding box filter
# Find ground datum around the tile
ground_z = z[classes == 2]
base_ground_mean = float(np.median(ground_z))
print(f"Global ground datum median: {base_ground_mean:.2f}m AMSL (10th percentile: {np.percentile(ground_z, 10):.2f}m, 90th percentile: {np.percentile(ground_z, 90):.2f}m)")

# For each building, query points within its bounding box, then precise polygon containment
building_summary = []
for b in buildings:
    minx, miny, maxx, maxy = b['bounds']
    mask_box = (x >= minx) & (x <= maxx) & (y >= miny) & (y <= maxy)
    idx_box = np.where(mask_box)[0]
    if len(idx_box) == 0:
        continue
    
    poly = b['poly_3857']
    # Check containment
    sub_x = x[idx_box]
    sub_y = y[idx_box]
    sub_z = z[idx_box]
    sub_c = classes[idx_box]
    
    # Vectorized point in polygon
    pts = [Point(px, py) for px, py in zip(sub_x, sub_y)]
    inside_mask = np.array([poly.contains(pt) for pt in pts])
    
    b_pts_idx = idx_box[inside_mask]
    n_in = len(b_pts_idx)
    if n_in < 10:
        continue
    
    b_z = sub_z[inside_mask]
    b_c = sub_c[inside_mask]
    
    # Local ground elevation from Class 2 points or footprint buffer
    local_ground = ground_z[(x[classes == 2] >= minx - 10) & (x[classes == 2] <= maxx + 10) & 
                            (y[classes == 2] >= miny - 10) & (y[classes == 2] <= maxy + 10)]
    local_ground_z = float(np.median(local_ground)) if len(local_ground) > 0 else base_ground_mean
    
    z_max = float(np.max(b_z))
    z_95 = float(np.percentile(b_z, 95))
    height_above_ground = max(0.0, z_max - local_ground_z)
    
    tags = b['tags']
    tag_height = float(tags['height']) if 'height' in tags and tags['height'].replace('.', '', 1).isdigit() else None
    tag_levels = int(tags['building:levels']) if 'building:levels' in tags and tags['building:levels'].isdigit() else None
    
    # Estimated floors based on observed LiDAR height
    inferred_floors = tag_levels if tag_levels else max(1, int(round(height_above_ground / 3.4)))
    
    building_summary.append({
        'id': b['id'],
        'name': b['name'],
        'point_count': n_in,
        'local_ground_z': local_ground_z,
        'z_max': z_max,
        'z_95': z_95,
        'height_m': height_above_ground,
        'area_sqm': poly.area,
        'tag_height': tag_height,
        'tag_levels': tag_levels,
        'inferred_floors': inferred_floors,
        'center_wgs84': [poly.centroid.x, poly.centroid.y] # Mercator
    })

print(f"Matched {len(building_summary)} buildings with LiDAR returns.")
building_summary.sort(key=lambda s: s['point_count'], reverse=True)
for i, s in enumerate(building_summary[:20]):
    print(f"#{i+1}: ID {s['id']} | '{s['name']}' | Points: {s['point_count']} | Area: {s['area_sqm']:.1f} m² | LiDAR Height: {s['height_m']:.2f} m | OSM Height: {s['tag_height']} | Floors: {s['inferred_floors']}")
