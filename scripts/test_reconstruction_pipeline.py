import os
import json
import laspy
import numpy as np
import trimesh
from shapely.geometry import Polygon, Point, LineString
from shapely.prepared import prep
from scipy.interpolate import griddata

def build_reconstructed_mesh(bx, by, bz, br, bg, bb, footprint_poly, base_ground_z=1384.50, res=0.35):
    print(f"Building surface mesh at {res}m resolution...")
    minx, miny, maxx, maxy = footprint_poly.bounds
    prep_poly = prep(footprint_poly)
    
    # Coordinate origin: building centroid
    cx, cy = footprint_poly.centroid.x, footprint_poly.centroid.y
    print(f"Building centroid origin: {cx:.2f}, {cy:.2f}")
    
    gx = np.arange(minx, maxx + res, res)
    gy = np.arange(miny, maxy + res, res)
    nx, ny = len(gx), len(gy)
    print(f"Grid dimensions: {nx} x {ny} = {nx*ny} cells")
    
    grid_z = np.full((ny, nx), np.nan)
    grid_r = np.full((ny, nx), 128, dtype=np.uint8)
    grid_g = np.full((ny, nx), 128, dtype=np.uint8)
    grid_b = np.full((ny, nx), 128, dtype=np.uint8)
    
    ix = np.clip(np.floor((bx - minx) / res).astype(int), 0, nx - 1)
    iy = np.clip(np.floor((by - miny) / res).astype(int), 0, ny - 1)
    
    # Fill cells with maximum Z (highest return represents the exterior roof surface)
    for px, py, pz, pr, pg, pb in zip(ix, iy, bz, br, bg, bb):
        if np.isnan(grid_z[py, px]) or pz > grid_z[py, px]:
            grid_z[py, px] = pz
            grid_r[py, px] = pr
            grid_g[py, px] = pg
            grid_b[py, px] = pb

    # Mark which cells are strictly inside the footprint polygon
    yy, xx = np.indices((ny, nx))
    cell_x = minx + xx * res + res / 2.0
    cell_y = miny + yy * res + res / 2.0
    
    inside_mask = np.zeros((ny, nx), dtype=bool)
    for j in range(ny):
        for i in range(nx):
            if prep_poly.contains(Point(cell_x[j, i], cell_y[j, i])):
                inside_mask[j, i] = True
                
    print(f"Cells inside footprint: {np.sum(inside_mask)} / {nx*ny}")
    
    # Interpolate any sparse gaps strictly inside the footprint using nearest observed points
    valid_mask = inside_mask & ~np.isnan(grid_z)
    missing_mask = inside_mask & np.isnan(grid_z)
    print(f"Observed cells inside: {np.sum(valid_mask)}, Interpolated gap cells: {np.sum(missing_mask)}")
    
    if np.sum(missing_mask) > 0 and np.sum(valid_mask) > 0:
        known_pts = np.column_stack((xx[valid_mask], yy[valid_mask]))
        known_vals = grid_z[valid_mask]
        query_pts = np.column_stack((xx[missing_mask], yy[missing_mask]))
        interp_vals = griddata(known_pts, known_vals, query_pts, method='nearest')
        grid_z[missing_mask] = interp_vals
        
    # Ensure minimum height is at foundation level
    grid_z = np.maximum(grid_z, base_ground_z)
    
    # Create vertices and faces
    # glTF coordinate system: X = East, Y = Up, Z = -North (South is +Z)
    top_node_idx = np.full((ny + 1, nx + 1), -1, dtype=int)
    bot_node_idx = np.full((ny + 1, nx + 1), -1, dtype=int)
    verts = []
    colors = []
    
    # Corner node elevations and colors
    corner_z = np.zeros((ny + 1, nx + 1), dtype=float)
    corner_r = np.zeros((ny + 1, nx + 1), dtype=float)
    corner_g = np.zeros((ny + 1, nx + 1), dtype=float)
    corner_b = np.zeros((ny + 1, nx + 1), dtype=float)
    corner_cnt = np.zeros((ny + 1, nx + 1), dtype=int)
    node_mask = np.zeros((ny + 1, nx + 1), dtype=bool)
    
    for j in range(ny):
        for i in range(nx):
            if inside_mask[j, i]:
                node_mask[j:j+2, i:i+2] = True
                val = grid_z[j, i] - base_ground_z
                corner_z[j:j+2, i:i+2] += val
                corner_r[j:j+2, i:i+2] += grid_r[j, i]
                corner_g[j:j+2, i:i+2] += grid_g[j, i]
                corner_b[j:j+2, i:i+2] += grid_b[j, i]
                corner_cnt[j:j+2, i:i+2] += 1
                
    nonzero = corner_cnt > 0
    corner_z[nonzero] /= corner_cnt[nonzero]
    corner_r[nonzero] /= corner_cnt[nonzero]
    corner_g[nonzero] /= corner_cnt[nonzero]
    corner_b[nonzero] /= corner_cnt[nonzero]
    
    # 1. Top vertices (roof)
    for j in range(ny + 1):
        for i in range(nx + 1):
            if node_mask[j, i]:
                px = float((minx + i * res) - cx)
                py = float(corner_z[j, i])  # Up
                pz = float(-((miny + j * res) - cy))  # -North
                top_node_idx[j, i] = len(verts)
                verts.append([px, py, pz])
                colors.append([int(corner_r[j, i]), int(corner_g[j, i]), int(corner_b[j, i]), 255])
                
    # 2. Bottom vertices (base at ground datum)
    for j in range(ny + 1):
        for i in range(nx + 1):
            if node_mask[j, i]:
                px = float((minx + i * res) - cx)
                py = 0.0  # Base level
                pz = float(-((miny + j * res) - cy))
                bot_node_idx[j, i] = len(verts)
                verts.append([px, py, pz])
                # Ground/foundation color: subtle stone gray
                colors.append([110, 110, 115, 255])
                
    faces = []
    
    # 3. Roof Triangles (top)
    for j in range(ny):
        for i in range(nx):
            if inside_mask[j, i]:
                t00 = top_node_idx[j, i]
                t10 = top_node_idx[j, i+1]
                t11 = top_node_idx[j+1, i+1]
                t01 = top_node_idx[j+1, i]
                faces.append([t00, t11, t10])
                faces.append([t00, t01, t11])
                
    # 4. Base Triangles (bottom)
    for j in range(ny):
        for i in range(nx):
            if inside_mask[j, i]:
                b00 = bot_node_idx[j, i]
                b10 = bot_node_idx[j, i+1]
                b11 = bot_node_idx[j+1, i+1]
                b01 = bot_node_idx[j+1, i]
                faces.append([b00, b10, b11])
                faces.append([b00, b11, b01])
                
    # 5. Facade Perimeter Walls (dropping from roof edge to base)
    for j in range(ny):
        for i in range(nx):
            if not inside_mask[j, i]:
                continue
            # South edge (j)
            if j == 0 or not inside_mask[j-1, i]:
                t0, t1 = top_node_idx[j, i], top_node_idx[j, i+1]
                b0, b1 = bot_node_idx[j, i], bot_node_idx[j, i+1]
                faces.append([t0, t1, b1])
                faces.append([t0, b1, b0])
            # North edge (j+1)
            if j == ny - 1 or not inside_mask[j+1, i]:
                t0, t1 = top_node_idx[j+1, i], top_node_idx[j+1, i+1]
                b0, b1 = bot_node_idx[j+1, i], bot_node_idx[j+1, i+1]
                faces.append([t1, t0, b0])
                faces.append([t1, b0, b1])
            # West edge (i)
            if i == 0 or not inside_mask[j, i-1]:
                t0, t1 = top_node_idx[j, i], top_node_idx[j+1, i]
                b0, b1 = bot_node_idx[j, i], bot_node_idx[j+1, i]
                faces.append([t1, t0, b0])
                faces.append([t1, b0, b1])
            # East edge (i+1)
            if i == nx - 1 or not inside_mask[j, i+1]:
                t0, t1 = top_node_idx[j, i+1], top_node_idx[j+1, i+1]
                b0, b1 = bot_node_idx[j, i+1], bot_node_idx[j+1, i+1]
                faces.append([t0, t1, b1])
                faces.append([t0, b1, b0])
                
    mesh = trimesh.Trimesh(vertices=verts, faces=faces)
    mesh.visual.vertex_colors = np.array(colors, dtype=np.uint8)
    mesh.fix_normals()
    
    print(f"Generated mesh: {len(mesh.vertices):,} vertices, {len(mesh.faces):,} faces")
    print(f"Mesh watertight: {mesh.is_watertight}")
    print(f"Mesh volume: {mesh.volume:,.2f} m3")
    return mesh

def main():
    with open(r"c:\Dev Drive\Bhu3D\scripts\utah_capitol_footprint_osm.json") as f:
        footprint_poly = Polygon(json.load(f)["utm_coords"])
        
    p = r"C:\Users\vasaw\.gemini\antigravity-ide\brain\95395275-ab92-4564-8be0-3ef7c50fb36f\scratch\Utah_state_capitol.laz"
    las = laspy.read(p)
    x = np.array(las.x)
    y = np.array(las.y)
    z = np.array(las.z)
    c = np.array(las.classification)
    red = np.array(las.red)
    green = np.array(las.green)
    blue = np.array(las.blue)
    
    base_ground_z = 1384.50
    minx, miny, maxx, maxy = footprint_poly.buffer(0.5).bounds
    bbox_mask = (x >= minx) & (x <= maxx) & (y >= miny) & (y <= maxy) & (z >= base_ground_z + 1.0)
    
    bx = x[bbox_mask]
    by = y[bbox_mask]
    bz = z[bbox_mask]
    br = (red[bbox_mask] / 256).astype(np.uint8)
    bg = (green[bbox_mask] / 256).astype(np.uint8)
    bb = (blue[bbox_mask] / 256).astype(np.uint8)
    
    prep_poly = prep(footprint_poly)
    inside = np.array([prep_poly.contains(Point(px, py)) for px, py in zip(bx, by)])
    bx, by, bz, br, bg, bb = bx[inside], by[inside], bz[inside], br[inside], bg[inside], bb[inside]
    
    # Build mesh at 0.35m resolution
    mesh = build_reconstructed_mesh(bx, by, bz, br, bg, bb, footprint_poly, base_ground_z=base_ground_z, res=0.35)

if __name__ == "__main__":
    main()
