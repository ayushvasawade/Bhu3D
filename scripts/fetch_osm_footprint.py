import urllib.request
import urllib.parse
import json
import pyproj

query = """
[out:json];
way(32920861);
out geom;
"""

url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query.strip())
req = urllib.request.Request(url, headers={"User-Agent": "Bhu3D/1.0"})

with urllib.request.urlopen(req, timeout=15) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    el = data['elements'][0]
    print(f"Name: {el['tags'].get('name')}")
    geom = el['geometry']
    print(f"Nodes count: {len(geom)}")
    
    # Transform to UTM 12N (EPSG:26912)
    transformer = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:26912", always_xy=True)
    utm_nodes = []
    for pt in geom:
        ux, uy = transformer.transform(pt['lon'], pt['lat'])
        utm_nodes.append([ux, uy])
        
    print(f"UTM min X: {min(p[0] for p in utm_nodes):.2f}, max X: {max(p[0] for p in utm_nodes):.2f}")
    print(f"UTM min Y: {min(p[1] for p in utm_nodes):.2f}, max Y: {max(p[1] for p in utm_nodes):.2f}")
    
    with open("scripts/utah_capitol_footprint_osm.json", "w") as f:
        json.dump({
            "osm_id": el['id'],
            "name": el['tags'].get('name'),
            "tags": el['tags'],
            "wgs84_coords": [[p['lon'], p['lat']] for p in geom],
            "utm_coords": utm_nodes
        }, f, indent=2)
    print("Saved to scripts/utah_capitol_footprint_osm.json")
