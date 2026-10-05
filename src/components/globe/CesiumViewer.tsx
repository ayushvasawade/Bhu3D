import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import {
  Globe2,
  Maximize2,
  Compass,
  ArrowUp,
  ArrowLeft,
  Sparkles,
  Layers,
  Building2,
  MapPin,
  RotateCcw
} from 'lucide-react';
import {
  LABuildingRecord,
  LADatasetMetadata,
  FloorInspectionOptions,
  PointCloudRenderOptions,
  ElevationMode
} from '../../types/lidar';
import { UndergroundFeature, UndergroundQueryResult } from '../../types/underground';
import { lidarService } from '../../services/lidarService';
import { VerticalPlacementDebugPanel } from '../lidar/VerticalPlacementDebugPanel';
import { LayerVisibilityState } from '../layout/LeftSidebar';
import { YoloBuildingDetection } from '../../types/yolo';
import { BuildingNavigator } from './BuildingNavigator';

interface CesiumViewerProps {
  laMetadata: LADatasetMetadata | null;
  selectedBuilding: LABuildingRecord | null;
  onSelectBuilding: (building: LABuildingRecord | null) => void;
  selectedFloor: number | null;
  onSelectFloor?: (floor: number | null) => void;
  floorInspectionOptions: FloorInspectionOptions;
  layers: LayerVisibilityState;
  elevationMode?: ElevationMode;
  isUndergroundMode?: boolean;
  onToggleUndergroundMode?: (enabled: boolean) => void;
  undergroundData?: UndergroundQueryResult | null;
  selectedUndergroundFeature?: UndergroundFeature | null;
  onSelectUndergroundFeature?: (feature: UndergroundFeature | null) => void;
  pointCloudOptions: PointCloudRenderOptions;
  yoloDetections: YoloBuildingDetection[];
  onViewerReady?: (viewer: Cesium.Viewer) => void;
  isDebugPanelOpen: boolean;
  onCloseDebugPanel: () => void;
  cameraMode?: 'global' | 'precinct';
  onCameraModeChange?: (mode: 'global' | 'precinct') => void;
  onFlyToGlobal?: () => void;
  onFlyToPrecinct?: (preset?: 'overview' | 'street' | 'ortho') => void;
}

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  laMetadata,
  selectedBuilding,
  onSelectBuilding,
  selectedFloor,
  onSelectFloor,
  floorInspectionOptions,
  layers,
  elevationMode = 'none',
  isUndergroundMode = false,
  onToggleUndergroundMode,
  undergroundData = null,
  selectedUndergroundFeature = null,
  onSelectUndergroundFeature,
  pointCloudOptions,
  yoloDetections,
  onViewerReady,
  isDebugPanelOpen,
  onCloseDebugPanel,
  cameraMode: parentCameraMode = 'global',
  onCameraModeChange,
  onFlyToGlobal: parentFlyToGlobal,
  onFlyToPrecinct: parentFlyToPrecinct
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const baseLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const realBuildingEntityRef = useRef<Cesium.Entity | null>(null);
  const elevationLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const floorEntitiesRef = useRef<Cesium.Entity[]>([]);
  const pointPrimitivesRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const buildingEntitiesRef = useRef<Cesium.Entity[]>([]);
  const yoloEntitiesRef = useRef<Cesium.Entity[]>([]);
  const undergroundEntitiesRef = useRef<Cesium.Entity[]>([]);

  const [sampledTerrainHeight, setSampledTerrainHeight] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'precinct' | 'global'>(parentCameraMode);

  useEffect(() => {
    setCameraMode(parentCameraMode);
  }, [parentCameraMode]);
  const [isIntroSequence, setIsIntroSequence] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'street' | 'ortho' | 'orbit'>('overview');
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number; height: number } | null>(null);

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
        credit: 'ESRI World Imagery',
        enablePickFeatures: false
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

      // Optimize Globe and Tile Caching for instantaneous Globe load
      viewer.scene.globe.tileCacheSize = 300;
      viewer.scene.globe.maximumScreenSpaceError = 2.0;
      viewer.scene.globe.loadingDescendantLimit = 20;
      viewer.scene.globe.preloadAncestors = true;
      viewer.scene.globe.preloadSiblings = true;

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

      // Initial Camera Placement: Earth from Space (Globe View)
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 20000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0
        }
      });

      // Add Global Reference Hotspots on the 3D Globe visible from high Earth orbit
      // 1. Primary 3D Construction Site: Los Angeles DTLA South Park
      viewer.entities.add({
        id: 'global-survey-pin',
        name: 'DTLA South Park 3D LiDAR Survey',
        position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 50),
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString('#00f2fe'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2.5,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1500, 35000000)
        },
        label: {
          text: '📍 DTLA 3D Construction (128 Meshes)',
          font: 'bold 12px monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3.5,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(5000, 25000000)
        }
      });

      // 2. India Cadastre Demonstration Zone: Pune
      viewer.entities.add({
        id: 'global-hotspot-pune',
        name: 'Pune Urban Cadastre Sandbox',
        position: Cesium.Cartesian3.fromDegrees(73.8567, 18.5204, 500),
        point: {
          pixelSize: 9,
          color: Cesium.Color.fromCssColorString('#f59e0b'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1.5,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10000, 35000000)
        },
        label: {
          text: '📍 Pune Cadastre Sandbox',
          font: '11px monospace',
          fillColor: Cesium.Color.fromCssColorString('#fcd34d'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(100000, 25000000)
        }
      });

      // 3. Utah State Capitol Survey Site
      viewer.entities.add({
        id: 'global-hotspot-utah',
        name: 'Utah State Capitol Survey',
        position: Cesium.Cartesian3.fromDegrees(-111.8882, 40.7774, 1377),
        point: {
          pixelSize: 9,
          color: Cesium.Color.fromCssColorString('#10b981'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1.5,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10000, 35000000)
        },
        label: {
          text: '📍 Utah Survey Site',
          font: '11px monospace',
          fillColor: Cesium.Color.fromCssColorString('#6ee7b7'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(100000, 25000000)
        }
      });

      viewerRef.current = viewer;
      onViewerReady?.(viewer);

      // Handle Map Click Selection & Hotspot Navigation
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: any) => {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject)) {
          // If clicked an underground utility feature (pipe, conduit, manhole)
          if (pickedObject.id?.undergroundFeature) {
            onSelectUndergroundFeature?.(pickedObject.id.undergroundFeature);
            return;
          }

          // If clicked a floor slab, select that floor
          const entId: string = pickedObject.id?.id || '';
          if (entId.startsWith('floor-slab-')) {
            const parts = entId.split('-');
            const lvl = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lvl)) {
              onSelectFloor?.(lvl);
              return;
            }
          }

          // If clicked the DTLA 3D survey pin, fly directly into the 3D construction!
          if (pickedObject.id?.id === 'global-survey-pin') {
            flyToPrecinct(3.2);
            return;
          }
          if (pickedObject.id?.id === 'global-hotspot-pune') {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(73.8567, 18.5204, 30000),
              duration: 2.5
            });
            return;
          }
          if (pickedObject.id?.id === 'global-hotspot-utah') {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(-111.8882, 40.7774, 8000),
              duration: 2.5
            });
            return;
          }
          if (pickedObject.id?.laBuildingData) {
            onSelectBuilding(pickedObject.id.laBuildingData);
            return;
          }
        }

        // Also check drillPick for floor slabs or underground features behind meshes
        const drillObjects = viewer.scene.drillPick(click.position);
        for (const d of drillObjects) {
          if (d.id?.undergroundFeature) {
            onSelectUndergroundFeature?.(d.id.undergroundFeature);
            return;
          }
          const dId: string = d.id?.id || '';
          if (dId.startsWith('floor-slab-')) {
            const parts = dId.split('-');
            const lvl = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lvl)) {
              onSelectFloor?.(lvl);
              return;
            }
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

      // Track cursor geographic coordinates in real time (throttled to avoid frame drops)
      let lastMouseMoveTime = 0;
      handler.setInputAction((movement: any) => {
        const now = performance.now();
        if (now - lastMouseMoveTime < 75) return;
        lastMouseMoveTime = now;

        const ray = viewer.camera.getPickRay(movement.endPosition);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (cartesian) {
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            setCursorCoords({
              lat: Cesium.Math.toDegrees(carto.latitude),
              lon: Cesium.Math.toDegrees(carto.longitude),
              height: Math.round(carto.height)
            });
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

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

  // 2B. Elevation Mode Raster Overlay (DEM / DSM / nDSM)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (elevationLayerRef.current) {
      viewer.imageryLayers.remove(elevationLayerRef.current);
      elevationLayerRef.current = null;
    }

    if (elevationMode && elevationMode !== 'none') {
      const imgMap: Record<string, string> = {
        dem: '/data/lidar/dem/dem_surface.png',
        dsm: '/data/lidar/dsm/dsm_surface.png',
        ndsm: '/data/lidar/ndsm/ndsm_surface.png'
      };

      const imageUrl = imgMap[elevationMode];
      if (imageUrl) {
        // Precise geographic bounds calculated from real USGS 3DEP LiDAR point cloud
        const elevationRectangle = Cesium.Rectangle.fromDegrees(
          -118.26394432831962,
          34.03520531945292,
          -118.25786138637235,
          34.03898454898699
        );

        const provider = new Cesium.SingleTileImageryProvider({
          url: imageUrl,
          rectangle: elevationRectangle
        });

        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.alpha = elevationMode === 'ndsm' ? 0.92 : 0.85;
        layer.show = true;
        elevationLayerRef.current = layer;
      }
    }
  }, [elevationMode]);

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

  // 4. Render 3D Reconstructed GLB Mesh (Lazy loaded: only in precinct mode)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (realBuildingEntityRef.current) {
      viewer.entities.remove(realBuildingEntityRef.current);
      realBuildingEntityRef.current = null;
    }

    if (layers.reconstruction && cameraMode === 'precinct') {
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
          color: isUndergroundMode
            ? Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.18)
            : Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.65),
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: isUndergroundMode ? 0.85 : 0.35
        }
      });
      realBuildingEntityRef.current = bldEntity;
    }
  }, [layers.reconstruction, layers.terrain, sampledTerrainHeight, cameraMode, isUndergroundMode]);

  // 5. Render OSM Building Footprints (Orange Polygons, lazy loaded in precinct mode)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    buildingEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    buildingEntitiesRef.current = [];

    if (layers.osm && laMetadata?.buildings && cameraMode === 'precinct') {
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
  }, [layers.osm, laMetadata, selectedBuilding, layers.terrain, sampledTerrainHeight, cameraMode]);

  // 6. Render LiDAR Point Cloud (Lazy loaded: only in precinct mode)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (pointPrimitivesRef.current) {
      viewer.scene.primitives.remove(pointPrimitivesRef.current);
      pointPrimitivesRef.current = null;
    }

    if (layers.lidar && cameraMode === 'precinct') {
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
  }, [layers.lidar, layers.terrain, sampledTerrainHeight, pointCloudOptions, cameraMode]);

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
              ? Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.85)
              : Cesium.Color.fromCssColorString('#f59e0b').withAlpha(selectedFloor !== null ? 0.08 : 0.22),
            outline: true,
            outlineColor: isTarget
              ? Cesium.Color.WHITE
              : Cesium.Color.fromCssColorString('#f59e0b').withAlpha(selectedFloor !== null ? 0.3 : 0.85)
          }
        });
        entities.push(slabEntity);
      }
      floorEntitiesRef.current = entities;
    }
  }, [layers.floorVolumes, selectedBuilding, selectedFloor, floorInspectionOptions, layers.terrain, sampledTerrainHeight]);

  // 8B. Subterranean Camera Collision and Depth Test Toggling for Underground Mode
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (isUndergroundMode) {
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
      viewer.scene.globe.depthTestAgainstTerrain = false;
    } else {
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
      viewer.scene.globe.depthTestAgainstTerrain = true;
    }
  }, [isUndergroundMode]);

  // 8C. Render Underground Infrastructure (Real LA County Sewer Network & Utilities)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    undergroundEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    undergroundEntitiesRef.current = [];

    // Render if underground mode is enabled or if underground layer is toggled
    const shouldRender = isUndergroundMode || (layers as any).underground;
    if (!shouldRender || !undergroundData?.features || cameraMode !== 'precinct') {
      return;
    }

    const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
    const newEntities: Cesium.Entity[] = [];

    for (const feat of undergroundData.features) {
      const isSelected = selectedUndergroundFeature?.id === feat.id;

      // Color mapping by utility type
      let colorHex = '#10b981'; // Green for SEWER
      if (feat.type === 'STORM_DRAIN') colorHex = '#06b6d4'; // Cyan
      else if (feat.type === 'WATER') colorHex = '#3b82f6'; // Blue
      else if (feat.type === 'ELECTRIC') colorHex = '#eab308'; // Amber
      else if (feat.type === 'GAS') colorHex = '#f97316'; // Orange
      else if (feat.type === 'TELECOM') colorHex = '#a855f7'; // Purple
      else if (feat.type === 'TUNNEL' || feat.type === 'SUBWAY') colorHex = '#ec4899'; // Pink
      else if (feat.type === 'BASEMENT' || feat.type === 'PARKING') colorHex = '#64748b'; // Slate

      // Calculate vertical position: authoritative depth if present; otherwise estimated visual offset
      const depthMeters = feat.depth !== undefined ? feat.depth : (feat.estimatedVisualDepth || 3.0);
      const featureZ = groundAlt - depthMeters;

      if (feat.geometry.type === 'LineString') {
        const coords = feat.geometry.coordinates as [number, number][];
        if (coords.length < 2) continue;

        const positionsWithHeight: number[] = [];
        coords.forEach(([lon, lat]) => {
          positionsWithHeight.push(lon, lat, featureZ);
        });

        // 3D Glowing Polyline utility conduit
        const polylineEntity = viewer.entities.add({
          id: `underground-pipe-${feat.id}`,
          name: `${feat.type} [${feat.provenance}] - ${feat.id}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(positionsWithHeight),
            width: isSelected ? 7 : (feat.type === 'SEWER' ? 5 : 4),
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: isSelected ? 0.65 : 0.35,
              color: isSelected
                ? Cesium.Color.WHITE
                : Cesium.Color.fromCssColorString(colorHex)
            })
          }
        });
        (polylineEntity as any).undergroundFeature = feat;
        newEntities.push(polylineEntity);

        // Subterranean Monospace Floating HUD Label at midpoint
        const midIdx = Math.floor(coords.length / 2);
        const [midLon, midLat] = coords[midIdx];

        const labelText = `${feat.type.replace('_', ' ')} · ${feat.provenance}\nID: ${feat.id}\n${
          feat.depth !== undefined
            ? `Depth: ${feat.depth}m (REAL)`
            : `Depth: UNAVAILABLE (Est. visual offset -${depthMeters.toFixed(1)}m)`
        }\n${feat.relationship === 'INTERSECTS_BUILDING' ? '⚡ INTERSECTS BUILDING' : feat.relationship}`;

        const labelEntity = viewer.entities.add({
          id: `underground-label-${feat.id}`,
          position: Cesium.Cartesian3.fromDegrees(midLon, midLat, featureZ + 0.8),
          label: {
            text: labelText,
            font: '10px monospace',
            fillColor: isSelected ? Cesium.Color.WHITE : Cesium.Color.fromCssColorString(colorHex),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#09090b').withAlpha(0.85),
            backgroundPadding: new Cesium.Cartesian2(6, 4),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 380)
          }
        });
        (labelEntity as any).undergroundFeature = feat;
        newEntities.push(labelEntity);

      } else if (feat.geometry.type === 'Point') {
        const [lon, lat] = feat.geometry.coordinates as [number, number];
        const pointEntity = viewer.entities.add({
          id: `underground-node-${feat.id}`,
          name: `${feat.type} [${feat.provenance}] - ${feat.id}`,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, featureZ),
          point: {
            pixelSize: isSelected ? 16 : 10,
            color: Cesium.Color.fromCssColorString(colorHex),
            outlineColor: isSelected ? Cesium.Color.WHITE : Cesium.Color.BLACK,
            outlineWidth: 2
          },
          label: {
            text: `${feat.type} · ${feat.provenance}\n${feat.id}`,
            font: '10px monospace',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -12),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#09090b').withAlpha(0.85),
            backgroundPadding: new Cesium.Cartesian2(4, 2),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 300)
          }
        });
        (pointEntity as any).undergroundFeature = feat;
        newEntities.push(pointEntity);
      }
    }

    undergroundEntitiesRef.current = newEntities;
  }, [
    isUndergroundMode,
    layers,
    undergroundData,
    selectedUndergroundFeature,
    cameraMode,
    layers.terrain,
    sampledTerrainHeight
  ]);

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
  // Orbit Camera Animation Effect (Smooth 360-degree rotation around precinct)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isOrbiting) return;

    let animId: number;
    const step = () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.camera.rotateRight(0.0018);
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isOrbiting]);

  // Camera Fly Helpers
  const flyToGlobal = (duration = 2.5) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    setIsOrbiting(false);
    onSelectBuilding(null);
    setCameraMode('global');
    onCameraModeChange?.('global');

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 20000000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  };

  const flyToPrecinct = (duration = 3.0, preset: 'overview' | 'street' | 'ortho' = 'overview') => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    setIsOrbiting(false);
    setCameraMode('precinct');
    onCameraModeChange?.('precinct');
    setCameraPreset(preset);
    setIsIntroSequence(false);

    const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;

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

    viewer.camera.flyTo({
      destination: dest,
      orientation,
      duration,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  };

  const handleSetCameraPreset = (preset: 'overview' | 'street' | 'ortho' | 'orbit') => {
    if (preset === 'orbit') {
      setIsOrbiting((prev) => !prev);
      return;
    }
    setCameraPreset(preset);
    flyToPrecinct(2.2, preset);
  };

  // Specific Building Direct Flight
  const handleSelectBuildingAndFly = (building: LABuildingRecord) => {
    onSelectBuilding(building);
    setIsOrbiting(false);
    setCameraMode('precinct');
    onCameraModeChange?.('precinct');
    const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
    if (viewerRef.current) {
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          building.center.longitude,
          building.center.latitude - 0.0018,
          groundAlt + building.derivedHeightMeters + 75
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-28),
          roll: 0
        },
        duration: 2.0,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
      });
    }
  };

  const resetOrientation = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    setIsOrbiting(false);
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

  const exploreUnderground = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    onToggleUndergroundMode?.(true);
    setCameraMode('precinct');
    onCameraModeChange?.('precinct');

    const targetLon = selectedBuilding ? selectedBuilding.center.longitude : centerLon;
    const targetLat = selectedBuilding ? selectedBuilding.center.latitude : centerLat;
    const groundAlt = layers.terrain ? (sampledTerrainHeight || 35.70) : 0.0;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        targetLon,
        targetLat - 0.0007,
        groundAlt - 8.0
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(12),
        roll: 0
      },
      duration: 2.2,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  };

  const exitUnderground = () => {
    onToggleUndergroundMode?.(false);
    flyToPrecinct(2.2, 'street');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950">
      <div ref={containerRef} className="w-full h-full" />

      {/* Subterranean Underground HUD Banner */}
      {isUndergroundMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-4 py-2 bg-emerald-950/90 backdrop-blur-xl border border-emerald-600/80 rounded-2xl shadow-2xl text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-emerald-200 uppercase tracking-wider">
              Subterranean Mode Active
            </span>
          </div>
          <span className="text-zinc-400 text-[11px] hidden sm:inline">
            Camera below surface · Depth test off · Translucent building shell
          </span>
          <button
            onClick={exitUnderground}
            className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <span>Exit Underground</span>
          </button>
        </div>
      )}

      {/* Prominent Floating "Back to 3D Globe" Banner when in 3D Construction View */}
      {cameraMode === 'precinct' && !isUndergroundMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-fadeIn">
          <div className="flex items-center gap-2 p-1.5 bg-black/90 backdrop-blur-xl border border-zinc-700/90 rounded-2xl shadow-2xl">
            <button
              onClick={() => flyToGlobal(2.5)}
              title="Return to Planetary 3D Earth Globe"
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>← Back to 3D Globe</span>
            </button>
            <div className="h-4 w-px bg-zinc-700 mx-1" />
            <div className="flex items-center gap-1.5 px-2 text-xs font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>DTLA 3D Construction</span>
            </div>
            <button
              onClick={() => setIsNavigatorOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-900/60 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Choose Building</span>
            </button>
          </div>
        </div>
      )}

      {/* 3D Globe Navigation HUD (Global Earth vs 3D Precinct vs Specific Buildings) */}
      <div className="absolute top-20 right-5 z-20 pointer-events-auto flex items-center gap-1.5 p-1 bg-black/85 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-xl">
        <button
          onClick={() => flyToGlobal(2.5)}
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
          onClick={() => flyToPrecinct(2.8, 'overview')}
          title="Zoom in to 3D LiDAR Construction (Downtown LA)"
          className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            cameraMode === 'precinct' && !selectedBuilding
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>3D Construction</span>
        </button>

        {/* Explore Underground Subterranean Mode Toggle */}
        <button
          onClick={isUndergroundMode ? exitUnderground : exploreUnderground}
          title={isUndergroundMode ? 'Exit Underground Subterranean View' : 'Explore Subterranean Infrastructure Corridors'}
          className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
            isUndergroundMode
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-md animate-pulse'
              : 'bg-zinc-900/80 text-emerald-400 border-emerald-900/60 hover:bg-emerald-950 hover:text-emerald-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isUndergroundMode ? 'Exit Underground' : 'Explore Underground'}</span>
        </button>

        {/* Specific Building Navigator Quick-Toggle */}
        <button
          onClick={() => setIsNavigatorOpen(!isNavigatorOpen)}
          title="Browse Specific 3D Reconstructed Buildings"
          className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
            isNavigatorOpen
              ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
              : 'bg-zinc-900/80 text-cyan-400 border-cyan-900/60 hover:bg-cyan-950 hover:text-cyan-300'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Specific 3D Buildings ({laMetadata?.buildings.length || 128})</span>
        </button>

        <button
          onClick={resetOrientation}
          title="Reset Orientation (North Up)"
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero Navigation Banner when in Globe View */}
      {cameraMode === 'global' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-fadeIn w-[92%] max-w-2xl">
          <div className="bg-black/90 backdrop-blur-2xl border border-zinc-700/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-700 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg">
                  <Globe2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Earth 3D Globe View
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">
                      Orbit 20,000 km
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 tracking-tight">
                    Downtown LA South Park 3D LiDAR Survey
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    128 Watertight 3D Meshes · 3.49M Raw LiDAR Returns · 72.17m AMSL Datum
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsNavigatorOpen(true)}
                  className="px-3.5 py-2.5 rounded-2xl text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-900/80 transition-all flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Choose Building</span>
                </button>

                <button
                  onClick={() => flyToPrecinct(3.5, 'overview')}
                  className="px-4 py-2.5 rounded-2xl text-xs font-mono font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-xl flex items-center gap-2 whitespace-nowrap"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Fly to 3D Construction</span>
                </button>
              </div>
            </div>

            {/* Quick-Jump Hotspot Chips */}
            <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-mono">
              <span className="text-zinc-500 font-semibold mr-1">Global Hotspots:</span>
              <button
                onClick={() => flyToPrecinct(3.2, 'overview')}
                className="px-2.5 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 hover:bg-cyan-900 transition-colors flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Downtown LA (Active 3D)</span>
              </button>
              <button
                onClick={() => {
                  viewerRef.current?.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(73.8567, 18.5204, 35000),
                    duration: 2.5
                  });
                }}
                className="px-2.5 py-1 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Pune Sandbox (India)</span>
              </button>
              <button
                onClick={() => {
                  viewerRef.current?.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(-111.8882, 40.7774, 12000),
                    duration: 2.5
                  });
                }}
                className="px-2.5 py-1 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Utah Survey</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Geographic Cursor Telemetry HUD */}
      {cursorCoords && (
        <div className="absolute bottom-2 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-zinc-800/80 text-[10px] font-mono text-zinc-400">
          <span>Lat: <strong className="text-zinc-200">{cursorCoords.lat.toFixed(4)}°</strong></span>
          <span>Lon: <strong className="text-zinc-200">{cursorCoords.lon.toFixed(4)}°</strong></span>
          <span>Alt: <strong className="text-cyan-400">{cursorCoords.height}m</strong></span>
        </div>
      )}

      {/* Specific Building Navigator Drawer */}
      <BuildingNavigator
        buildings={laMetadata?.buildings || []}
        selectedBuilding={selectedBuilding}
        onSelectBuilding={handleSelectBuildingAndFly}
        onFlyToPrecinct={() => flyToPrecinct(3.0, 'overview')}
        onFlyToGlobal={() => flyToGlobal(2.8)}
        onSetCameraPreset={handleSetCameraPreset}
        isOpen={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        isGlobalMode={cameraMode === 'global'}
        activePreset={cameraPreset}
        isOrbiting={isOrbiting}
      />

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
