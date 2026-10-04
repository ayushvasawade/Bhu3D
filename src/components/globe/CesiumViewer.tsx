import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { Building2, Layers, Satellite, Map, Landmark, AlertCircle, Box, CheckCircle2, Ruler } from 'lucide-react';
import { PropertyRecord, ViewLevel } from '../../types/property';
import { BuildingFootprint, Parcel } from '../../types/geospatial';
import {
  RealLidarBuilding,
  LidarViewMode,
  LidarCompareSubMode,
  PointCloudRenderOptions,
  LidarPointCloudData,
  LidarCameraPreset,
  LidarDatasetId,
  LABuildingRecord,
  LADatasetMetadata,
  FloorInspectionOptions
} from '../../types/lidar';
import { lidarService } from '../../services/lidarService';
import { geospatialService } from '../../services/geospatialDataService';
import { externalGeoService } from '../../services/externalGeoService';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { VerticalPlacementDebugPanel } from '../lidar/VerticalPlacementDebugPanel';

import { LayerVisibilityState } from './LayerControlPanel';
import { YoloBuildingDetection } from '../../types/yolo';

interface CesiumViewerProps {
  currentProperty: PropertyRecord;
  viewLevel: ViewLevel;
  selectedBuilding?: BuildingFootprint | null;
  onSelectBuilding?: (building: BuildingFootprint | null) => void;
  onCameraChange?: (telemetry: { latitude: number; longitude: number; altitude: number; heading: number }) => void;
  isRealLidarMode?: boolean;
  activeDataset?: LidarDatasetId;
  realLidarMetadata?: RealLidarBuilding | null;
  laMetadata?: LADatasetMetadata | null;
  cameraPreset?: LidarCameraPreset;
  selectedRealBuilding?: RealLidarBuilding | null;
  onSelectRealBuilding?: (building: RealLidarBuilding | null) => void;
  selectedLABuilding?: LABuildingRecord | null;
  onSelectLABuilding?: (building: LABuildingRecord | null) => void;
  selectedFloor?: number | null;
  floorInspectionOptions?: FloorInspectionOptions;
  layers?: LayerVisibilityState;
  targetFlyLocation?: { latitude: number; longitude: number; altitude?: number } | null;
  lidarViewMode?: LidarViewMode;
  compareSubMode?: LidarCompareSubMode;
  pointCloudOptions?: PointCloudRenderOptions;
  yoloDetections?: YoloBuildingDetection[];
  onViewerReady?: (viewer: Cesium.Viewer) => void;
}

type BasemapStyle = 'satellite' | 'dark' | 'streets' | 'bhuvan';

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

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  currentProperty,
  viewLevel,
  selectedBuilding,
  onSelectBuilding,
  onCameraChange,
  isRealLidarMode = true,
  activeDataset = 'la_south_park',
  realLidarMetadata = null,
  laMetadata = null,
  cameraPreset = 'overview',
  selectedRealBuilding = null,
  onSelectRealBuilding,
  selectedLABuilding = null,
  onSelectLABuilding,
  selectedFloor = null,
  floorInspectionOptions = {
    isInspectionMode: false,
    isExplodedView: false,
    explodeSpacingMeters: 4.0,
    floorHeightAssumption: 3.5
  },
  layers = {
    lidar: true,
    osmBuildings: true,
    parcels: true,
    satellite: true,
    terrain: false,
    propertyVolume: true,
    validationZones: true,
    yoloSegmentation: true,
    alignmentValidation: true
  },
  targetFlyLocation = null,
  lidarViewMode = 'reconstruction',
  compareSubMode = 'overlay',
  pointCloudOptions = {
    pointSize: 3,
    colorMode: 'rgb',
    densityPercentage: 100,
    buildingOnly: false,
    meshOpacity: 0.65
  },
  yoloDetections = [],
  onViewerReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markerEntityRef = useRef<Cesium.Entity | null>(null);
  const realBuildingEntityRef = useRef<Cesium.Entity | null>(null);
  const realGroundMarkerRef = useRef<Cesium.Entity | null>(null);
  const floorEntitiesRef = useRef<Cesium.Entity[]>([]);
  const pointPrimitivesRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const highlightPointPrimitivesRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const cachedPointDataRef = useRef<LidarPointCloudData | null>(null);
  const cachedLAPointDataRef = useRef<LidarPointCloudData | null>(null);
  const laMetadataRef = useRef<LADatasetMetadata | null>(laMetadata);
  laMetadataRef.current = laMetadata;
  const activeDatasetRef = useRef(activeDataset);
  activeDatasetRef.current = activeDataset;
  const onSelectLABuildingRef = useRef(onSelectLABuilding);
  onSelectLABuildingRef.current = onSelectLABuilding;
  const onSelectRealBuildingRef = useRef(onSelectRealBuilding);
  onSelectRealBuildingRef.current = onSelectRealBuilding;
  const onSelectBuildingRef = useRef(onSelectBuilding);
  onSelectBuildingRef.current = onSelectBuilding;
  const realLidarMetadataRef = useRef(realLidarMetadata);
  realLidarMetadataRef.current = realLidarMetadata;
  const buildingEntitiesRef = useRef<Cesium.Entity[]>([]);
  const parcelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const yoloEntitiesRef = useRef<Cesium.Entity[]>([]);
  const alignmentEntitiesRef = useRef<Cesium.Entity[]>([]);
  const currentBaseLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const clickHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const onViewerReadyRef = useRef(onViewerReady);
  onViewerReadyRef.current = onViewerReady;


  const [basemap, setBasemap] = useState<BasemapStyle>('satellite');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [bhuvanAlert, setBhuvanAlert] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Vertical placement & terrain audit state
  const [isVerticalPlacementDebugOpen, setIsVerticalPlacementDebugOpen] = useState(false);
  const [sampledTerrainHeight, setSampledTerrainHeight] = useState<number>(0.0);
  const [groundAnchorHeight, setGroundAnchorHeight] = useState<number>(0.0);

  // Screen-projected callout position
  const [calloutScreenPos, setCalloutScreenPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });

  // Helper to get ImageryProvider by style
  const getImageryProvider = (style: BasemapStyle) => {
    switch (style) {
      case 'bhuvan':
        return externalGeoService.createBhuvanImageryProvider();
      case 'satellite':
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: 'ESRI World Imagery / Bhuvan ISRO'
        });
      case 'dark':
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
          maximumLevel: 19,
          credit: 'Stadia Maps / OpenMapTiles'
        });
      case 'streets':
        return new Cesium.UrlTemplateImageryProvider({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          maximumLevel: 19,
          credit: 'OpenStreetMap contributors'
        });
    }
  };

  // 1. Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;
    let removeCameraListener: (() => void) | undefined;
    let removePostRenderListener: (() => void) | undefined;

    try {
      const initialProvider = getImageryProvider('satellite');
      const baseLayer = new Cesium.ImageryLayer(initialProvider);
      currentBaseLayerRef.current = baseLayer;

      const viewer = new Cesium.Viewer(containerRef.current, {
        baseLayer: baseLayer,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        selectionIndicator: false,
        timeline: false,
        animation: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        skyAtmosphere: new Cesium.SkyAtmosphere(),
        skyBox: false,
        contextOptions: {
          webgl: {
            alpha: true,
            preserveDrawingBuffer: true
          }
        }
      });

      viewerRef.current = viewer;
      onViewerReadyRef.current?.(viewer);

      // Atmospheric and lighting configuration
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.atmosphereLightIntensity = 10.0;
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: new Cesium.Cartesian3(-0.6, -0.6, -0.8)
      });
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#000000');
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#09090b');
      viewer.scene.globe.depthTestAgainstTerrain = true;

      // Camera move listener for live HUD telemetry
      removeCameraListener = viewer.camera.changed.addEventListener(() => {
        const cartographic = viewer.camera.positionCartographic;
        if (cartographic && onCameraChange) {
          onCameraChange({
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            altitude: cartographic.height,
            heading: Cesium.Math.toDegrees(viewer.camera.heading)
          });
        }
      });

      // Update screen callout position on postRender
      removePostRenderListener = viewer.scene.postRender.addEventListener(() => {
        let pos: Cesium.Cartesian3 | undefined;
        if (isRealLidarMode) {
          if (activeDataset === 'la_south_park') {
            const baseGround = layers?.terrain ? sampledTerrainHeight : 0.0;
            if (selectedLABuilding) {
              pos = Cesium.Cartesian3.fromDegrees(
                selectedLABuilding.center.longitude,
                selectedLABuilding.center.latitude,
                baseGround + selectedLABuilding.derivedHeightMeters + 5
              );
            } else {
              pos = Cesium.Cartesian3.fromDegrees(-118.260903, 34.037095, baseGround + 60);
            }
          } else if (realBuildingEntityRef.current) {
            pos = realBuildingEntityRef.current.position?.getValue(viewer.clock.currentTime);
          }
        } else if (markerEntityRef.current) {
          pos = markerEntityRef.current.position?.getValue(viewer.clock.currentTime);
        }

        if (pos) {
          const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, pos);
          if (screenPos) {
            const isOccluded = Cesium.Cartesian3.distance(viewer.camera.position, pos) > 40000000;
            setCalloutScreenPos({
              x: screenPos.x,
              y: screenPos.y,
              visible: !isOccluded && screenPos.x >= 0 && screenPos.x <= window.innerWidth && screenPos.y >= 0 && screenPos.y <= window.innerHeight
            });
          }
        }
      });

      // Initial Camera: In Real LiDAR mode, fly directly to selected dataset
      if (isRealLidarMode) {
        if (activeDataset === 'la_south_park') {
          const laGround = layers?.terrain ? 35.7 : 0.0;
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-118.260903, 34.037095 - 0.0055, laGround + 420),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-35),
              roll: 0
            }
          });
        } else {
          const utahGround = layers?.terrain ? 1366.4 : 0.0;
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-111.888200, 40.777394 - 0.0035, utahGround + 380),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-32),
              roll: 0
            }
          });
        }
      } else {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 18000000),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0
          }
        });
      }

      // Click handler for 3D building picking
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: any) => {
        const curActiveDataset = activeDatasetRef.current;
        const curLaMeta = laMetadataRef.current;

        // If in LA mode, pick building by exact 3D surface or footprint polygon
        if (curActiveDataset === 'la_south_park' && curLaMeta?.buildings) {
          const ray = viewer.camera.getPickRay(movement.position);
          let cartesian: Cesium.Cartesian3 | undefined;
          if (viewer.scene.pickPositionSupported) {
            try {
              cartesian = viewer.scene.pickPosition(movement.position);
            } catch {
              // fallback
            }
          }
          if (!cartesian && ray) {
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          }
          if (!cartesian) {
            cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
          }

          if (cartesian) {
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            const clickLon = Cesium.Math.toDegrees(carto.longitude);
            const clickLat = Cesium.Math.toDegrees(carto.latitude);

            // 1. Exact point-in-polygon containment
            for (const b of curLaMeta.buildings) {
              if (b.footprintCoordinates && isPointInPolygon(clickLon, clickLat, b.footprintCoordinates)) {
                onSelectLABuildingRef.current?.(b);
                return;
              }
            }

            // 2. Proximity check fallback (within ~80 meters)
            let bestBld: LABuildingRecord | null = null;
            let minD = Infinity;
            for (const b of curLaMeta.buildings) {
              const d = Math.hypot(b.center.longitude - clickLon, b.center.latitude - clickLat);
              if (d < minD) {
                minD = d;
                bestBld = b;
              }
            }
            if (bestBld && minD < 0.0008) {
              onSelectLABuildingRef.current?.(bestBld);
              return;
            }
          }
        }

        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id;
          if ((entity as any).laBuildingData) {
            onSelectLABuildingRef.current?.((entity as any).laBuildingData);
            return;
          }
          if (
            (entity as any).isRealLidarBuilding ||
            entity.id === 'real-lidar-utah-capitol' ||
            entity.id === 'real-lidar-ground-ring'
          ) {
            onSelectRealBuildingRef.current?.(realLidarMetadataRef.current || null);
            return;
          }
          if ((entity as any).buildingData) {
            const building = (entity as any).buildingData as BuildingFootprint;
            onSelectBuildingRef.current?.(building);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      clickHandlerRef.current = handler;
    } catch (err: any) {
      console.error('[CesiumViewer] Failed to initialize Cesium Viewer:', err);
      setInitError(err?.message || 'Cesium WebGL failed to initialize');
    }

    return () => {
      if (clickHandlerRef.current && !clickHandlerRef.current.isDestroyed()) {
        clickHandlerRef.current.destroy();
        clickHandlerRef.current = null;
      }
      removeCameraListener?.();
      removePostRenderListener?.();
      const currentViewer = viewerRef.current;
      if (currentViewer && !currentViewer.isDestroyed()) {
        currentViewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []);


  // 2. Update Basemap Layer when switched
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (basemap === 'bhuvan') {
      setBhuvanAlert('Probing official Bhuvan WMS endpoint (bhuvan-vec2.nrsc.gov.in/bhuvan/wms)...');
      externalGeoService.checkBhuvanAvailability().then((res) => {
        if (!res.available) {
          setBhuvanAlert(
            'Bhuvan / ISRO WMS Status: CONNECTION FAILED. NRSC endpoint timed out or requires authorized access. External service unavailable. Using previously loaded local demonstration data.'
          );
        } else {
          setBhuvanAlert(null);
        }
      });
    } else {
      setBhuvanAlert(null);
    }

    if (currentBaseLayerRef.current) {
      viewer.imageryLayers.remove(currentBaseLayerRef.current, true);
    }

    try {
      const newProvider = getImageryProvider(basemap);
      const newLayer = new Cesium.ImageryLayer(newProvider);
      viewer.imageryLayers.add(newLayer);
      currentBaseLayerRef.current = newLayer;

      // Handle tile error gracefully
      newLayer.errorEvent.addEventListener(() => {
        if (basemap === 'bhuvan') {
          setBhuvanAlert(
            'Bhuvan / ISRO WMS Status: CONNECTION FAILED. Tile request failed on NRSC servers. External service unavailable. Using previously loaded local demonstration data.'
          );
        }
      });
    } catch {
      if (basemap === 'bhuvan') {
        setBhuvanAlert(
          'Bhuvan / ISRO WMS Status: CONNECTION FAILED. Unable to initialize WMS provider.'
        );
      }
    }
  }, [basemap]);

  // 2b. Manage Cesium Terrain Provider & Sample Elevation
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    let isCancelled = false;
    const updateTerrain = async () => {
      const isLA = activeDataset === 'la_south_park';
      const sampleLon = isLA ? -118.260903 : (realLidarMetadata?.geographicLocation.longitude || -111.888200);
      const sampleLat = isLA ? 34.037095 : (realLidarMetadata?.geographicLocation.latitude || 40.777394);

      if (layers?.terrain) {
        try {
          const terrainProvider = await Cesium.createWorldTerrainAsync();
          if (isCancelled || !viewerRef.current || viewer.isDestroyed()) return;
          viewer.terrainProvider = terrainProvider;

          // Sample terrain height at the dataset anchor location
          const carto = [Cesium.Cartographic.fromDegrees(sampleLon, sampleLat)];
          await Cesium.sampleTerrainMostDetailed(terrainProvider, carto);
          if (!isCancelled) {
            const h = carto[0].height || (isLA ? 35.70 : 1366.40);
            setSampledTerrainHeight(h);
            setGroundAnchorHeight(h);
          }
        } catch (e) {
          console.warn('World Terrain load failed, fallback to ellipsoid:', e);
          if (!isCancelled) {
            viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            setSampledTerrainHeight(0.0);
            setGroundAnchorHeight(0.0);
          }
        }
      } else {
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        setSampledTerrainHeight(0.0);
        setGroundAnchorHeight(0.0);
      }
    };

    updateTerrain();
    return () => { isCancelled = true; };
  }, [layers?.terrain, activeDataset, realLidarMetadata]);

  // 3. Load Real LiDAR Building or Conceptual Sandbox Layers
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Clear old marker, buildings, parcels, real building entities, and point cloud primitives
    if (highlightPointPrimitivesRef.current && viewer && !viewer.isDestroyed()) {
      viewer.scene.primitives.remove(highlightPointPrimitivesRef.current);
      highlightPointPrimitivesRef.current = null;
    }
    if (pointPrimitivesRef.current && viewer && !viewer.isDestroyed()) {
      viewer.scene.primitives.remove(pointPrimitivesRef.current);
      pointPrimitivesRef.current = null;
    }
    if (markerEntityRef.current) {
      viewer.entities.remove(markerEntityRef.current);
      markerEntityRef.current = null;
    }
    if (realBuildingEntityRef.current) {
      viewer.entities.remove(realBuildingEntityRef.current);
      realBuildingEntityRef.current = null;
    }
    if (realGroundMarkerRef.current) {
      viewer.entities.remove(realGroundMarkerRef.current);
      realGroundMarkerRef.current = null;
    }
    buildingEntitiesRef.current.forEach((b) => viewer.entities.remove(b));
    buildingEntitiesRef.current = [];
    parcelEntitiesRef.current.forEach((p) => viewer.entities.remove(p));
    parcelEntitiesRef.current = [];

    // REAL LIDAR MODE (Primary Active Showcase)
    if (isRealLidarMode) {
      if (activeDataset === 'la_south_park') {
        const centerLon = -118.260903;
        const centerLat = 34.037095;
        // Requirement 2, 3, 4: Reconstructed GLB geometry is normalized (local ground Z = 0).
        // Anchor to ground/terrain elevation without double-adding LiDAR ground.
        const centerAlt = layers?.terrain ? (sampledTerrainHeight || 35.70) : 0.0;

        // Add Reconstructed Watertight GLB Model with 128 genuine buildings
        const bldEntity = viewer.entities.add({
          id: 'real-lidar-la-buildings',
          name: 'USGS 3DEP LiDAR Reconstructed City (128 Meshes)',
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
          model: {
            uri: '/models/la_usgs_buildings.glb',
            minimumPixelSize: 64,
            maximumScale: 20000,
            shadows: Cesium.ShadowMode.ENABLED,
            heightReference: layers?.terrain ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE
          }
        });
        (bldEntity as any).isRealLidarBuilding = true;
        realBuildingEntityRef.current = bldEntity;

        // Add Ground Survey Bounds Radar Ring
        const groundMarker = viewer.entities.add({
          id: 'real-lidar-la-ground-ring',
          name: 'USGS Survey Footprint Extent (DTLA South Park, Normalized Datum)',
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt + 0.5),
          ellipse: {
            semiMajorAxis: 320.0,
            semiMinorAxis: 260.0,
            height: centerAlt + 0.5,
            material: Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.12),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.85),
            outlineWidth: 2
          }
        });
        realGroundMarkerRef.current = groundMarker;

        // Add 2D building footprint outlines for all 128 buildings when layers.osmBuildings is on or in COMPARE mode
        if (laMetadata?.buildings && (layers?.osmBuildings || lidarViewMode === 'compare')) {
          const laFootprintEntities: Cesium.Entity[] = [];
          for (const b of laMetadata.buildings) {
            if (!b.footprintCoordinates || b.footprintCoordinates.length < 3) continue;
            const coords = b.footprintCoordinates;
            const positions = Cesium.Cartesian3.fromDegreesArrayHeights(
              coords.map(([lon, lat]) => [lon, lat, centerAlt + 0.15]).flat()
            );

            const isCompare = lidarViewMode === 'compare';
            const footprintEntity = viewer.entities.add({
              id: `la-osm-footprint-${b.id}`,
              name: `${b.name} Footprint`,
              polyline: {
                positions,
                clampToGround: !!layers?.terrain,
                width: isCompare ? 2.5 : 1.5,
                material: isCompare
                  ? Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.9)
                  : Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.45)
              }
            });
            (footprintEntity as any).laBuildingData = b;
            laFootprintEntities.push(footprintEntity);
          }
          buildingEntitiesRef.current = laFootprintEntities;
        }

        return;
      }

      if (realLidarMetadata) {
        const { longitude, latitude } = realLidarMetadata.geographicLocation;
        // Requirement 3 & 4: Anchor normalized GLB to the building's actual WGS84 coordinates and terrain ground elevation
        const bldGroundAlt = layers?.terrain ? (sampledTerrainHeight || 1366.40) : 0.0;
        const bldPos = Cesium.Cartesian3.fromDegrees(longitude, latitude, bldGroundAlt);

        // Add Reconstructed Watertight GLB Model
        const bldEntity = viewer.entities.add({
          id: 'real-lidar-utah-capitol',
          name: realLidarMetadata.buildingName,
          position: bldPos,
          model: {
            uri: realLidarMetadata.reconstructionPipeline.outputModelFile,
            minimumPixelSize: 64,
            maximumScale: 20000,
            shadows: Cesium.ShadowMode.ENABLED,
            heightReference: layers?.terrain ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE
          }
        });
        (bldEntity as any).isRealLidarBuilding = true;
        (bldEntity as any).lidarData = realLidarMetadata;
        realBuildingEntityRef.current = bldEntity;

        // Add Ground Radar Ring around building precinct
        const groundMarker = viewer.entities.add({
          id: 'real-lidar-ground-ring',
          name: `Utah State Capitol Ground Datum (${bldGroundAlt.toFixed(2)}m Datum)`,
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, bldGroundAlt + 0.5),
          ellipse: {
            semiMajorAxis: 160.0,
            semiMinorAxis: 110.0,
            height: bldGroundAlt + 0.5,
            material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.18),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.85),
            outlineWidth: 2
          }
        });
        realGroundMarkerRef.current = groundMarker;

        return;
      }
    }

    // SANDBOX MODE (Indian 3D Cadastre Concept)
    let isCancelled = false;
    const { latitude, longitude } = currentProperty.coordinates;
    const markerPos = Cesium.Cartesian3.fromDegrees(longitude, latitude, 5);
    const marker = viewer.entities.add({
      name: currentProperty.ownerName,
      position: markerPos,
      point: {
        pixelSize: 14,
        color: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      ellipse: {
        semiMajorAxis: 350.0,
        semiMinorAxis: 350.0,
        height: 2,
        material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.28),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineWidth: 2
      }
    });
    markerEntityRef.current = marker;

    const loadGeospatialLayers = async () => {
      const cityKey = currentProperty.city.toLowerCase() === 'pune' ? 'pune' : 'pune';
      const parcels = await geospatialService.getParcelData(cityKey);
      if (isCancelled || !viewerRef.current || viewer.isDestroyed()) return;

      const parcelEntities: Cesium.Entity[] = [];
      parcels.forEach((parcel) => {
        const ring = parcel.geometry.coordinates[0];
        if (!ring || ring.length < 3) return;
        const flatCoords: number[] = [];
        ring.forEach(([lon, lat]: number[]) => flatCoords.push(lon, lat));
        const pEntity = viewer.entities.add({
          name: `Parcel ${parcel.surveyNumber}`,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.08),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.55),
            outlineWidth: 2,
            height: 1
          }
        });
        (pEntity as any).parcelData = parcel;
        parcelEntities.push(pEntity);
      });
      parcelEntitiesRef.current = parcelEntities;

      const buildings = await geospatialService.getBuildingFootprints(cityKey);
      if (isCancelled || !viewerRef.current || viewer.isDestroyed()) return;

      const buildingEntities: Cesium.Entity[] = [];
      buildings.forEach((bld) => {
        const ring = bld.geometry.type === 'MultiPolygon'
          ? (bld.geometry as any).coordinates[0]?.[0]
          : (bld.geometry as any).coordinates[0];
        if (!ring || ring.length < 3) return;
        const flatCoords: number[] = [];
        ring.forEach(([lon, lat]: number[]) => flatCoords.push(lon, lat));
        const isTarget = bld.associatedPropertyId === currentProperty.id || bld.id === 'BLD-PUN-00027';
        const isSelected = selectedBuilding?.id === bld.id;

        const entity = viewer.entities.add({
          name: bld.name || bld.id,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            extrudedHeight: bld.height,
            height: 0,
            material: isSelected
              ? Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.95)
              : isTarget
              ? Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.88)
              : Cesium.Color.fromCssColorString('#1e293b').withAlpha(0.72),
            outline: true,
            outlineColor: isSelected
              ? Cesium.Color.fromCssColorString('#00f2fe')
              : isTarget
              ? Cesium.Color.fromCssColorString('#38bdf8')
              : Cesium.Color.fromCssColorString('#475569'),
            outlineWidth: isTarget || isSelected ? 2 : 1
          }
        });
        (entity as any).buildingData = bld;
        buildingEntities.push(entity);
      });
      buildingEntitiesRef.current = buildingEntities;
    };

    loadGeospatialLayers();
  }, [currentProperty, selectedBuilding, isRealLidarMode, activeDataset, realLidarMetadata, laMetadata, layers?.osmBuildings, layers?.terrain, sampledTerrainHeight, lidarViewMode]);

  // 3c. Manage Selected LA Building Footprint, Structural Slabs, & Inferred Floor Volumes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Clear existing floor entities
    floorEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
    floorEntitiesRef.current = [];

    if (activeDataset !== 'la_south_park' || !selectedLABuilding) return;

    const newFloorEntities: Cesium.Entity[] = [];
    const coords = selectedLABuilding.footprintCoordinates;
    if (!coords || coords.length < 3) return;

    const flatDegrees: number[] = [];
    let minLon = Number.POSITIVE_INFINITY, maxLon = Number.NEGATIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY, maxLat = Number.NEGATIVE_INFINITY;
    coords.forEach(([lon, lat]) => {
      flatDegrees.push(lon, lat);
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });

    const isCompare = lidarViewMode === 'compare';
    const isInspection = !!floorInspectionOptions?.isInspectionMode;
    const isExploded = !!floorInspectionOptions?.isExplodedView;
    const explodeSpacing = floorInspectionOptions?.explodeSpacingMeters ?? 4.0;
    const floorH = floorInspectionOptions?.floorHeightAssumption ?? 3.5;

    const baseGround = layers?.terrain ? sampledTerrainHeight : 0.0;
    const roofZ = selectedLABuilding.mainRoofAMSL || selectedLABuilding.peakElevationAMSL;
    const bldHeight = selectedLABuilding.derivedHeightMeters || Math.max(2.5, roofZ - selectedLABuilding.localGroundAMSL);
    const computedFloors = Math.max(1, Math.round(bldHeight / floorH));
    const actualFloorHeight = bldHeight / computedFloors;

    // 1. 2D Ground Footprint Outline Ring
    const groundOutline = viewer.entities.add({
      id: `la-bld-${selectedLABuilding.id}-ground-outline`,
      name: `${selectedLABuilding.name} OSM Footprint Outline`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(
          coords.map(([lon, lat]) => [lon, lat, baseGround + 0.25]).flat()
        ),
        clampToGround: !!layers?.terrain,
        width: isCompare ? 3.5 : 2.5,
        material: isCompare
          ? Cesium.Color.fromCssColorString('#f59e0b')
          : Cesium.Color.fromCssColorString('#00f2fe')
      }
    });
    newFloorEntities.push(groundOutline);

    // 2. 2D Ground Footprint Fill
    const groundFill = viewer.entities.add({
      id: `la-bld-${selectedLABuilding.id}-ground-fill`,
      name: `${selectedLABuilding.name} Footprint Base Polygon`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(flatDegrees),
        height: baseGround + 0.1,
        material: isCompare
          ? Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.25)
          : Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.20)
      }
    });
    newFloorEntities.push(groundFill);

    // 2b. In COMPARE Mode: Add LiDAR XY Extent Bounding Box in vibrant Emerald
    if (isCompare) {
      const pad = 0.00002;
      const lidarBoxEntity = viewer.entities.add({
        id: `la-bld-${selectedLABuilding.id}-lidar-extent`,
        name: `${selectedLABuilding.name} LiDAR XY Extent (${selectedLABuilding.pointCount} pts)`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(
            [
              [minLon - pad, minLat - pad, baseGround + 0.4],
              [maxLon + pad, minLat - pad, baseGround + 0.4],
              [maxLon + pad, maxLat + pad, baseGround + 0.4],
              [minLon - pad, maxLat + pad, baseGround + 0.4],
              [minLon - pad, minLat - pad, baseGround + 0.4]
            ].flat()
          ),
          clampToGround: !!layers?.terrain,
          width: 2.5,
          material: Cesium.Color.fromCssColorString('#10b981')
        }
      });
      newFloorEntities.push(lidarBoxEntity);
    }

    // 3. Highlight Perimeter Wireframe if NOT in inspection mode
    if (!isInspection) {
      const perimeterWireframe = viewer.entities.add({
        id: `la-bld-${selectedLABuilding.id}-roof-perimeter`,
        name: `${selectedLABuilding.name} Parapet Perimeter Highlight`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(
            coords.map(([lon, lat]) => [lon, lat, baseGround + bldHeight + 0.2]).flat()
          ),
          width: 2.0,
          material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.85)
        }
      });
      newFloorEntities.push(perimeterWireframe);
    }

    // 4. Inferred Structural Floor Slabs & Interior Volumes (Requirements D & E)
    for (let fl = 1; fl <= computedFloors; fl++) {
      const flBaseZ = baseGround + (fl - 1) * actualFloorHeight;
      const flTopZ = fl === computedFloors ? baseGround + bldHeight : baseGround + fl * actualFloorHeight;
      const flSpan = flTopZ - flBaseZ;
      const zOffset = isExploded ? (fl - 1) * explodeSpacing : 0;

      const isTargetFloor = selectedFloor !== null && selectedFloor !== undefined
        ? fl === selectedFloor
        : false;

      // Slab thickness (realistic concrete plate: 0.30m)
      const slabThickness = Math.min(0.32, flSpan * 0.12);
      // Ceiling gap (realistic clearance: 0.20m below upper slab)
      const ceilingGap = Math.min(0.20, flSpan * 0.08);

      // A. Structural Floor Plate / Slab
      const slabEntity = viewer.entities.add({
        id: `la-bld-${selectedLABuilding.id}-slab-${fl}`,
        name: `Floor ${fl} Structural Slab [INFERRED] (${(flBaseZ + zOffset).toFixed(1)}m AMSL)`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatDegrees),
          height: flBaseZ + zOffset,
          extrudedHeight: flBaseZ + zOffset + slabThickness,
          material: isTargetFloor
            ? Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.95)
            : Cesium.Color.fromCssColorString('#0284c7').withAlpha(isInspection ? 0.70 : 0.40),
          outline: true,
          outlineColor: isTargetFloor
            ? Cesium.Color.WHITE
            : Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.6),
          outlineWidth: isTargetFloor ? 3 : 1
        }
      });
      newFloorEntities.push(slabEntity);

      // B. Usable Interior Floor Volume
      const volumeEntity = viewer.entities.add({
        id: `la-bld-${selectedLABuilding.id}-volume-${fl}`,
        name: `Floor ${fl} Inferred Usable Volume (${(flBaseZ + zOffset + slabThickness).toFixed(1)}m - ${(flTopZ + zOffset - ceilingGap).toFixed(1)}m AMSL)`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatDegrees),
          height: flBaseZ + zOffset + slabThickness,
          extrudedHeight: flTopZ + zOffset - ceilingGap,
          material: isTargetFloor
            ? Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.45)
            : Cesium.Color.fromCssColorString('#38bdf8').withAlpha(isInspection ? 0.18 : 0.06),
          outline: true,
          outlineColor: isTargetFloor
            ? Cesium.Color.WHITE
            : Cesium.Color.fromCssColorString('#38bdf8').withAlpha(isInspection ? 0.4 : 0.15),
          outlineWidth: isTargetFloor ? 2 : 1
        }
      });
      newFloorEntities.push(volumeEntity);

      // C. Floating 3D Text Label in Exploded View
      if (isExploded) {
        const labelEntity = viewer.entities.add({
          id: `la-bld-${selectedLABuilding.id}-label-${fl}`,
          position: Cesium.Cartesian3.fromDegrees(
            selectedLABuilding.center.longitude,
            selectedLABuilding.center.latitude,
            flBaseZ + zOffset + flSpan * 0.5
          ),
          label: {
            text: `FL ${fl} [INFERRED]\n${flBaseZ.toFixed(1)}m - ${flTopZ.toFixed(1)}m AMSL (Δh=${flSpan.toFixed(1)}m)`,
            font: 'bold 11px monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: isTargetFloor ? Cesium.Color.WHITE : Cesium.Color.fromCssColorString('#38bdf8'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            pixelOffset: new Cesium.Cartesian2(45, 0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        newFloorEntities.push(labelEntity);
      }
    }

    floorEntitiesRef.current = newFloorEntities;

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        newFloorEntities.forEach((entity) => viewer.entities.remove(entity));
      }
      floorEntitiesRef.current = [];
    };
  }, [activeDataset, selectedLABuilding, selectedFloor, floorInspectionOptions, lidarViewMode, layers?.terrain, sampledTerrainHeight]);

  // 3d. Highlight Real LiDAR Points for the Selected LA Building
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (highlightPointPrimitivesRef.current && !viewer.isDestroyed()) {
      viewer.scene.primitives.remove(highlightPointPrimitivesRef.current);
      highlightPointPrimitivesRef.current = null;
    }

    if (
      activeDataset !== 'la_south_park' ||
      !selectedLABuilding ||
      !cachedLAPointDataRef.current ||
      !selectedLABuilding.buildingIndex
    ) {
      return;
    }

    const pointData = cachedLAPointDataRef.current;
    const bIndices = pointData.buildingIndices;
    if (!bIndices) return;

    const centerAlt = layers?.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
    const centerCartesian = Cesium.Cartesian3.fromDegrees(
      pointData.centerLon || -118.260903,
      pointData.centerLat || 34.037095,
      centerAlt
    );
    const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);

    const highlightCollection = new Cesium.PointPrimitiveCollection();
    viewer.scene.primitives.add(highlightCollection);
    highlightPointPrimitivesRef.current = highlightCollection;

    const targetBIdx = selectedLABuilding.buildingIndex;
    const count = pointData.count;
    const positions = pointData.positions;
    const amslElevations = pointData.amslElevations;
    const basePixelSize = (pointCloudOptions.pointSize || 3) + 3;

    // Check if a specific floor is selected
    const targetFloorObj = selectedFloor
      ? selectedLABuilding.levels.find((l) => l.level === selectedFloor)
      : null;

    for (let i = 0; i < count; i++) {
      if (bIndices[i] === targetBIdx) {
        const dx = positions[i * 3];
        const dy = positions[i * 3 + 1];
        const dz = positions[i * 3 + 2];
        const amsl = amslElevations[i];

        const localPt = new Cesium.Cartesian3(dx, dy, dz);
        const worldPos = Cesium.Matrix4.multiplyByPoint(enuMatrix, localPt, new Cesium.Cartesian3());

        let color = Cesium.Color.fromCssColorString('#00f2fe');
        let pSize = basePixelSize;

        if (targetFloorObj) {
          if (amsl >= targetFloorObj.zMinAMSL && amsl <= targetFloorObj.zMaxAMSL) {
            color = Cesium.Color.WHITE;
            pSize = basePixelSize + 2;
          } else {
            color = Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.65);
          }
        }

        highlightCollection.add({
          position: worldPos,
          color,
          pixelSize: pSize
        });
      }
    }

    highlightCollection.show = true;

    return () => {
      if (viewer && !viewer.isDestroyed() && highlightPointPrimitivesRef.current) {
        viewer.scene.primitives.remove(highlightPointPrimitivesRef.current);
        highlightPointPrimitivesRef.current = null;
      }
    };
  }, [activeDataset, selectedLABuilding, selectedFloor, pointCloudOptions.pointSize, layers?.terrain, sampledTerrainHeight]);

  // Helper: Topographic elevation colormap (Blue -> Cyan -> Green -> Yellow -> Red)
  const getTopographicColor = (amsl: number, minZ = 1377.0, maxZ = 1459.0): Cesium.Color => {
    const t = Math.max(0, Math.min(1, (amsl - minZ) / (maxZ - minZ)));
    let r = 0, g = 0, b = 0;
    if (t < 0.25) {
      const s = t / 0.25;
      r = 0;
      g = Math.round(255 * s);
      b = 255;
    } else if (t < 0.5) {
      const s = (t - 0.25) / 0.25;
      r = 0;
      g = 255;
      b = Math.round(255 * (1 - s));
    } else if (t < 0.75) {
      const s = (t - 0.5) / 0.25;
      r = Math.round(255 * s);
      g = 255;
      b = 0;
    } else {
      const s = (t - 0.75) / 0.25;
      r = 255;
      g = Math.round(255 * (1 - s));
      b = 0;
    }
    return Cesium.Color.fromBytes(r, g, b, 255);
  };

  // 3b. Manage Real LiDAR Point Cloud & 3D Reconstructed Model Visibility by View Mode
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Update standard GIS layers
    if (realGroundMarkerRef.current) {
      realGroundMarkerRef.current.show = layers.validationZones;
    }
    buildingEntitiesRef.current.forEach((entity) => {
      entity.show = layers.osmBuildings || lidarViewMode === 'compare';
    });
    parcelEntitiesRef.current.forEach((entity) => {
      entity.show = layers.parcels;
    });

    if (!isRealLidarMode || (activeDataset !== 'la_south_park' && !realLidarMetadata)) {
      if (pointPrimitivesRef.current && !viewer.isDestroyed()) {
        viewer.scene.primitives.remove(pointPrimitivesRef.current);
        pointPrimitivesRef.current = null;
      }
      return;
    }

    const shouldShowPoints =
      layers.lidar &&
      (lidarViewMode === 'scan' ||
        (lidarViewMode === 'compare' && (compareSubMode === 'overlay' || compareSubMode === 'lidar_only')));

    const shouldShowMesh =
      layers.lidar &&
      (lidarViewMode === 'reconstruction' ||
        (lidarViewMode === 'compare' && (compareSubMode === 'overlay' || compareSubMode === 'mesh_only')));

    // Update Watertight 3D Reconstructed Mesh Entity
    if (realBuildingEntityRef.current) {
      realBuildingEntityRef.current.show = shouldShowMesh;
      if (realBuildingEntityRef.current.model) {
        if (floorInspectionOptions?.isInspectionMode) {
          (realBuildingEntityRef.current.model as any).color = Cesium.Color.WHITE.withAlpha(0.12);
          (realBuildingEntityRef.current.model as any).colorBlendMode = Cesium.ColorBlendMode.MIX;
          (realBuildingEntityRef.current.model as any).colorBlendAmount = 0.88;
        } else if (
          lidarViewMode === 'compare' &&
          compareSubMode === 'overlay' &&
          pointCloudOptions.meshOpacity < 0.99
        ) {
          (realBuildingEntityRef.current.model as any).color = Cesium.Color.WHITE.withAlpha(
            pointCloudOptions.meshOpacity
          );
          (realBuildingEntityRef.current.model as any).colorBlendMode = Cesium.ColorBlendMode.MIX;
          (realBuildingEntityRef.current.model as any).colorBlendAmount =
            1.0 - pointCloudOptions.meshOpacity;
        } else {
          (realBuildingEntityRef.current.model as any).color = undefined;
        }
      }
    }

    // Update or Load Point Cloud Collection
    if (!shouldShowPoints) {
      if (pointPrimitivesRef.current) {
        pointPrimitivesRef.current.show = false;
      }
      return;
    }

    let isCancelled = false;

    const loadAndRenderPoints = async () => {
      try {
        const isLA = activeDataset === 'la_south_park';
        let pointData: LidarPointCloudData;
        let centerCartesian: Cesium.Cartesian3;

        if (isLA) {
          if (!cachedLAPointDataRef.current) {
            cachedLAPointDataRef.current = await lidarService.getLAPointCloudData();
          }
          pointData = cachedLAPointDataRef.current;
          const centerAlt = layers?.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
          centerCartesian = Cesium.Cartesian3.fromDegrees(
            pointData.centerLon || -118.260903,
            pointData.centerLat || 34.037095,
            centerAlt
          );
        } else {
          if (!cachedPointDataRef.current) {
            cachedPointDataRef.current = await lidarService.getPointCloudData();
          }
          pointData = cachedPointDataRef.current;
          const { longitude, latitude } = realLidarMetadata!.geographicLocation;
          const centerAlt = layers?.terrain ? (sampledTerrainHeight || 1366.40) : 0.0;
          centerCartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, centerAlt);
        }

        if (isCancelled || !viewerRef.current || viewer.isDestroyed()) return;

        // Reset existing primitive collection if already exists
        if (pointPrimitivesRef.current && !viewer.isDestroyed()) {
          viewer.scene.primitives.remove(pointPrimitivesRef.current);
          pointPrimitivesRef.current = null;
        }

        const pointCollection = new Cesium.PointPrimitiveCollection();
        viewer.scene.primitives.add(pointCollection);
        pointPrimitivesRef.current = pointCollection;

        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);

        const count = pointData.count;
        const positions = pointData.positions;
        const amslElevations = pointData.amslElevations;
        const colorsRgb = pointData.colorsRgb;
        const intensities = pointData.intensities;
        const classifications = pointData.classifications;
        const isBuilding = pointData.isBuilding;

        const onlyBld = pointCloudOptions.buildingOnly;
        const densityPct = pointCloudOptions.densityPercentage;
        const colorMode = pointCloudOptions.colorMode;
        const pixelSize = pointCloudOptions.pointSize;

        for (let i = 0; i < count; i++) {
          if (onlyBld && isBuilding[i] === 0) continue;
          if (densityPct === 25 && i % 4 !== 0) continue;
          if (densityPct === 50 && i % 2 !== 0) continue;
          if (densityPct === 75 && i % 4 === 3) continue;

          let localPt: Cesium.Cartesian3;
          if (isLA) {
            const dx = positions[i * 3];
            const dy = positions[i * 3 + 1];
            const dz = positions[i * 3 + 2];
            localPt = new Cesium.Cartesian3(dx, dy, dz);
          } else {
            const lx = positions[i * 3];
            const ly = positions[i * 3 + 1];
            const lz = positions[i * 3 + 2];
            localPt = new Cesium.Cartesian3(lx, -lz, ly);
          }

          const worldPos = Cesium.Matrix4.multiplyByPoint(enuMatrix, localPt, new Cesium.Cartesian3());

          let pointColor: Cesium.Color;
          if (colorMode === 'rgb') {
            pointColor = Cesium.Color.fromBytes(
              colorsRgb[i * 3],
              colorsRgb[i * 3 + 1],
              colorsRgb[i * 3 + 2],
              255
            );
          } else if (colorMode === 'elevation') {
            const minZ = isLA ? 72.0 : 1377.0;
            const maxZ = isLA ? 130.0 : 1459.0;
            pointColor = getTopographicColor(amslElevations[i], minZ, maxZ);
          } else if (colorMode === 'classification') {
            pointColor =
              classifications[i] === 2
                ? Cesium.Color.fromCssColorString('#64748b')
                : Cesium.Color.fromCssColorString('#38bdf8');
          } else {
            const v = intensities[i];
            pointColor = Cesium.Color.fromBytes(v, v, v, 255);
          }

          pointCollection.add({
            position: worldPos,
            color: pointColor,
            pixelSize: pixelSize
          });
        }

        pointCollection.show = true;
      } catch (err) {
        console.error('[CesiumViewer] Error loading point cloud primitives:', err);
      }
    };

    loadAndRenderPoints();

    return () => {
      isCancelled = true;
    };
  }, [
    isRealLidarMode,
    activeDataset,
    realLidarMetadata,
    lidarViewMode,
    compareSubMode,
    pointCloudOptions,
    floorInspectionOptions,
    layers,
    sampledTerrainHeight
  ]);

  // 3c. Manage YOLO Segmentation Masks & Multi-Layer Alignment Entities
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Clean up existing YOLO entities
    yoloEntitiesRef.current.forEach((e) => {
      try {
        viewer.entities.remove(e);
      } catch {}
    });
    yoloEntitiesRef.current = [];

    // Clean up existing alignment entities
    alignmentEntitiesRef.current.forEach((e) => {
      try {
        viewer.entities.remove(e);
      } catch {}
    });
    alignmentEntitiesRef.current = [];

    if (activeDataset !== 'la_south_park' || !laMetadata?.buildings) return;

    const showYolo = layers.yoloSegmentation ?? true;
    const showAlignment = layers.alignmentValidation ?? true;

    if (!showYolo && !showAlignment) return;

    const newYoloEntities: Cesium.Entity[] = [];
    const newAlignmentEntities: Cesium.Entity[] = [];

    // 1. Render building YOLO masks (from fused LABuildingRecord or yoloDetections)
    for (const b of laMetadata.buildings) {
      const coords = b.yoloMaskCoordinates;
      if (showYolo && coords && coords.length >= 3) {
        const groundAlt = b.localGroundAMSL + 0.15;

        const yoloEntity = viewer.entities.add({
          id: `la-yolo-mask-${b.id}`,
          name: `${b.name} YOLOv8 Segmentation Mask`,
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(
              coords.map(([lon, lat]) => Cesium.Cartesian3.fromDegrees(lon, lat, groundAlt))
            ),
            material: Cesium.Color.fromCssColorString('#ec4899').withAlpha(0.28),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#f43f5e').withAlpha(0.9),
            outlineWidth: 2,
            height: groundAlt
          }
        });
        (yoloEntity as any).laBuildingData = b;
        newYoloEntities.push(yoloEntity);
      }

      // 2. Render alignment discrepancy indicators
      if (showAlignment && coords && coords.length >= 3) {
        let sumLon = 0;
        let sumLat = 0;
        for (const [l, lt] of coords) {
          sumLon += l;
          sumLat += lt;
        }
        const yoloCentroid = [sumLon / coords.length, sumLat / coords.length];
        const osmCentroid = [b.center.longitude, b.center.latitude];

        const dLat = (yoloCentroid[1] - osmCentroid[1]) * 110540;
        const dLon = (yoloCentroid[0] - osmCentroid[0]) * 111320 * Math.cos((osmCentroid[1] * Math.PI) / 180);
        const offsetDist = Math.hypot(dLon, dLat);

        if (offsetDist > 2.0) {
          const vectorPositions = [
            Cesium.Cartesian3.fromDegrees(osmCentroid[0], osmCentroid[1], b.localGroundAMSL + 0.5),
            Cesium.Cartesian3.fromDegrees(yoloCentroid[0], yoloCentroid[1], b.localGroundAMSL + 0.5)
          ];

          const lineEntity = viewer.entities.add({
            id: `alignment-offset-${b.id}`,
            name: `${b.name} Optical Parallax Vector (${offsetDist.toFixed(1)}m)`,
            polyline: {
              positions: vectorPositions,
              width: 3,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString('#f59e0b'),
                dashLength: 8.0
              })
            }
          });
          (lineEntity as any).laBuildingData = b;
          newAlignmentEntities.push(lineEntity);
        }
      }
    }

    // Also render any raw yoloDetections that don't yet have matched buildings
    if (showYolo && yoloDetections && yoloDetections.length > 0) {
      yoloDetections.forEach((det) => {
        if (!det.maskGeoCoords || det.maskGeoCoords.length < 3) return;
        const coords = det.maskGeoCoords;
        const groundAlt = 72.0 + 0.12;

        const rawEntity = viewer.entities.add({
          id: `raw-yolo-det-${det.detectionId}`,
          name: `YOLO Detection ${det.detectionId} (${Math.round(det.confidence * 100)}%)`,
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(
              coords.map(([lon, lat]) => Cesium.Cartesian3.fromDegrees(lon, lat, groundAlt))
            ),
            material: Cesium.Color.fromCssColorString('#ec4899').withAlpha(0.2),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#ec4899').withAlpha(0.7),
            outlineWidth: 1.5,
            height: groundAlt
          }
        });
        newYoloEntities.push(rawEntity);
      });
    }

    yoloEntitiesRef.current = newYoloEntities;
    alignmentEntitiesRef.current = newAlignmentEntities;

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        newYoloEntities.forEach((e) => {
          try {
            viewer.entities.remove(e);
          } catch {}
        });
        newAlignmentEntities.forEach((e) => {
          try {
            viewer.entities.remove(e);
          } catch {}
        });
      }
    };
  }, [activeDataset, laMetadata, layers.yoloSegmentation, layers.alignmentValidation, yoloDetections]);
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !targetFlyLocation) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        targetFlyLocation.longitude,
        targetFlyLocation.latitude - 0.002,
        targetFlyLocation.altitude || 500
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0
      },
      duration: 1.8
    });
  }, [targetFlyLocation]);


  // 4. Fly Camera when viewLevel, cameraPreset, or mode changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (isRealLidarMode) {
      if (activeDataset === 'la_south_park') {
        const centerLon = -118.260903;
        const centerLat = 34.037095;

        if (viewLevel === 'global') {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 14000000),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
            duration: 2.0
          });
          return;
        }

        if (viewLevel === 'city') {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.05, 9000),
            orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-55), roll: 0 },
            duration: 2.0
          });
          return;
        }

        const laGround = layers?.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
        switch (cameraPreset) {
          case 'overview':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0055, laGround + 420),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-35), roll: 0 },
              duration: 1.8
            });
            break;
          case 'domeCloseUp':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(-118.2625, 34.0372 - 0.0015, laGround + 140),
              orientation: { heading: Cesium.Math.toRadians(350), pitch: Cesium.Math.toRadians(-22), roll: 0 },
              duration: 1.8
            });
            break;
          case 'grandSouthPortico':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0028, laGround + 120),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-15), roll: 0 },
              duration: 1.8
            });
            break;
          case 'aerialTopDown':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, laGround + 650),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-90), roll: 0 },
              duration: 1.8
            });
            break;
          case 'frontElevation':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0035, laGround + 70),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-8), roll: 0 },
              duration: 1.8
            });
            break;
          case 'sideElevation':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon + 0.0035, centerLat, laGround + 70),
              orientation: { heading: Cesium.Math.toRadians(270), pitch: Cesium.Math.toRadians(-8), roll: 0 },
              duration: 1.8
            });
            break;
        }
        return;
      }

      if (realLidarMetadata) {
        const { longitude, latitude } = realLidarMetadata.geographicLocation;
        const utahGround = layers?.terrain ? (sampledTerrainHeight || 1366.40) : 0.0;

      if (viewLevel === 'global') {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 14000000),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0
          },
          duration: 2.0
        });
        return;
      }

      if (viewLevel === 'city') {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.06, 12000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-55),
            roll: 0
          },
          duration: 2.0
        });
        return;
      }

      // Detailed views by preset or level
      switch (cameraPreset) {
        case 'overview':
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.0035, utahGround + 380),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-32),
              roll: 0
            },
            duration: 1.8
          });
          break;

        case 'domeCloseUp':
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude + 0.0008, latitude - 0.0012, utahGround + 120),
            orientation: {
              heading: Cesium.Math.toRadians(330),
              pitch: Cesium.Math.toRadians(-22),
              roll: 0
            },
            duration: 1.8
          });
          break;

        case 'grandSouthPortico':
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.0018, utahGround + 75),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-12),
              roll: 0
            },
            duration: 1.8
          });
          break;

        case 'aerialTopDown':
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, utahGround + 520),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-90),
              roll: 0
            },
            duration: 1.8
          });
          break;

        case 'frontElevation':
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.0022, utahGround + 45),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-5),
              roll: 0
            },
            duration: 1.8
          });
          break;

        case 'sideElevation':
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude + 0.0022, latitude, utahGround + 45),
            orientation: {
              heading: Cesium.Math.toRadians(270),
              pitch: Cesium.Math.toRadians(-5),
              roll: 0
            },
            duration: 1.8
          });
          break;
      }
      return;
    }
  }

    // Sandbox Indian mode camera
    const { latitude, longitude } = currentProperty.coordinates;
    switch (viewLevel) {
      case 'global':
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 18000000),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0
          },
          duration: 2.2
        });
        break;

      case 'city':
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.08, 28000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-55),
            roll: 0
          },
          duration: 2.2
        });
        break;

      case 'buildings':
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(longitude - 0.0035, latitude - 0.004, 1100),
          orientation: {
            heading: Cesium.Math.toRadians(35),
            pitch: Cesium.Math.toRadians(-38),
            roll: 0
          },
          duration: 2.0
        });
        break;

      case 'layers':
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(longitude - 0.0018, latitude - 0.002, 320),
          orientation: {
            heading: Cesium.Math.toRadians(45),
            pitch: Cesium.Math.toRadians(-28),
            roll: 0
          },
          duration: 1.8
        });
        break;

      case 'ownership':
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(longitude - 0.0008, latitude - 0.001, 140),
          orientation: {
            heading: Cesium.Math.toRadians(55),
            pitch: Cesium.Math.toRadians(-20),
            roll: 0
          },
          duration: 1.6
        });
        break;
    }
  }, [viewLevel, currentProperty, isRealLidarMode, activeDataset, realLidarMetadata, cameraPreset]);

  // 4b. Fly camera to selected LA Building
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedLABuilding || activeDataset !== 'la_south_park') return;

    const baseGround = layers?.terrain ? (sampledTerrainHeight || 35.70) : 0.0;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        selectedLABuilding.center.longitude,
        selectedLABuilding.center.latitude - 0.002,
        baseGround + selectedLABuilding.derivedHeightMeters + 90
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-32),
        roll: 0
      },
      duration: 1.5
    });
  }, [selectedLABuilding, activeDataset, layers?.terrain, sampledTerrainHeight]);

  if (initError) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black text-white">
        <div className="max-w-md p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center shadow-2xl backdrop-blur-md">
          <AlertCircle className="w-10 h-10 text-white mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">3D Globe Renderer Notice</h3>
          <p className="text-xs text-zinc-400 mb-4 font-mono">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl transition-all shadow-md active:scale-95"
          >
            Retry 3D Globe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Cesium Globe Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D Callout Banner */}
      {calloutScreenPos.visible && !selectedBuilding && !selectedRealBuilding && !selectedLABuilding && (
        <div
          style={{
            left: `${calloutScreenPos.x}px`,
            top: `${calloutScreenPos.y}px`,
            transform: 'translate(-50%, -125%)'
          }}
          className="absolute z-20 pointer-events-none transition-all duration-100 ease-out flex flex-col items-center"
        >
          {isRealLidarMode && activeDataset === 'la_south_park' ? (
            <div
              onClick={() => {
                if (laMetadataRef.current?.buildings?.[0]) {
                  onSelectLABuilding?.(laMetadataRef.current.buildings[0]);
                }
              }}
              className="gis-glass-panel px-3.5 py-1.5 rounded-full flex items-center space-x-2 shadow-2xl border border-cyan-500/40 animate-fadeIn pointer-events-auto cursor-pointer hover:border-cyan-400 transition-all bg-black/85 backdrop-blur-md"
            >
              <Box className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs font-bold text-white tracking-tight">USGS 3DEP LiDAR (Los Angeles DTLA)</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                129 3D Buildings
              </span>
              <DataProvenanceBadge status="REAL" label="REAL USGS" size="sm" />
            </div>
          ) : isRealLidarMode && realLidarMetadata ? (
            <div
              onClick={() => onSelectRealBuilding?.(realLidarMetadata)}
              className="gis-glass-panel px-3.5 py-1.5 rounded-full flex items-center space-x-2 shadow-2xl border border-white/30 animate-fadeIn pointer-events-auto cursor-pointer hover:border-white transition-all bg-black/85 backdrop-blur-md"
            >
              <Box className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-xs font-bold text-white tracking-tight">{realLidarMetadata.buildingName}</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                {realLidarMetadata.elevationMetrics.derivedBuildingHeightMeters}m
              </span>
              <DataProvenanceBadge status="REAL" label="REAL LiDAR" size="sm" />
            </div>
          ) : (
            <div className="gis-glass-panel px-3.5 py-2 rounded-2xl flex items-center space-x-2.5 shadow-2xl border border-white/20 animate-fadeIn">
              <div className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <DataProvenanceBadge status={currentProperty.isLabDemo ? 'DEMO' : 'DERIVED'} size="sm" />
                </div>
                <div className="text-xs font-bold text-white tracking-wide">{currentProperty.propertyName || currentProperty.buildingName}</div>
                <div className="text-[10px] text-zinc-400">
                  {currentProperty.city}, {currentProperty.state}, {currentProperty.country}
                </div>
              </div>
            </div>
          )}

          {/* Pointer line & indicator */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-white to-zinc-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-white border border-black -mt-1 animate-ping" />
        </div>
      )}

      {/* Basemap Switcher Floating Widget */}
      <div className="absolute top-20 right-5 z-20 pointer-events-auto hidden md:block">
        <div className="relative">
          <button
            onClick={() => setShowBasemapMenu(!showBasemapMenu)}
            title="Switch Geospatial Basemap"
            className="p-2.5 rounded-xl bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 text-white shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-medium"
          >
            <Layers className="w-4 h-4 text-zinc-400" />
            <span className="capitalize">{basemap} Map</span>
          </button>

          {showBasemapMenu && (
            <div className="absolute right-0 top-12 w-52 gis-glass-panel rounded-2xl p-2 shadow-2xl border border-zinc-800 flex flex-col space-y-1 animate-fadeIn">
              <button
                onClick={() => {
                  setBasemap('satellite');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  basemap === 'satellite'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Satellite className="w-3.5 h-3.5" />
                <span>Satellite (ESRI)</span>
              </button>

              <button
                onClick={() => {
                  setBasemap('bhuvan');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  basemap === 'bhuvan'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Bhuvan / ISRO (WMS)</span>
              </button>

              <button
                onClick={() => {
                  setBasemap('dark');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  basemap === 'dark'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Monochrome Dark</span>
              </button>

              <button
                onClick={() => {
                  setBasemap('streets');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  basemap === 'streets'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>OpenStreetMap</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vertical Placement Debug Mode Toggle */}
      {isRealLidarMode && (
        <div className="absolute top-20 left-5 z-20 pointer-events-auto">
          <button
            onClick={() => setIsVerticalPlacementDebugOpen(!isVerticalPlacementDebugOpen)}
            title="Audit vertical placement: LiDAR ground, GLB Z, anchor, terrain height"
            className={`px-3 py-2 rounded-xl border shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-medium transition-all ${
              isVerticalPlacementDebugOpen
                ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-cyan-500/30'
                : 'bg-zinc-950/90 hover:bg-zinc-900 border-zinc-800 text-zinc-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vertical Placement Audit</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300">
              {layers?.terrain ? '3D DEM' : 'ELLIPSOID'}
            </span>
          </button>
        </div>
      )}

      {/* Vertical Placement Debug Panel */}
      <VerticalPlacementDebugPanel
        isOpen={isVerticalPlacementDebugOpen}
        onClose={() => setIsVerticalPlacementDebugOpen(false)}
        dataset={activeDataset}
        selectedLABuilding={selectedLABuilding}
        realLidarMetadata={realLidarMetadata}
        isTerrainEnabled={!!layers?.terrain}
        sampledTerrainHeight={sampledTerrainHeight}
        groundAnchorHeight={groundAnchorHeight}
      />

      {/* Bhuvan Connectivity / Error Alert Banner */}
      {bhuvanAlert && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-xl w-[90%] sm:w-auto">
          <div className="gis-glass-panel px-4 py-2.5 rounded-2xl border border-zinc-700 bg-zinc-950 text-xs text-zinc-300 flex items-start space-x-2.5 shadow-2xl animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <div className="text-left font-mono">
              <span className="font-bold text-white block">External WMS Service Notice</span>
              <span className="text-[11px] text-zinc-400 leading-snug block">
                {bhuvanAlert}
              </span>
            </div>
            <button
              onClick={() => setBhuvanAlert(null)}
              className="p-1 text-zinc-400 hover:text-white ml-2 shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
