import { lidarService } from './lidarService';
import { ReconstructionPipelineDetails, ElevationMetrics } from '../types/lidar';

class BuildingReconstructionService {
  /**
   * Return URL of the georeferenced binary glTF (GLB) reconstructed from LiDAR
   */
  async getModelUri(): Promise<string> {
    const meta = await lidarService.getLidarMetadata();
    return meta.reconstructionPipeline.outputModelFile;
  }

  /**
   * Return 3D reconstruction mesh statistics (vertex count, face count, watertight status)
   */
  async getMeshStatistics(): Promise<ReconstructionPipelineDetails> {
    const meta = await lidarService.getLidarMetadata();
    return meta.reconstructionPipeline;
  }

  /**
   * Return calculated spatial extent, base elevation, peak elevation, and derived height
   */
  async getElevationMetrics(): Promise<ElevationMetrics> {
    const meta = await lidarService.getLidarMetadata();
    return meta.elevationMetrics;
  }

  /**
   * Return 8-stage LiDAR processing pipeline workflow
   */
  async getPipelineStages(): Promise<string[]> {
    const meta = await lidarService.getLidarMetadata();
    return meta.reconstructionPipeline.stages;
  }
}

export const buildingReconstructionService = new BuildingReconstructionService();
