import React from 'react';
import { Database, Map, Satellite, Mountain, Landmark, FileCode, ExternalLink } from 'lucide-react';
import { DATA_SOURCES } from '../../data/dataSources';
import { DataSourceItem } from '../../types/property';

interface DataSourcesGridProps {
  onSelectSource?: (source: DataSourceItem) => void;
}

export const DataSourcesGrid: React.FC<DataSourcesGridProps> = ({ onSelectSource }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'osm':
        return <Map className="w-4 h-4 text-emerald-400" />;
      case 'isro':
        return <Satellite className="w-4 h-4 text-orange-400" />;
      case 'srtm':
        return <Mountain className="w-4 h-4 text-cyan-400" />;
      case 'soi':
        return <Landmark className="w-4 h-4 text-indigo-400" />;
      case 'cad':
        return <FileCode className="w-4 h-4 text-rose-400" />;
      default:
        return <Database className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-sky-500/20">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-1.5">
        <div className="p-1 rounded-md bg-sky-950/80 border border-sky-500/30 text-sky-400">
          <Database className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Data Sources
        </h3>
      </div>
      <p className="text-[11px] text-slate-400 leading-snug mb-3 font-normal">
        This 3D model is created using publicly available and government data sources (demo).
      </p>

      {/* Grid of sources */}
      <div className="grid grid-cols-2 gap-2">
        {DATA_SOURCES.map((source) => (
          <div
            key={source.id}
            onClick={() => onSelectSource?.(source)}
            className="gis-glass-card rounded-xl p-2.5 flex items-start space-x-2.5 hover:border-sky-400/50 hover:bg-slate-800/80 cursor-pointer transition-all duration-200 group"
          >
            <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 group-hover:scale-105 transition-transform shrink-0">
              {getIcon(source.iconType)}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-sky-300">
                  {source.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate block leading-tight">
                {source.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
