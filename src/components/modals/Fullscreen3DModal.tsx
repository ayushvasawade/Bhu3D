import React, { useState } from 'react';
import { X, Layers, Maximize2, ShieldCheck, Ruler, Home } from 'lucide-react';
import { PropertyRecord, RoomItem } from '../../types/property';
import { Apartment3DViewer } from '../property/Apartment3DViewer';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface Fullscreen3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyRecord;
}

export const Fullscreen3DModal: React.FC<Fullscreen3DModalProps> = ({
  isOpen,
  onClose,
  property
}) => {
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg animate-fadeIn select-text">
      <div className="gis-glass-panel rounded-3xl w-full max-w-5xl h-[88vh] border border-white/20 shadow-2xl relative flex flex-col overflow-hidden text-zinc-100">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white text-black">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Bhu3D Concept Lab · 3D Unit Volume ({property.propertyName})
                </h2>
                <DataProvenanceBadge status="DEMO" label="CONCEPT LAB MODEL" size="sm" />
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Proposed Ref: {property.propertyId3D} · {property.buildingName}, {property.city}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 3D Scene + Room List */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Main 3D Canvas */}
          <div className="flex-1 h-full relative">
            <Apartment3DViewer
              property={property}
              selectedRoomId={selectedRoom?.id}
              onSelectRoom={setSelectedRoom}
            />
          </div>

          {/* Right Info Drawer */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-950 p-5 overflow-y-auto space-y-4 shrink-0">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-zinc-400" />
                Floor Plan Room Breakdown
              </h3>
              <p className="text-[11px] text-zinc-400 mb-3">
                Click a room to inspect architectural spatial parameters.
              </p>

              <div className="space-y-2">
                {property.rooms.map((room) => {
                  const isSelected = selectedRoom?.id === room.id;
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(isSelected ? null : room)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900 border-white shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {room.name}
                        </span>
                        <span className="text-xs font-mono text-white font-semibold">
                          {room.areaSqM} m²
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Dimensions: {room.dimensions}
                      </div>
                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-zinc-700 text-[10px] text-zinc-300 space-y-1">
                          <span className="font-semibold text-white block">Features:</span>
                          {room.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-white" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Area summary */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Built-up Area:</span>
                <span className="font-mono text-white font-bold">{property.builtUpArea} m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Carpet Area:</span>
                <span className="font-mono text-zinc-200">{property.carpetArea} m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Undivided Share (UDS):</span>
                <span className="font-mono text-zinc-300 font-semibold">{property.undividedLandShare} m²</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
