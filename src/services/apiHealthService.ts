import { ApiHealth } from '../types/geospatial';
import { externalGeoService } from './externalGeoService';
import { copernicusService } from './copernicusService';

class ApiHealthService {
  private healthCache: Map<string, ApiHealth> = new Map();
  private lastCheckedTimestamp?: string;

  async runHealthChecks(): Promise<Record<string, ApiHealth>> {
    const timestamp = new Date().toISOString();
    this.lastCheckedTimestamp = timestamp;

    // 1. OpenStreetMap Local GeoJSON Ingestion Check
    let osmStatus: ApiHealth['status'] = 'CONNECTED';
    let osmMessage = 'Active local GeoJSON ingestion (9 verified building polygons)';

    try {
      const res = await fetch('/data/pune/buildings.geojson');
      if (!res.ok) {
        osmStatus = 'FAILED';
        osmMessage = `HTTP ${res.status}: Failed to load buildings GeoJSON`;
      }
    } catch {
      osmStatus = 'FAILED';
      osmMessage = 'Failed to fetch local buildings GeoJSON';
    }

    // 2. Copernicus Data Space Ecosystem Live API Check
    let copernicusStatus: ApiHealth['status'] = 'CONNECTED';
    let copernicusMessage = 'Connected to Copernicus Data Space Ecosystem OData API';
    const startCop = performance.now();

    try {
      const scenes = await copernicusService.searchSentinel2({ tileId: 'T43QDA', limit: 1 });
      const duration = Math.round(performance.now() - startCop);

      if (scenes.length > 0) {
        copernicusStatus = 'CONNECTED';
        copernicusMessage = `Live OData API connected (${duration}ms, latest scene: ${scenes[0].name.slice(0, 24)}...)`;
      } else {
        copernicusStatus = 'FAILED';
        copernicusMessage = 'No scenes returned from Copernicus Data Space';
      }
    } catch (e: any) {
      copernicusStatus = 'FAILED';
      copernicusMessage = `Copernicus request failed: ${e?.message || 'Network error'}`;
    }

    // 3. Bhuvan WMS Health Check
    let bhuvanStatus: ApiHealth['status'] = 'FAILED';
    let bhuvanMessage = 'NRSC WMS endpoint timed out / requires authorized access';

    try {
      const bhuvanResult = await externalGeoService.checkBhuvanAvailability();
      bhuvanStatus = bhuvanResult.status as ApiHealth['status'];
      bhuvanMessage = bhuvanResult.message;
    } catch (e: any) {
      bhuvanStatus = 'FAILED';
      bhuvanMessage = 'Connection error probing NRSC servers';
    }

    const results: Record<string, ApiHealth> = {
      osm: {
        provider: 'OpenStreetMap',
        status: osmStatus,
        lastChecked: timestamp,
        message: osmMessage
      },
      copernicus: {
        provider: 'Copernicus Sentinel-2',
        status: copernicusStatus,
        lastChecked: timestamp,
        message: copernicusMessage
      },
      bhuvan: {
        provider: 'Bhuvan / ISRO',
        status: bhuvanStatus,
        lastChecked: timestamp,
        message: bhuvanMessage
      },
      soi: {
        provider: 'Survey of India',
        status: 'REFERENCE',
        lastChecked: timestamp,
        message: 'LADM ISO 19152 reference guidelines document active'
      },
      dem: {
        provider: 'SRTM / AW3D30 DEM',
        status: 'NOT_INTEGRATED',
        lastChecked: timestamp,
        message: 'Direct raster DEM grid not yet integrated; using local survey datum'
      },
      lidar: {
        provider: 'LiDAR Point Cloud',
        status: 'PLANNED',
        lastChecked: timestamp,
        message: 'Planned for Step 11+ drone LiDAR ingestion'
      },
      naksha: {
        provider: 'NAKSHA / Urban Cadastral GIS',
        status: 'DEMO',
        lastChecked: timestamp,
        message: 'Cadastral parcel polygons (Demo survey dataset)'
      },
      floorplan: {
        provider: 'Architectural Floor Plan',
        status: 'DEMO',
        lastChecked: timestamp,
        message: 'Sample 3D cutaway apartment BIM layout (Demo)'
      },
      ownership: {
        provider: 'Ownership Database',
        status: 'SIMULATED',
        lastChecked: timestamp,
        message: 'Simulated citizen titles for hackathon prototype'
      }
    };

    Object.entries(results).forEach(([k, v]) => this.healthCache.set(k, v));
    return results;
  }

  getHealth(providerKey: string): ApiHealth | undefined {
    return this.healthCache.get(providerKey);
  }

  getLastChecked(): string | undefined {
    return this.lastCheckedTimestamp;
  }
}

export const apiHealthService = new ApiHealthService();
