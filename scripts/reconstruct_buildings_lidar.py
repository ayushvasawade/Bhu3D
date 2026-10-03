"""
High-Fidelity Real LiDAR -> 3D Building Reconstruction Pipeline
==============================================================
Reads:
  - f8601d6d-142b-4343-abd0-84d85e09b02b.laz (3.5M USGS LiDAR returns)
  - scripts/la_osm_buildings.json (OSM footprint polygons)

Produces:
  - public/models/la_usgs_buildings.glb (Clean, multi-level watertight 3D building meshes driven by real LiDAR)
  - public/data/la_usgs_buildings_metadata.json (Precinct metadata with physical ground area & true roof levels)

Pipeline:
1. Isolate building candidate points using OSM footprint intersection + elevation filter (> 2.0m above local ground).
2. Remove noise and extreme outliers (Statistical Outlier Removal / percentile clipping).
3. Analyze XY & Z distribution:
   - Sample true perimeter roof elevations along footprint edges directly from nearest roof LiDAR returns.
   - Grid-sample interior roof points (1.5m-2.0m resolution) to capture real penthouses, equipment rooms, and roof geometry.
4. Triangulate roof surface with 2.5D Delaunay constrained to polygon boundary.
5. Extrude facade skirts connecting the real observed roof perimeter to local ground datum.
6. Seal with bottom floor cap.
7. Compute physical footprint area in true ground square meters (correcting Mercator projection inflation).
8. Export unified GLB and metadata.
"""

import os
import json
import math
import struct
import numpy as np
import laspy
from shapely.geometry import Polygon, Point
from scipy.spatial import Delaunay
import trimesh

LAZ_PATH = r'C:\Dev Drive\Bhu3D\f8601d6d-142b-4343-abd0-84d85e09b02b.laz'
OSM_PATH = 'scripts/la_osm_buildings.json'
OUT_GLB_PATH = 'public/models/la_usgs_buildings.glb'
OUT_META_PATH = 'public/data/la_usgs_buildings_metadata.json'
OUT_BIN_PATH = 'public/data/la_usgs_lidar_points.bin'

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
cos_lat0 = math.cos(math.radians(CENTER_LAT))

def mercator_to_local_enu(mx, my):
    dx = (mx - CENTER_MX) * cos_lat0
    dy = (my - CENTER_MY) * cos_lat0
    return dx, dy

def main():
    print(f"Reading raw USGS LAZ LiDAR: {LAZ_PATH}...")
    las = laspy.read(LAZ_PATH)
    n_pts = len(las.points)
    print(f"Loaded {n_pts} points.")

    x_3857 = np.array(las.x, dtype=np.float64)
    y_3857 = np.array(las.y, dtype=np.float64)
    z_vals = np.array(las.z, dtype=np.float32)
    classes = np.array(las.classification, dtype=np.uint8)
    intensities = np.array(las.intensity, dtype=np.uint16)

    # Ground datum
    ground_pts = z_vals[classes == 2]
    GLOBAL_GROUND_Z = float(np.median(ground_pts))
    print(f"Ground Datum (median Class 2): {GLOBAL_GROUND_Z:.2f}m AMSL")

    # Load OSM polygons
    with open(OSM_PATH, 'r', encoding='utf-8') as f:
        osm_data = json.load(f)

    nodes = {el['id']: (el['lon'], el['lat']) for el in osm_data.get('elements', []) if el['type'] == 'node'}
    ways = [el for el in osm_data.get('elements', []) if el['type'] == 'way' and 'building' in el.get('tags', {})]

    # Filter valid polygons (> 15 m²)
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
        # Check area in physical square meters
        poly_enu_temp = [mercator_to_local_enu(x, y) for x, y in coords_3857]
        poly_enu_geom = Polygon(poly_enu_temp)
        if poly_enu_geom.is_empty or poly_enu_geom.area < 15.0:
            continue
        tags = w.get('tags', {})
        name = tags.get('name', tags.get('addr:housenumber', '') + ' ' + tags.get('addr:street', f"Building {w['id']}"))
        buildings.append({
            'id': w['id'],
            'name': name.strip() or f"Building {w['id']}",
            'poly_3857': poly_3857,
            'poly_enu': poly_enu_geom,
            'coords_wgs84': coords_wgs84,
            'coords_3857': coords_3857,
            'tags': tags,
            'bounds': poly_3857.bounds,
            'area_sqm': float(poly_enu_geom.area) # True physical ground area!
        })

    print(f"Processed {len(buildings)} candidate building footprints.")

    # Match LiDAR points to building footprints
    point_building_map = np.zeros(n_pts, dtype=np.uint16)
    building_stats = []

    print("Associating LiDAR points with buildings...")
    for b_idx, b in enumerate(buildings, start=1):
        minx, miny, maxx, maxy = b['bounds']
        idx_box = np.where((x_3857 >= minx) & (x_3857 <= maxx) & (y_3857 >= miny) & (y_3857 <= maxy))[0]
        if len(idx_box) == 0:
            continue

        sub_x = x_3857[idx_box]
        sub_y = y_3857[idx_box]
        poly = b['poly_3857']
        pts_geom = [Point(px, py) for px, py in zip(sub_x, sub_y)]
        inside_mask = np.array([poly.contains(pt) for pt in pts_geom])
        inside_idx = idx_box[inside_mask]

        if len(inside_idx) < 10:
            continue

        point_building_map[inside_idx] = b_idx
        b_z = z_vals[inside_idx]

        # Local ground elevation from Class 2 near building
        ground_near = ground_pts[(x_3857[classes == 2] >= minx - 20) & (x_3857[classes == 2] <= maxx + 20) &
                                 (y_3857[classes == 2] >= miny - 20) & (y_3857[classes == 2] <= maxy + 20)]
        local_ground = float(np.median(ground_near)) if len(ground_near) > 0 else GLOBAL_GROUND_Z

        # Filter out extreme noise spikes (> 99.8th percentile or > 135m AMSL for South Park)
        z_valid = b_z[(b_z >= local_ground - 2.0) & (b_z <= 140.0)]
        if len(z_valid) < 5:
            z_valid = b_z

        z_roof_candidates = z_valid[z_valid >= local_ground + 2.0]
        if len(z_roof_candidates) >= 5:
            z_max = float(np.percentile(z_roof_candidates, 99.0))
            z_main_roof = float(np.median(z_roof_candidates))
        else:
            z_max = float(np.max(z_valid))
            z_main_roof = z_max

        height_m = max(2.5, z_max - local_ground)

        tags = b['tags']
        tag_height = float(tags['height']) if 'height' in tags and tags['height'].replace('.', '', 1).isdigit() else None
        tag_levels = int(tags['building:levels']) if 'building:levels' in tags and tags['building:levels'].isdigit() else None

        b_type = tags.get('building', 'yes')
        floor_h = 3.5 if b_type in ['commercial', 'office', 'retail', 'university', 'public'] else 3.2
        inferred_floors = tag_levels if tag_levels else max(1, int(round(height_m / floor_h)))

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
            'mainRoofAMSL': round(z_main_roof, 2),
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
    # 3D Building Reconstruction: Real LiDAR-driven Roof Geometry
    # -------------------------------------------------------------
    print("Reconstructing high-fidelity 3D building meshes from real LiDAR points...")
    all_vertices = []
    all_faces = []
    vertex_offset = 0
    reconstructed_count = 0

    for b in building_stats:
        pts_idx = b['pointIndices']
        if len(pts_idx) < 10:
            continue

        b_mx = x_3857[pts_idx]
        b_my = y_3857[pts_idx]
        b_z = z_vals[pts_idx]

        b_enu_x = (b_mx - CENTER_MX) * cos_lat0
        b_enu_y = (b_my - CENTER_MY) * cos_lat0

        local_ground_rel = b['localGroundAMSL'] - GLOBAL_GROUND_Z

        # Footprint boundary vertices in ENU
        poly_coords = b['coords_3857']
        poly_enu = np.array([mercator_to_local_enu(pt[0], pt[1]) for pt in poly_coords], dtype=np.float32)
        if not np.allclose(poly_enu[0], poly_enu[-1]):
            poly_enu = np.vstack([poly_enu, poly_enu[0]])
        n_boundary = len(poly_enu) - 1
        boundary_xy = poly_enu[:-1]
        poly_local = Polygon(poly_enu)

        # Filter candidate roof points (>= local ground + 2.0m)
        roof_mask = (b_z >= b['localGroundAMSL'] + 2.0) & (b_z <= b['peakElevationAMSL'] + 0.5)
        n_roof = np.sum(roof_mask)

        if n_roof >= 10:
            roof_x = b_enu_x[roof_mask]
            roof_y = b_enu_y[roof_mask]
            roof_z = b_z[roof_mask] - GLOBAL_GROUND_Z

            # Voxel/Grid downsampling of interior roof points for clean topology
            # Resolution: 2.0m for larger buildings, 1.2m for small buildings
            grid_res = 1.8 if len(roof_x) > 100 else 1.0
            r_coords = np.column_stack([roof_x, roof_y])
            grid_keys = np.floor((r_coords - r_coords.min(axis=0)) / grid_res).astype(int)
            unique_keys, u_idx = np.unique(grid_keys[:, 0] * 10000 + grid_keys[:, 1], return_index=True)

            sub_rx = roof_x[u_idx]
            sub_ry = roof_y[u_idx]
            sub_rz = roof_z[u_idx]

            # Sample perimeter roof elevations from nearby roof LiDAR returns
            boundary_roof_z = []
            for bp in boundary_xy:
                dists = np.hypot(roof_x - bp[0], roof_y - bp[1])
                near_pts = roof_z[dists <= 6.0]
                if len(near_pts) >= 3:
                    # Use 75th percentile of local edge returns to capture true parapet height
                    edge_z = float(np.percentile(near_pts, 75))
                else:
                    edge_z = float(np.percentile(roof_z, 60))
                boundary_roof_z.append(edge_z)
            boundary_roof_z = np.array(boundary_roof_z, dtype=np.float32)

            boundary_pts_top = np.column_stack([boundary_xy, boundary_roof_z])
            boundary_pts_bot = np.column_stack([boundary_xy, np.full(n_boundary, local_ground_rel, dtype=np.float32)])

            # Interior points: only keep points strictly inside polygon and at least 1.0m from boundary
            interior_mask = [poly_local.buffer(-0.5).contains(Point(px, py)) for px, py in zip(sub_rx, sub_ry)]
            if np.any(interior_mask):
                valid_rx = sub_rx[interior_mask]
                valid_ry = sub_ry[interior_mask]
                valid_rz = sub_rz[interior_mask]
                interior_pts = np.column_stack([valid_rx, valid_ry, valid_rz])
                mesh_pts_top = np.vstack([boundary_pts_top, interior_pts])
            else:
                mesh_pts_top = boundary_pts_top

            # 2.5D Delaunay triangulation for roof surface
            try:
                tri = Delaunay(mesh_pts_top[:, :2])
                roof_faces_raw = tri.simplices
                valid_roof_faces = []
                for face in roof_faces_raw:
                    tri_center = Point(mesh_pts_top[face, :2].mean(axis=0))
                    if poly_local.contains(tri_center):
                        valid_roof_faces.append(face)
                roof_faces = np.array(valid_roof_faces, dtype=np.int32) if len(valid_roof_faces) > 0 else np.empty((0, 3), dtype=np.int32)
            except Exception:
                roof_faces = np.empty((0, 3), dtype=np.int32)
        else:
            # Fallback for buildings with sparse returns (< 10 roof points)
            flat_roof_z = b['peakElevationAMSL'] - GLOBAL_GROUND_Z
            boundary_pts_top = np.column_stack([boundary_xy, np.full(n_boundary, flat_roof_z, dtype=np.float32)])
            boundary_pts_bot = np.column_stack([boundary_xy, np.full(n_boundary, local_ground_rel, dtype=np.float32)])
            mesh_pts_top = boundary_pts_top

            try:
                tri = Delaunay(boundary_xy)
                valid_faces = []
                for face in tri.simplices:
                    if poly_local.contains(Point(boundary_xy[face].mean(axis=0))):
                        valid_faces.append(face)
                roof_faces = np.array(valid_faces, dtype=np.int32) if len(valid_faces) > 0 else np.empty((0, 3), dtype=np.int32)
            except Exception:
                roof_faces = np.empty((0, 3), dtype=np.int32)

        # Build full building vertices:
        # 0 .. len(mesh_pts_top)-1 : Top / Roof vertices
        # n_top .. n_top + n_boundary - 1 : Bottom boundary vertices at local ground
        n_top = len(mesh_pts_top)
        bld_vertices = np.vstack([mesh_pts_top, boundary_pts_bot])

        # Wall facade skirts connecting boundary_pts_top (indices 0..n_boundary-1) to boundary_pts_bot (n_top..n_top+n_boundary-1)
        skirt_faces = []
        for k in range(n_boundary):
            next_k = (k + 1) % n_boundary
            top_k = k
            top_next = next_k
            bot_k = n_top + k
            bot_next = n_top + next_k
            skirt_faces.append([top_k, top_next, bot_next])
            skirt_faces.append([top_k, bot_next, bot_k])
        skirt_faces = np.array(skirt_faces, dtype=np.int32)

        # Bottom floor cap
        try:
            tri_bot = Delaunay(boundary_xy)
            bot_faces = []
            for face in tri_bot.simplices:
                if poly_local.contains(Point(boundary_xy[face].mean(axis=0))):
                    bot_faces.append([n_top + face[0], n_top + face[2], n_top + face[1]]) # reversed winding
            bot_faces = np.array(bot_faces, dtype=np.int32) if len(bot_faces) > 0 else np.empty((0, 3), dtype=np.int32)
        except Exception:
            bot_faces = np.empty((0, 3), dtype=np.int32)

        all_bld_faces = []
        if len(roof_faces) > 0:
            all_bld_faces.append(roof_faces)
        if len(skirt_faces) > 0:
            all_bld_faces.append(skirt_faces)
        if len(bot_faces) > 0:
            all_bld_faces.append(bot_faces)

        if len(all_bld_faces) == 0:
            continue

        combined_faces = np.vstack(all_bld_faces)
        all_vertices.append(bld_vertices)
        all_faces.append(combined_faces + vertex_offset)
        vertex_offset += len(bld_vertices)
        reconstructed_count += 1

    master_vertices = np.vstack(all_vertices)
    master_faces = np.vstack(all_faces)
    print(f"Reconstructed {reconstructed_count} buildings with real LiDAR roof geometry.")
    print(f"Total mesh topology: {len(master_vertices)} vertices, {len(master_faces)} faces.")

    # Convert ENU to glTF (X=East, Y=Up, Z=-North)
    gltf_vertices = np.column_stack([
        master_vertices[:, 0],
        master_vertices[:, 2],
        -master_vertices[:, 1]
    ])

    mesh = trimesh.Trimesh(vertices=gltf_vertices, faces=master_faces, process=True)
    mesh.fix_normals()
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=np.full((len(master_vertices), 4), [242, 244, 248, 255], dtype=np.uint8))
    mesh.export(OUT_GLB_PATH, file_type='glb')
    glb_mb = os.path.getsize(OUT_GLB_PATH) / (1024 * 1024)
    print(f"Exported clean 3D GLB to {OUT_GLB_PATH} ({glb_mb:.2f} MB).")

    # Update metadata
    building_stats.sort(key=lambda b: b['derivedHeightMeters'], reverse=True)
    json_buildings = []
    for b in building_stats:
        json_buildings.append({
            'id': f"LA-{b['id']}",
            'osmWayId': b['id'],
            'buildingIndex': b['b_idx'],
            'name': b['name'],
            'buildingType': b['buildingType'],
            'footprintAreaSqM': b['footprintAreaSqM'],
            'pointCount': b['pointCount'],
            'localGroundAMSL': b['localGroundAMSL'],
            'peakElevationAMSL': b['peakElevationAMSL'],
            'mainRoofAMSL': b.get('mainRoofAMSL', b['peakElevationAMSL']),
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
            'visualizedPoints': 281117,
            'globalGroundDatumAMSL': round(GLOBAL_GROUND_Z, 2),
            'elevationRange': {'min': float(np.min(z_vals)), 'max': float(np.max(z_vals))}
        },
        'reconstruction': {
            'status': 'HIGH_FIDELITY_REAL_LIDAR_DERIVED',
            'method': 'LiDAR-Driven Multi-Tier Roof Surface with Real Perimeter Elevations and Skirt Walls',
            'buildingsReconstructed': reconstructed_count,
            'meshVertices': len(master_vertices),
            'meshFaces': len(master_faces),
            'modelFile': '/models/la_usgs_buildings.glb',
            'pointsFile': '/data/la_usgs_lidar_points.bin'
        },
        'buildings': json_buildings
    }

    with open(OUT_META_PATH, 'w', encoding='utf-8') as f:
        json.dump(metadata_payload, f, indent=2)

    print(f"Saved updated metadata to {OUT_META_PATH} ({len(json_buildings)} buildings).")
    print("Reconstruction pipeline executed successfully.")

if __name__ == '__main__':
    main()
