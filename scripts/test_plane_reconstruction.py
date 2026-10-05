import json, math, numpy as np, laspy, shapely, trimesh
from shapely.geometry import Polygon, MultiPoint, Point, box
from shapely.ops import unary_union

LAZ_PATH = r'C:\Dev Drive\Bhu3D\f8601d6d-142b-4343-abd0-84d85e09b02b.laz'
OSM_PATH = 'scripts/la_osm_buildings.json'

las = laspy.read(LAZ_PATH)
x_3857, y_3857, z_vals = np.array(las.x), np.array(las.y), np.array(las.z)

CENTER_LON, CENTER_LAT = -118.260903, 34.037095
def wgs84_to_mercator(lon, lat):
    mx = lon * 20037508.34 / 180.0
    my = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) / (math.pi / 180.0)
    my = my * 20037508.34 / 180.0
    return mx, my
CENTER_MX, CENTER_MY = wgs84_to_mercator(CENTER_LON, CENTER_LAT)
cos_lat0 = math.cos(math.radians(CENTER_LAT))

with open(OSM_PATH, 'r') as f: osm_data = json.load(f)
nodes = {el['id']: (el['lon'], el['lat']) for el in osm_data.get('elements', []) if el['type'] == 'node'}
ways = {el['id']: el for el in osm_data.get('elements', []) if el['type'] == 'way' and 'building' in el.get('tags', {})}

def segment_building_planes(pts_3d, poly_enu, local_ground_z, min_plane_points=80):
    """
    Multi-model RANSAC plane segmentation on 3D LiDAR points.
    Returns list of planes with normal, d, inliers, polygon, and classification.
    """
    pts = pts_3d.copy()
    remaining_idx = np.arange(len(pts))
    planes = []

    for _ in range(8):
        if len(remaining_idx) < min_plane_points:
            break
        cand_pts = pts[remaining_idx]
        best_inliers = []
        best_n = None
        best_d = 0

        # RANSAC iterations
        n_iters = min(250, max(50, len(cand_pts) // 20))
        for _ in range(n_iters):
            s_idx = np.random.choice(len(cand_pts), 3, replace=False)
            p1, p2, p3 = cand_pts[s_idx]
            v1, v2 = p2 - p1, p3 - p1
            n = np.cross(v1, v2)
            norm = np.linalg.norm(n)
            if norm < 1e-6:
                continue
            n = n / norm
            if n[2] < 0:
                n = -n
            d = -np.dot(n, p1)
            dists = np.abs(np.dot(cand_pts, n) + d)
            inliers = np.where(dists < 0.40)[0]
            if len(inliers) > len(best_inliers):
                best_inliers = inliers
                best_n = n
                best_d = d

        if len(best_inliers) < min_plane_points:
            break

        # Refine plane with SVD on inliers
        inlier_pts = cand_pts[best_inliers]
        centroid = np.mean(inlier_pts, axis=0)
        _, _, vh = np.linalg.svd(inlier_pts - centroid)
        refined_n = vh[2, :]
        if refined_n[2] < 0:
            refined_n = -refined_n
        refined_d = -np.dot(refined_n, centroid)

        # Residuals
        dists = np.abs(np.dot(inlier_pts, refined_n) + refined_d)
        rmse = float(np.sqrt(np.mean(dists ** 2)))
        tilt_deg = math.degrees(math.acos(np.clip(refined_n[2], -1.0, 1.0)))

        # Skip nearly vertical planes (facades/walls captured by angled pulses)
        if tilt_deg > 75.0:
            remaining_idx = np.delete(remaining_idx, best_inliers)
            continue

        # Extract 2D spatial footprint of inliers via 1.5m grid rasterization
        ix, iy = inlier_pts[:, 0], inlier_pts[:, 1]
        grid_res = 1.5
        min_gx, max_gx = ix.min() - 1, ix.max() + 1
        min_gy, max_gy = iy.min() - 1, iy.max() + 1
        
        ci = np.floor((ix - min_gx) / grid_res).astype(int)
        ri = np.floor((iy - min_gy) / grid_res).astype(int)
        occupied = set(zip(ci, ri))
        
        cell_boxes = [box(min_gx + c * grid_res, min_gy + r * grid_res, 
                          min_gx + (c + 1) * grid_res, min_gy + (r + 1) * grid_res) 
                      for c, r in occupied]
        plane_poly = unary_union(cell_boxes).buffer(0.3).intersection(poly_enu)
        
        if not plane_poly.is_valid or plane_poly.is_empty or plane_poly.area < 15.0:
            remaining_idx = np.delete(remaining_idx, best_inliers)
            continue

        z_mean_rel = float(centroid[2])
        planes.append({
            'normal': refined_n,
            'd': refined_d,
            'z_mean_rel': z_mean_rel,
            'elevation_amsl': z_mean_rel + local_ground_z,
            'point_count': len(inlier_pts),
            'area_sqm': float(plane_poly.area),
            'poly': plane_poly,
            'rmse': rmse,
            'tilt_deg': tilt_deg,
            'is_sloped': tilt_deg >= 5.0
        })

        remaining_idx = np.delete(remaining_idx, best_inliers)

    return planes

for bid in [428128033, 428128017, 491697758]:
    w = ways[bid]
    coords_wgs84 = [nodes[nid] for nid in w['nodes']]
    coords_3857 = [wgs84_to_mercator(lon, lat) for lon, lat in coords_wgs84]
    poly = Polygon(coords_3857)
    minx, miny, maxx, maxy = poly.bounds
    idx = np.where((x_3857 >= minx) & (x_3857 <= maxx) & (y_3857 >= miny) & (y_3857 <= maxy))[0]
    sub_x, sub_y, sub_z = x_3857[idx], y_3857[idx], z_vals[idx]
    in_poly = shapely.contains_xy(poly, sub_x, sub_y)

    px = (sub_x[in_poly] - CENTER_MX) * cos_lat0
    py = (sub_y[in_poly] - CENTER_MY) * cos_lat0
    pz = sub_z[in_poly]

    coords_enu = [((c[0]-CENTER_MX)*cos_lat0, (c[1]-CENTER_MY)*cos_lat0) for c in coords_3857]
    poly_enu = Polygon(coords_enu)

    # Local ground (e.g. 71.5m for 428128033, 73.4m for 428128017)
    local_ground_z = float(np.percentile(pz, 5))
    rel_h = pz - local_ground_z
    roof_mask = (rel_h >= 2.0) & (pz <= 135.0)

    pts_3d = np.column_stack([px[roof_mask], py[roof_mask], rel_h[roof_mask]])
    planes = segment_building_planes(pts_3d, poly_enu, local_ground_z)

    print(f'=== Building {bid} (OSM Area: {poly_enu.area:.1f} m2) ===')
    print(f'Detected {len(planes)} distinct roof planes:')
    for i, p in enumerate(planes):
        print(f'  Plane {i+1}: {p["point_count"]} pts, Area: {p["area_sqm"]:.1f} m2, Height: {p["z_mean_rel"]:.2f}m (AMSL: {p["elevation_amsl"]:.2f}m), Tilt: {p["tilt_deg"]:.1f} deg, RMSE: {p["rmse"]:.2f}m')
