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

      {/* 2. Explore Underground Mode Action Banner */}
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
              className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Minimize2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Exit Underground</span>
            </button>
          ) : (
            <button
              onClick={onExploreUnderground}
              className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-center shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Explore Underground</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Official Source & Summary Stats Card */}
      <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-zinc-400 font-bold uppercase">Data Source:</span>
          <a
            href={queryResult.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans text-[10px]"
          >
            <span>LA County Public Works</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Status Callout */}
        <div
          className={`p-2 rounded-xl border text-[10px] leading-tight ${
            queryResult.hasRealFeaturesAtAoi
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          <div className="font-bold flex items-center gap-1 mb-0.5">
            <Info className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>{queryResult.statusText}</span>
          </div>
          {!queryResult.hasRealFeaturesAtAoi && (
            <p className="text-[9px] text-zinc-500 font-sans mt-0.5">
              LA County CSMD covers unincorporated areas; DTLA incorporates under City of LA Sanitation. Demonstration utility lines rendered with explicit DEMO tags.
            </p>
          )}
        </div>

        {/* Feature Provenance Counters Grid */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
          <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850">
            <span className="text-[8px] text-zinc-500 block uppercase">Total</span>
            <span className="font-bold text-white text-xs">{queryResult.featuresRendered}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850">
            <span className="text-[8px] text-emerald-400 block uppercase">REAL</span>
            <span className="font-bold text-emerald-400 text-xs">{queryResult.realCount}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850">
            <span className="text-[8px] text-amber-400 block uppercase">ESTIMATED</span>
            <span className="font-bold text-amber-400 text-xs">{queryResult.estimatedCount}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850">
            <span className="text-[8px] text-pink-400 block uppercase">DEMO</span>
            <span className="font-bold text-pink-400 text-xs">{queryResult.demoCount}</span>
          </div>
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
              BUILDING ↔ UNDERGROUND
            </span>
            <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold border ${getRelationshipBadge(activeFeature.relationship)}`}>
              {activeFeature.relationship.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="space-y-1 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Building:</span>
              <span className="text-white font-bold truncate max-w-[170px]" title={selectedBuilding.name}>
                {selectedBuilding.name} ({selectedBuilding.id})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Infrastructure:</span>
              <span className="text-white font-bold truncate max-w-[170px]" title={activeFeature.id}>
                {activeFeature.name || activeFeature.id}
              </span>
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
              <span className={activeFeature.depth ? 'text-amber-300 font-bold' : 'text-zinc-400'}>
                {activeFeature.depth ? `-${activeFeature.depth}m (ESTIMATED)` : 'UNAVAILABLE'}
              </span>
            </div>
          </div>

          <p className="text-[8.5px] text-zinc-500 font-sans leading-tight pt-1 border-t border-zinc-850 italic">
            Do not claim the sewer belongs to the property. Utilities within public rights-of-way represent municipal service connections.
          </p>
        </div>
      )}

      {/* 6. Visual Underground Cutaway Diagram */}
      <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5 font-mono text-[9.5px]">
        <span className="text-[10px] text-zinc-400 uppercase font-bold block">
          Subterranean Stratum Diagram
        </span>
        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] leading-relaxed">
          <div className="text-cyan-300 font-bold">
            BUILDING  ┌─────────────────────┐
          </div>
          <div className="text-zinc-400">
            GROUND ───┴─────────────────────┴─── (0.0m Ground Surface)
          </div>
          <div className="text-amber-400">
            ↓ -1.5m ─── POTABLE WATER MAIN (8" DIP)
          </div>
          <div className="text-emerald-400">
            ↓ -3.2m ─── SANITARY SEWER GRAVITY MAIN (12" VCP)
          </div>
        </div>
        <p className="text-[8.5px] text-zinc-500 font-sans leading-tight">
          Visual vertical offset only. Not physical engineering survey depth unless authoritatively specified.
        </p>
      </div>

      {/* 7. Detailed Feature List */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase block px-1">
          Infrastructure Elements ({filteredFeatures.length})
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
                  <span className="text-white font-bold text-[11px] truncate max-w-[150px]">
                    {f.id}
                  </span>
                </div>
                <span
                  className={`text-[8px] px-1.5 py-0.2 rounded font-bold ${
                    f.provenance === 'REAL'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : f.provenance === 'DEMO'
                      ? 'bg-pink-950 text-pink-300 border border-pink-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {f.provenance}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[9px] text-zinc-400">
                <div>Material: <span className="text-zinc-200">{f.material || 'Standard'}</span></div>
                <div>Diameter: <span className="text-zinc-200">{f.diameter ? `${f.diameter}"` : 'N/A'}</span></div>
                <div>Distance: <span className="text-cyan-300">{f.distanceToBuildingMeters !== undefined ? `${f.distanceToBuildingMeters}m` : 'Adjacent'}</span></div>
                <div>Depth: <span className={f.depth ? 'text-amber-300' : 'text-zinc-500'}>{f.depth ? `-${f.depth}m` : 'UNAVAILABLE'}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
