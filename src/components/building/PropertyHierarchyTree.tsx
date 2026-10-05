import React, { useState, useMemo } from 'react';
import { Building2, ChevronDown, ChevronRight, Home, AlertCircle, Layers } from 'lucide-react';
import { LABuildingRecord } from '../../types/lidar';
import { generateBuildingFloors } from '../../utils/geoUtils';

interface PropertyHierarchyTreeProps {
  building: LABuildingRecord;
  selectedFloor: number | null;
  onSelectFloor?: (floor: number | null) => void;
  floorHeightAssumption?: number;
}

export const PropertyHierarchyTree: React.FC<PropertyHierarchyTreeProps> = ({
  building,
  selectedFloor,
  onSelectFloor,
  floorHeightAssumption = 3.5
}) => {
  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({ 1: true });

  const floorResult = useMemo(() => {
    return generateBuildingFloors(building, { floorHeightAssumption });
  }, [building, floorHeightAssumption]);

  const toggleFloorExpand = (lvl: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFloors((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  return (
    <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Vertical Property & Strata Tree</span>
          </h4>
          <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
            Floor Count: <strong className="text-amber-300">ESTIMATED</strong> · Floor Geometry: <strong className="text-cyan-300">DERIVED</strong> · Source: <strong className="text-emerald-400">REAL LiDAR + OSM</strong>
          </p>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
          ESTIMATED CADASTRE
        </span>
      </div>

      {/* Root Building Node */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-[11px] truncate">
            {building.name} ({building.id})
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 ml-auto border border-cyan-800 font-bold">
            ROOT PARCEL
          </span>
        </div>

        {/* Tree of Floors: Building ├── Floor 1 ... └── Floor N */}
        <div className="pl-4 border-l-2 border-zinc-800 space-y-2">
          {floorResult.floors.map((fl) => {
            const lvl = fl.floorNumber;
            const isFloorSelected = selectedFloor === lvl;
            const isExpanded = !!expandedFloors[lvl];

            return (
              <div key={fl.id} className="space-y-1.5">
                {/* Floor Branch Item */}
                <div
                  onClick={() => onSelectFloor?.(isFloorSelected ? null : lvl)}
                  className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isFloorSelected
                      ? 'bg-zinc-800 text-white border-cyan-500 shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => toggleFloorExpand(lvl, e)}
                      className="p-0.5 rounded hover:bg-zinc-750 text-zinc-400 shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-cyan-300 shrink-0">
                      {fl.floorCode}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-[11px] block truncate">
                        {fl.floorName}
                      </span>
                      <span className="text-[9px] text-zinc-400 block font-sans truncate">
                        {fl.baseElevation}m – {fl.topElevation}m AMSL ({fl.height}m · {fl.volume.toLocaleString()} m³)
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[9px] text-emerald-400 font-bold block">
                      {fl.confidence}% Conf
                    </span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      {fl.provenance}
                    </span>
                  </div>
                </div>

                {/* Sub-Units Branch (Marked clearly as DEMO / PROTOTYPE) */}
                {isExpanded && (
                  <div className="pl-6 border-l border-zinc-800 space-y-1.5 pt-0.5">
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-white text-[10px]">
                          <Home className="w-3 h-3 text-amber-400" />
                          <span>Unit {fl.floorCode}-U01</span>
                        </span>
                        <span className="text-[8px] font-mono px-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                          DEMO / PROTOTYPE
                        </span>
                      </div>

                      <div className="text-[9px] text-zinc-400 font-mono">
                        Spatial ULPIN: <span className="text-zinc-200 select-all">{fl.syntheticUnitId}</span>
                      </div>

                      {/* Explicit Honest Disclaimer: No actual apartment boundaries */}
                      <p className="text-[8.5px] text-zinc-500 font-sans italic leading-tight pt-0.5 border-t border-zinc-900">
                        * Notice: Unit boundary is for prototype demonstration. LiDAR measures exterior envelope only; interior apartment partition walls and legal condominium floor slabs are not detected.
                      </p>

                      {/* Data Connection Status */}
                      <div className="pt-1 border-t border-zinc-900 grid grid-cols-2 gap-1 text-[9px]">
                        <div>
                          <span className="text-zinc-500 block">Deed Title / Owner:</span>
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>Not connected</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Municipal Tax Roll:</span>
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>Not connected</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
