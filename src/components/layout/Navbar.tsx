import React from 'react';
import { Globe2, Sun, Moon, Info, Layers, Workflow, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'explore' | 'about' | 'datasources' | 'howitworks';
  onTabChange: (tab: 'explore' | 'about' | 'datasources' | 'howitworks') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAbout: () => void;
  onOpenHowItWorks: () => void;
  onOpenDataSources: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleTheme,
  onOpenAbout,
  onOpenHowItWorks,
  onOpenDataSources
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 h-16 px-5 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-[#070b13]/90 via-[#070b13]/60 to-transparent backdrop-blur-md border-b border-sky-500/10">
      {/* Left: Brand / Title */}
      <div className="flex items-center space-x-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-emerald-400 p-[1.5px] shadow-glow-cyan">
          <div className="w-full h-full bg-[#0b1324] rounded-[10px] flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-sky-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              3D Urban Property Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Bridging Earth, Buildings and Ownership
          </p>
        </div>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex items-center space-x-1 sm:space-x-2 bg-slate-900/60 p-1 rounded-full border border-sky-500/20 backdrop-blur-md">
        <button
          onClick={() => onTabChange('explore')}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === 'explore'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-glow-cyan'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => {
            onTabChange('about');
            onOpenAbout();
          }}
          className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          About
        </button>
        <button
          onClick={() => {
            onTabChange('datasources');
            onOpenDataSources();
          }}
          className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          Data Sources
        </button>
        <button
          onClick={() => {
            onTabChange('howitworks');
            onOpenHowItWorks();
          }}
          className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-1.5"
        >
          <Workflow className="w-3.5 h-3.5 text-sky-400" />
          How It Works
        </button>
      </nav>

      {/* Right: Theme toggle & SIH Badge */}
      <div className="flex items-center space-x-3">
        {/* Dark/Light toggle */}
        <button
          onClick={onToggleTheme}
          title="Toggle UI Contrast Theme"
          className="p-2 rounded-lg bg-slate-800/60 border border-sky-500/20 text-slate-300 hover:text-white hover:border-sky-400/40 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-300" />}
        </button>

        {/* SIH Prototype Badge */}
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-sky-500/30 px-3 py-1.5 rounded-xl shadow-sm">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            S
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-semibold text-slate-200 leading-none">
              SIH Prototype
            </span>
            <span className="text-[9px] font-mono text-sky-400 leading-tight">
              v0.1 · 3D ULPIN
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
