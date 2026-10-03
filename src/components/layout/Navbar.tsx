import React from 'react';
import { Globe2, Sun, Moon, Info, Layers, Workflow, ShieldCheck } from 'lucide-react';
import { PrototypeRole } from '../../types/intelligence';
import { RoleSelector } from './RoleSelector';

interface NavbarProps {
  activeTab: 'explore' | 'about' | 'datasources' | 'howitworks';
  onTabChange: (tab: 'explore' | 'about' | 'datasources' | 'howitworks') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAbout: () => void;
  onOpenHowItWorks: () => void;
  onOpenDataSources: () => void;
  currentRole?: PrototypeRole;
  onSelectRole?: (role: PrototypeRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleTheme,
  onOpenAbout,
  onOpenHowItWorks,
  onOpenDataSources,
  currentRole = 'survey_officer',
  onSelectRole
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 h-16 px-5 flex items-center justify-between pointer-events-auto bg-black/85 backdrop-blur-md border-b border-zinc-800">
      {/* Left: Brand / Title */}
      <div className="flex items-center space-x-3.5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-black p-[2px] shadow-sm">
          <div className="w-full h-full bg-black rounded-[9px] flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Bhu3D
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
              3D ULPIN
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            3D Urban Property Explorer & Vertical Cadastre
          </p>
        </div>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex items-center space-x-1 sm:space-x-1.5 bg-zinc-950 p-1 rounded-full border border-zinc-800 backdrop-blur-md">
        <button
          onClick={() => onTabChange('explore')}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === 'explore'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => {
            onTabChange('about');
            onOpenAbout();
          }}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'about'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>About</span>
        </button>
        <button
          onClick={() => {
            onTabChange('datasources');
            onOpenDataSources();
          }}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'datasources'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Data Sources</span>
        </button>
        <button
          onClick={() => {
            onTabChange('howitworks');
            onOpenHowItWorks();
          }}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'howitworks'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>How It Works</span>
        </button>
      </nav>

      {/* Right: Role Selector, Theme Toggle & SIH Badge */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {onSelectRole && (
          <RoleSelector currentRole={currentRole} onSelectRole={onSelectRole} />
        )}

        <button
          onClick={onToggleTheme}
          title="Toggle Contrast"
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-300" />}
        </button>

        {/* SIH Research Badge (Monochrome) */}
        <div className="hidden sm:flex items-center space-x-2 bg-zinc-900/90 border border-zinc-700 px-3 py-1.5 rounded-xl shadow-sm">
          <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">
            S
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-semibold text-white leading-none">
              SIH 2026
            </span>
            <span className="text-[9px] font-mono text-zinc-400 leading-tight">
              Research Prototype
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
