import React from 'react';
import { Globe, Building2, Box, Layers, ShieldCheck } from 'lucide-react';
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
    label: 'Property Intelligence',
    description: 'Validation, Evidence & Cadastral Status',
    icon: ShieldCheck
  }
];

export const ViewLevelNav: React.FC<ViewLevelNavProps> = ({
  currentLevel,
  onSelectLevel
}) => {
  return (
    <div className="flex flex-col space-y-1.5 pointer-events-auto w-48 sm:w-56">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentLevel === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectLevel(item.id)}
            className={`group relative flex items-center space-x-3 px-3 py-2 rounded-2xl text-left transition-all duration-200 border ${
              isActive
                ? 'gis-glass-panel border-white/60 bg-white/10 text-white translate-x-1 shadow-sm'
                : 'bg-black/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
            )}

            <div
              className={`p-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 group-hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold tracking-wide truncate text-white">
                {item.label}
              </span>
              <span className="text-[10px] text-zinc-500 truncate group-hover:text-zinc-400 font-sans">
                {item.description.split('(')[0]}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
