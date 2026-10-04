import React from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { ProvenanceStatus } from '../../types/intelligence';

export interface LayerVisibilityState {
  lidar: boolean;
  osmBuildings: boolean;
  parcels: boolean;
  satellite: boolean;
  terrain: boolean;
  propertyVolume: boolean;
  validationZones: boolean;
  yoloSegmentation: boolean;
  alignmentValidation: boolean;
}

interface LayerControlPanelProps {
  layers: LayerVisibilityState;
  onToggleLayer: (key: keyof LayerVisibilityState) => void;
  isRealLidarMode: boolean;
}

interface LayerDefinition {
  key: keyof LayerVisibilityState;
  label: string;
  status: ProvenanceStatus;
  detail: string;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  onToggleLayer,
  isRealLidarMode
}) => {
  const layerDefs: LayerDefinition[] = [
    {
      key: 'yoloSegmentation',
      label: 'YOLOv8 Aerial Building Masks',
      status: 'REAL',
      detail: 'Instance segmentation contours'
    },
    {
      key: 'alignmentValidation',
      label: '5-Layer Alignment Validation',
      status: 'REAL',
      detail: 'IoU coincidence & mismatch indicators'
    },
    {
      key: 'lidar',
      label: 'LiDAR / 3D Solid Building',
      status: 'REAL',
      detail: 'OpenTopography 3.48M pts'
    },
    {
      key: 'osmBuildings',
      label: 'OSM Building Footprints',
      status: 'REAL',
      detail: 'OpenStreetMap GeoJSON vectors'
    },
    {
      key: 'parcels',
      label: 'Cadastral Parcels Layer',
      status: 'DEMO',
      detail: 'Survey lot boundaries (Demo)'
    },
    {
      key: 'satellite',
      label: 'Satellite Imagery Layer',
      status: 'REAL',
      detail: 'ESRI World Imagery / Copernicus'
    },
    {
      key: 'propertyVolume',
      label: '3D Vertical Unit Slices',
      status: 'DERIVED',
      detail: 'Cadastral vertical property slice'
    },
    {
      key: 'validationZones',
      label: '3D Geometric Validation Extents',
      status: 'DERIVED',
      detail: 'Ground datum & boundary envelope'
    },
    {
      key: 'terrain',
      label: 'Terrain / Elevation (3D DEM)',
      status: 'REAL',
      detail: 'Cesium World Terrain 3D Elevation'
    }
  ];

  return (
    <div className="gis-glass-panel rounded-2xl p-3 w-72 sm:w-80 shadow-2xl pointer-events-auto border border-zinc-800 text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
        <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono">
          <Layers className="w-3.5 h-3.5 text-white" />
          <span>Geospatial Layer Control</span>
        </span>
        <span className="text-[9px] font-mono text-zinc-400">Provenance Verified</span>
      </div>

      <div className="space-y-1.5">
        {layerDefs.map((def) => {
          const isVisible = layers[def.key];
          return (
            <div
              key={def.key}
              onClick={() => onToggleLayer(def.key)}
              className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 cursor-pointer border border-zinc-800 transition-all select-none group"
            >
              <div className="flex items-center space-x-2 min-w-0 pr-1">
                <button
                  type="button"
                  className={`p-1 rounded-lg transition-colors ${
                    isVisible
                      ? 'bg-white text-black border border-white'
                      : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                  }`}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-200 group-hover:text-white truncate">
                    {def.label}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate font-mono">{def.detail}</div>
                </div>
              </div>

              <DataProvenanceBadge status={def.status} size="sm" showIcon={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
