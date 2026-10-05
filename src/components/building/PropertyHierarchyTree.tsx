import React, { useState } from 'react';
import { Building2, ChevronDown, ChevronRight, Hash, Home, AlertCircle } from 'lucide-react';
import { LABuildingRecord } from '../../types/lidar';

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

  const derivedH = building.derivedHeightMeters;
  const count = Math.max(1, Math.round(derivedH / floorHeightAssumption));

  const toggleFloorExpand = (lvl: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFloors((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  const cleanBldId = building.id.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Vertical Property & Ownership Hierarchy
          </h4>
          <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
            Cadastral strata decomposition and condominium unit registration
          </p>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-400 font-bold">
          3D CADASTRE
        </span>
      </div>

      {/* Root Building Node */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-[11px] truncate">
            {building.name} ({building.id})
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 ml-auto border border-cyan-800">
            ROOT PARCEL
          </span>
        </div>

        {/* Tree of Floors */}
        <div className="pl-4 border-l-2 border-zinc-800 space-y-2">
          {Array.from({ length: count }, (_, i) => {
            const lvl = i + 1;
            const isFloorSelected = selectedFloor === lvl;
            const isExpanded = !!expandedFloors[lvl];
            const floorCode = `F${String(lvl).padStart(2, '0')}`;
            const unitCode = `${floorCode}-U01`;
            const derivedId = `BH3D-SPARK-${cleanBldId}-${unitCode}`;

            return (
              <div key={lvl} className="space-y-1.5">
                {/* Floor Branch Item */}
                <div
                  onClick={() => onSelectFloor?.(isFloorSelected ? null : lvl)}
                  className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isFloorSelected
                      ? 'bg-zinc-800 text-white border-cyan-500 shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleFloorExpand(lvl, e)}
                      className="p-0.5 rounded hover:bg-zinc-750 text-zinc-400"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="font-bold text-[11px]">
                      {lvl === 1 ? 'Floor 1 (Ground Strata)' : `Floor ${lvl}`}
                    </span>
                  </div>

                  <span className="text-[9px] text-zinc-500">
                    1 Registered Unit
                  </span>
                </div>

                {/* Sub-Units Branch (Shown when expanded) */}
                {isExpanded && (
                  <div className="pl-6 border-l border-zinc-800 space-y-1.5 pt-0.5">
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-white text-[10px]">
                          <Home className="w-3 h-3 text-amber-400" />
                          <span>Unit {unitCode}</span>
                        </span>
                        <span className="text-[8px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          DERIVED UNIT
                        </span>
                      </div>

                      <div className="text-[9px] text-zinc-400 font-mono">
                        Spatial ULPIN: <span className="text-zinc-200 select-all">{derivedId}</span>
                      </div>

                      {/* Explicit Honest Data Connection Status */}
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
