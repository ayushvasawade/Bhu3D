import {
  RealLidarBuilding,
  PointCloudMetrics,
  LidarSourceDetails,
  LidarPointCloudData
} from '../types/lidar';

class LidarService {
  private metadataCache: RealLidarBuilding | null = null;
  private fetchPromise: Promise<RealLidarBuilding> | null = null;
  private pointCloudCache: LidarPointCloudData | null = null;
  private pointCloudPromise: Promise<LidarPointCloudData> | null = null;

  /**
   * Fetch real LiDAR metadata generated from the offline LAS/LAZ ingestion pipeline
   */
  async getLidarMetadata(): Promise<RealLidarBuilding> {
    if (this.metadataCache) {
      return this.metadataCache;
    }

    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        const response = await fetch('/data/lidar_building_metadata.json');
        if (!response.ok) {
          throw new Error(`Failed to load LiDAR building metadata: ${response.statusText}`);
        }
        const data: RealLidarBuilding = await response.json();
        this.metadataCache = data;
        return data;
      } catch (err) {
        console.error('[LidarService] Error loading LiDAR metadata:', err);
        throw err;
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Fetch and decode the binary point-cloud stream (24 bytes per point)
   */
  async getPointCloudData(): Promise<LidarPointCloudData> {
    if (this.pointCloudCache) {
      return this.pointCloudCache;
    }

    if (this.pointCloudPromise) {
      return this.pointCloudPromise;
    }

    this.pointCloudPromise = (async () => {
      try {
        const meta = await this.getLidarMetadata();
        const binUrl = meta.reconstructionPipeline.pointCloudStreamFile || '/data/utah_capitol_lidar_points.bin';
        const response = await fetch(binUrl);
        if (!response.ok) {
          throw new Error(`Failed to download LiDAR point stream: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const RECORD_SIZE = 24;
        const count = Math.floor(buffer.byteLength / RECORD_SIZE);
        const dataView = new DataView(buffer);

        const positions = new Float32Array(count * 3);
        const amslElevations = new Float32Array(count);
        const colorsRgb = new Uint8Array(count * 3);
        const intensities = new Uint8Array(count);
        const classifications = new Uint8Array(count);
        const isBuilding = new Uint8Array(count);

        let buildingCount = 0;

        for (let i = 0; i < count; i++) {
          const offset = i * RECORD_SIZE;
          const x = dataView.getFloat32(offset, true);
          const y = dataView.getFloat32(offset + 4, true);
          const z = dataView.getFloat32(offset + 8, true);
          const amsl = dataView.getFloat32(offset + 12, true);

          const r = dataView.getUint8(offset + 16);
          const g = dataView.getUint8(offset + 17);
          const b = dataView.getUint8(offset + 18);
          const intensity = dataView.getUint8(offset + 19);

          const cls = dataView.getUint8(offset + 20);
          const isBld = dataView.getUint8(offset + 21);

          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;

          amslElevations[i] = amsl;

          colorsRgb[i * 3] = r;
          colorsRgb[i * 3 + 1] = g;
          colorsRgb[i * 3 + 2] = b;

          intensities[i] = intensity;
          classifications[i] = cls;
          isBuilding[i] = isBld;

          if (isBld === 1) {
            buildingCount++;
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
          isBuilding
        };

        this.pointCloudCache = parsedData;
        return parsedData;
      } catch (err) {
        console.error('[LidarService] Error parsing LiDAR point stream:', err);
        throw err;
      } finally {
        this.pointCloudPromise = null;
      }
    })();

    return this.pointCloudPromise;
  }

  /**
   * Return point-cloud statistics (total points, extracted building points, classifications)
   */
  async getPointCloudMetrics(): Promise<PointCloudMetrics> {
    const meta = await this.getLidarMetadata();
    return meta.pointCloudMetrics;
  }

  /**
   * Return dataset source details & OpenTopography attribution
   */
  async getSourceDetails(): Promise<LidarSourceDetails> {
    const meta = await this.getLidarMetadata();
    return meta.lidarSource;
  }
}

export const lidarService = new LidarService();
