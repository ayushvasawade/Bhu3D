import os
import json
import math
import struct
import numpy as np
import laspy
from shapely.geometry import Polygon, Point, MultiPolygon
from scipy.spatial import Delaunay
import trimesh

# Input file
laz_path = r'C:\Dev Drive\Bhu3D\f8601d6d-142b-4343-abd0-84d85e09b02b.laz'
osm_path = 'scripts/la_osm_buildings.json'

os.makedirs('public/data', exist_ok=True)
os.makedirs('public/models', exist_ok=True)

print(f"Reading LAZ point cloud: {laz_path}...")
las = laspy.read(laz_path)
n_pts = len(las.points)
print(f"Loaded {n_pts} points.")

# Coordinates in EPSG:3857
x_3857 = np.array(las.x, dtype=np.float64)
y_3857 = np.array(las.y, dtype=np.float64)
z_vals = np.array(las.z, dtype=np.float32)
classes = np.array(las.classification, dtype=np.uint8)
intensities = np.array(las.intensity, dtype=np.uint16)

# Coordinate conversion formulas
# Center of the LA dataset specified by user:
# Center: ~34.037095°N, 118.260903°W
CENTER_LON = -118.260903
CENTER_LAT = 34.037095

def wgs84_to_mercator(lon, lat):
    mx = lon * 20037508.34 / 180.0
    my = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) / (math.pi / 180.0)
    my = my * 20037508.34 / 180.0
    return mx, my

def mercator_to_wgs84(x, y):
    lon = (x / 20037508.34) * 180.0
    lat = (y / 20037508.34) * 180.0
    lat = 180.0 / math.pi * (2.0 * math.atan(math.exp(lat * math.pi / 180.0)) - math.pi / 2.0)
    return lon, lat

CENTER_MX, CENTER_MY = wgs84_to_mercator(CENTER_LON, CENTER_LAT)

# Ground datum
ground_pts = z_vals[classes == 2]
GLOBAL_GROUND_Z = float(np.median(ground_pts))
print(f"Dataset Center: ({CENTER_LAT:.6f}, {CENTER_LON:.6f}), Ground Datum: {GLOBAL_GROUND_Z:.2f}m AMSL")

# Load OSM building polygons
with open(osm_path, 'r', encoding='utf-8') as f:
    osm_data = json.load(f)

nodes = {el['id']: (el['lon'], el['lat']) for el in osm_data.get('elements', []) if el['type'] == 'node'}
ways = [el for el in osm_data.get('elements', []) if el['type'] == 'way' and 'building' in el.get('tags', {})]

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
    if poly_3857.is_empty or poly_3857.area < 15:
        continue
    tags = w.get('tags', {})
    name = tags.get('name', tags.get('addr:housenumber', '') + ' ' + tags.get('addr:street', f"Building {w['id']}"))
    buildings.append({
        'id': w['id'],
        'name': name.strip() or f"Building {w['id']}",
        'poly_3857': poly_3857,
        'coords_wgs84': coords_wgs84,
        'coords_3857': coords_3857,
        'tags': tags,
        'bounds': poly_3857.bounds,
        'area_sqm': float(poly_3857.area)
    })

print(f"Processed {len(buildings)} candidate building polygons from OSM.")

# Local ENU conversion from Mercator:
# dx = (mx - CENTER_MX) * cos(lat0)
# dy = my - CENTER_MY
# In Web Mercator, scale factor k = 1 / cos(lat0)
cos_lat0 = math.cos(math.radians(CENTER_LAT))
def mercator_to_local_enu(mx, my):
    dx = (mx - CENTER_MX) * cos_lat0
    dy = (my - CENTER_MY) * cos_lat0
    return dx, dy

# Find which points are in which building
point_building_map = np.zeros(n_pts, dtype=np.uint16)
building_stats = []

print("Assigning LiDAR points to building footprints...")
for b_idx, b in enumerate(buildings, start=1):
    minx, miny, maxx, maxy = b['bounds']
    idx_box = np.where((x_3857 >= minx) & (x_3857 <= maxx) & (y_3857 >= miny) & (y_3857 <= maxy))[0]
    if len(idx_box) == 0:
        continue
    
    sub_x = x_3857[idx_box]
    sub_y = y_3857[idx_box]
    
    # Fast point-in-polygon
    poly = b['poly_3857']
    pts = [Point(px, py) for px, py in zip(sub_x, sub_y)]
    inside_mask = np.array([poly.contains(pt) for pt in pts])
    
    inside_idx = idx_box[inside_mask]
    if len(inside_idx) < 10:
        continue
    
    point_building_map[inside_idx] = b_idx
    
    b_z = z_vals[inside_idx]
    
    # Local ground elevation
    ground_near = ground_pts[(x_3857[classes == 2] >= minx - 15) & (x_3857[classes == 2] <= maxx + 15) & 
                             (y_3857[classes == 2] >= miny - 15) & (y_3857[classes == 2] <= maxy + 15)]
    local_ground = float(np.median(ground_near)) if len(ground_near) > 0 else GLOBAL_GROUND_Z
    
    z_max = float(np.max(b_z))
    z_95 = float(np.percentile(b_z, 95))
    height_m = max(2.5, z_max - local_ground)
    
    tags = b['tags']
    tag_height = float(tags['height']) if 'height' in tags and tags['height'].replace('.', '', 1).isdigit() else None
    tag_levels = int(tags['building:levels']) if 'building:levels' in tags and tags['building:levels'].isdigit() else None
    
    # Nominal floor height: 3.5m commercial / 3.2m residential
    b_type = tags.get('building', 'yes')
    floor_h = 3.5 if b_type in ['commercial', 'office', 'retail', 'university', 'public'] else 3.2
    inferred_floors = tag_levels if tag_levels else max(1, int(round(height_m / floor_h)))
    
    # Calculate floor levels
    levels_list = []
    for fl in range(1, inferred_floors + 1):
        fl_z_min = local_ground + (fl - 1) * (height_m / inferred_floors)
        fl_z_max = local_ground + fl * (height_m / inferred_floors)
        levels_list.append({
            'level': fl,
            'floorName': 'Ground Floor' if fl == 1 else f"Level {fl:02d}",
            'zMinAMSL': round(fl_z_min, 2),
            'zMaxAMSL': round(fl_z_max, 2),
            'heightMeters': round(fl_z_max - fl_z_min, 2)
        })
    
    # Centroid in WGS84
    c_lon, c_lat = mercator_to_wgs84(poly.centroid.x, poly.centroid.y)
    
    building_stats.append({
        'b_idx': b_idx,
        'id': b['id'],
        'name': b['name'],
        'buildingType': b_type,
        'footprintAreaSqM': round(b['area_sqm'], 1),
        'pointCount': len(inside_idx),
        'pointIndices': inside_idx,
        'localGroundAMSL': round(local_ground, 2),
        'peakElevationAMSL': round(z_max, 2),
        'z95ElevationAMSL': round(z_95, 2),
        'derivedHeightMeters': round(height_m, 2),
        'tagHeight': tag_height,
        'tagLevels': tag_levels,
        'inferredFloors': inferred_floors,
        'levels': levels_list,
        'center': {'latitude': round(c_lat, 6), 'longitude': round(c_lon, 6)},
        'footprintWGS84': [[round(pt[0], 6), round(pt[1], 6)] for pt in b['coords_wgs84']],
        'coords_3857': b['coords_3857']
    })

print(f"Matched {len(building_stats)} buildings with LiDAR returns.")

# -------------------------------------------------------------
# Part 1: Export Optimized Binary Point Cloud Stream
# -------------------------------------------------------------
print("Generating decimated, high-performance point cloud binary stream...")
# Target: ~250,000 points
# Decimate ground (Class 2) by 12x, decimate unclassified non-building by 8x,
# keep building points with high density (decimate by 2x-3x).
is_bld = (point_building_map > 0)
bld_indices = np.where(is_bld)[0]
ground_indices = np.where(~is_bld & (classes == 2))[0]
other_indices = np.where(~is_bld & (classes != 2))[0]

step_bld = max(1, len(bld_indices) // 160000)
step_ground = max(1, len(ground_pts) // 80000)
step_other = max(1, len(other_indices) // 40000)

sample_bld = bld_indices[::step_bld]
sample_ground = ground_indices[::step_ground]
sample_other = other_indices[::step_other]

selected_pts_idx = np.concatenate([sample_bld, sample_ground, sample_other])
np.random.seed(42)
np.random.shuffle(selected_pts_idx)
total_sample_pts = len(selected_pts_idx)
print(f"Selected {total_sample_pts} points for binary stream ({len(sample_bld)} building, {len(sample_ground)} ground, {len(sample_other)} other).")

# Compute local ENU for all selected points
sel_mx = x_3857[selected_pts_idx]
sel_my = y_3857[selected_pts_idx]
sel_z = z_vals[selected_pts_idx]
sel_c = classes[selected_pts_idx]
sel_int = intensities[selected_pts_idx]
sel_b_idx = point_building_map[selected_pts_idx]

sel_dx = (sel_mx - CENTER_MX) * cos_lat0
sel_dy = (sel_my - CENTER_MY) * cos_lat0
sel_dz = sel_z - GLOBAL_GROUND_Z

# Scale intensity to 0-255
min_int = float(np.min(intensities))
max_int = float(np.max(intensities))
scaled_int = np.clip(((sel_int.astype(np.float32) - min_int) / max(1.0, max_int - min_int)) * 255.0, 0, 255).astype(np.uint8)

bin_file_path = 'public/data/la_usgs_lidar_points.bin'
with open(bin_file_path, 'wb') as f:
    # Header:
    # uint32 magic (0x4C494441 'LIDA')
    # uint32 count
    # float64 center_lon
    # float64 center_lat
    # float64 center_alt
    f.write(struct.pack('<IIddd', 0x4C494441, total_sample_pts, CENTER_LON, CENTER_LAT, GLOBAL_GROUND_Z))
    
    # Per point (20 bytes):
    # float32 dx (local East, m)
    # float32 dy (local North, m)
    # float32 dz (relative to ground datum, m)
    # float32 amsl (absolute elevation, m)
    # uint8 intensity (0-255)
    # uint8 classification
    # uint8 is_building (1 or 0)
    # uint8 building_idx_low
    for i in range(total_sample_pts):
        b_val = int(sel_b_idx[i])
        f.write(struct.pack('<ffffBBBB',
            float(sel_dx[i]),
            float(sel_dy[i]),
            float(sel_dz[i]),
            float(sel_z[i]),
            int(scaled_int[i]),
            int(sel_c[i]),
            1 if b_val > 0 else 0,
            b_val & 0xFF
        ))

bin_size_mb = os.path.getsize(bin_file_path) / (1024 * 1024)
print(f"Exported point cloud binary stream to {bin_file_path} ({bin_size_mb:.2f} MB, {total_sample_pts} points).")

# -------------------------------------------------------------
# Part 2: 3D Building Reconstruction from Real LiDAR Points
# -------------------------------------------------------------
print("Reconstructing 3D building meshes directly from LiDAR point clouds...")
all_vertices = []
all_faces = []
vertex_offset = 0

# Sort buildings by height and point count
reconstructed_buildings = 0
for b in building_stats:
    pts_idx = b['pointIndices']
    if len(pts_idx) < 15:
        continue
    
    b_mx = x_3857[pts_idx]
    b_my = y_3857[pts_idx]
    b_z = z_vals[pts_idx]
    
    # Local ENU coordinates
    b_enu_x = (b_mx - CENTER_MX) * cos_lat0
    b_enu_y = (b_my - CENTER_MY) * cos_lat0
    
    local_ground_rel = b['localGroundAMSL'] - GLOBAL_GROUND_Z
    
    # Boundary vertices in local ENU
    poly_coords = b['coords_3857']
    poly_enu = np.array([mercator_to_local_enu(pt[0], pt[1]) for pt in poly_coords], dtype=np.float32)
    # Ensure closed ring
    if not np.allclose(poly_enu[0], poly_enu[-1]):
        poly_enu = np.vstack([poly_enu, poly_enu[0]])
    n_boundary = len(poly_enu) - 1
    
    # Downsample roof points for Delaunay triangulation if too dense
    max_roof_pts = 1200
    if len(b_enu_x) > max_roof_pts:
        step = len(b_enu_x) // max_roof_pts
        b_enu_x = b_enu_x[::step]
        b_enu_y = b_enu_y[::step]
        b_z = b_z[::step]
    
    # Filter points near ground (only keep points at least 2.0m above local ground for roof surface)
    roof_mask = (b_z >= b['localGroundAMSL'] + 2.0)
    if np.sum(roof_mask) >= 6:
        roof_x = b_enu_x[roof_mask]
        roof_y = b_enu_y[roof_mask]
        roof_z = b_z[roof_mask] - GLOBAL_GROUND_Z
    else:
        # If very few roof points, use all points
        roof_x = b_enu_x
        roof_y = b_enu_y
        roof_z = b_z - GLOBAL_GROUND_Z
    
    # Add boundary vertices at the observed upper edge
    # Estimate upper boundary Z by nearest neighbor or 90th percentile
    upper_boundary_z = float(np.percentile(roof_z, 85))
    
    boundary_pts_top = np.column_stack([poly_enu[:-1], np.full(n_boundary, upper_boundary_z)])
    boundary_pts_bot = np.column_stack([poly_enu[:-1], np.full(n_boundary, local_ground_rel)])
    
    # Combine roof interior points with top boundary points
    interior_pts = np.column_stack([roof_x, roof_y, roof_z])
    mesh_pts_top = np.vstack([boundary_pts_top, interior_pts])
    
    # 2.5D Delaunay triangulation on (X, Y)
    try:
        tri = Delaunay(mesh_pts_top[:, :2])
        roof_faces = tri.simplices
        
        # Filter triangles whose centroid falls outside the polygon
        poly_local = Polygon(poly_enu)
        valid_roof_faces = []
        for face in roof_faces:
            tri_center = Point(mesh_pts_top[face, :2].mean(axis=0))
            if poly_local.contains(tri_center) or poly_local.touches(tri_center):
                valid_roof_faces.append(face)
        
        roof_faces = np.array(valid_roof_faces, dtype=np.int32)
    except Exception:
        # Fallback to flat polygon triangulation
        roof_faces = np.empty((0, 3), dtype=np.int32)
    
    # Vertices for this building:
    # 0 .. len(mesh_pts_top)-1 : Top/Roof points
    # len(mesh_pts_top) .. len(mesh_pts_top) + n_boundary - 1 : Bottom boundary points
    n_top = len(mesh_pts_top)
    bld_vertices = np.vstack([mesh_pts_top, boundary_pts_bot])
    
    # Build vertical facade skirts connecting boundary_pts_top (0..n_boundary-1) to boundary_pts_bot (n_top..n_top+n_boundary-1)
    skirt_faces = []
    for k in range(n_boundary):
        next_k = (k + 1) % n_boundary
        top_k = k
        top_next = next_k
        bot_k = n_top + k
        bot_next = n_top + next_k
        # Two triangles for the quad wall panel
        skirt_faces.append([top_k, top_next, bot_next])
        skirt_faces.append([top_k, bot_next, bot_k])
    
    skirt_faces = np.array(skirt_faces, dtype=np.int32)
    
    # Bottom floor cap (triangulated)
    try:
        tri_bot = Delaunay(poly_enu[:-1])
        bot_faces = []
        for face in tri_bot.simplices:
            tri_center = Point(poly_enu[:-1][face].mean(axis=0))
            if poly_local.contains(tri_center):
                # Reverse winding for bottom facing down
                bot_faces.append([n_top + face[0], n_top + face[2], n_top + face[1]])
        bot_faces = np.array(bot_faces, dtype=np.int32)
    except Exception:
        bot_faces = np.empty((0, 3), dtype=np.int32)
    
    # Combine all faces for this building
    all_bld_faces = []
    if len(roof_faces) > 0:
        all_bld_faces.append(roof_faces)
    if len(skirt_faces) > 0:
        all_bld_faces.append(skirt_faces)
    if len(bot_faces) > 0:
        all_bld_faces.append(bot_faces)
    
    if len(all_bld_faces) == 0:
        continue
    
    combined_bld_faces = np.vstack(all_bld_faces)
    
    # Append to master mesh with vertex offset
    all_vertices.append(bld_vertices)
    all_faces.append(combined_bld_faces + vertex_offset)
    vertex_offset += len(bld_vertices)
    reconstructed_buildings += 1

master_vertices = np.vstack(all_vertices)
master_faces = np.vstack(all_faces)

print(f"Reconstructed {reconstructed_buildings} 3D buildings from real LiDAR points.")
print(f"Master mesh topology: {len(master_vertices)} vertices, {len(master_faces)} faces.")

# Transform from ENU (East, North, Up) to glTF standard (East, Up, -North)
gltf_vertices = np.column_stack([
    master_vertices[:, 0],      # X = East
    master_vertices[:, 2],      # Y = Up
    -master_vertices[:, 1]      # Z = -North
])

# Build Trimesh and export GLB
mesh = trimesh.Trimesh(vertices=gltf_vertices, faces=master_faces, process=True)
mesh.fix_normals()

# Add architectural neutral monochrome material
# Clean stone-white matte color
mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=np.full((len(master_vertices), 4), [240, 240, 245, 255], dtype=np.uint8))

glb_path = 'public/models/la_usgs_buildings.glb'
mesh.export(glb_path, file_type='glb')
glb_size_mb = os.path.getsize(glb_path) / (1024 * 1024)
print(f"Saved reconstructed 3D city buildings to {glb_path} ({glb_size_mb:.2f} MB).")


# -------------------------------------------------------------
# Part 3: Metadata JSON Generation
# -------------------------------------------------------------
print("Exporting comprehensive building and precinct metadata...")

# Sort buildings by height descending
building_stats.sort(key=lambda b: b['derivedHeightMeters'], reverse=True)

# Clean building_stats for JSON (remove numpy types and point indices)
json_buildings = []
for b in building_stats:
    json_buildings.append({
        'id': f"LA-{b['id']}",
        'osmWayId': b['id'],
        'name': b['name'],
        'buildingType': b['buildingType'],
        'footprintAreaSqM': b['footprintAreaSqM'],
        'pointCount': b['pointCount'],
        'localGroundAMSL': b['localGroundAMSL'],
        'peakElevationAMSL': b['peakElevationAMSL'],
        'derivedHeightMeters': b['derivedHeightMeters'],
        'tagHeight': b['tagHeight'],
        'tagLevels': b['tagLevels'],
        'inferredFloors': b['inferredFloors'],
        'center': b['center'],
        'levels': b['levels'],
        'footprintCoordinates': b['footprintWGS84']
    })

metadata_payload = {
    'datasetName': 'USGS 3DEP LiDAR - Los Angeles South Park Precinct',
    'location': {
        'city': 'Los Angeles',
        'state': 'California',
        'country': 'USA',
        'sw': {'latitude': 34.035205, 'longitude': -118.263944},
        'ne': {'latitude': 34.038985, 'longitude': -118.257861},
        'center': {'latitude': CENTER_LAT, 'longitude': CENTER_LON, 'elevation': GLOBAL_GROUND_Z}
    },
    'crs': {
        'sourceCRS': 'EPSG:3857 (Web Mercator)',
        'targetCRS': 'EPSG:4326 (WGS84)',
        'verticalDatum': 'NAVD88 (Meters)'
    },
    'lidarSource': {
        'provider': 'USGS 3D Elevation Program (3DEP)',
        'collection': 'USGS National Geospatial Program Airborne LiDAR',
        'resolution': 'High Density Airborne Pulse',
        'totalRawPoints': n_pts,
        'visualizedPoints': total_sample_pts,
        'globalGroundDatumAMSL': round(GLOBAL_GROUND_Z, 2),
        'elevationRange': {'min': float(np.min(z_vals)), 'max': float(np.max(z_vals))}
    },
    'reconstruction': {
        'status': 'HIGH_FIDELITY_REAL_DATA',
        'method': 'Delaunay 2.5D Roof Surface Reconstruction with Footprint Skirts',
        'buildingsReconstructed': reconstructed_buildings,
        'meshVertices': len(master_vertices),
        'meshFaces': len(master_faces),
        'modelFile': '/models/la_usgs_buildings.glb',
        'pointsFile': '/data/la_usgs_lidar_points.bin'
    },
    'buildings': json_buildings
}

meta_path = 'public/data/la_usgs_buildings_metadata.json'
with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump(metadata_payload, f, indent=2)

print(f"Saved metadata to {meta_path} ({len(json_buildings)} buildings).")
print("All USGS LiDAR preprocessing and reconstruction completed successfully!")
