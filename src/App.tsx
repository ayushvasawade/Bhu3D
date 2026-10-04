import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/layout/Navbar';
import { LeftSidebar, LayerVisibilityState } from './components/layout/LeftSidebar';
import { CesiumViewer } from './components/globe/CesiumViewer';
import { LABuildingCard } from './components/lidar/LABuildingCard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  LABuildingRecord,
  LADatasetMetadata,
  FloorInspectionOptions,
  PointCloudRenderOptions
} from './types/lidar';
import { YoloBuildingDetection } from './types/yolo';
import { lidarService } from './services/lidarService';
import { yoloService } from './services/yoloSegmentationService';
import { buildingFusionService } from './services/buildingFusionService';
import * as Cesium from 'cesium';

export function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Metadata & Selection States
  const [laMetadata, setLaMetadata] = useState<LADatasetMetadata | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<LABuildingRecord | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // Default Layer Visibility (3D Construction Active by Default)
  // Satellite ✓, LiDAR ✓, OSM ✓, 3D Mesh (Reconstruction) ✓, YOLO ✗, Validation ✗, Floor Volumes ✗
  const [layers, setLayers] = useState<LayerVisibilityState>({
    satellite: true,
    lidar: true,
    osm: true,
    reconstruction: true,
    yolo: false,
    validation: false,
    floorVolumes: false,
    terrain: false
  });

  // Point Cloud Options
  const [pointCloudOptions] = useState<PointCloudRenderOptions>({
    pointSize: 3,
    colorMode: 'rgb',
    densityPercentage: 100,
    buildingOnly: false,
    meshOpacity: 0.65
  });

  // Floor Inspection Options
  const [floorInspectionOptions, setFloorInspectionOptions] = useState<FloorInspectionOptions>({
    isInspectionMode: false,
    isExplodedView: false,
    explodeSpacingMeters: 4.0,
    floorHeightAssumption: 3.5
  });

  // YOLO Runtime Detections State (only populated on actual inference)
  const [yoloDetections, setYoloDetections] = useState<YoloBuildingDetection[]>([]);
  const [isYoloRunning, setIsYoloRunning] = useState<boolean>(false);

  // Vertical Placement Audit Debug Panel Toggle
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState<boolean>(false);

  // Camera & Navigation Mode: Initial is 'global' (Earth 3D Globe)
  const [cameraMode, setCameraMode] = useState<'global' | 'precinct'>('global');

  const cesiumViewerRef = useRef<Cesium.Viewer | null>(null);

  // Camera Flight Handlers
  const handleFlyToGlobal = () => {
    setCameraMode('global');
    setSelectedBuilding(null);
    setSelectedFloor(null);
    if (cesiumViewerRef.current && !cesiumViewerRef.current.isDestroyed()) {
      cesiumViewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-118.260903, 34.037095, 20000000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0
        },
        duration: 2.2,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
      });
    }
  };

  const handleFlyToPrecinct = (preset: 'overview' | 'street' | 'ortho' = 'overview') => {
    setCameraMode('precinct');
    if (cesiumViewerRef.current && !cesiumViewerRef.current.isDestroyed()) {
      const centerLon = -118.260903;
      const centerLat = 34.037095;
      const groundAlt = layers.terrain ? 35.70 : 0.0;
      let dest = Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0055, groundAlt + 420);
      let orientation = {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0
      };
      if (preset === 'street') {
        dest = Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0012, groundAlt + 85);
        orientation = {
          heading: Cesium.Math.toRadians(15),
          pitch: Cesium.Math.toRadians(-12),
          roll: 0
        };
      } else if (preset === 'ortho') {
        dest = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, groundAlt + 650);
        orientation = {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-89.9),
          roll: 0
        };
      }
      cesiumViewerRef.current.camera.flyTo({
        destination: dest,
        orientation,
        duration: 2.5,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
      });
    }
  };

  // Load Real USGS 3DEP LiDAR Dataset on Initial Mount
  useEffect(() => {
    lidarService.getLAMetadata()
      .then((data) => {
        setLaMetadata(data);
      })
      .catch((err) => {
        console.error('[App] Failed to load LA USGS LiDAR metadata:', err);
      });
  }, []);

  // Layer Visibility Toggle Handler
  const handleToggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };

      // If enabling YOLO layer and no detections exist yet, trigger real inference
      if (key === 'yolo' && next.yolo && yoloDetections.length === 0 && !isYoloRunning) {
        handleRunYoloSegmentation();
      }

      return next;
    });
  };

  // Run Real YOLO Segmentation on satellite aerial image
  const handleRunYoloSegmentation = async () => {
    if (!laMetadata?.buildings || isYoloRunning) return;
    setIsYoloRunning(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/data/south_park_satellite.png';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load aerial satellite tile'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      // LA South Park Geographic Extent
      const extent: [number, number, number, number] = [
        laMetadata.location.sw.longitude,
        laMetadata.location.sw.latitude,
        laMetadata.location.ne.longitude,
        laMetadata.location.ne.latitude
      ];

      const detections = await yoloService.segmentBuildings(canvas, extent);
      setYoloDetections(detections);

      // Perform real polygon geometric matching against OSM footprints
      if (detections.length > 0) {
        const fusionResult = buildingFusionService.matchDetectionsToBuildings(
          detections,
          laMetadata.buildings
        );

        setLaMetadata({
          ...laMetadata,
          buildings: fusionResult.updatedBuildings
        });

        // Update selected building if one is currently active
        if (selectedBuilding) {
          const updated = fusionResult.updatedBuildings.find((b) => b.id === selectedBuilding.id);
          if (updated) setSelectedBuilding(updated);
        }
      }
    } catch (err) {
      console.warn('[App] Real YOLO inference notice:', err);
    } finally {
      setIsYoloRunning(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className={`relative w-screen h-screen overflow-hidden ${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
        {/* Top Minimal Navigation Bar */}
        <Navbar
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          cameraMode={cameraMode}
          onFlyToGlobal={handleFlyToGlobal}
          onFlyToPrecinct={() => handleFlyToPrecinct('overview')}
        />

        {/* Center: Cesium 3D Globe Viewer */}
        <main className="absolute inset-0 z-0">
          <CesiumViewer
            laMetadata={laMetadata}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={(bld) => {
              setSelectedBuilding(bld);
              if (bld) setCameraMode('precinct');
            }}
            selectedFloor={selectedFloor}
            floorInspectionOptions={floorInspectionOptions}
            layers={layers}
            pointCloudOptions={pointCloudOptions}
            yoloDetections={yoloDetections}
            onViewerReady={(v) => { cesiumViewerRef.current = v; }}
            isDebugPanelOpen={isDebugPanelOpen}
            onCloseDebugPanel={() => setIsDebugPanelOpen(false)}
            cameraMode={cameraMode}
            onCameraModeChange={setCameraMode}
            onFlyToGlobal={handleFlyToGlobal}
            onFlyToPrecinct={handleFlyToPrecinct}
          />
        </main>

        {/* Left Sidebar: DATA, ANALYSIS, CADASTRE (Phase 7 Design) */}
        <div className="absolute top-20 left-5 z-20 pointer-events-auto">
          <LeftSidebar
            layers={layers}
            onToggleLayer={handleToggleLayer}
            buildings={laMetadata?.buildings || []}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={(bld) => {
              setSelectedBuilding(bld);
              if (bld) setCameraMode('precinct');
            }}
            onToggleDebugPanel={() => setIsDebugPanelOpen(!isDebugPanelOpen)}
            isDebugPanelOpen={isDebugPanelOpen}
            onRunYolo={handleRunYoloSegmentation}
            isYoloRunning={isYoloRunning}
            cameraMode={cameraMode}
            onFlyToGlobal={handleFlyToGlobal}
            onFlyToPrecinct={() => handleFlyToPrecinct('overview')}
          />
        </div>

        {/* Right Sidebar: Contextual Building Inspector (ONLY SHOWN WHEN SELECTED) */}
        {selectedBuilding && (
          <div className="absolute top-20 right-5 z-20 pointer-events-auto animate-fadeIn">
            <LABuildingCard
              building={selectedBuilding}
              onClose={() => {
                setSelectedBuilding(null);
                setSelectedFloor(null);
              }}
              onFlyToGlobal={handleFlyToGlobal}
              onFocusBuilding={(bld) => {
                if (cesiumViewerRef.current) {
                  const ground = layers.terrain ? 35.70 : 0.0;
                  cesiumViewerRef.current.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(
                      bld.center.longitude,
                      bld.center.latitude - 0.0018,
                      ground + bld.derivedHeightMeters + 75
                    ),
                    orientation: {
                      heading: Cesium.Math.toRadians(0),
                      pitch: Cesium.Math.toRadians(-28),
                      roll: 0
                    },
                    duration: 1.5
                  });
                }
              }}
              selectedFloor={selectedFloor}
              onSelectFloor={setSelectedFloor}
              floorInspectionOptions={floorInspectionOptions}
              onChangeFloorInspectionOptions={(opts) =>
                setFloorInspectionOptions((prev) => ({ ...prev, ...opts }))
              }
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
export default App;
