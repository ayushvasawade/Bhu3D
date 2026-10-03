import React, { useState, useMemo } from 'react';
import { Search, Building, Box, MapPin, X, ArrowRight, Layers, CheckCircle2, FlaskConical } from 'lucide-react';
import { BuildingFootprint, Parcel } from '../../types/geospatial';
import { RealLidarBuilding, LADatasetMetadata } from '../../types/lidar';
import { PropertyRecord } from '../../types/property';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

export interface SearchResultItem {
  id: string;
  type: 'lidar' | 'osm_building' | 'parcel' | 'demo_lab';
  title: string;
  subtitle: string;
  status: 'REAL' | 'DERIVED' | 'ESTIMATED' | 'DEMO' | 'UNAVAILABLE';
  coordinates: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  rawData: any;
}

interface PropertySearchCardProps {
  buildings: BuildingFootprint[];
  parcels: Parcel[];
  properties: PropertyRecord[];
  realLidarMetadata: RealLidarBuilding | null;
  laMetadata?: LADatasetMetadata | null;
  isRealLidarMode: boolean;
  onSelectResult: (result: SearchResultItem) => void;
}

export const PropertySearchCard: React.FC<PropertySearchCardProps> = ({
  buildings,
  parcels,
  properties,
  realLidarMetadata,
  laMetadata,
  isRealLidarMode,
  onSelectResult
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'real' | 'lab'>('all');

  // Compile searchable inventory strictly adhering to Data Honesty
  const searchableItems = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [];

    // 0. Real LA USGS 3DEP LiDAR buildings
    if (laMetadata?.buildings) {
      laMetadata.buildings.forEach((bld) => {
        list.push({
          id: bld.id,
          type: 'lidar',
          title: bld.name || `LA Building ${bld.osmWayId}`,
          subtitle: `Los Angeles, CA · ${bld.derivedHeightMeters}m LiDAR Height · ${bld.inferredFloors} Fl (Inferred)`,
          status: 'REAL',
          coordinates: {
            latitude: bld.center.latitude,
            longitude: bld.center.longitude,
            altitude: bld.peakElevationAMSL + 80
          },
          rawData: bld
        });
      });
    }

    // 1. Real Airborne LiDAR dataset
    if (realLidarMetadata) {
      list.push({
        id: 'LIDAR-UTAH-CAPITOL',
        type: 'lidar',
        title: realLidarMetadata.buildingName,
        subtitle: `${realLidarMetadata.geographicLocation.city}, ${realLidarMetadata.geographicLocation.state} · 3.48M Laser Returns`,
        status: 'REAL',
        coordinates: {
          latitude: realLidarMetadata.geographicLocation.latitude,
          longitude: realLidarMetadata.geographicLocation.longitude,
          altitude: 380
        },
        rawData: realLidarMetadata
      });
    }

    // 2. Real OSM vector buildings (Pune)
    buildings.forEach((bld) => {
      list.push({
        id: bld.id,
        type: 'osm_building',
        title: bld.name || `Building ${bld.id}`,
        subtitle: `OSM ${bld.properties?.osmId || bld.id} · ${bld.height}m Height · ${bld.floors || 1} Fl (Est)`,
        status: 'REAL',
        coordinates: {
          latitude: bld.centroid[1],
          longitude: bld.centroid[0],
          altitude: 450
        },
        rawData: bld
      });
    });

    // 3. Cadastral parcels (Reference/Demo layer)
    parcels.forEach((prc) => {
      const ring = prc.geometry.coordinates[0];
      const avgLon = ring ? ring.reduce((acc, c) => acc + c[0], 0) / ring.length : 73.856;
      const avgLat = ring ? ring.reduce((acc, c) => acc + c[1], 0) / ring.length : 18.520;

      list.push({
        id: prc.id,
        type: 'parcel',
        title: `Cadastral Parcel ${prc.surveyNumber}`,
        subtitle: `Sub-div ${prc.subDivision || 'A'} · Ward ${prc.wardNumber || 'Kothrud'} (Ref Layer)`,
        status: 'DEMO',
        coordinates: {
          latitude: avgLat,
          longitude: avgLon,
          altitude: 500
        },
        rawData: prc
      });
    });

    // 4. Conceptual Demonstration / Lab Models (Explicitly labeled)
    properties.forEach((prop) => {
      list.push({
        id: prop.id,
        type: 'demo_lab',
        title: `[Lab Model] ${prop.buildingName} - ${prop.unitNumber}`,
        subtitle: `Synthetic Vertical Subdivision · Ref: ${prop.propertyId3D}`,
        status: 'DEMO',
        coordinates: {
          latitude: prop.coordinates.latitude,
          longitude: prop.coordinates.longitude,
          altitude: 350
        },
        rawData: prop
      });
    });

    return list;
  }, [buildings, parcels, properties, realLidarMetadata, laMetadata]);

  // Filtered results
  const filtered = useMemo(() => {
    let base = searchableItems;
    if (filterType === 'real') {
      base = base.filter((i) => i.status === 'REAL');
    } else if (filterType === 'lab') {
      base = base.filter((i) => i.status === 'DEMO');
    }

    if (!searchTerm.trim()) {
      return base.slice(0, 5);
    }
    const term = searchTerm.toLowerCase();
    return base.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.subtitle.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term)
    );
  }, [searchTerm, searchableItems, filterType]);

  const handleSelect = (item: SearchResultItem) => {
    onSelectResult(item);
    setSearchTerm(item.title);
    setIsOpen(false);
  };

  return (
    <div className="gis-glass-panel rounded-3xl p-3.5 w-72 sm:w-80 max-w-[320px] shadow-2xl pointer-events-auto border border-zinc-800 text-xs">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="geo-search-input" className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-zinc-300" />
          <span>Geospatial Search</span>
        </label>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
          OSM · LiDAR · Lab
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-2 p-0.5 bg-black/60 rounded-xl border border-zinc-800 text-[10px] font-mono">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            filterType === 'all' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          All ({searchableItems.length})
        </button>
        <button
          onClick={() => setFilterType('real')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            filterType === 'real' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Real Data
        </button>
        <button
          onClick={() => setFilterType('lab')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            filterType === 'lab' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Lab Models
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          id="geo-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search building, OSM ID, or Lab model..."
          className="w-full h-10 pl-8 pr-8 rounded-xl bg-black/80 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-sans"
        />
        <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />

        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="mt-2 space-y-1 max-h-56 overflow-y-auto custom-scrollbar border-t border-zinc-800/80 pt-2 animate-fadeIn">
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-zinc-500 text-[11px] font-sans">
              No matching records found.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {item.type === 'lidar' && <Box className="w-3.5 h-3.5 text-white shrink-0" />}
                    {item.type === 'osm_building' && <Building className="w-3.5 h-3.5 text-zinc-300 shrink-0" />}
                    {item.type === 'parcel' && <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                    {item.type === 'demo_lab' && <FlaskConical className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                    <span className="font-semibold text-white text-[11px] truncate group-hover:text-white">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate font-mono">
                    {item.subtitle}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  <DataProvenanceBadge status={item.status} size="sm" showIcon={false} />
                  <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Access Pills */}
      {!isOpen && (
        <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 mb-1.5 font-mono">QUICK REAL-WORLD LOCATIONS:</div>
          <div className="flex flex-wrap gap-1">
            {realLidarMetadata && (
              <button
                onClick={() => {
                  const lidarItem = searchableItems.find((i) => i.type === 'lidar');
                  if (lidarItem) handleSelect(lidarItem);
                }}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                <span>Utah Capitol (LiDAR)</span>
              </button>
            )}
            {buildings.slice(0, 2).map((bld) => (
              <button
                key={bld.id}
                onClick={() => {
                  const osmItem = searchableItems.find((i) => i.id === bld.id);
                  if (osmItem) handleSelect(osmItem);
                }}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-900/80 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition-colors truncate max-w-[140px]"
              >
                OSM {bld.properties?.osmId ? bld.properties.osmId.split('/')[1] : bld.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
