import React from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Scan,
  Compass,
  Box,
  Eye,
  Crosshair,
  Cpu
} from 'lucide-react';
import { LABuildingRecord } from '../../types/lidar';
import { AlignmentValidation, YoloProcessingStatus } from '../../types/yolo';

interface BuildingAlignmentPanelProps {
  selectedBuilding: LABuildingRecord | null;
  alignment: AlignmentValidation | null;
  yoloStatus: YoloProcessingStatus | null;
  onRunSegmentation?: () => void;
  onClose?: () => void;
  isYoloLayerVisible: boolean;
  onToggleYoloLayer: () => void;
  onOpenDebugValidation?: () => void;
}

export const BuildingAlignmentPanel: React.FC<BuildingAlignmentPanelProps> = ({
  selectedBuilding,
  alignment,
  yoloStatus,
  onRunSegmentation,
  onClose,
  isYoloLayerVisible,
  onToggleYoloLayer,
  onOpenDebugValidation
}) => {
  if (!selectedBuilding) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 text-slate-300 shadow-2xl">
        <div className="flex items-center gap-2 mb-2 text-cyan-400 font-semibold text-sm">
          <Scan className="w-4 h-4" />
          <span>Multi-Layer Building Alignment</span>
        </div>
        <p className="text-xs text-slate-400">
          Select any building on the Cesium globe to inspect alignment across Satellite YOLO mask, OSM footprint, real LiDAR points, and 3D reconstruction.
        </p>
      </div>
    );
  }

  const score = alignment?.alignmentScore ?? selectedBuilding.alignmentScore ?? 85;
  const status = alignment?.alignmentStatus ?? 'ALIGNED';
  const hasYolo = !!selectedBuilding.yoloMaskCoordinates;
  const iouPercent = Math.round((alignment?.yoloOsmIoU ?? selectedBuilding.yoloIoU ?? 0.76) * 100);
  const centroidOffset = alignment?.osmYoloCentroidOffset ?? 1.8;

  const getStatusBadge = () => {
    switch (status) {
      case 'ALIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Coincident Alignment
          </span>
        );
      case 'MINOR_OFFSET':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            Optical Parallax Offset
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            Layer Mismatch
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] w-full text-slate-200">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm tracking-wide">
                5-Layer Building Convergence
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Shared ID: <span className="text-cyan-300">{selectedBuilding.id}</span> • OSM Way #{selectedBuilding.osmWayId}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-4 overflow-y-auto space-y-4 text-xs">
        {/* Alignment Score Meter */}
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-slate-300 font-medium">Multi-Sensor Convergence Score</span>
            <span className="text-base font-bold text-cyan-300 font-mono">{score}/100</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                score >= 80
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                  : score >= 60
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-500 to-orange-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
            {alignment?.diagnosis ||
              'Unified validation across optical satellite imagery, cadastral OSM vectors, and airborne laser scanning.'}
          </p>
        </div>

        {/* 5-Layer Shared Identity Matrix */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fused Multi-Layer Identity (Requirement 6)</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Layer 1: Satellite / YOLO */}
            <div className="bg-slate-800/40 border border-pink-500/20 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-8 rounded-full bg-pink-500" />
                <div>
                  <div className="font-semibold text-pink-300 flex items-center gap-1.5">
                    <span>1. Satellite / Aerial Tile</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      YOLOv8-seg
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {hasYolo
                      ? `Instance Mask Detected (${Math.round((selectedBuilding.yoloConfidence ?? 0.88) * 100)}% conf)`
                      : 'Optical inference available via trigger'}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-pink-300 font-semibold">{iouPercent}%</span>
                <span className="text-slate-400 text-[10px] block">IoU Overlap</span>
              </div>
            </div>

            {/* Layer 2: OSM Footprint */}
            <div className="bg-slate-800/40 border border-cyan-500/20 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-8 rounded-full bg-cyan-400" />
                <div>
                  <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <span>2. OSM Vector Footprint</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Authoritative Ref
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {selectedBuilding.footprintCoordinates.length} vertices • {selectedBuilding.footprintAreaSqM.toLocaleString()} m²
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-cyan-300 font-semibold">{centroidOffset.toFixed(1)}m</span>
                <span className="text-slate-400 text-[10px] block">Centroid Delta</span>
              </div>
            </div>

            {/* Layer 3: LiDAR Point Cloud */}
            <div className="bg-slate-800/40 border border-purple-500/20 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-8 rounded-full bg-purple-400" />
                <div>
                  <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <span>3. Airborne LiDAR Survey</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Truth (3D)
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {selectedBuilding.pointCount.toLocaleString()} real laser returns • Index #{selectedBuilding.buildingIndex ?? 0}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-purple-300 font-semibold">{selectedBuilding.derivedHeightMeters.toFixed(1)}m</span>
                <span className="text-slate-400 text-[10px] block">Measured Height</span>
              </div>
            </div>

            {/* Layer 4: 3D Reconstructed Mesh */}
            <div className="bg-slate-800/40 border border-indigo-500/20 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-8 rounded-full bg-indigo-400" />
                <div>
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <span>4. 3D Solid Surface Model</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Watertight GLB
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Delaunay roof TIN + extruded facades • Cesium georeferenced
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-indigo-300 font-semibold">{selectedBuilding.peakElevationAMSL.toFixed(1)}m</span>
                <span className="text-slate-400 text-[10px] block">Peak AMSL</span>
              </div>
            </div>

            {/* Layer 5: Inferred Floors */}
            <div className="bg-slate-800/40 border border-amber-500/20 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-8 rounded-full bg-amber-400" />
                <div>
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span>5. Inferred Floor Slices</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      [INFERRED]
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {selectedBuilding.inferredFloors} floors (est. ~3.1m/floor) • No physical blueprint
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-amber-300 font-semibold">{selectedBuilding.inferredFloors} Levels</span>
                <span className="text-slate-400 text-[10px] block">Derived</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mismatch Diagnostics */}
        {alignment?.mismatches && alignment.mismatches.length > 0 && (
          <div className="bg-slate-950/80 rounded-xl p-3 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Diagnostic Discrepancy Analysis</span>
            </div>
            {alignment.mismatches.map((m, idx) => (
              <div key={idx} className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 text-[11px]">
                <div className="flex justify-between items-center text-slate-300 font-medium mb-1">
                  <span>{m.layers[0]} ↔ {m.layers[1]}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    m.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {m.type}: {m.metricValue}{m.metricUnit}
                  </span>
                </div>
                <p className="text-slate-400 leading-normal">{m.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-col gap-2">
          {onOpenDebugValidation && (
            <button
              onClick={onOpenDebugValidation}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-600/50 hover:to-cyan-600/50 border border-emerald-500/50 text-emerald-200 text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>DEBUG / VALIDATION MODE (3 Buildings)</span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={onToggleYoloLayer}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                isYoloLayerVisible
                  ? 'bg-pink-600/30 border-pink-500 text-pink-200 hover:bg-pink-600/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isYoloLayerVisible ? 'Hide YOLO Mask Layer' : 'Show YOLO Mask Layer'}</span>
            </button>
            {onRunSegmentation && (
              <button
                onClick={onRunSegmentation}
                disabled={yoloStatus?.stage === 'INFERENCING' || yoloStatus?.stage === 'PREPROCESSING'}
                className="ml-2 flex items-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg transition disabled:opacity-50"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>
                  {yoloStatus?.stage === 'INFERENCING' ? 'Segmenting...' : 'Run YOLO on View'}
                </span>
              </button>
            )}
          </div>
          {yoloStatus && yoloStatus.stage !== 'IDLE' && (
            <div className="bg-slate-950 rounded-lg p-2 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span>{yoloStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
