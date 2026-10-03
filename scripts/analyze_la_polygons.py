import laspy
import json
import numpy as np
from shapely.geometry import shape, Point, Polygon
import math

laz_path = r'C:\Dev Drive\Bhu3D\f8601d6d-142b-4343-abd0-84d85e09b02b.laz'
las = laspy.read(laz_path)
print(f"Loaded {len(las.points)} points from {laz_path}")

# Load OSM buildings
with open('scripts/la_osm_buildings.json', 'r', encoding='utf-8') as f:
    osm_data = json.load(f)

nodes = {el['id']: (el['lon'], el['lat']) for el in osm_data.get('elements', []) if el['type'] == 'node'}
ways = [el for el in osm_data.get('elements', []) if el['type'] == 'way' and 'building' in el.get('tags', {})]

print(f"Loaded {len(ways)} building ways and {len(nodes)} nodes.")

# Build polygon geometries in WGS84 and in EPSG:3857
def wgs84_to_mercator(lon, lat):
    x = lon * 20037508.34 / 180.0
    y = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) / (math.pi / 180.0)
    y = y * 20037508.34 / 180.0
    return x, y

def mercator_to_wgs84(x, y):
    lon = (x / 20037508.34) * 180.0
    lat = (y / 20037508.34) * 180.0
    lat = 180.0 / math.pi * (2.0 * math.atan(math.exp(lat * math.pi / 180.0)) - math.pi / 2.0)
    return lon, lat

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
    
    tags = w.get('tags', {})
    name = tags.get('name', tags.get('addr:housenumber', '') + ' ' + tags.get('addr:street', f"Building {w['id']}"))
    buildings.append({
        'id': w['id'],
        'name': name.strip() or f"Building {w['id']}",
        'poly_3857': poly_3857,
        'coords_wgs84': coords_wgs84,
        'tags': tags,
        'area_sqm': poly_3857.area
    })

print(f"Constructed {len(buildings)} valid building polygons in EPSG:3857.")
# Sort by footprint area
buildings.sort(key=lambda b: b['area_sqm'], reverse=True)
for i, b in enumerate(buildings[:15]):
    tags = b['tags']
    print(f"#{i+1}: ID {b['id']}, Name: '{b['name']}', Area: {b['area_sqm']:.1f} m², Height tag: {tags.get('height', 'N/A')}, Levels tag: {tags.get('building:levels', 'N/A')}")
