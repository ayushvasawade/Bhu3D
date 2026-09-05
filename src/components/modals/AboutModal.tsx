import React from 'react';
import { X, ShieldAlert, Award, Layers, Globe2, FileCheck2, Cpu } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
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
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 shadow-glow-cyan">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 font-semibold">
                SIH Problem Statement
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              3D ULPIN Generation & Vertical Property Mapping System
            </h2>
          </div>
        </div>

        {/* Notice Badge */}
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2.5 mb-5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Prototype Research Notice: </span>
            This interface is an interactive prototype developed for the Smart India Hackathon. All displayed property owner names, titles, and apartment models are <strong>DEMO DATA</strong> generated to showcase the architectural workflow.
          </div>
        </div>

        {/* Context Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              Why 2D Cadastre Fails in Modern Urban Spaces
            </h3>
            <p>
              India’s Bhu-Aadhaar (Unique Land Parcel Identification Number - ULPIN) assigns a 14-digit alphanumeric ID to land parcels based on their latitude and longitude bounding polygon. While this works seamlessly for horizontal agricultural or suburban land plots, <strong>modern high-rise apartments and multi-level complexes create hundreds of distinct vertical properties sharing the exact same 2D footprint</strong>.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              The 3D ULPIN Solution
            </h3>
            <p>
              The 3D ULPIN system extends the Land Administration Domain Model (ISO 19152 LADM) into three dimensions by indexing:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-slate-300 pl-2">
              <li><strong>2D Spatial Base:</strong> Centroid coordinates from Survey of India / Bhuvan ISRO cadastral layers.</li>
              <li><strong>Z-Elevation (AMSL):</strong> Height Above Mean Sea Level derived via SRTM / LiDAR digital elevation models.</li>
              <li><strong>Vertical Floor Slices:</strong> Bounding volumetric boxes (CityGML LOD2/LOD3) representing each architectural floor level.</li>
              <li><strong>Unit Boundary Sub-Parcels:</strong> Exact 3D bounding geometry, carpet area, and legal undivided land share (UDS).</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1.5">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              Core Benefits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <span className="font-semibold text-white block mb-1">Clear Property Title Registry</span>
                <span className="text-[11px] text-slate-400">Eliminates ambiguity in high-rise property sales, mortgages, and succession.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <span className="font-semibold text-white block mb-1">Municipal Urban Planning</span>
                <span className="text-[11px] text-slate-400">Accurate vertical taxation, utility pipe management, and density analytics.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <span className="font-semibold text-white block mb-1">Emergency Response & Fire Safety</span>
                <span className="text-[11px] text-slate-400">3D floor-level indoor maps for firefighters and disaster management teams.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <span className="font-semibold text-white block mb-1">Digital India & Ease of Living</span>
                <span className="text-[11px] text-slate-400">Instant one-click digital title verification for citizens and financial institutions.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-6 pt-4 border-t border-sky-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm transition-all shadow-glow-cyan"
          >
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
};
