import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { FooterHUD } from './components/layout/FooterHUD';
import { CesiumViewer } from './components/globe/CesiumViewer';
import { BuildingInfoCard } from './components/globe/BuildingInfoCard';
import { GeospatialPipelineStatusPanel } from './components/pipeline/GeospatialPipelineStatusPanel';
import { SatelliteDataPanel } from './components/pipeline/SatelliteDataPanel';
import { OwnerSearchCard } from './components/search/OwnerSearchCard';
import { ViewLevelNav } from './components/search/ViewLevelNav';
import { PropertyDetailsPanel } from './components/property/PropertyDetailsPanel';
import { AboutModal } from './components/modals/AboutModal';
import { HowItWorksModal } from './components/modals/HowItWorksModal';
import { DataSourcesModal } from './components/modals/DataSourcesModal';
import { Fullscreen3DModal } from './components/modals/Fullscreen3DModal';
import { DEMO_PROPERTIES } from './data/demoProperties';
import { PropertyRecord, ViewLevel, DataSourceItem } from './types/property';
import { BuildingFootprint, PipelineStatus } from './types/geospatial';
import { geospatialService } from './services/geospatialDataService';

export function App() {
  const [properties] = useState<PropertyRecord[]>(DEMO_PROPERTIES);
  const [currentProperty, setCurrentProperty] = useState<PropertyRecord>(DEMO_PROPERTIES[0]);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('global');
  const [activeTab, setActiveTab] = useState<'explore' | 'about' | 'datasources' | 'howitworks'>('explore');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Geospatial Pipeline & Selection
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingFootprint | null>(null);
  const [pipelineStatus] = useState<PipelineStatus>(() => geospatialService.getPipelineStatus());

  // Modals state
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [isFullscreen3DOpen, setIsFullscreen3DOpen] = useState(false);

  // Real-time HUD telemetry state
  const [telemetry, setTelemetry] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    altitude: 20000000,
    heading: 0
  });

  const handleSelectProperty = (property: PropertyRecord) => {
    setCurrentProperty(property);
    setSelectedBuilding(null);
    // When a user selects a property, fly into city or buildings view
    setViewLevel('city');
  };

  const handleLevelSelect = (level: ViewLevel) => {
    setViewLevel(level);
    if (level === 'global' || level === 'city') {
      setSelectedBuilding(null);
    }
  };

  const handleSelectSource = (source: DataSourceItem) => {
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070b13] text-slate-100 select-none">
      {/* 1. Main Background: Fullscreen Interactive CesiumJS Globe */}
      <div className="absolute inset-0 z-0">
        <CesiumViewer
          currentProperty={currentProperty}
          viewLevel={viewLevel}
          selectedBuilding={selectedBuilding}
          onSelectBuilding={handleBuildingClick}
          onCameraChange={(cam) => {
            setTelemetry({
              latitude: cam.latitude,
              longitude: cam.longitude,
              altitude: cam.altitude,
              heading: cam.heading
            });
          }}
        />
      </div>

      {/* 2. Top Header Navigation Bar */}
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
      />

      {/* 3. Floating Left Sidebar: Search & 5-Step Vertical Cadastre Navigation */}
      <aside aria-label="Cadastre Navigation" className="absolute top-20 left-5 z-20 flex flex-col space-y-3 pointer-events-none">
        <OwnerSearchCard
          currentProperty={currentProperty}
          properties={properties}
          onSelectProperty={handleSelectProperty}
        />

        <ViewLevelNav
          currentLevel={viewLevel}
          onSelectLevel={handleLevelSelect}
        />
      </aside>

      {/* 4. Clicked Building Information Card */}
      {selectedBuilding && (
        <BuildingInfoCard
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          onViewProperty={handleViewPropertyFromBuilding}
        />
      )}

      {/* 5. Floating Right Sidebar: Property Information & 3D Apartment Preview */}
      <aside aria-label="Property Information" className="absolute top-20 right-5 z-20 pointer-events-none">
        <PropertyDetailsPanel
          property={currentProperty}
          onOpenFullscreen3D={() => setIsFullscreen3DOpen(true)}
          onSelectSource={handleSelectSource}
          onBack={() => {
            if (viewLevel !== 'global') {
              setViewLevel('global');
              setSelectedBuilding(null);
            }
          }}
        />
      </aside>

      {/* 6. Geospatial Pipeline Processing Status Panel & Satellite Telemetry */}
      <div className="absolute top-20 right-[445px] z-20 hidden xl:flex flex-col items-end space-y-2 pointer-events-none">
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

      {/* 8. Informational Modals */}
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
    </div>
  );
}

export default App;
