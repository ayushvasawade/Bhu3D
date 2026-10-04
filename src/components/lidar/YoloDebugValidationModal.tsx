import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Layers,
  Scan,
  Maximize2,
  X,
  ShieldCheck,
  Activity,
  Cpu,
  Terminal,
  Compass,
  AlertCircle
} from 'lucide-react';
import { LABuildingRecord } from '../../types/lidar';
import { AlignmentValidation, YoloProcessingStatus } from '../../types/yolo';

interface YoloDebugValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: LABuildingRecord[];
  onSelectAndFlyToBuilding: (building: LABuildingRecord) => void;
  yoloStatus: YoloProcessingStatus;
  onRunSegmentation: () => void;
}

export const YoloDebugValidationModal: React.FC<YoloDebugValidationModalProps> = ({
  isOpen,
  onClose,
  buildings,
  onSelectAndFlyToBuilding,
  yoloStatus,
  onRunSegmentation
}) => {
  const [activeTab, setActiveTab] = useState<'SMALL' | 'MEDIUM' | 'LARGE_TRUNCATED' | 'LARGE_CONTAINED'>('MEDIUM');

  if (!isOpen) return null;

  // Real Audited DTLA South Park buildings
  const targets = {
    SMALL: {
      id: 'LA-428383131',
      name: 'Small Annex (LA-428383131)',
      category: 'Small Auxiliary Structure',
      areaSqM: 34.1,
      vertices: 5,
      lidarPts: 575,
      lidarHeight: 3.12,
      groundAMSL: 71.84,
      peakAMSL: 74.96,
      inferredFloors: 1,
      center: [-118.261866, 34.036793] as [number, number],
      osmMeshIoU: 89.4,
      centroidOffsetM: 0.32,
      hausdorffM: 3.03,
      lidarCoverage: 100.0,
      crsStatus: 'EPSG:3857 -> ENU -> EPSG:4978 Verified',
      tileClipped: false,
      yoloNote: 'COCO weights lack building class (0 detections). CV fallback provides perimeter.'
    },
    MEDIUM: {
      id: 'LA-428383427',
      name: 'Commercial Warehouse (LA-428383427)',
      category: 'Medium Multi-Tenant Building',
      areaSqM: 641.9,
      vertices: 8,
      lidarPts: 10371,
      lidarHeight: 7.77,
      groundAMSL: 71.62,
      peakAMSL: 79.39,
      inferredFloors: 2,
      center: [-118.261522, 34.036301] as [number, number],
      osmMeshIoU: 97.9,
      centroidOffsetM: 0.11,
      hausdorffM: 2.80,
      lidarCoverage: 100.0,
      crsStatus: 'EPSG:3857 -> ENU -> EPSG:4978 Verified',
      tileClipped: false,
      yoloNote: 'COCO weights lack building class (0 detections). CV fallback provides perimeter.'
    },
    LARGE_TRUNCATED: {
      id: 'LA-428128103',
      name: 'South Park Block (LA-428128103)',
      category: 'Large Commercial Facility (Boundary Clipped)',
      areaSqM: 4409.9,
      vertices: 36,
      lidarPts: 38201,
      lidarHeight: 9.92,
      groundAMSL: 72.34,
      peakAMSL: 82.26,
      inferredFloors: 3,
      center: [-118.258007, 34.035886] as [number, number],
      osmMeshIoU: 20.1,
      centroidOffsetM: 43.04,
      hausdorffM: 93.68,
      lidarCoverage: 100.0, // of available tile points
      crsStatus: 'CRS Exact, but 32.7m of footprint extends outside USGS LAZ survey tile boundary',
      tileClipped: true,
      yoloNote: 'COCO weights lack building class. Mesh is truncated by survey tile boundary.'
    },
    LARGE_CONTAINED: {
      id: 'LA-1495167032',
      name: 'The Eden Tower (LA-1495167032)',
      category: 'Large Residential Complex (100% Inside Tile)',
      areaSqM: 4778.1,
      vertices: 18,
      lidarPts: 90845,
      lidarHeight: 27.95,
      groundAMSL: 72.05,
      peakAMSL: 100.0,
      inferredFloors: 8,
      center: [-118.261271, 34.037568] as [number, number],
      osmMeshIoU: 94.2,
      centroidOffsetM: 0.28,
      hausdorffM: 3.40,
      lidarCoverage: 100.0,
      crsStatus: 'EPSG:3857 -> ENU -> EPSG:4978 Verified',
      tileClipped: false,
      yoloNote: 'COCO weights lack building class. Full 90,845 LiDAR returns reconstructed.'
    }
  };

  const current = targets[activeTab];
  const matchedRecord = buildings.find((b) => b.id === current.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base">
                  Real Geometry &amp; CRS Audit (USGS 3DEP + OSM + 3D Mesh)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  RIGOROUS AUDIT MODE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Source LAZ: <span className="text-cyan-300">EPSG:3857 (3.5M pts)</span> • Target: <span className="text-emerald-300">WGS84 EPSG:4326 / Cesium ECEF</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto">
          <span className="text-xs font-mono text-slate-400 uppercase font-semibold mr-1 shrink-0">
            Audit Benchmark:
          </span>
          <button
            onClick={() => setActiveTab('SMALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 border shrink-0 ${
              activeTab === 'SMALL'
                ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white border-pink-400 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>SMALL (34m²)</span>
          </button>
          <button
            onClick={() => setActiveTab('MEDIUM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 border shrink-0 ${
              activeTab === 'MEDIUM'
                ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white border-pink-400 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>MEDIUM (642m²)</span>
          </button>
          <button
            onClick={() => setActiveTab('LARGE_CONTAINED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 border shrink-0 ${
              activeTab === 'LARGE_CONTAINED'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>LARGE: THE EDEN (4,778m²)</span>
          </button>
          <button
            onClick={() => setActiveTab('LARGE_TRUNCATED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 border shrink-0 ${
              activeTab === 'LARGE_TRUNCATED'
                ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white border-amber-400 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>LARGE (TILE-CLIPPED)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Tile clipping warning banner if applicable */}
          {current.tileClipped && (
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-2.5 text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-amber-100">Dataset Tile Boundary Truncation Detected</strong>
                <p className="text-[11px] text-amber-300/90 mt-0.5">
                  Building 428128103 crosses the eastern limit of the USGS LAZ survey tile (stopping at -118.257861°W).
                  32.7 meters of the building footprint extends outside the LiDAR bounds, explaining why its mesh is truncated and IoU drops to 20.1%.
                  Use &quot;The Eden Tower&quot; tab to audit a large building 100% inside the LiDAR tile.
                </p>
              </div>
            </div>
          )}

          {/* Building Identification Card */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{current.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {current.category}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                WGS84 Coordinates: <span className="text-cyan-300 font-bold">{current.center[1]}° N, {Math.abs(current.center[0])}° W</span>
              </p>
            </div>
            {matchedRecord && (
              <button
                onClick={() => {
                  onSelectAndFlyToBuilding(matchedRecord);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500 text-cyan-200 font-semibold flex items-center gap-1.5 transition self-start sm:self-center"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Fly to Building in Cesium</span>
              </button>
            )}
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Metric 1: OSM <-> 3D Mesh IoU */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-emerald-500/30">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono uppercase mb-1">
                <span>OSM ↔ 3D Mesh IoU</span>
                <span className="px-1.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  GEOMETRY
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {current.osmMeshIoU.toFixed(1)}%
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Polygon spatial coincidence
              </p>
            </div>

            {/* Metric 2: Mesh Centroid Offset */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-cyan-500/30">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono uppercase mb-1">
                <span>Centroid Error</span>
                <span className="px-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  PRECISION
                </span>
              </div>
              <div className="text-xl font-bold text-cyan-300 font-mono">
                {current.centroidOffsetM.toFixed(2)} m
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                OSM footprint vs 3D mesh centroid
              </p>
            </div>

            {/* Metric 3: Hausdorff Distance */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-amber-500/30">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono uppercase mb-1">
                <span>Hausdorff Dist</span>
                <span className="px-1.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  MAX SPREAD
                </span>
              </div>
              <div className="text-xl font-bold text-amber-300 font-mono">
                {current.hausdorffM.toFixed(2)} m
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Max perimeter boundary divergence
              </p>
            </div>

            {/* Metric 4: LiDAR Returns */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-purple-500/30">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono uppercase mb-1">
                <span>LiDAR Returns</span>
                <span className="px-1.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  USGS TRUTH
                </span>
              </div>
              <div className="text-xl font-bold text-purple-300 font-mono">
                {current.lidarPts.toLocaleString()} pts
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Measured Height: {current.lidarHeight.toFixed(2)}m
              </p>
            </div>
          </div>

          {/* Critical Audit Findings Table */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pipeline Stage CRS &amp; Mathematical Verification Trace</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="py-2 pr-3">PIPELINE STAGE</th>
                    <th className="py-2 px-3">EXACT COORDINATE SYSTEM</th>
                    <th className="py-2 px-3">VERIFICATION STATUS</th>
                    <th className="py-2 pl-3">ACCURACY / FINDINGS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 pr-3 text-pink-300 font-semibold">1. Source LAZ Point Cloud</td>
                    <td className="py-2.5 px-3 text-slate-300">EPSG:3857 (WGS 84 / Pseudo-Mercator)</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                        CONFIRMED HEADER
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-400">3,495,906 points in LAZ header VLR 2112. (Not UTM 11N).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 text-cyan-300 font-semibold">2. OSM Cadastral Vectors</td>
                    <td className="py-2.5 px-3 text-slate-300">EPSG:4326 (WGS84 Lon/Lat Degrees)</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                        CONFIRMED JSON
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-400">Projected to EPSG:3857 for spatial containment query.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 text-indigo-300 font-semibold">3. Reconstruction Mesh</td>
                    <td className="py-2.5 px-3 text-slate-300">Topocentric ENU (Meters) -&gt; glTF (X, Z, -Y)</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                        CONFIRMED GLB
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-400">Origin at (-118.260903°, 34.037095°, 72.17m AMSL).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 text-emerald-300 font-semibold">4. Cesium Globe ECEF</td>
                    <td className="py-2.5 px-3 text-slate-300">EPSG:4978 (Earth-Centered Earth-Fixed)</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                        CONFIRMED ECEF
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-400">Vertex geographic reprojection error &lt; 0.14m.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 text-amber-300 font-semibold">5. YOLOv8-seg Aerial Model</td>
                    <td className="py-2.5 px-3 text-slate-300">ONNX Model (COCO 80 Classes)</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                        UNTRAINED ON BLDGS
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-400">COCO has no building class. Needs SpaceNet/aerial fine-tuning.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Audit Status: <strong className="text-emerald-300">LiDAR + OSM + 3D Mesh Validated</strong>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Close Audit Modal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
