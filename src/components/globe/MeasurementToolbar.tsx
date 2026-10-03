import React from 'react';
import { Ruler, ArrowUpDown, Square, Box, X } from 'lucide-react';
import { MeasurementType } from '../../types/intelligence';

interface MeasurementToolbarProps {
  activeType: MeasurementType | null;
  onSelectType: (type: MeasurementType | null) => void;
  metrics: {
    horizontalDistanceM?: number;
    verticalHeightM?: number;
    footprintAreaSqM?: number;
    volumeM3?: number;
  };
  onClear?: () => void;
}

export const MeasurementToolbar: React.FC<MeasurementToolbarProps> = ({
  activeType,
  onSelectType,
  metrics,
  onClear
}) => {
  return (
    <div className="gis-glass-panel rounded-2xl p-2.5 shadow-2xl border border-zinc-800 text-xs pointer-events-auto">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-zinc-800">
        <span className="text-[10px] font-mono uppercase text-zinc-300 font-bold flex items-center gap-1">
          <Ruler className="w-3 h-3 text-white" />
          <span>3D Measurement Inspector</span>
        </span>
        {activeType && (
          <button
            onClick={() => onSelectType(null)}
            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-0.5"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1">
        <button
          onClick={() => onSelectType(activeType === 'distance' ? null : 'distance')}
          className={`p-1.5 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
            activeType === 'distance'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
          title="Measure Horizontal Extent / Distance"
        >
          <Ruler className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Distance</span>
        </button>

        <button
          onClick={() => onSelectType(activeType === 'height' ? null : 'height')}
          className={`p-1.5 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
            activeType === 'height'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
          title="Inspect Vertical Height"
        >
          <ArrowUpDown className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Height</span>
        </button>

        <button
          onClick={() => onSelectType(activeType === 'area' ? null : 'area')}
          className={`p-1.5 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
            activeType === 'area'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
          title="Compute Ground Footprint Area"
        >
          <Square className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Area</span>
        </button>

        <button
          onClick={() => onSelectType(activeType === 'volume' ? null : 'volume')}
          className={`p-1.5 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
            activeType === 'volume'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
          title="Approximate 3D Spatial Volume"
        >
          <Box className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Volume</span>
        </button>
      </div>

      {/* Measurement Readout Box */}
      <div className="mt-2 p-2 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono space-y-1">
        {activeType === 'distance' && (
          <div className="flex items-center justify-between text-zinc-300">
            <span>Footprint Span:</span>
            <span className="font-bold text-white">
              {metrics.horizontalDistanceM ? `${metrics.horizontalDistanceM.toFixed(1)} m` : 'Calculated'}
            </span>
          </div>
        )}

        {activeType === 'height' && (
          <div className="flex items-center justify-between text-zinc-300">
            <span>Vertical Height (AGL):</span>
            <span className="font-bold text-white">
              {metrics.verticalHeightM ? `${metrics.verticalHeightM.toFixed(1)} m` : '—'}
            </span>
          </div>
        )}

        {activeType === 'area' && (
          <div className="flex items-center justify-between text-zinc-300">
            <span>Footprint Area:</span>
            <span className="font-bold text-white">
              {metrics.footprintAreaSqM ? `${Math.round(metrics.footprintAreaSqM).toLocaleString()} m²` : '—'}
            </span>
          </div>
        )}

        {activeType === 'volume' && (
          <div className="flex items-center justify-between text-zinc-300">
            <span>Calculated 3D Volume:</span>
            <span className="font-bold text-white">
              {metrics.volumeM3 ? `${Math.round(metrics.volumeM3).toLocaleString()} m³` : '—'}
            </span>
          </div>
        )}

        {!activeType && (
          <div className="text-[10px] text-zinc-500 text-center py-0.5 font-sans">
            Select a tool to inspect real geometrical extents of loaded 3D features
          </div>
        )}
      </div>
    </div>
  );
};
