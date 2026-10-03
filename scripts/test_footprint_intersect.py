import json
import laspy
import numpy as np
from shapely.geometry import Polygon, Point
from shapely.prepared import prep

# Load OSM footprint
with open(r"c:\Dev Drive\Bhu3D\scripts\utah_capitol_footprint_osm.json") as f:
    footprint_data = json.load(f)

poly_coords = footprint_data["utm_coords"]
footprint_poly = Polygon(poly_coords)
print(f"Footprint valid: {footprint_poly.is_valid}")
print(f"Footprint area: {footprint_poly.area:.2f} m²")
print(f"Footprint perimeter: {footprint_poly.length:.2f} m")
print(f"Footprint bounds: {footprint_poly.bounds}")

# Load LiDAR
p = r"C:\Users\vasaw\.gemini\antigravity-ide\brain\95395275-ab92-4564-8be0-3ef7c50fb36f\scratch\Utah_state_capitol.laz"
las = laspy.read(p)
x, y, z, c = np.array(las.x), np.array(las.y), np.array(las.z), np.array(las.classification)

# Buffer the footprint slightly (0.8m) to capture eaves / facades
buffered_poly = footprint_poly.buffer(0.8)
minx, miny, maxx, maxy = buffered_poly.bounds

bbox_mask = (x >= minx) & (x <= maxx) & (y >= miny) & (y <= maxy)
bx, by, bz, bc = x[bbox_mask], y[bbox_mask], z[bbox_mask], c[bbox_mask]
print(f"Points in buffered bbox: {len(bx):,}")

prep_poly = prep(buffered_poly)
inside_mask = np.array([prep_poly.contains(Point(px, py)) for px, py in zip(bx, by)])
print(f"Points strictly inside buffered building footprint: {np.sum(inside_mask):,}")

print("Classifications of building points:", np.unique(bc[inside_mask], return_counts=True))
print(f"Elevations inside footprint: min={bz[inside_mask].min():.2f}m, max={bz[inside_mask].max():.2f}m")
