import urllib.request
import json
import os

bbox = '34.035205,-118.263944,34.038985,-118.257861'
query = f"""[out:json][timeout:30];
(
  way["building"]({bbox});
  relation["building"]({bbox});
);
out body;
>;
out skel qt;"""

url = 'https://overpass-api.de/api/interpreter'
req = urllib.request.Request(url, data=query.encode('utf-8'), headers={'User-Agent': 'Bhu3D-LA-LiDAR/1.0'})

os.makedirs('scripts', exist_ok=True)
print(f"Querying Overpass for bbox: {bbox} ...")
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        ways = [el for el in data.get('elements', []) if el.get('type') == 'way' and 'building' in el.get('tags', {})]
        print(f"Found {len(ways)} building footprints in OSM.")
        for w in ways[:20]:
            tags = w.get('tags', {})
            name = tags.get('name', tags.get('addr:housenumber', '') + ' ' + tags.get('addr:street', 'Unnamed'))
            b_type = tags.get('building', 'yes')
            levels = tags.get('building:levels', 'N/A')
            height = tags.get('height', 'N/A')
            print(f"  Way ID {w['id']}: {name} ({b_type}), levels: {levels}, height: {height}")
        
        with open('scripts/la_osm_buildings.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print("Successfully saved to scripts/la_osm_buildings.json")
except Exception as e:
    print("Error fetching from Overpass:", e)
