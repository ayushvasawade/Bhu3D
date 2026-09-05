import * as Cesium from 'cesium';
import { BhuvanLayerConfig, SentinelScene } from '../types/geospatial';
import { copernicusService } from './copernicusService';

export const OFFICIAL_BHUVAN_WMS_URL = 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms';

class ExternalGeoService {
  private bhuvanConfig: BhuvanLayerConfig = {
    name: 'Bhuvan / ISRO Thematic Layer',
    url: OFFICIAL_BHUVAN_WMS_URL,
    layer: 'india3',
    format: 'image/png',
    visible: true
  };

  /**
   * Creates a Cesium WebMapServiceImageryProvider for the official Bhuvan WMS
   */
  createBhuvanImageryProvider(config: Partial<BhuvanLayerConfig> = {}): Cesium.WebMapServiceImageryProvider {
    const mergedConfig = { ...this.bhuvanConfig, ...config };

    return new Cesium.WebMapServiceImageryProvider({
      url: mergedConfig.url,
      layers: mergedConfig.layer,
      parameters: {
        service: 'WMS',
        version: '1.1.1',
        request: 'GetMap',
        styles: '',
        format: mergedConfig.format,
        transparent: true
      },
      credit: 'NRSC / ISRO Bhuvan Geo-Platform'
    });
  }

  /**
   * Probes live connectivity to the official Bhuvan WMS endpoint
   */
  async checkBhuvanAvailability(): Promise<{ available: boolean; status: string; message: string }> {
    const testUrl = `${this.bhuvanConfig.url}?SERVICE=WMS&REQUEST=GetCapabilities`;

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/xml, text/xml' },
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        return {
          available: true,
          status: 'CONNECTED',
          message: 'Bhuvan WMS server reachable'
        };
      } else {
        return {
          available: false,
          status: 'FAILED',
          message: `Bhuvan returned HTTP ${response.status} (Restricted access)`
        };
      }
    } catch (err: any) {
      return {
        available: false,
        status: 'FAILED',
        message: 'NRSC WMS endpoint timed out or requires institutional VPN/whitelist'
      };
    }
  }

  /**
   * Retrieve Copernicus Sentinel-2 metadata scenes for an Area of Interest
   */
  async getCopernicusMetadata(aoi: { tileId?: string; aoiName?: string } = {}): Promise<SentinelScene[]> {
    return copernicusService.searchSentinel2({
      tileId: aoi.tileId || 'T43QDA',
      limit: 3
    });
  }

  getBhuvanConfig(): BhuvanLayerConfig {
    return { ...this.bhuvanConfig };
  }
}

export const externalGeoService = new ExternalGeoService();
