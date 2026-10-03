import { lidarService } from './lidarService';
import { buildingReconstructionService } from './buildingReconstructionService';
import { RealLidarBuilding } from '../types/lidar';

class RealBuildingDataService {
  /**
   * Get the primary real LiDAR building representation
   */
  async getRealBuilding(): Promise<RealLidarBuilding> {
    return lidarService.getLidarMetadata();
  }

  /**
   * Get geographic WGS84 coordinates for Cesium positioning
   */
  async getCoordinates(): Promise<{ latitude: number; longitude: number; baseElevation: number }> {
    const meta = await lidarService.getLidarMetadata();
    return {
      latitude: meta.geographicLocation.latitude,
      longitude: meta.geographicLocation.longitude,
      baseElevation: meta.elevationMetrics.baseGroundElevationMeters
    };
  }

  /**
   * Get GLB model URI
   */
  async getModelUri(): Promise<string> {
    return buildingReconstructionService.getModelUri();
  }

  /**
   * Provide precomputed camera targets for inspecting the real LiDAR building in Cesium
   */
  async getCameraViews() {
    const meta = await lidarService.getLidarMetadata();
    const { latitude, longitude } = meta.geographicLocation;

    return {
      overview: {
        latitude: latitude - 0.0032,
        longitude: longitude,
        height: 380,
        heading: 0, // Facing North
        pitch: -32,
        roll: 0
      },
      domeCloseUp: {
        latitude: latitude - 0.0012,
        longitude: longitude + 0.0008,
        height: 120,
        heading: 330,
        pitch: -22,
        roll: 0
      },
      grandSouthPortico: {
        latitude: latitude - 0.0018,
        longitude: longitude,
        height: 75,
        heading: 0,
        pitch: -12,
        roll: 0
      },
      aerialTopDown: {
        latitude: latitude,
        longitude: longitude,
        height: 520,
        heading: 0,
        pitch: -90,
        roll: 0
      }
    };
  }
}

export const realBuildingDataService = new RealBuildingDataService();
