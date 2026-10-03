import json
import laspy
import numpy as np
import trimesh
from scipy.spatial import Delaunay
from shapely.geometry import Polygon, Point
from shapely.prepared import prep

# 1. Load Footprint
with open(r"c:\Dev Drive\Bhu3D\scripts\utah_capitol_footprint_osm.json") as f:
    footprint_data = json.load(f)

poly_coords = footprint_data["utm_coords"]
footprint_poly = Polygon(poly_coords)
prep_poly = prep(footprint_poly)

# 2. Load LiDAR
p = r"C:\Users\vasaw\.gemini\antigravity-ide\brain\95395275-ab92-4564-8be0-3ef7c50fb36f\scratch\Utah_state_capitol.laz"
las = laspy.read(p)
x = np.array(las.x)
y = np.array(las.y)
z = np.array(las.z)
c = np.array(las.classification)

# Building center
cx, cy = 425049.8, 4514425.6
base_ground_z = 1384.50

# Bounding box filter first
minx, miny, maxx, maxy = footprint_poly.buffer(1.0).bounds
mask = (x >= minx) & (x <= maxx) & (y >= miny) & (y <= maxy) & (c == 1) & (z >= base_ground_z + 1.0)
bx, by, bz = x[mask], y[mask], z[mask]

# Strict point-in-polygon filter
inside = np.array([prep_poly.contains(Point(px, py)) for px, py in zip(bx, by)])
bx, by, bz = bx[inside], by[inside], bz[inside]
print(f"Extracted {len(bx):,} roof points strictly inside footprint.")

# Let's inspect max / min / dome peak
print(f"Dome peak: {bz.max():.2f}m AMSL (derived height: {bz.max() - base_ground_z:.2f}m)")
print(f"Roof min: {bz.min():.2f}m AMSL")
