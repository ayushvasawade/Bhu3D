import React from 'react';
import { Globe2, Maximize2, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  cameraMode?: 'global' | 'precinct';
  onFlyToGlobal?: () => void;
  onFlyToPrecinct?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  onToggleTheme,
  cameraMode = 'global',
  onFlyToGlobal,
  onFlyToPrecinct
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 px-5 flex items-center justify-between pointer-events-auto bg-black/90 backdrop-blur-xl border-b border-zinc-800 select-none">
      {/* Left: Brand / Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onFlyToGlobal}
          title="Go to 3D Earth Globe"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-black p-[2px] shadow-sm hover:scale-105 transition-transform"
        >
          <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-white" />
          </div>
        </button>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              Bhu3D
            </h1>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
              3D CADASTRE
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
            Planetary Cadastre & LiDAR 3D City Construction
          </p>
        </div>
      </div>

      {/* Center: Always-Visible 3D Earth Globe vs 3D Construction Switcher */}
      <div className="flex items-center p-1 bg-zinc-900/90 rounded-2xl border border-zinc-700 shadow-inner">
        <button
          onClick={onFlyToGlobal}
          title="Return to Planetary 3D Earth Globe"
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            cameraMode === 'global'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>3D Earth Globe</span>
        </button>

        <button
          onClick={onFlyToPrecinct}
          title="Enter Downtown LA 3D Construction Precinct"
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            cameraMode === 'precinct'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>3D Construction</span>
        </button>
      </div>

      {/* Right: Theme Toggle & Status Badge */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onToggleTheme}
          title="Toggle Contrast"
          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-zinc-300" /> : <Moon className="w-3.5 h-3.5 text-zinc-300" />}
        </button>

        <div className="hidden lg:flex items-center space-x-2 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-white">SIH 2026</span>
          <span className="text-[9px] font-mono text-zinc-400">Prototype</span>
        </div>
      </div>
    </header>
  );
};
