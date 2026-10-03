"""
Patch la_usgs_buildings_metadata.json to add buildingIndex field.
This replicates the exact filtering and enumeration logic from build_la_usgs_dataset.py
to map each osmWayId to its binary point cloud index (byte 19 in .bin records).
Does NOT touch the LAZ, .bin, or .glb files.
"""
import json
import math
from shapely.geometry import Polygon

osm_path = 'scripts/la_osm_buildings.json'
meta_path = 'public/data/la_usgs_buildings_metadata.json'

def wgs84_to_mercator(lon, lat):
    mx = lon * 20037508.34 / 180.0
    my = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) / (math.pi / 180.0)
    my = my * 20037508.34 / 180.0
    return mx, my

with open(osm_path, 'r', encoding='utf-8') as f:
    osm_data = json.load(f)

nodes = {el['id']: (el['lon'], el['lat']) for el in osm_data.get('elements', []) if el['type'] == 'node'}
ways = [el for el in osm_data.get('elements', []) if el['type'] == 'way' and 'building' in el.get('tags', {})]

# Replicate exact filtering from build_la_usgs_dataset.py lines 62-87
filtered_way_ids = []
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
    filtered_way_ids.append(w['id'])

# b_idx is 1-based enumeration of the filtered list (same as enumerate(buildings, start=1))
way_id_to_b_idx = {}
for b_idx, way_id in enumerate(filtered_way_ids, start=1):
    way_id_to_b_idx[way_id] = b_idx

print(f"Filtered OSM ways: {len(filtered_way_ids)}")
print(f"b_idx range: 1 to {len(filtered_way_ids)}")

# Patch metadata
with open(meta_path, 'r', encoding='utf-8') as f:
    meta = json.load(f)

matched = 0
for b in meta['buildings']:
    osm_id = b['osmWayId']
    if osm_id in way_id_to_b_idx:
        b['buildingIndex'] = way_id_to_b_idx[osm_id]
        matched += 1
    else:
        print(f"  WARNING: osmWayId {osm_id} ({b['name']}) not found in filtered OSM ways")

with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump(meta, f, indent=2)

print(f"Patched {matched}/{len(meta['buildings'])} buildings with buildingIndex")

# Verify a few
for b in meta['buildings'][:3]:
    print(f"  {b['name']}: osmWayId={b['osmWayId']}, buildingIndex={b.get('buildingIndex', 'MISSING')}")
