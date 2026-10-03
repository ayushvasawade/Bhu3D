import React, { useState, useEffect } from 'react';
import { Box } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { FooterHUD } from './components/layout/FooterHUD';
import { CesiumViewer } from './components/globe/CesiumViewer';
import { BuildingInfoCard } from './components/globe/BuildingInfoCard';
import { GeospatialPipelineStatusPanel } from './components/pipeline/GeospatialPipelineStatusPanel';
import { SatelliteDataPanel } from './components/pipeline/SatelliteDataPanel';
import { PropertySearchCard, SearchResultItem } from './components/search/PropertySearchCard';
import { ViewLevelNav } from './components/search/ViewLevelNav';
import { PropertyIntelligencePanel } from './components/property/PropertyIntelligencePanel';
import { RealLidarControlCard } from './components/lidar/RealLidarControlCard';
import { RealLidarBuildingCard } from './components/lidar/RealLidarBuildingCard';
import { LAControlCard } from './components/lidar/LAControlCard';
import { LABuildingCard } from './components/lidar/LABuildingCard';
import { RealLidarProvenancePanel } from './components/lidar/RealLidarProvenancePanel';
import { RealLidarSideBySideModal } from './components/lidar/RealLidarSideBySideModal';
import { RealLidarMeshInspectorModal } from './components/lidar/RealLidarMeshInspectorModal';
import { LayerControlPanel, LayerVisibilityState } from './components/globe/LayerControlPanel';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataProvenanceBadge } from './components/common/DataProvenanceBadge';
import { PropertyPassportModal } from './components/modals/PropertyPassportModal';
import { AboutModal } from './components/modals/AboutModal';
import { HowItWorksModal } from './components/modals/HowItWorksModal';
import { DataSourcesModal } from './components/modals/DataSourcesModal';
import { Fullscreen3DModal } from './components/modals/Fullscreen3DModal';
import { DEMO_PROPERTIES } from './data/demoProperties';
import { PropertyRecord, ViewLevel, DataSourceItem } from './types/property';
import { BuildingFootprint, Parcel, PipelineStatus } from './types/geospatial';
import {
  RealLidarBuilding,
  LidarViewMode,
  LidarCompareSubMode,
  PointCloudRenderOptions,
  LidarCameraPreset,
  LidarDatasetId,
  LABuildingRecord,
  LADatasetMetadata,
  FloorInspectionOptions
} from './types/lidar';
import { PropertyPassportData, PrototypeRole } from './types/intelligence';
import { geospatialService } from './services/geospatialDataService';
import { realBuildingDataService } from './services/realBuildingDataService';
import { lidarService } from './services/lidarService';
import { copernicusService } from './services/copernicusService';
import { intelligenceService } from './services/intelligenceService';

export function App() {
  // Mode selection: Real LiDAR Demonstration (Default & Primary) vs Conceptual Indian Cadastre Sandbox
  const [isRealLidarMode, setIsRealLidarMode] = useState<boolean>(true);
  const [activeDataset, setActiveDataset] = useState<LidarDatasetId>('la_south_park');
  const [realLidarMetadata, setRealLidarMetadata] = useState<RealLidarBuilding | null>(null);
  const [laMetadata, setLaMetadata] = useState<LADatasetMetadata | null>(null);
  const [selectedRealBuilding, setSelectedRealBuilding] = useState<RealLidarBuilding | null>(null);
  const [selectedLABuilding, setSelectedLABuilding] = useState<LABuildingRecord | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [cameraPreset, setCameraPreset] = useState<LidarCameraPreset>('overview');
  const [isProvenancePanelOpen, setIsProvenancePanelOpen] = useState<boolean>(true);
  const [isMeshInspectorOpen, setIsMeshInspectorOpen] = useState<boolean>(false);

  // Real LiDAR Pipeline & Comparison States
  const [lidarViewMode, setLidarViewMode] = useState<LidarViewMode>('reconstruction');
  const [compareSubMode, setCompareSubMode] = useState<LidarCompareSubMode>('overlay');
  const [pointCloudOptions, setPointCloudOptions] = useState<PointCloudRenderOptions>({
    pointSize: 3,
    colorMode: 'rgb',
    densityPercentage: 100,
    buildingOnly: false,
    meshOpacity: 0.65
  });
  const [isSideBySideOpen, setIsSideBySideOpen] = useState<boolean>(false);

  // 3D Floor Inspection & Exploded View Options
  const [floorInspectionOptions, setFloorInspectionOptions] = useState<FloorInspectionOptions>({
    isInspectionMode: false,
    isExplodedView: false,
    explodeSpacingMeters: 4.0,
    floorHeightAssumption: 3.5
  });

  // Conceptual Cadastre Sandbox state
  const [properties] = useState<PropertyRecord[]>(DEMO_PROPERTIES);
  const [currentProperty, setCurrentProperty] = useState<PropertyRecord>(DEMO_PROPERTIES[0]);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('buildings');
  const [activeTab, setActiveTab] = useState<'explore' | 'about' | 'datasources' | 'howitworks'>('explore');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Geospatial Pipeline & Real Datasets
  const [allBuildings, setAllBuildings] = useState<BuildingFootprint[]>([]);
  const [allParcels, setAllParcels] = useState<Parcel[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingFootprint | null>(null);
  const [pipelineStatus] = useState<PipelineStatus>(() => geospatialService.getPipelineStatus());
  const [sentinelScene, setSentinelScene] = useState<any>(null);

  // Layer Visibility State
  const [layers, setLayers] = useState<LayerVisibilityState>({
    lidar: true,
    osmBuildings: true,
    parcels: true,
    satellite: true,
    terrain: false,
    propertyVolume: true,
    validationZones: true
  });
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);

  // Prototype Role State
  const [currentRole, setCurrentRole] = useState<PrototypeRole>('survey_officer');

  // Search Camera Target
  const [targetFlyLocation, setTargetFlyLocation] = useState<{
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null>(null);

  // Modals state
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [isFullscreen3DOpen, setIsFullscreen3DOpen] = useState(false);
  const [passportModalData, setPassportModalData] = useState<PropertyPassportData | null>(null);

  // Real-time HUD telemetry state (Defaults to Los Angeles USGS coordinates)
  const [telemetry, setTelemetry] = useState({
    latitude: 34.037095,
    longitude: -118.260903,
    altitude: 420,
    heading: 0
  });

  // Load real LiDAR metadata & OSM data on initial mount
  useEffect(() => {
    // 1. Fetch LA USGS 3DEP LiDAR dataset metadata
    lidarService.getLAMetadata()
      .then((data) => {
        setLaMetadata(data);
      })
      .catch((err) => {
        console.error('[App] Failed to load LA USGS LiDAR metadata:', err);
      });

    // 2. Fetch Utah Capitol metadata
    realBuildingDataService.getRealBuilding()
      .then((data) => {
        setRealLidarMetadata(data);
      })
      .catch((err) => {
        console.error('[App] Failed to load real LiDAR building data:', err);
      });

    // Ingest real OSM footprints & parcels
    geospatialService.getBuildingFootprints('pune')
      .then((blds) => setAllBuildings(blds))
      .catch((err) => console.error('[App] Failed to load OSM buildings:', err));

    geospatialService.getParcelData('pune')
      .then((prcs) => setAllParcels(prcs))
      .catch((err) => console.error('[App] Failed to load cadastral parcels:', err));

    // Ingest Copernicus satellite scene
    copernicusService.searchSentinel2({ tileId: 'T43QDA', limit: 1 })
      .then((scenes) => {
        if (scenes.length > 0) setSentinelScene(scenes[0]);
      })
      .catch((err) => console.warn('[App] Copernicus query:', err));
  }, []);

  const handleSelectProperty = (property: PropertyRecord) => {
    setCurrentProperty(property);
    setSelectedBuilding(null);
    setViewLevel('city');
  };

  const handleLevelSelect = (level: ViewLevel) => {
    setViewLevel(level);
    if (level === 'global' || level === 'city') {
      setSelectedBuilding(null);
      setSelectedRealBuilding(null);
    }
  };

  const handleSelectSource = (_source: DataSourceItem) => {
    setIsDataSourcesOpen(true);
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleBuildingClick = (building: BuildingFootprint | null) => {
    setSelectedBuilding(building);
    if (building) {
      setViewLevel('buildings');
      setIsProvenancePanelOpen(true);
    }
  };

  const handleViewPropertyFromBuilding = (associatedPropertyId?: string) => {
    if (associatedPropertyId) {
      const match = properties.find((p) => p.id === associatedPropertyId);
      if (match) {
        setCurrentProperty(match);
      }
    }
    setSelectedBuilding(null);
    setViewLevel('ownership');
  };

  // Unified Search Selection Handler
  const handleSearchResult = (result: SearchResultItem) => {
    if (result.type === 'lidar') {
      setIsRealLidarMode(true);
      setSelectedBuilding(null);
      if (result.rawData?.levels) {
        // LA USGS 3DEP building selected
        setActiveDataset('la_south_park');
        setSelectedLABuilding(result.rawData as LABuildingRecord);
        setSelectedRealBuilding(null);
        setSelectedFloor(null);
      } else {
        // Utah Capitol selected
        setActiveDataset('utah_capitol');
        setSelectedRealBuilding(realLidarMetadata);
        setSelectedLABuilding(null);
        setSelectedFloor(null);
      }
      setIsProvenancePanelOpen(true);
      setCameraPreset('overview');
      setTargetFlyLocation({
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
        altitude: result.coordinates.altitude || 380
      });
    } else if (result.type === 'osm_building') {
      setIsRealLidarMode(false);
      setSelectedRealBuilding(null);
      setSelectedLABuilding(null);
      const bld = result.rawData as BuildingFootprint;
      setSelectedBuilding(bld);
      setIsProvenancePanelOpen(true);
      setViewLevel('buildings');
      setTargetFlyLocation({
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
        altitude: 450
      });
    } else if (result.type === 'parcel') {
      setIsRealLidarMode(false);
      setSelectedRealBuilding(null);
      setSelectedLABuilding(null);
      setViewLevel('layers');
      setTargetFlyLocation({
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
        altitude: 550
      });
    } else if (result.type === 'demo_lab') {
      setIsRealLidarMode(false);
      setSelectedRealBuilding(null);
      setSelectedLABuilding(null);
      const prop = result.rawData as PropertyRecord;
      setCurrentProperty(prop);
      setViewLevel('ownership');
      setIsProvenancePanelOpen(true);
      setTargetFlyLocation({
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
        altitude: 320
      });
    }
  };

  const handleToggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white select-none">
      {/* 1. Main Background: Fullscreen Interactive CesiumJS Globe */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary fallbackTitle="3D Globe Viewport Notice" fallbackMessage="Cesium WebGL rendering encountered a canvas initialization issue.">
          <CesiumViewer
            currentProperty={currentProperty}
            viewLevel={viewLevel}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleBuildingClick}
            isRealLidarMode={isRealLidarMode}
            activeDataset={activeDataset}
            realLidarMetadata={realLidarMetadata}
            laMetadata={laMetadata}
            cameraPreset={cameraPreset}
            selectedRealBuilding={selectedRealBuilding}
            onSelectRealBuilding={(bld) => {
              setSelectedRealBuilding(bld);
              if (bld) {
                setIsProvenancePanelOpen(true);
              }
            }}
            selectedLABuilding={selectedLABuilding}
            onSelectLABuilding={(bld) => {
              setSelectedLABuilding(bld);
              setSelectedFloor(null);
              setIsProvenancePanelOpen(true);
            }}
            selectedFloor={selectedFloor}
            floorInspectionOptions={floorInspectionOptions}
            onCameraChange={(cam) => {
              setTelemetry({
                latitude: cam.latitude,
                longitude: cam.longitude,
                altitude: cam.altitude,
                heading: cam.heading
              });
            }}
            layers={layers}
            targetFlyLocation={targetFlyLocation}
            lidarViewMode={lidarViewMode}
            compareSubMode={compareSubMode}
            pointCloudOptions={pointCloudOptions}
          />
        </ErrorBoundary>
      </div>

      {/* 2. Top Header Navigation Bar with Role Selector */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'explore') {
            setIsAboutOpen(false);
            setIsHowItWorksOpen(false);
            setIsDataSourcesOpen(false);
          }
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenDataSources={() => setIsDataSourcesOpen(true)}
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
      />

      {/* 2b. Floating Mode Navigation Bar for Utah State Capitol Real LiDAR */}
      {isRealLidarMode && (
        <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-20 pointer-events-auto hidden md:flex items-center gap-1 p-1 rounded-2xl bg-zinc-950/95 border border-zinc-800 backdrop-blur-xl shadow-2xl animate-fadeIn">
          <button
            onClick={() => setLidarViewMode('scan')}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              lidarViewMode === 'scan'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
            <span>SCAN</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                lidarViewMode === 'scan' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              REAL
            </span>
          </button>

          <button
            onClick={() => setLidarViewMode('reconstruction')}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              lidarViewMode === 'reconstruction'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            <span>3D MESH</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                lidarViewMode === 'reconstruction' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              DERIVED
            </span>
          </button>

          <button
            onClick={() => setLidarViewMode('compare')}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              lidarViewMode === 'compare'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>COMPARE</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                lidarViewMode === 'compare' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              AUDIT
            </span>
          </button>

          <div className="w-px h-3.5 bg-zinc-800 my-auto mx-0.5" />

          {activeDataset === 'utah_capitol' ? (
            <button
              onClick={() => setIsMeshInspectorOpen(true)}
              className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
              <span>INSPECTOR &amp; QC</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-zinc-800 text-zinc-400">
                METRICS
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono text-zinc-300 bg-zinc-900/60 border border-zinc-800/60 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              <span className="text-[11px] font-semibold text-white">USGS LA 3DEP</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                129 Meshes
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. Floating Left Sidebar: Mode Switcher, Real Search, Telemetry & Layer Control */}
      <aside
        aria-label="LiDAR and Cadastre Navigation"
        className="absolute top-20 left-4 bottom-24 z-20 flex flex-col space-y-2 pointer-events-none w-72 sm:w-80 max-w-[325px] max-h-[calc(100vh-11.5rem)] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1"
      >
        {/* Mode & Camera Controls */}
        {activeDataset === 'la_south_park' ? (
          <LAControlCard
            metadata={laMetadata}
            activeDataset={activeDataset}
            onSelectDataset={(ds) => {
              setActiveDataset(ds);
              setSelectedRealBuilding(null);
              setSelectedLABuilding(null);
              setSelectedBuilding(null);
              setSelectedFloor(null);
              if (ds === 'la_south_park') {
                setTargetFlyLocation({ latitude: 34.037095, longitude: -118.260903, altitude: 420 });
              } else {
                setTargetFlyLocation({ latitude: 40.7774, longitude: -111.8882, altitude: 380 });
              }
            }}
            isRealLidarMode={isRealLidarMode}
            onToggleMode={(mode: boolean) => {
              setIsRealLidarMode(mode);
              setSelectedRealBuilding(null);
              setSelectedLABuilding(null);
              setSelectedBuilding(null);
              setSelectedFloor(null);
            }}
            cameraPreset={cameraPreset}
            onSelectCameraPreset={(preset: LidarCameraPreset) => {
              setCameraPreset(preset);
              if (viewLevel !== 'buildings') {
                setViewLevel('buildings');
              }
            }}
            lidarViewMode={lidarViewMode}
            onChangeViewMode={setLidarViewMode}
            compareSubMode={compareSubMode}
            onChangeCompareSubMode={setCompareSubMode}
            pointCloudOptions={pointCloudOptions}
            onChangePointCloudOptions={(opts) =>
              setPointCloudOptions((prev) => ({ ...prev, ...opts }))
            }
            selectedBuilding={selectedLABuilding}
            onSelectBuilding={(bld) => {
              setSelectedLABuilding(bld);
              setSelectedFloor(null);
            }}
            onResetCamera={() => setCameraPreset('overview')}
          />
        ) : (
          <RealLidarControlCard
            metadata={realLidarMetadata}
            isRealLidarMode={isRealLidarMode}
            onToggleMode={(mode) => {
              setIsRealLidarMode(mode);
              setSelectedRealBuilding(null);
              setSelectedLABuilding(null);
              setSelectedBuilding(null);
              setSelectedFloor(null);
              if (mode) {
                setIsProvenancePanelOpen(true);
                setCameraPreset('overview');
              }
            }}
            cameraPreset={cameraPreset}
            onSelectCameraPreset={(preset) => {
              setCameraPreset(preset);
              if (viewLevel !== 'buildings') {
                setViewLevel('buildings');
              }
            }}
            onOpenProvenance={() => setIsProvenancePanelOpen(!isProvenancePanelOpen)}
            lidarViewMode={lidarViewMode}
            onChangeViewMode={setLidarViewMode}
            compareSubMode={compareSubMode}
            onChangeCompareSubMode={setCompareSubMode}
            pointCloudOptions={pointCloudOptions}
            onChangePointCloudOptions={(opts) =>
              setPointCloudOptions((prev) => ({ ...prev, ...opts }))
            }
            onOpenSideBySide={() => setIsSideBySideOpen(true)}
            onOpenInspector={() => setIsMeshInspectorOpen(true)}
            onResetCamera={() => setCameraPreset('overview')}
          />
        )}

        {/* Real Geospatial Building & Property Search */}
        <PropertySearchCard
          buildings={allBuildings}
          parcels={allParcels}
          properties={properties}
          realLidarMetadata={realLidarMetadata}
          laMetadata={laMetadata}
          isRealLidarMode={isRealLidarMode}
          onSelectResult={handleSearchResult}
        />

        {/* View Level Breadcrumb Navigation */}
        <ViewLevelNav
          currentLevel={viewLevel}
          onSelectLevel={handleLevelSelect}
        />

        {/* Layer Controls Toggle Button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="w-full py-2 px-3 rounded-xl bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white flex items-center justify-between transition-colors shadow-lg"
          >
            <span>Geospatial Layer Controls</span>
            <span className="text-[10px] font-mono text-zinc-400">
              {showLayerPanel ? 'Hide ▲' : 'Show ▼'}
            </span>
          </button>
          {showLayerPanel && (
            <div className="mt-2 animate-fadeIn">
              <LayerControlPanel
                layers={layers}
                onToggleLayer={handleToggleLayer}
                isRealLidarMode={isRealLidarMode}
              />
            </div>
          )}
        </div>
      </aside>

      {/* 4. Clicked Real LiDAR Building Information Card (Utah) */}
      {selectedRealBuilding && isRealLidarMode && activeDataset === 'utah_capitol' && (
        <RealLidarBuildingCard
          metadata={selectedRealBuilding}
          onClose={() => setSelectedRealBuilding(null)}
          onOpenProvenance={() => {
            setSelectedRealBuilding(null);
            setIsProvenancePanelOpen(true);
          }}
        />
      )}

      {/* 4b. Clicked Sandbox Building Information Card */}
      {selectedBuilding && !isRealLidarMode && (
        <BuildingInfoCard
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          onViewProperty={handleViewPropertyFromBuilding}
        />
      )}

      {/* 5. Floating Right Sidebar: Real LiDAR Provenance or Cadastre Intelligence */}
      <aside
        aria-label="Property and Provenance Information"
        className="absolute top-20 right-4 bottom-24 z-20 pointer-events-none w-72 sm:w-80 md:w-92 max-w-[370px] max-h-[calc(100vh-11.5rem)] flex flex-col"
      >
        {isProvenancePanelOpen && (
          isRealLidarMode ? (
            activeDataset === 'la_south_park' ? (
              selectedLABuilding ? (
                <LABuildingCard
                  building={selectedLABuilding}
                  onClose={() => {
                    setSelectedLABuilding(null);
                    setSelectedFloor(null);
                  }}
                  selectedFloor={selectedFloor}
                  onSelectFloor={setSelectedFloor}
                  floorInspectionOptions={floorInspectionOptions}
                  onChangeFloorInspectionOptions={(opts) =>
                    setFloorInspectionOptions((prev) => ({ ...prev, ...opts }))
                  }
                />
              ) : (
                <div className="gis-glass-panel rounded-3xl p-5 border border-zinc-800 shadow-2xl pointer-events-auto backdrop-blur-xl text-white">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">USGS 3DEP Survey</span>
                        <h4 className="text-sm font-bold text-white">DTLA South Park Precinct</h4>
                      </div>
                    </div>
                    <DataProvenanceBadge status="REAL" label="REAL LiDAR" size="sm" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                    Select any of the 129 3D reconstructed buildings from the dropdown or click directly on the 3D globe to inspect real elevation, footprint dimensions, and inferred floor stratification.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">SOURCE CRS</span>
                      <span className="text-white font-bold">EPSG:3857</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">DATUM (AMSL)</span>
                      <span className="text-cyan-400 font-bold">72.17 m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">RAW SURVEY</span>
                      <span className="text-white font-bold">3.49M pts</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">BUILDINGS</span>
                      <span className="text-white font-bold">129 Meshes</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <RealLidarProvenancePanel
                metadata={realLidarMetadata}
                onCameraPreset={setCameraPreset}
                activeCameraPreset={cameraPreset}
                onClose={() => setIsProvenancePanelOpen(false)}
                onOpenSideBySide={() => setIsSideBySideOpen(true)}
                onOpenInspector={() => setIsMeshInspectorOpen(true)}
              />
            )
          ) : (
            <PropertyIntelligencePanel
              building={selectedBuilding}
              realLidarMetadata={realLidarMetadata}
              isRealLidarMode={isRealLidarMode}
              property={currentProperty}
              parcel={allParcels[0] || null}
              sentinelScene={sentinelScene}
              onClose={() => setIsProvenancePanelOpen(false)}
              onOpenPassport={(passport) => setPassportModalData(passport)}
              onOpenFullscreen3D={() => setIsFullscreen3DOpen(true)}
            />
          )
        )}
      </aside>

      {/* 6. Geospatial Pipeline Processing Status Panel & Satellite Telemetry */}
      <div className="absolute top-20 right-[465px] z-20 hidden 2xl:flex flex-col items-end space-y-2 pointer-events-none">
        <GeospatialPipelineStatusPanel status={pipelineStatus} />
        <SatelliteDataPanel />
      </div>

      {/* 7. Bottom HUD: Compass, Coordinates, and Step Progression */}
      <FooterHUD
        currentLevel={viewLevel}
        onSelectLevel={handleLevelSelect}
        coordinates={{
          latitude: telemetry.latitude,
          longitude: telemetry.longitude,
          altitude: telemetry.altitude
        }}
        heading={telemetry.heading}
      />

      {/* 8. Informational & Verification Modals */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => {
          setIsAboutOpen(false);
          setActiveTab('explore');
        }}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => {
          setIsHowItWorksOpen(false);
          setActiveTab('explore');
        }}
      />

      <DataSourcesModal
        isOpen={isDataSourcesOpen}
        onClose={() => {
          setIsDataSourcesOpen(false);
          setActiveTab('explore');
        }}
      />

      <Fullscreen3DModal
        isOpen={isFullscreen3DOpen}
        onClose={() => setIsFullscreen3DOpen(false)}
        property={currentProperty}
      />

      {/* Property Passport & QR Verification Modal */}
      {passportModalData && (
        <PropertyPassportModal
          isOpen={!!passportModalData}
          onClose={() => setPassportModalData(null)}
          passport={passportModalData}
          onExportGeoJson={() => {
            if (selectedBuilding) {
              const jsonStr = intelligenceService.exportGeoJson(
                selectedBuilding,
                passportModalData.validation,
                passportModalData.confidence
              );
              const blob = new Blob([jsonStr], { type: 'application/geo+json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Bhu3D_${selectedBuilding.id}_passport.geojson`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }}
        />
      )}
      {/* 9. Dual-Viewport Synchronized Side-by-Side Verification Modal */}
      <RealLidarSideBySideModal
        isOpen={isSideBySideOpen}
        onClose={() => setIsSideBySideOpen(false)}
        metadata={realLidarMetadata}
      />

      {/* 10. LiDAR -> Mesh Quality & Validation Inspector Modal */}
      <RealLidarMeshInspectorModal
        isOpen={isMeshInspectorOpen}
        onClose={() => setIsMeshInspectorOpen(false)}
        metadata={realLidarMetadata}
      />
    </div>
  );
}

export default App;

