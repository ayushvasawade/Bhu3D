import React from 'react';
import { X, ArrowDown, Map, Box, Layers, UserCheck, Hash, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Real Geospatial Ingestion',
    subtitle: 'OpenTopography LiDAR · OSM · ESRI Satellite · SRTM',
    icon: Map,
    status: 'REAL',
    description: 'Ingestion of 2D cadastral footprints, real survey LiDAR point clouds, and satellite imagery to establish precise ground truth coordinates (WGS84 / EPSG:4326).'
  },
  {
    step: 2,
    title: 'Physical Extrusion & Measurements',
    subtitle: 'LiDAR Elevation & Footprint Geometry',
    icon: Box,
    status: 'DERIVED',
    description: 'Deriving accurate physical building heights, roof elevations, and surface ground datum directly from survey measurements.'
  },
  {
    step: 3,
    title: 'Evidence & Validation Framework',
    subtitle: 'Multi-Source Provenance & Confidence Auditing',
    icon: ShieldCheck,
    status: 'REAL',
    description: 'Cross-verifying geometry against satellite optical data, tagging every attribute with transparent status badges (REAL, DERIVED, ESTIMATED, UNAVAILABLE).'
  },
  {
    step: 4,
    title: 'Bhu3D Concept Lab / Vertical Cadastre',
    subtitle: 'Floor Slicing & Volumetric Unit Modeling',
    icon: Layers,
    status: 'DEMO',
    description: 'In the Demonstration Lab, architectural floor plans are sliced into 3D volumetric units to demonstrate ISO 19152 LADM 3D parcel modeling when official indoor records are unavailable.'
  },
  {
    step: 5,
    title: 'Proposed 3D Bhu3D Reference',
    subtitle: 'Prototype Spatial Reference Identifier',
    icon: Hash,
    status: 'DERIVED',
    description: 'Synthesizing a research reference code (BHU3D-*) combining spatial geohashes with building centroids. Official DoLR ULPINs remain UNAVAILABLE until government API integration.'
  }
];

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="gis-glass-panel rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-white/20 p-6 shadow-2xl relative text-zinc-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-semibold">
            Technical Architecture
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            How Bhu3D 3D Cadastral Mapping Works
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            The end-to-end data pipeline transforming real spatial coordinates into validated 3D property passports.
          </p>
        </div>

        {/* 5-Step Pipeline Flow */}
        <div className="space-y-4">
          {PIPELINE_STEPS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === PIPELINE_STEPS.length - 1;

            return (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-full gis-glass-card rounded-2xl p-4 flex items-start space-x-3.5 hover:border-white/40 transition-all">
                  <div
                    className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow-sm"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Step 0{item.step}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {item.subtitle}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {!isLast && (
                  <div className="my-1.5 flex items-center justify-center text-zinc-500">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>ISO 19152 LADM 3D Extension Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm transition-all shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
