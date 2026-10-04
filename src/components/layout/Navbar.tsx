import React from 'react';
import { Globe2, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  onToggleTheme
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 h-14 px-5 flex items-center justify-between pointer-events-auto bg-black/85 backdrop-blur-md border-b border-zinc-800 select-none">
      {/* Left: Brand / Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-black p-[2px] shadow-sm">
          <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-white" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              Bhu3D
            </h1>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
              3D CADASTRE
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            Real LiDAR 3D Reconstruction & Vertical Property Mapping
          </p>
        </div>
      </div>

      {/* Center: Dataset Scope */}
      <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Downtown Los Angeles South Park · USGS 3DEP LiDAR</span>
      </div>

      {/* Right: Theme Toggle & SIH Badge */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onToggleTheme}
          title="Toggle Contrast"
          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-zinc-300" /> : <Moon className="w-3.5 h-3.5 text-zinc-300" />}
        </button>

        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-lg">
          <span className="text-[11px] font-bold text-white">SIH 2026</span>
          <span className="text-[9px] font-mono text-zinc-400">Prototype</span>
        </div>
      </div>
    </header>
  );
};
