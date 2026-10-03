import React from 'react';
import { Box, X, ExternalLink, Activity, Database, CheckCircle2, MapPin } from 'lucide-react';
import { RealLidarBuilding } from '../../types/lidar';

interface RealLidarBuildingCardProps {
  metadata: RealLidarBuilding;
  onClose: () => void;
  onOpenProvenance?: () => void;
}

export const RealLidarBuildingCard: React.FC<RealLidarBuildingCardProps> = ({
  metadata,
  onClose,
  onOpenProvenance
}) => {
  const {
    buildingName,
    geographicLocation,
    lidarSource,
    pointCloudMetrics,
    elevationMetrics,
    reconstructionPipeline
  } = metadata;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-84 z-30 w-84 sm:w-[410px] gis-glass-panel rounded-3xl p-5 border border-zinc-800 shadow-2xl animate-fadeIn pointer-events-auto backdrop-blur-xl text-white">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-zinc-800 mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-zinc-900 text-white border border-zinc-700">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white text-black font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-black" />
                REAL LiDAR
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                Watertight GLB
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
              {buildingName}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
          title="Close Card"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Building Metrics & Provenance Table */}
      <div className="space-y-2 text-xs divide-y divide-zinc-900 font-medium">
        <div className="flex items-center justify-between pt-1">
          <span className="text-zinc-400">Location</span>
          <span className="text-zinc-200 font-medium text-right flex items-center gap-1 font-sans">
            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>{geographicLocation.city}, {geographicLocation.state}, USA</span>
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Geographic Coordinates</span>
          <span className="text-white font-mono text-[11px]">
            {geographicLocation.latitude.toFixed(6)}° N, {Math.abs(geographicLocation.longitude).toFixed(6)}° W
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">LiDAR Source</span>
          <span className="text-white font-semibold">{lidarSource.provider}</span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Dataset Name / ID</span>
          <span className="text-zinc-300 font-mono text-[11px]">{lidarSource.datasetId}</span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Original CRS</span>
          <span className="text-zinc-300 font-mono text-[11px]">{pointCloudMetrics.originalCrs}</span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Derived Height</span>
          <span className="text-white font-mono font-bold text-sm">
            {elevationMetrics.derivedBuildingHeightMeters} m{' '}
            <span className="text-zinc-400 text-[11px] font-normal font-sans">
              ({elevationMetrics.derivedBuildingHeightFeet} ft)
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Dome Peak Elevation</span>
          <span className="text-white font-mono">
            {elevationMetrics.domePeakElevationMeters} m AMSL
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Extracted LiDAR Points</span>
          <span className="text-white font-mono font-bold">
            {pointCloudMetrics.buildingExtractedPoints.toLocaleString()} points
          </span>
        </div>
      </div>

      {/* Provenance Verified Notice */}
      <div className="mt-3.5 p-2.5 rounded-xl bg-black border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
        <div className="text-white font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          <span>Real-World Airborne LiDAR Survey</span>
        </div>
        <p className="text-zinc-400 text-[10px] leading-relaxed font-sans">
          Reconstructed from 132,650 LiDAR structural returns acquired by airborne laser scanning. Watertight solid mesh rendered via binary glTF.
        </p>
      </div>

      {/* Action Links */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
        <a
          href={lidarSource.datasetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-all border border-zinc-700 flex items-center justify-center space-x-1.5"
        >
          <span>OpenTopography</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {onOpenProvenance && (
          <button
            onClick={onOpenProvenance}
            className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-95"
          >
            <span>Full Provenance</span>
          </button>
        )}
      </div>
    </div>
  );
};
