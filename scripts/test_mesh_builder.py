import json, math
import numpy as np
import laspy
from shapely.geometry import Polygon, MultiPoint, Point
import trimesh

def build_lod2_building_mesh(poly_enu_coords, main_roof_h, penthouses=[]):
    """
    Builds clean LOD2 architectural mesh:
    - Base at Z=0
    - Vertical walls to main_roof_h
    - Horizontal roof cap at main_roof_h
    - Horizontal bottom cap at Z=0
    - Separate vertical box/extrusion for each penthouse/elevated structure
    """
    poly = Polygon(poly_enu_coords)
    if not poly.is_valid:
        poly = poly.buffer(0)
        
    # Triangulate 2D polygon using trimesh / shapely
    poly_2d = trimesh.path.polygons.triangulate_polygon(poly, engine='earcut')
    if len(poly_2d[0]) == 0:
        # Fallback to Delaunay
        from scipy.spatial import Delaunay
        pts_2d = np.array(poly.exterior.coords)[:-1]
        tri = Delaunay(pts_2d)
        valid_faces = []
        for face in tri.simplices:
            if poly.contains(Point(pts_2d[face].mean(axis=0))):
                valid_faces.append(face)
        poly_2d = (pts_2d, np.array(valid_faces))
        
    pts_2d, cap_faces = poly_2d
    n_2d = len(pts_2d)
    
    # 1. Main building vertices:
    # 0 .. n_2d-1: Top roof cap at main_roof_h
    # n_2d .. 2*n_2d-1: Bottom cap at Z=0
    top_cap_pts = np.column_stack([pts_2d, np.full(n_2d, main_roof_h)])
    bot_cap_pts = np.column_stack([pts_2d, np.full(n_2d, 0.0)])
    main_vertices = np.vstack([top_cap_pts, bot_cap_pts])
    
    # Top cap faces (facing UP, normal +Z)
    roof_faces = cap_faces.copy()
    
    # Bottom cap faces (facing DOWN, normal -Z, reverse winding)
    bot_faces = np.column_stack([
        cap_faces[:, 0] + n_2d,
        cap_faces[:, 2] + n_2d,
        cap_faces[:, 1] + n_2d
    ])
    
    # Vertical walls along exterior boundary
    boundary_xy = np.array(poly.exterior.coords)[:-1]
    n_b = len(boundary_xy)
    
    # Find indices of boundary_xy in pts_2d
    b_indices = []
    for bpt in boundary_xy:
        dists = np.hypot(pts_2d[:, 0] - bpt[0], pts_2d[:, 1] - bpt[1])
        b_indices.append(np.argmin(dists))
        
    wall_faces = []
    for i in range(n_b):
        next_i = (i + 1) % n_b
        top_curr = b_indices[i]
        top_next = b_indices[next_i]
        bot_curr = top_curr + n_2d
        bot_next = top_next + n_2d
        
        # Two triangles per quad wall, outward winding
        wall_faces.append([top_curr, top_next, bot_next])
        wall_faces.append([top_curr, bot_next, bot_curr])
        
    wall_faces = np.array(wall_faces, dtype=np.int32)
    
    all_bld_vertices = [main_vertices]
    all_bld_faces = [roof_faces, bot_faces, wall_faces]
    curr_v_offset = len(main_vertices)
    
    # 2. Add Rooftop Penthouses / Elevated Tiers
    for pent in penthouses:
        pent_poly = pent['poly']
        pent_h = pent['height']
        if not pent_poly.is_valid or pent_poly.area < 12.0:
            continue
            
        p_tri = trimesh.path.polygons.triangulate_polygon(pent_poly, engine='earcut')
        if len(p_tri[0]) == 0:
            continue
        p_pts2d, p_cap_faces = p_tri
        np_2d = len(p_pts2d)
        
        p_top = np.column_stack([p_pts2d, np.full(np_2d, pent_h)])
        p_bot = np.column_stack([p_pts2d, np.full(np_2d, main_roof_h)])
        p_verts = np.vstack([p_top, p_bot])
        
        p_top_faces = p_cap_faces + curr_v_offset
        
        p_bound_xy = np.array(pent_poly.exterior.coords)[:-1]
        np_b = len(p_bound_xy)
        p_b_indices = []
        for bpt in p_bound_xy:
            d = np.hypot(p_pts2d[:, 0] - bpt[0], p_pts2d[:, 1] - bpt[1])
            p_b_indices.append(np.argmin(d))
            
        p_wall_faces = []
        for i in range(np_b):
            next_i = (i + 1) % np_b
            tc = curr_v_offset + p_b_indices[i]
            tn = curr_v_offset + p_b_indices[next_i]
            bc = tc + np_2d
            bn = tn + np_2d
            p_wall_faces.append([tc, tn, bn])
            p_wall_faces.append([tc, bn, bc])
            
        all_bld_vertices.append(p_verts)
        all_bld_faces.append(p_top_faces)
        if len(p_wall_faces) > 0:
            all_bld_faces.append(np.array(p_wall_faces, dtype=np.int32))
            
        curr_v_offset += len(p_verts)
        
    final_v = np.vstack(all_bld_vertices)
    final_f = np.vstack(all_bld_faces)
    
    mesh = trimesh.Trimesh(vertices=final_v, faces=final_f, process=True)
    return mesh

# Test on a dummy box
test_poly = [[0, 0], [20, 0], [20, 30], [0, 30]]
test_pent = [{
    'poly': Polygon([[5, 8], [15, 8], [15, 20], [5, 20]]),
    'height': 45.0
}]
m = build_lod2_building_mesh(test_poly, 38.0, test_pent)
print("Test mesh vertices:", len(m.vertices), "faces:", len(m.faces))
print("Is watertight:", m.is_watertight)
print("Volume:", m.volume)
print("Bounds:", m.bounds)
