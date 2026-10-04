import {
  LidarPointCloudData,
  LADatasetMetadata
} from '../types/lidar';

class LidarService {
  private laMetadataCache: LADatasetMetadata | null = null;
  private laFetchPromise: Promise<LADatasetMetadata> | null = null;
  private laPointCloudCache: LidarPointCloudData | null = null;
  private laPointCloudPromise: Promise<LidarPointCloudData> | null = null;

  /**
   * Fetch Los Angeles USGS 3DEP LiDAR building and precinct metadata
   */
  async getLAMetadata(): Promise<LADatasetMetadata> {
    if (this.laMetadataCache) {
      return this.laMetadataCache;
    }

    if (this.laFetchPromise) {
      return this.laFetchPromise;
    }

    this.laFetchPromise = (async () => {
      try {
        const response = await fetch('/data/la_usgs_buildings_metadata.json');
        if (!response.ok) {
          throw new Error(`Failed to load LA USGS LiDAR metadata: ${response.statusText}`);
        }
        const data: LADatasetMetadata = await response.json();
        this.laMetadataCache = data;
        return data;
      } catch (err) {
        console.error('[LidarService] Error loading LA USGS metadata:', err);
        throw err;
      } finally {
        this.laFetchPromise = null;
      }
    })();

    return this.laFetchPromise;
  }

  /**
   * Fetch and decode the Los Angeles USGS 3DEP LiDAR binary point-cloud stream (20 bytes per point + 32 byte header)
   */
  async getLAPointCloudData(): Promise<LidarPointCloudData> {
    if (this.laPointCloudCache) {
      return this.laPointCloudCache;
    }

    if (this.laPointCloudPromise) {
      return this.laPointCloudPromise;
    }

    this.laPointCloudPromise = (async () => {
      try {
        const response = await fetch('/data/la_usgs_lidar_points.bin');
        if (!response.ok) {
          throw new Error(`Failed to download LA LiDAR point stream: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const dataView = new DataView(buffer);

        // Read 32-byte header
        const magic = dataView.getUint32(0, true);
        const count = dataView.getUint32(4, true);
        const centerLon = dataView.getFloat64(8, true);
        const centerLat = dataView.getFloat64(16, true);
        const centerAlt = dataView.getFloat64(24, true);

        const HEADER_SIZE = 32;
        const RECORD_SIZE = 20;

        const positions = new Float32Array(count * 3);
        const amslElevations = new Float32Array(count);
        const colorsRgb = new Uint8Array(count * 3);
        const intensities = new Uint8Array(count);
        const classifications = new Uint8Array(count);
        const isBuilding = new Uint8Array(count);
        const buildingIndices = new Uint8Array(count);

        let buildingCount = 0;

        for (let i = 0; i < count; i++) {
          const offset = HEADER_SIZE + i * RECORD_SIZE;
          const dx = dataView.getFloat32(offset, true);
          const dy = dataView.getFloat32(offset + 4, true);
          const dz = dataView.getFloat32(offset + 8, true);
          const amsl = dataView.getFloat32(offset + 12, true);

          const intensity = dataView.getUint8(offset + 16);
          const cls = dataView.getUint8(offset + 17);
          const isBld = dataView.getUint8(offset + 18);
          const bldIdx = dataView.getUint8(offset + 19);

          positions[i * 3] = dx;
          positions[i * 3 + 1] = dy;
          positions[i * 3 + 2] = dz;

          amslElevations[i] = amsl;
          intensities[i] = intensity;
          classifications[i] = cls;
          isBuilding[i] = isBld;
          buildingIndices[i] = bldIdx;

          if (isBld === 1) {
            buildingCount++;
          }

          // True color mapping from classification & elevation
          const normZ = Math.max(0, Math.min(1, (amsl - 72.0) / 58.0));
          if (cls === 2) {
            // Ground
            colorsRgb[i * 3] = 120 + Math.floor(intensity * 0.2);
            colorsRgb[i * 3 + 1] = 120 + Math.floor(intensity * 0.2);
            colorsRgb[i * 3 + 2] = 128 + Math.floor(intensity * 0.2);
          } else if (isBld === 1) {
            // Building
            const r = Math.floor(255 * (1 - normZ * 0.6));
            const g = Math.floor(200 + 55 * normZ);
            const b = Math.floor(160 + 95 * normZ);
            colorsRgb[i * 3] = r;
            colorsRgb[i * 3 + 1] = g;
            colorsRgb[i * 3 + 2] = b;
          } else {
            // Vegetation / other
            colorsRgb[i * 3] = 40 + Math.floor(intensity * 0.4);
            colorsRgb[i * 3 + 1] = 140 + Math.floor(intensity * 0.4);
            colorsRgb[i * 3 + 2] = 60 + Math.floor(intensity * 0.3);
          }
        }

        const parsedData: LidarPointCloudData = {
          count,
          buildingCount,
          positions,
          amslElevations,
          colorsRgb,
          intensities,
          classifications,
          isBuilding,
          buildingIndices,
          centerLon,
          centerLat,
          centerAlt
        };

        this.laPointCloudCache = parsedData;
        return parsedData;
      } catch (err) {
        console.error('[LidarService] Error parsing LA LiDAR point stream:', err);
        throw err;
      } finally {
        this.laPointCloudPromise = null;
      }
    })();

    return this.laPointCloudPromise;
  }
}

export const lidarService = new LidarService();
