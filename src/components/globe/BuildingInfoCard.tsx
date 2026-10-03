import React from 'react';
import { Building2, X, ArrowRight, Layers, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BuildingFootprint } from '../../types/geospatial';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface BuildingInfoCardProps {
  building: BuildingFootprint;
  onClose: () => void;
  onViewProperty?: (propertyId?: string) => void;
}

export const BuildingInfoCard: React.FC<BuildingInfoCardProps> = ({
  building,
  onClose,
  onViewProperty
}) => {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-84 z-30 w-80 sm:w-96 gis-glass-panel rounded-3xl p-5 border border-white/20 shadow-2xl animate-fadeIn pointer-events-auto text-zinc-100">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-zinc-800 mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-white text-black">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold">
                {building.id}
              </span>
              <DataProvenanceBadge status="REAL" label="REAL OSM" size="sm" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              {building.name}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Building Metrics with Provenance */}
      <div className="space-y-2 text-xs divide-y divide-zinc-800/80 font-medium">
        <div className="flex items-center justify-between pt-1">
          <span className="text-zinc-400">Footprint Source</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold">{building.source}</span>
            <DataProvenanceBadge status="REAL" size="sm" showIcon={false} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Extruded Height</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-mono">{building.height} m</span>
            <DataProvenanceBadge status="DERIVED" size="sm" showIcon={false} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Estimated Floors</span>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-200">{building.floors} Floors</span>
            <DataProvenanceBadge status="ESTIMATED" size="sm" showIcon={false} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Spatial Centroid</span>
          <span className="text-zinc-300 font-mono text-[11px]">
            {building.centroid[1].toFixed(4)}° N, {building.centroid[0].toFixed(4)}° E
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Vertical Units</span>
          <DataProvenanceBadge status="UNAVAILABLE" size="sm" showIcon={false} />
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-zinc-400">Ownership Title</span>
          <DataProvenanceBadge status="UNAVAILABLE" size="sm" showIcon={false} />
        </div>
      </div>

      {/* Honest Provenance Notice */}
      <div className="mt-3.5 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
        <div className="text-white font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Real Geospatial Feature</span>
        </div>
        <p className="text-zinc-400 text-[10px] leading-relaxed">
          Footprint coordinates derived directly from OpenStreetMap. Elevation is computed via standard height estimation. Ownership and interior unit data remain unavailable.
        </p>
      </div>

      {/* Action Button: View Property Intelligence */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <button
          onClick={() => onViewProperty?.(building.associatedPropertyId)}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-sm flex items-center justify-center space-x-2"
        >
          <span>Open Property Intelligence</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
