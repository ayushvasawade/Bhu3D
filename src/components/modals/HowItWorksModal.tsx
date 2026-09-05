import React from 'react';
import { X, ArrowDown, Map, Box, Layers, UserCheck, Hash, CheckCircle2 } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Existing Geospatial Data',
    subtitle: 'Bhuvan (ISRO) · Survey of India · OSM · SRTM DEM',
    icon: Map,
    color: 'from-blue-500 to-sky-400',
    description: 'Ingestion of 2D cadastral boundary polygons, satellite optical base imagery, and digital terrain elevation to establish ground truth coordinates (WGS84 / EPSG:4326).'
  },
  {
    step: 2,
    title: '3D City / Building (LOD2)',
    subtitle: 'Volumetric Massing & LiDAR Extrusion',
    icon: Box,
    color: 'from-cyan-500 to-teal-400',
    description: 'Extruding 2D building footprints into 3D polygonal massings using drone LiDAR heights and municipal sanction drawings, producing OGC 3D Tiles / CityGML models.'
  },
  {
    step: 3,
    title: 'Individual Floor / Apartment',
    subtitle: 'Vertical Cadastre Slicing (BIM / CAD)',
    icon: Layers,
    color: 'from-indigo-500 to-blue-400',
    description: 'Subdividing the vertical building volume into individual floor slabs and apartment unit polygons, defining exact 3D bounding coordinates, ceiling heights, and carpet areas.'
  },
  {
    step: 4,
    title: 'Property + Ownership Data',
    subtitle: 'Land Revenue Registry & Title Deeds',
    icon: UserCheck,
    color: 'from-emerald-500 to-teal-400',
    description: 'Linking the 3D unit geometry to municipal registration records, title deeds, undivided land share (UDS), mutation records, and verified citizen identity.'
  },
  {
    step: 5,
    title: '3D Property ID / ULPIN',
    subtitle: '3D Bhu-Aadhaar Generation Algorithm',
    icon: Hash,
    color: 'from-sky-500 to-indigo-500',
    description: 'Synthesizing a unique 3D cadastre code: combining State + District + GeoCentroid Hash + Building ID + Floor Level + Unit ID (e.g. IN-MH-PUN-0428-BLD04-FL03-U301).'
  }
];

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="gis-glass-panel rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-sky-500/30 p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 font-semibold">
            Technical Architecture
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            How 3D Cadastral Mapping Works
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            The end-to-end data pipeline transforming 2D satellite coordinates into individual 3D property titles.
          </p>
        </div>

        {/* 5-Step Pipeline Flow */}
        <div className="space-y-4">
          {PIPELINE_STEPS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === PIPELINE_STEPS.length - 1;

            return (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-full gis-glass-card rounded-2xl p-4 flex items-start space-x-3.5 hover:border-sky-400/50 transition-all">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shrink-0 shadow-lg`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                        Step 0{item.step}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.subtitle}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {!isLast && (
                  <div className="my-1.5 flex items-center justify-center text-sky-400/60">
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>ISO 19152 LADM 3D Extension Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm transition-all shadow-glow-cyan"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
