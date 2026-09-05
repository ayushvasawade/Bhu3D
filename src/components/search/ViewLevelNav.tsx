import React from 'react';
import { Globe, Building2, Box, Layers, UserCheck } from 'lucide-react';
import { ViewLevel } from '../../types/property';

interface ViewLevelNavProps {
  currentLevel: ViewLevel;
  onSelectLevel: (level: ViewLevel) => void;
}

interface NavItem {
  id: ViewLevel;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'global',
    label: 'Global View',
    description: 'National orbital elevation (~20,000 km)',
    icon: Globe
  },
  {
    id: 'city',
    label: 'City View',
    description: 'Municipal cadastre bounds (~25 km)',
    icon: Building2
  },
  {
    id: 'buildings',
    label: '3D Buildings',
    description: 'LOD2 spatial massings (~800 m)',
    icon: Box
  },
  {
    id: 'layers',
    label: 'Property Layers',
    description: 'Vertical floor slices & parcel volume (~150 m)',
    icon: Layers
  },
  {
    id: 'ownership',
    label: 'Ownership Details',
    description: 'Unit cadastral title & 3D ULPIN registry',
    icon: UserCheck
  }
];

export const ViewLevelNav: React.FC<ViewLevelNavProps> = ({
  currentLevel,
  onSelectLevel
}) => {
  return (
    <div className="flex flex-col space-y-2 pointer-events-auto w-48 sm:w-56">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentLevel === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectLevel(item.id)}
            className={`group relative flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-300 ${
              isActive
                ? 'gis-glass-panel border-sky-400/80 bg-sky-950/60 shadow-glow-cyan text-white translate-x-1'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border border-sky-500/15 text-slate-300 hover:text-white hover:border-sky-500/30'
            }`}
          >
            {/* Active glowing pill indicator */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-400 rounded-r-full shadow-glow-cyan" />
            )}

            <div
              className={`p-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sky-500/30 text-sky-300'
                  : 'bg-slate-800/80 text-slate-400 group-hover:text-sky-400'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className="text-xs sm:text-sm font-semibold tracking-wide truncate">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 truncate group-hover:text-slate-300">
                {item.description.split('(')[0]}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
