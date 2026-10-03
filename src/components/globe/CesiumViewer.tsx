import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { Building2, Layers, Satellite, Map, Landmark, AlertCircle, Box, CheckCircle2 } from 'lucide-react';
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
  LADatasetMetadata
} from '../../types/lidar';
import { lidarService } from '../../services/lidarService';
import { geospatialService } from '../../services/geospatialDataService';
import { externalGeoService } from '../../services/externalGeoService';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

import { LayerVisibilityState } from './LayerControlPanel';

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
  layers?: LayerVisibilityState;
  targetFlyLocation?: { latitude: number; longitude: number; altitude?: number } | null;
  lidarViewMode?: LidarViewMode;
  compareSubMode?: LidarCompareSubMode;
  pointCloudOptions?: PointCloudRenderOptions;
}

type BasemapStyle = 'satellite' | 'dark' | 'streets' | 'bhuvan';

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
  layers = {
    lidar: true,
    osmBuildings: true,
    parcels: true,
    satellite: true,
    terrain: false,
    propertyVolume: true,
    validationZones: true
  },
  targetFlyLocation = null,
  lidarViewMode = 'reconstruction',
  compareSubMode = 'overlay',
  pointCloudOptions = {
    pointSize: 3,
    colorMode: 'rgb',
    densityPercentage: 100,
    buildingOnly: true,
    meshOpacity: 0.65
  }
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markerEntityRef = useRef<Cesium.Entity | null>(null);
  const realBuildingEntityRef = useRef<Cesium.Entity | null>(null);
  const realGroundMarkerRef = useRef<Cesium.Entity | null>(null);
  const floorEntitiesRef = useRef<Cesium.Entity[]>([]);
  const pointPrimitivesRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const cachedPointDataRef = useRef<LidarPointCloudData | null>(null);
  const cachedLAPointDataRef = useRef<LidarPointCloudData | null>(null);
  const laMetadataRef = useRef<LADatasetMetadata | null>(laMetadata);
  laMetadataRef.current = laMetadata;
  const buildingEntitiesRef = useRef<Cesium.Entity[]>([]);
  const parcelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const currentBaseLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const clickHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);


  const [basemap, setBasemap] = useState<BasemapStyle>('satellite');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [bhuvanAlert, setBhuvanAlert] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

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

      // Atmospheric and lighting configuration
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.atmosphereLightIntensity = 10.0;
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: new Cesium.Cartesian3(-0.6, -0.6, -0.8)
      });
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#000000');
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#09090b');

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
            if (selectedLABuilding) {
              pos = Cesium.Cartesian3.fromDegrees(
                selectedLABuilding.center.longitude,
                selectedLABuilding.center.latitude,
                selectedLABuilding.peakElevationAMSL + 5
              );
            } else {
              pos = Cesium.Cartesian3.fromDegrees(-118.260903, 34.037095, 120);
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
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-118.260903, 34.037095 - 0.0055, 420),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-35),
              roll: 0
            }
          });
        } else {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-111.888200, 40.777394 - 0.0035, 380),
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
        // If in LA mode, pick nearest building to click position
        if (activeDataset === 'la_south_park' && laMetadataRef.current?.buildings) {
          const ray = viewer.camera.getPickRay(movement.position);
          if (ray) {
            const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
              const carto = Cesium.Cartographic.fromCartesian(cartesian);
              const clickLon = Cesium.Math.toDegrees(carto.longitude);
              const clickLat = Cesium.Math.toDegrees(carto.latitude);
              let bestBld: LABuildingRecord | null = null;
              let minD = Infinity;
              for (const b of laMetadataRef.current.buildings) {
                const d = Math.hypot(b.center.longitude - clickLon, b.center.latitude - clickLat);
                if (d < minD) {
                  minD = d;
                  bestBld = b;
                }
              }
              if (bestBld && minD < 0.0015) {
                onSelectLABuilding?.(bestBld);
                return;
              }
            }
          }
        }

        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id;
          if (
            (entity as any).isRealLidarBuilding ||
            entity.id === 'real-lidar-utah-capitol' ||
            entity.id === 'real-lidar-ground-ring' ||
            entity.id === 'real-lidar-la-buildings' ||
            entity.id === 'real-lidar-la-ground-ring'
          ) {
            if (activeDataset === 'la_south_park' && laMetadataRef.current?.buildings?.[0]) {
              onSelectLABuilding?.(laMetadataRef.current.buildings[0]);
            } else {
              onSelectRealBuilding?.(realLidarMetadata || null);
            }
            return;
          }
          if ((entity as any).buildingData) {
            const building = (entity as any).buildingData as BuildingFootprint;
            onSelectBuilding?.(building);
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

  // 3. Load Real LiDAR Building or Conceptual Sandbox Layers
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Clear old marker, buildings, parcels, real building entities, and point cloud primitives
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
        const centerAlt = 72.17;

        // Add Reconstructed Watertight GLB Model with 129 genuine buildings
        const bldEntity = viewer.entities.add({
          id: 'real-lidar-la-buildings',
          name: 'USGS 3DEP LiDAR Reconstructed City (129 Meshes)',
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
          model: {
            uri: '/models/la_usgs_buildings.glb',
            minimumPixelSize: 64,
            maximumScale: 20000,
            shadows: Cesium.ShadowMode.ENABLED,
            heightReference: Cesium.HeightReference.NONE
          }
        });
        (bldEntity as any).isRealLidarBuilding = true;
        realBuildingEntityRef.current = bldEntity;

        // Add Ground Survey Bounds Radar Ring
        const groundMarker = viewer.entities.add({
          id: 'real-lidar-la-ground-ring',
          name: 'USGS Survey Footprint Extent (DTLA South Park, 72.17m AMSL Datum)',
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

        return;
      }

      if (realLidarMetadata) {
        const { longitude, latitude } = realLidarMetadata.geographicLocation;
        const bldPos = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);

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
            heightReference: Cesium.HeightReference.NONE
          }
        });
        (bldEntity as any).isRealLidarBuilding = true;
        (bldEntity as any).lidarData = realLidarMetadata;
        realBuildingEntityRef.current = bldEntity;

        // Add Ground Radar Ring around building precinct
        const groundMarker = viewer.entities.add({
          id: 'real-lidar-ground-ring',
          name: 'Utah State Capitol Ground Datum (1,384.50m AMSL)',
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 1),
          ellipse: {
            semiMajorAxis: 160.0,
            semiMinorAxis: 110.0,
            height: 1,
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
  }, [currentProperty, selectedBuilding, isRealLidarMode, activeDataset, realLidarMetadata]);

  // 3c. Manage Selected LA Building Footprint & Inferred Floor Slices
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
    coords.forEach(([lon, lat]) => {
      flatDegrees.push(lon, lat);
    });

    // 1. Ground Footprint Outline Ring
    const groundOutline = viewer.entities.add({
      id: `la-bld-${selectedLABuilding.id}-ground-outline`,
      name: `${selectedLABuilding.name} Footprint Base`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(
          coords.map(([lon, lat]) => [lon, lat, selectedLABuilding.localGroundAMSL + 0.3]).flat()
        ),
        width: 3.5,
        material: Cesium.Color.fromCssColorString('#00f2fe')
      }
    });
    newFloorEntities.push(groundOutline);

    // 2. Inferred Floor Slices:
    // If selectedFloor is specified, highlight that floor with prominent cyan fill & white edge
    // Otherwise render all inferred floors as subtle translucent strata
    selectedLABuilding.levels.forEach((lvl) => {
      const isTargetFloor = selectedFloor !== null && selectedFloor !== undefined
        ? lvl.level === selectedFloor
        : false;

      const floorColor = isTargetFloor
        ? Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.65)
        : Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.12);

      const outlineColor = isTargetFloor
        ? Cesium.Color.WHITE
        : Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.4);

      const floorEntity = viewer.entities.add({
        id: `la-bld-${selectedLABuilding.id}-floor-${lvl.level}`,
        name: `${lvl.floorName} (Inferred: ${lvl.zMinAMSL.toFixed(1)}m - ${lvl.zMaxAMSL.toFixed(1)}m AMSL)`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatDegrees),
          height: lvl.zMinAMSL,
          extrudedHeight: lvl.zMaxAMSL,
          material: floorColor,
          outline: true,
          outlineColor: outlineColor,
          outlineWidth: isTargetFloor ? 3 : 1
        }
      });
      newFloorEntities.push(floorEntity);
    });

    floorEntitiesRef.current = newFloorEntities;

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        newFloorEntities.forEach((entity) => viewer.entities.remove(entity));
      }
      floorEntitiesRef.current = [];
    };
  }, [activeDataset, selectedLABuilding, selectedFloor]);

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
      entity.show = layers.osmBuildings;
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
        if (
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
          centerCartesian = Cesium.Cartesian3.fromDegrees(
            pointData.centerLon || -118.260903,
            pointData.centerLat || 34.037095,
            pointData.centerAlt || 72.17
          );
        } else {
          if (!cachedPointDataRef.current) {
            cachedPointDataRef.current = await lidarService.getPointCloudData();
          }
          pointData = cachedPointDataRef.current;
          const { longitude, latitude } = realLidarMetadata!.geographicLocation;
          centerCartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
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
    layers
  ]);

  // Handle direct target fly requests from search selection
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

        switch (cameraPreset) {
          case 'overview':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0055, 420),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-35), roll: 0 },
              duration: 1.8
            });
            break;
          case 'domeCloseUp':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(-118.2625, 34.0372 - 0.0015, 140),
              orientation: { heading: Cesium.Math.toRadians(350), pitch: Cesium.Math.toRadians(-22), roll: 0 },
              duration: 1.8
            });
            break;
          case 'grandSouthPortico':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0028, 120),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-15), roll: 0 },
              duration: 1.8
            });
            break;
          case 'aerialTopDown':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 650),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-90), roll: 0 },
              duration: 1.8
            });
            break;
          case 'frontElevation':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.0035, 110),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-8), roll: 0 },
              duration: 1.8
            });
            break;
          case 'sideElevation':
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLon + 0.0035, centerLat, 110),
              orientation: { heading: Cesium.Math.toRadians(270), pitch: Cesium.Math.toRadians(-8), roll: 0 },
              duration: 1.8
            });
            break;
        }
        return;
      }

      if (realLidarMetadata) {
        const { longitude, latitude } = realLidarMetadata.geographicLocation;

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
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.0035, 380),
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
            destination: Cesium.Cartesian3.fromDegrees(longitude + 0.0008, latitude - 0.0012, 120),
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
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.0018, 75),
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
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 520),
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
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.0022, 1420),
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
            destination: Cesium.Cartesian3.fromDegrees(longitude + 0.0022, latitude, 1420),
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

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        selectedLABuilding.center.longitude,
        selectedLABuilding.center.latitude - 0.002,
        selectedLABuilding.peakElevationAMSL + 90
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-32),
        roll: 0
      },
      duration: 1.5
    });
  }, [selectedLABuilding, activeDataset]);

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
