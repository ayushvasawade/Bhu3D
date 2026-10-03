import laspy
import numpy as np

p = r"C:\Users\vasaw\.gemini\antigravity-ide\brain\95395275-ab92-4564-8be0-3ef7c50fb36f\scratch\Utah_state_capitol.laz"
las = laspy.read(p)
x = np.array(las.x)
y = np.array(las.y)
z = np.array(las.z)
c = np.array(las.classification)

cx, cy = 425049.8, 4514425.6
bx_min, bx_max = 424970.0, 425130.0
by_min, by_max = 4514375.0, 4514475.0
base_ground_z = 1384.50

mask = (x >= bx_min) & (x <= bx_max) & (y >= by_min) & (y <= by_max) & (c == 1) & (z >= base_ground_z + 2.0)
bx, by, bz = x[mask], y[mask], z[mask]

# Inspect building dimensions on X and Y
print(f"X range: {bx.min():.2f} to {bx.max():.2f} (span: {bx.max() - bx.min():.2f}m)")
print(f"Y range: {by.min():.2f} to {by.max():.2f} (span: {by.max() - by.min():.2f}m)")

# Look at 2D grid histogram at fine resolution (0.25m or 0.35m)
res = 0.30
bins_x = np.arange(bx.min(), bx.max() + res, res)
bins_y = np.arange(by.min(), by.max() + res, res)
H, xedges, yedges = np.histogram2d(bx, by, bins=[bins_x, bins_y])
print(f"Grid cells total: {H.size}, populated: {np.sum(H > 0)} ({np.sum(H > 0)/H.size*100:.1f}%)")
print(f"Max points in a 0.3m cell: {H.max()}, median populated: {np.median(H[H > 0])}")
