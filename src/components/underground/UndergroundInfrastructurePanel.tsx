import React from 'react';
import {
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  Database,
  Compass,
  Zap,
  Droplets,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import {
  UndergroundFeature,
  UndergroundQueryResult,
  UndergroundType
} from '../../types/underground';
import { LABuildingRecord } from '../../types/lidar';

interface UndergroundInfrastructurePanelProps {
  queryResult: UndergroundQueryResult | null;
  selectedBuilding: LABuildingRecord | null;
  isUndergroundMode: boolean;
  onToggleUndergroundMode: (enabled: boolean) => void;
  onExploreUnderground?: () => void;
  onExitUnderground?: () => void;
  selectedFeature: UndergroundFeature | null;
  onSelectFeature: (feature: UndergroundFeature | null) => void;
  filterType: UndergroundType | 'ALL';
  onChangeFilterType: (type: UndergroundType | 'ALL') => void;
  onClose?: () => void;
}

export const UndergroundInfrastructurePanel: React.FC<UndergroundInfrastructurePanelProps> = ({
  queryResult,
  selectedBuilding,
  isUndergroundMode,
  onToggleUndergroundMode,
  onExploreUnderground,
  onExitUnderground,
  selectedFeature,
  onSelectFeature,
  filterType,
  onChangeFilterType,
  onClose
}) => {
  if (!queryResult) return null;

  const features = queryResult.features || [];
  const filteredFeatures =
    filterType === 'ALL' ? features : features.filter((f) => f.type === filterType);

  const activeFeature = selectedFeature || (filteredFeatures.length > 0 ? filteredFeatures[0] : null);

  const getTypeColor = (type: UndergroundType) => {
    switch (type) {
      case 'SEWER':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
      case 'WATER':
        return 'text-cyan-400 bg-cyan-950/80 border-cyan-800';
      case 'ELECTRIC':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'STORM_DRAIN':
        return 'text-purple-400 bg-purple-950/80 border-purple-800';
      default:
        return 'text-zinc-400 bg-zinc-900 border-zinc-700';
    }
  };

  const getRelationshipBadge = (rel: string) => {
    switch (rel) {
      case 'INTERSECTS_BUILDING':
        return 'bg-pink-950 text-pink-300 border-pink-800';
      case 'NEAR_BUILDING':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'WITHIN_AOI':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="gis-glass-panel rounded-3xl p-4 w-80 sm:w-92 max-w-[370px] shadow-2xl pointer-events-auto border border-zinc-800 transition-all duration-300 select-text flex flex-col max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar font-mono text-xs space-y-3.5">
      {/* 1. Header with Close and Mode Action */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-xs uppercase font-extrabold text-white tracking-wider">
              UNDERGROUND INFRASTRUCTURE
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400 font-sans">
            Downtown Los Angeles · South Park Precinct
          </p>
        </div>

        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Required Honest Underground Status Specification */}
      <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-[10.5px] font-mono shadow-inner">
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
          <span className="text-zinc-400">Authoritative data for this building:</span>
          <span className="text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-[9.5px]">
            UNAVAILABLE
          </span>
        </div>
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
          <span className="text-zinc-400">Visualization:</span>
          <span className="text-purple-300 font-bold px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-[9.5px]">
            DEMO
          </span>
        </div>
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
          <span className="text-zinc-400">Depth:</span>
          <span className="text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-[9.5px]">
            ESTIMATED
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Source:</span>
          <span className="text-zinc-300 font-semibold text-[9.5px] text-right truncate max-w-[180px]">
            No authoritative feature available for current AOI
          </span>
        </div>
      </div>

      {/* 2B. Required Explanation Alert Banner */}
      <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-800/70 text-[10px] text-amber-200/90 font-sans leading-relaxed flex items-start gap-2 shadow-sm">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          Airborne LiDAR does not detect underground infrastructure. Underground visualization is a prototype representation pending authoritative utility/GPR/BIM data.
        </p>
      </div>

      {/* 3. Explore Underground Mode Action Banner */}
      <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-cyan-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-300 font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Subterranean View</span>
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              isUndergroundMode
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
            }`}
          >
            {isUndergroundMode ? 'SUB-TERRAIN ACTIVE' : 'SURFACE VIEW'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isUndergroundMode ? (
            <button
              onClick={onExitUnderground}
              className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center border border-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Exit Underground</span>
            </button>
          ) : (
            <button
              onClick={onExploreUnderground}
              className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-center shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Explore Underground</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Type Filter Chips */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
        {(['ALL', 'SEWER', 'WATER', 'ELECTRIC'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onChangeFilterType(t)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
              filterType === t
                ? 'bg-white text-black shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 5. BUILDING <-> UNDERGROUND RELATIONSHIP CARD */}
      {selectedBuilding && activeFeature && (
        <div className="p-2.5 rounded-2xl bg-zinc-950 border border-cyan-900/60 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-850">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              BUILDING ↔ INFRASTRUCTURE
            </span>
            <span className="text-[8px] px-2 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800">
              DEMO — NOT AUTHORITATIVE
            </span>
          </div>

          <div className="space-y-1 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Selected Building:</span>
              <span className="text-white font-bold truncate max-w-[170px]" title={selectedBuilding.name}>
                {selectedBuilding.name} ({selectedBuilding.id})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Feature Status:</span>
              <span className="text-purple-300 font-bold">DEMO — NOT AUTHORITATIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Distance:</span>
              <span className="text-cyan-300 font-bold">
                {activeFeature.distanceToBuildingMeters !== undefined
                  ? `${activeFeature.distanceToBuildingMeters} meters`
                  : 'Directly Adjacent'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Subsurface Depth:</span>
              <span className="text-amber-300 font-bold">
                {activeFeature.depth ? `-${activeFeature.depth}m (ESTIMATED)` : 'UNAVAILABLE'}
              </span>
            </div>
          </div>

          <p className="text-[8.5px] text-zinc-500 font-sans leading-tight pt-1 border-t border-zinc-850 italic">
            Airborne LiDAR does not detect underground infrastructure. Underground visualization is a prototype representation pending authoritative utility/GPR/BIM data.
          </p>
        </div>
      )}

      {/* 6. Visual Underground Cutaway Diagram */}
      <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5 font-mono text-[9.5px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-400 uppercase font-bold block">
            Subterranean Diagram
          </span>
          <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
            DEMO PROTOTYPE
          </span>
        </div>
        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] leading-relaxed">
          <div className="text-cyan-300 font-bold">
            BUILDING  ┌─────────────────────┐
          </div>
          <div className="text-zinc-400">
            GROUND ───┴─────────────────────┴─── (0.0m Ground Surface)
          </div>
          <div className="text-amber-400">
            ↓ -1.5m ─── POTABLE WATER MAIN [ESTIMATED]
          </div>
          <div className="text-emerald-400">
            ↓ -3.2m ─── SANITARY SEWER MAIN [ESTIMATED]
          </div>
        </div>
        <p className="text-[8px] text-zinc-500 font-sans leading-tight">
          Visual depth is ESTIMATED. No authoritative 3D underground utility data is available for this building.
        </p>
      </div>

      {/* 7. Detailed Feature List */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase block px-1">
          Demo Elements ({filteredFeatures.length})
        </span>

        {filteredFeatures.map((f) => {
          const isSelected = activeFeature?.id === f.id;
          return (
            <div
              key={f.id}
              onClick={() => onSelectFeature(f)}
              className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 border-cyan-500 shadow-md'
                  : 'bg-zinc-950/70 border-zinc-850 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold border ${getTypeColor(f.type)}`}>
                    {f.type}
                  </span>
                  <span className="text-white font-bold text-[10.5px] truncate max-w-[130px]">
                    {f.id}
                  </span>
                </div>
                <span className="text-[8px] px-1.5 py-0.2 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  DEMO — NOT AUTHORITATIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[9px] text-zinc-400">
                <div>Type: <span className="text-zinc-200">{f.type}</span></div>
                <div>Status: <span className="text-purple-300 font-bold">DEMO</span></div>
                <div>Distance: <span className="text-cyan-300">{f.distanceToBuildingMeters !== undefined ? `${f.distanceToBuildingMeters}m` : 'Adjacent'}</span></div>
                <div>Depth: <span className="text-amber-300 font-bold">{f.depth ? `-${f.depth}m (ESTIMATED)` : 'ESTIMATED'}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
