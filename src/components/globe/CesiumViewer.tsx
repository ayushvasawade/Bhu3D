import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import {
  Globe2,
  Maximize2,
  Compass,
  ArrowUp
} from 'lucide-react';
import {
  LABuildingRecord,
  LADatasetMetadata,
  FloorInspectionOptions,
  PointCloudRenderOptions
} from '../../types/lidar';
import { lidarService } from '../../services/lidarService';
import { VerticalPlacementDebugPanel } from '../lidar/VerticalPlacementDebugPanel';
import { LayerVisibilityState } from '../layout/LeftSidebar';
import { YoloBuildingDetection } from '../../types/yolo';

interface CesiumViewerProps {
  laMetadata: LADatasetMetadata | null;
  selectedBuilding: LABuildingRecord | null;
  onSelectBuilding: (building: LABuildingRecord | null) => void;
  selectedFloor: number | null;
  floorInspectionOptions: FloorInspectionOptions;
  layers: LayerVisibilityState;
  pointCloudOptions: PointCloudRenderOptions;
  yoloDetections: YoloBuildingDetection[];
  onViewerReady?: (viewer: Cesium.Viewer) => void;
  isDebugPanelOpen: boolean;
  onCloseDebugPanel: () => void;
}

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  laMetadata,
  selectedBuilding,
  onSelectBuilding,
  selectedFloor,
  floorInspectionOptions,
  layers,
  pointCloudOptions,
  yoloDetections,
  onViewerReady,
  isDebugPanelOpen,
  onCloseDebugPanel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const baseLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const realBuildingEntityRef = useRef<Cesium.Entity | null>(null);
  const floorEntitiesRef = useRef<Cesium.Entity[]>([]);
  const pointPrimitivesRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const buildingEntitiesRef = useRef<Cesium.Entity[]>([]);
  const yoloEntitiesRef = useRef<Cesium.Entity[]>([]);

  const [sampledTerrainHeight, setSampledTerrainHeight] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'precinct' | 'global'>('precinct');

  const centerLon = -118.260903;
  const centerLat = 34.037095;

  // 1. Initialize Cesium 3D Globe with High-Resolution Satellite Base Imagery
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    try {
      // Create high-resolution ESRI World Imagery provider (free, reliable, global satellite)
      const satelliteProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: 'ESRI World Imagery'
      });
      const baseLayer = new Cesium.ImageryLayer(satelliteProvider);
      baseLayerRef.current = baseLayer;

      const viewer = new Cesium.Viewer(containerRef.current, {
        baseLayer: baseLayer,
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        shouldAnimate: false,
        contextOptions: {
          webgl: {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
          }
        }
      });

      // Enable 3D Globe features: atmosphere halo, skybox stars, terrain depth test
      viewer.scene.globe.show = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.globe.enableLighting = false; // Bright, clear satellite visibility everywhere
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#09090b');
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;

      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
      }
      if (viewer.scene.skyBox) {
        viewer.scene.skyBox.show = true;
      }

      // Initial Camera Placement over DTLA South Park
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0055, 420),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0
        }
      });

      viewerRef.current = viewer;
      onViewerReady?.(viewer);

      // Handle Map Click Selection
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: any) => {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject)) {
          if (pickedObject.id?.laBuildingData) {
            onSelectBuilding(pickedObject.id.laBuildingData);
            return;
          }
        }

        // Raycast geographic click to find clicked building polygon
        const ray = viewer.camera.getPickRay(click.position);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (cartesian) {
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            const clickedLon = Cesium.Math.toDegrees(carto.longitude);
            const clickedLat = Cesium.Math.toDegrees(carto.latitude);

            if (laMetadata?.buildings) {
              const matched = laMetadata.buildings.find((b) => {
                if (!b.footprintCoordinates || b.footprintCoordinates.length < 3) return false;
                return isPointInPolygon(clickedLon, clickedLat, b.footprintCoordinates);
              });
              if (matched) {
                onSelectBuilding(matched);
                return;
              }
            }
          }
        }

        onSelectBuilding(null);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      return () => {
        handler.destroy();
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
      };
    } catch (e: any) {
      console.error('[CesiumViewer] Init error:', e);
      setInitError(e?.message || 'Cesium WebGL initialization failed');
    }
  }, []);

  // 2. Satellite Imagery Layer Visibility Toggle
  useEffect(() => {
    if (baseLayerRef.current) {
      baseLayerRef.current.show = layers.satellite;
    }
  }, [layers.satellite]);

  // 3. Terrain Provider Management
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (layers.terrain) {
      Cesium.createWorldTerrainAsync({
        requestWaterMask: false,
        requestVertexNormals: true
      })
        .then((terrainProvider) => {
          if (!viewer.isDestroyed()) {
            viewer.terrainProvider = terrainProvider;
            const targetPos = Cesium.Cartographic.fromDegrees(centerLon, centerLat);
            Cesium.sampleTerrainMostDetailed(terrainProvider, [targetPos])
              .then(([sampled]) => {
                if (sampled && typeof sampled.height === 'number') {
                  setSampledTerrainHeight(sampled.height);
                }
              })
              .catch(() => setSampledTerrainHeight(35.70));
          }
        })
        .catch(() => {
          viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
          setSampledTerrainHeight(0.0);
        });
    } else {
      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      setSampledTerrainHeight(0.0);
    }
  }, [layers.terrain]);

  // 4. Render 3D Reconstructed GLB Mesh
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (realBuildingEntityRef.current) {
      viewer.entities.remove(realBuildingEntityRef.current);
      realBuildingEntityRef.current = null;
    }

    if (layers.reconstruction) {
      const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
      const bldEntity = viewer.entities.add({
        id: 'real-lidar-la-buildings',
        name: 'USGS 3DEP LiDAR Reconstructed Buildings (128 Meshes)',
        position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, groundAlt),
        model: {
          uri: '/models/la_usgs_buildings.glb',
          minimumPixelSize: 64,
          maximumScale: 20000,
          shadows: Cesium.ShadowMode.ENABLED,
          heightReference: layers.terrain
            ? Cesium.HeightReference.CLAMP_TO_GROUND
            : Cesium.HeightReference.NONE,
          color: Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.65),
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: 0.35
        }
      });
      realBuildingEntityRef.current = bldEntity;
    }
  }, [layers.reconstruction, layers.terrain, sampledTerrainHeight]);

  // 5. Render OSM Building Footprints (Orange Polygons)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    buildingEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    buildingEntitiesRef.current = [];

    if (layers.osm && laMetadata?.buildings) {
      const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
      const footprints: Cesium.Entity[] = [];

      for (const b of laMetadata.buildings) {
        if (!b.footprintCoordinates || b.footprintCoordinates.length < 3) continue;
        const isSelected = selectedBuilding?.id === b.id;
        const positions = Cesium.Cartesian3.fromDegreesArrayHeights(
          b.footprintCoordinates.map(([lon, lat]) => [lon, lat, groundAlt + 0.15]).flat()
        );

        const entity = viewer.entities.add({
          id: `osm-footprint-${b.id}`,
          name: `${b.name} Footprint`,
          polyline: {
            positions,
            clampToGround: !!layers.terrain,
            width: isSelected ? 3.5 : 1.8,
            material: isSelected
              ? Cesium.Color.fromCssColorString('#ffffff')
              : Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.9) // Orange
          }
        });
        (entity as any).laBuildingData = b;
        footprints.push(entity);
      }
      buildingEntitiesRef.current = footprints;
    }
  }, [layers.osm, laMetadata, selectedBuilding, layers.terrain, sampledTerrainHeight]);

  // 6. Render LiDAR Point Cloud
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (pointPrimitivesRef.current) {
      viewer.scene.primitives.remove(pointPrimitivesRef.current);
      pointPrimitivesRef.current = null;
    }

    if (layers.lidar) {
      lidarService.getLAPointCloudData()
        .then((pointData) => {
          if (!viewer || viewer.isDestroyed()) return;
          const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
          const pointsCollection = new Cesium.PointPrimitiveCollection();

          const count = pointData.count;
          const step = Math.max(1, Math.floor(100 / (pointCloudOptions.densityPercentage || 100)));
          const bldOnly = pointCloudOptions.buildingOnly;
          const ptSize = pointCloudOptions.pointSize || 3;

          for (let i = 0; i < count; i += step) {
            if (bldOnly && pointData.isBuilding[i] !== 1) continue;

            const dx = pointData.positions[i * 3];
            const dy = pointData.positions[i * 3 + 1];
            const dz = pointData.positions[i * 3 + 2];

            const lon = centerLon + dx / (111320 * Math.cos((centerLat * Math.PI) / 180));
            const lat = centerLat + dy / 110540;
            const alt = groundAlt + dz;

            const r = pointData.colorsRgb[i * 3] / 255;
            const g = pointData.colorsRgb[i * 3 + 1] / 255;
            const b = pointData.colorsRgb[i * 3 + 2] / 255;

            pointsCollection.add({
              position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
              pixelSize: ptSize,
              color: new Cesium.Color(r, g, b, 0.9)
            });
          }

          viewer.scene.primitives.add(pointsCollection);
          pointPrimitivesRef.current = pointsCollection;
        })
        .catch((err) => console.error('[CesiumViewer] Failed to stream LiDAR points:', err));
    }
  }, [layers.lidar, layers.terrain, sampledTerrainHeight, pointCloudOptions]);

  // 7. Render YOLO Aerial Segmentation Masks (Magenta Polygons)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    yoloEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    yoloEntitiesRef.current = [];

    if (layers.yolo && yoloDetections && yoloDetections.length > 0) {
      const yoloEntities: Cesium.Entity[] = [];

      for (const det of yoloDetections) {
        if (!det.maskGeoCoords || det.maskGeoCoords.length < 3) continue;

        const positions = Cesium.Cartesian3.fromDegreesArray(
          det.maskGeoCoords.flat()
        );

        const entity = viewer.entities.add({
          id: `yolo-mask-${det.detectionId}`,
          name: `YOLO Detection (${Math.round(det.confidence * 100)}%)`,
          polyline: {
            positions,
            clampToGround: true,
            width: 2.2,
            material: Cesium.Color.fromCssColorString('#ec4899') // Magenta
          }
        });
        yoloEntities.push(entity);
      }
      yoloEntitiesRef.current = yoloEntities;
    }
  }, [layers.yolo, yoloDetections]);

  // 8. Render Inferred Vertical Floors (Transparent Stacked Volumes)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    floorEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    floorEntitiesRef.current = [];

    if (layers.floorVolumes && selectedBuilding && selectedBuilding.footprintCoordinates?.length >= 3) {
      const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
      const floorH = floorInspectionOptions.floorHeightAssumption || 3.5;
      const derivedH = selectedBuilding.derivedHeightMeters;
      const count = Math.max(1, Math.round(derivedH / floorH));
      const perFloorH = derivedH / count;
      const explode = floorInspectionOptions.isExplodedView ? floorInspectionOptions.explodeSpacingMeters : 0;

      const flatCoords: number[] = [];
      selectedBuilding.footprintCoordinates.forEach(([lon, lat]) => flatCoords.push(lon, lat));

      const entities: Cesium.Entity[] = [];

      for (let i = 0; i < count; i++) {
        const lvl = i + 1;
        const isTarget = selectedFloor === lvl;
        const baseZ = groundAlt + i * perFloorH + i * explode;
        const ceilingZ = baseZ + perFloorH;

        const slabEntity = viewer.entities.add({
          id: `floor-slab-${selectedBuilding.id}-${lvl}`,
          name: `Floor ${lvl}`,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: baseZ,
            extrudedHeight: ceilingZ,
            material: isTarget
              ? Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.65)
              : Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.22),
            outline: true,
            outlineColor: isTarget
              ? Cesium.Color.WHITE
              : Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.85)
          }
        });
        entities.push(slabEntity);
      }
      floorEntitiesRef.current = entities;
    }
  }, [layers.floorVolumes, selectedBuilding, selectedFloor, floorInspectionOptions, layers.terrain, sampledTerrainHeight]);

  // 9. Camera Fly-To on Building Selection
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (selectedBuilding) {
      const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedBuilding.center.longitude,
          selectedBuilding.center.latitude - 0.0018,
          groundAlt + selectedBuilding.derivedHeightMeters + 75
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-28),
          roll: 0
        },
        duration: 1.5
      });
      setCameraMode('precinct');
    }
  }, [selectedBuilding]);

  // Camera Fly Helpers
  const flyToGlobal = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 16000000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration: 2.2
    });
    setCameraMode('global');
  };

  const flyToPrecinct = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0055, groundAlt + 420),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0
      },
      duration: 2.0
    });
    setCameraMode('precinct');
  };

  const resetOrientation = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const currentPos = viewer.camera.positionCartographic;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(currentPos.longitude, currentPos.latitude, currentPos.height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0
      },
      duration: 1.2
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950">
      <div ref={containerRef} className="w-full h-full" />

      {/* 3D Globe Navigation HUD (Global Earth vs 3D Precinct) */}
      <div className="absolute top-18 right-5 z-20 pointer-events-auto flex items-center gap-1.5 p-1 bg-black/85 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-xl">
        <button
          onClick={flyToGlobal}
          title="Zoom out to Full 3D Earth Globe"
          className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            cameraMode === 'global'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>3D Globe</span>
        </button>

        <button
          onClick={flyToPrecinct}
          title="Zoom in to 3D LiDAR Precinct (Downtown LA)"
          className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            cameraMode === 'precinct' && !selectedBuilding
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Precinct 3D</span>
        </button>

        <button
          onClick={resetOrientation}
          title="Reset Orientation (North Up)"
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {initError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/90 text-white z-50">
          <div className="max-w-md p-6 bg-zinc-900 rounded-3xl border border-red-800 text-center space-y-3">
            <h3 className="text-base font-bold text-red-400">Cesium Globe Error</h3>
            <p className="text-xs text-zinc-400">{initError}</p>
          </div>
        </div>
      )}

      {/* Vertical Placement Audit Debug Panel (Requirement 8) */}
      {isDebugPanelOpen && (
        <VerticalPlacementDebugPanel
          selectedBuilding={selectedBuilding}
          datasetId="la_south_park"
          isTerrainActive={!!layers.terrain}
          sampledTerrainHeight={sampledTerrainHeight}
          onClose={onCloseDebugPanel}
        />
      )}
    </div>
  );
};

function isPointInPolygon(lon: number, lat: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
