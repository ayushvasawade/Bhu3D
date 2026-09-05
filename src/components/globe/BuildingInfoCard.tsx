import React from 'react';
import { Building2, X, ArrowRight, Layers, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BuildingFootprint } from '../../types/geospatial';

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
    <div className="absolute top-20 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-84 z-30 w-80 sm:w-96 gis-glass-panel rounded-3xl p-5 border border-sky-400/50 shadow-2xl animate-fadeIn pointer-events-auto">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-sky-500/20 mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 font-bold">
                {building.id}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                3D Volume
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              {building.name}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Building Metrics */}
      <div className="space-y-2 text-xs divide-y divide-slate-800/60 font-medium">
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-400">Geometry Source</span>
          <span className="text-emerald-400 font-semibold">{building.source}</span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-slate-400">Measured / Extruded Height</span>
          <span className="text-slate-100 font-mono">
            {building.height} m{' '}
            <span className="text-slate-400 text-[10px] font-normal">({building.heightSource})</span>
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-slate-400">Estimated Floors</span>
          <span className="text-slate-200">{building.floors} Floors</span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-slate-400">Spatial Centroid</span>
          <span className="text-sky-300 font-mono text-[11px]">
            {building.centroid[1].toFixed(4)}° N, {building.centroid[0].toFixed(4)}° E
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-slate-400">Cadastral Separation</span>
          <span className="text-slate-300 text-[11px]">Decoupled from Ownership</span>
        </div>
      </div>

      {/* Data Provenance Notice */}
      <div className="mt-3.5 p-2.5 rounded-xl bg-slate-900/80 border border-sky-500/20 text-[11px] text-slate-300 space-y-1">
        <div className="text-sky-300 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real Geospatial Feature</span>
        </div>
        <p className="text-slate-400 text-[10px] leading-relaxed">
          Footprint coordinates derived directly from OpenStreetMap. Elevation & height are processed through the WGS84 ingestion pipeline.
        </p>
      </div>

      {/* Action Button: Continue into Property / Apartment View */}
      <div className="mt-4 pt-3 border-t border-sky-500/20">
        <button
          onClick={() => onViewProperty?.(building.associatedPropertyId)}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all shadow-glow-cyan flex items-center justify-center space-x-2"
        >
          <span>Inspect Vertical Floors & Ownership</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
