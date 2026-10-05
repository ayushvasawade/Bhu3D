import React, { useMemo } from 'react';
import { LABuildingRecord } from '../../types/lidar';
import { generateBuildingFloors } from '../../utils/geoUtils';

interface BuildingCrossSectionProps {
  building: LABuildingRecord;
  selectedFloor: number | null;
  onSelectFloor?: (floor: number | null) => void;
  floorHeightAssumption?: number;
}

export const BuildingCrossSection: React.FC<BuildingCrossSectionProps> = ({
  building,
  selectedFloor,
  onSelectFloor,
  floorHeightAssumption = 3.5
}) => {
  const floorResult = useMemo(() => {
    return generateBuildingFloors(building, { floorHeightAssumption });
  }, [building, floorHeightAssumption]);

  const groundZ = floorResult.baseGroundAMSL;
  const peakZ = floorResult.roofAMSL;
  const count = floorResult.floorCount;

  // Reverse so roof is at top, ground at bottom
  const reversedFloors = useMemo(() => {
    return [...floorResult.floors].reverse();
  }, [floorResult.floors]);

  return (
    <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Vertical Architectural Cross-Section
          </h4>
          <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
            LiDAR elevation profile and vertical floor stratification (NAVD88 AMSL)
          </p>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-400 font-bold">
          {count} STRATA
        </span>
      </div>

      {/* Roof Deck Datum Header */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold">Main Roof Deck</span>
          <span className="text-[9px] text-zinc-400">({building.architecture?.classification?.replace(/_/g, ' ') || 'Planar Flat'})</span>
        </div>
        <span className="text-white font-bold">{peakZ.toFixed(2)} m AMSL</span>
      </div>

      {/* Stacked Floor Cross-Section Planks */}
      <div className="space-y-1.5 pt-1">
        {reversedFloors.map((f) => {
          const isSelected = selectedFloor === f.floorNumber;
          return (
            <div
              key={f.id}
              onClick={() => onSelectFloor?.(isSelected ? null : f.floorNumber)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-white text-black border-white shadow-lg font-bold'
                  : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {f.floorCode}
                </span>
                <div>
                  <span className="block text-[11px] leading-tight font-semibold">
                    {f.floorName}
                  </span>
                  <span className={`text-[9px] block ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    Height: {f.height}m · Vol: {f.volume.toLocaleString()} m³
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="block font-bold text-[10px]">
                  {f.baseElevation}m → {f.topElevation}m
                </span>
                <span className={`text-[9px] font-bold ${isSelected ? 'text-zinc-800' : 'text-amber-400'}`}>
                  {f.provenance}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ground Level Datum Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-bold">Local Ground Datum</span>
          <span className="text-[9px] text-zinc-400">(Ring Buffer Class 2 Returns)</span>
        </div>
        <span className="text-white font-bold">{groundZ.toFixed(2)} m AMSL</span>
      </div>
    </div>
  );
};
