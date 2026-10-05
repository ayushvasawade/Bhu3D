import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import {
  RotateCcw,
  Maximize2,
  Layers,
  Satellite,
  Building,
  Box,
  Scan,
  Compass,
  Mountain
} from 'lucide-react';
import { LABuildingRecord, FloorInspectionOptions, ElevationMode } from '../../types/lidar';
import { YoloBuildingDetection } from '../../types/yolo';
import { lidarService } from '../../services/lidarService';
import { generateBuildingFloors } from '../../utils/geoUtils';

interface BuildingDetailViewerProps {
  building: LABuildingRecord;
  selectedFloor: number | null;
  onSelectFloor?: (floor: number | null) => void;
  floorInspectionOptions: FloorInspectionOptions;
  onChangeFloorInspectionOptions?: (opts: Partial<FloorInspectionOptions>) => void;
  yoloDetections?: YoloBuildingDetection[];
  isolateSelectedFloor?: boolean;
}

export const BuildingDetailViewer: React.FC<BuildingDetailViewerProps> = ({
  building,
  selectedFloor,
  onSelectFloor,
  floorInspectionOptions,
  onChangeFloorInspectionOptions,
  yoloDetections = [],
  isolateSelectedFloor = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const baseLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const elevationOverlayRef = useRef<Cesium.ImageryLayer | null>(null);
  const modelEntityRef = useRef<Cesium.Entity | null>(null);
  const osmEntityRef = useRef<Cesium.Entity | null>(null);
  const pointPrimitivesRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const floorEntitiesRef = useRef<Cesium.Entity[]>([]);
  const yoloEntityRef = useRef<Cesium.Entity | null>(null);

  const [elevationMode, setElevationMode] = useState<ElevationMode>('none');

  // Layer Toggles on Detail Viewer
  const [layers, setLayers] = useState({
    satellite: true,
    mesh: true,
    lidar: true,
    osm: true,
    yolo: false,
    floors: true
  });

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const centerLon = building.center.longitude;
  const centerLat = building.center.latitude;
  const groundAlt = 0.0; // Normalized local terrain anchor
  const bldHeight = building.derivedHeightMeters;

  const onSelectFloorRef = useRef(onSelectFloor);
  useEffect(() => {
    onSelectFloorRef.current = onSelectFloor;
  }, [onSelectFloor]);

  const floorResult = useMemo(
    () => generateBuildingFloors(building, floorInspectionOptions),
    [building, floorInspectionOptions]
  );
  const count = floorResult.floorCount;
  const perFloorH = floorResult.averageFloorHeight;

  // Initialize Cesium Viewer focused strictly on this building
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    try {
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

      viewer.scene.globe.show = true;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#09090b');
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;

      // Camera view tightly focused on the building
      const cameraDistance = Math.max(70, bldHeight * 2.2);
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          centerLon,
          centerLat - 0.0009 * (cameraDistance / 100),
          groundAlt + bldHeight + cameraDistance * 0.65
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-32),
          roll: 0
        }
      });

      viewerRef.current = viewer;

      // Click to pick floor entity via drillPick + elevation raycast
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: any) => {
        // 1. Drill pick to find any floor entity under the mouse
        const pickedObjects = viewer.scene.drillPick(click.position);
        for (const p of pickedObjects) {
          const entId: string = p?.id?.id || '';
          if (entId.startsWith('building-detail-floor-')) {
            const lvl = parseInt(entId.replace('building-detail-floor-', ''), 10);
            if (!isNaN(lvl)) {
              onSelectFloorRef.current?.(lvl);
              return;
            }
          }
          if (p?.id?.floorLevel) {
            onSelectFloorRef.current?.(p.id.floorLevel);
            return;
          }
        }

        // 2. Raycast elevation on the 3D building surface
        let cartesian: Cesium.Cartesian3 | undefined;
        if (viewer.scene.pickPositionSupported) {
          cartesian = viewer.scene.pickPosition(click.position);
        }
        if (!cartesian) {
          const ray = viewer.camera.getPickRay(click.position);
          if (ray) {
            cartesian = viewer.scene.globe.pick(ray, viewer.scene) || undefined;
          }
        }

        if (cartesian) {
          const carto = Cesium.Cartographic.fromCartesian(cartesian);
          const clickLon = Cesium.Math.toDegrees(carto.longitude);
          const clickLat = Cesium.Math.toDegrees(carto.latitude);
          const clickHeight = carto.height;

          // If within the building area, calculate floor level from clicked elevation
          if (
            Math.abs(clickLon - centerLon) < 0.002 &&
            Math.abs(clickLat - centerLat) < 0.002
          ) {
            const relZ = Math.max(0, clickHeight - groundAlt);
            const targetLvl = Math.min(count, Math.max(1, Math.floor(relZ / perFloorH) + 1));
            onSelectFloorRef.current?.(targetLvl);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      return () => {
        handler.destroy();
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
      };
    } catch (err) {
      console.error('[BuildingDetailViewer] Init error:', err);
    }
  }, [centerLon, centerLat, bldHeight, count, perFloorH]);

  // Reset Camera Helper
  const handleResetCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const cameraDistance = Math.max(70, bldHeight * 2.2);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        centerLon,
        centerLat - 0.0009 * (cameraDistance / 100),
        groundAlt + bldHeight + cameraDistance * 0.65
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-32),
        roll: 0
      },
      duration: 1.2
    });
  };

  // Satellite layer toggle
  useEffect(() => {
    if (baseLayerRef.current) {
      baseLayerRef.current.show = layers.satellite;
    }
  }, [layers.satellite]);

  // Elevation Mode Raster Overlay
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (elevationOverlayRef.current) {
      viewer.imageryLayers.remove(elevationOverlayRef.current);
      elevationOverlayRef.current = null;
    }

    if (elevationMode && elevationMode !== 'none') {
      const imgMap: Record<string, string> = {
        dem: '/data/lidar/dem/dem_surface.png',
        dsm: '/data/lidar/dsm/dsm_surface.png',
        ndsm: '/data/lidar/ndsm/ndsm_surface.png'
      };

      const imageUrl = imgMap[elevationMode];
      if (imageUrl) {
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
        elevationOverlayRef.current = layer;
      }
    }
  }, [elevationMode]);

  // 3D Reconstructed Mesh
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (modelEntityRef.current) {
      viewer.entities.remove(modelEntityRef.current);
      modelEntityRef.current = null;
    }

    if (layers.mesh) {
      const isXRay = floorInspectionOptions.isInspectionMode;
      const modelEntity = viewer.entities.add({
        id: `building-detail-mesh-${building.id}`,
        name: building.name,
        position: Cesium.Cartesian3.fromDegrees(-118.260903, 34.037095, groundAlt),
        model: {
          uri: '/models/la_usgs_buildings.glb',
          minimumPixelSize: 64,
          maximumScale: 20000,
          shadows: Cesium.ShadowMode.ENABLED,
          color: Cesium.Color.fromCssColorString('#00f2fe').withAlpha(isXRay ? 0.25 : 0.75),
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: 0.4
        }
      });
      modelEntityRef.current = modelEntity;
    }
  }, [layers.mesh, building.id, floorInspectionOptions.isInspectionMode]);

  // OSM Footprint
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (osmEntityRef.current) {
      viewer.entities.remove(osmEntityRef.current);
      osmEntityRef.current = null;
    }

    if (layers.osm && building.footprintCoordinates?.length >= 3) {
      const positions = Cesium.Cartesian3.fromDegreesArrayHeights(
        building.footprintCoordinates.map(([lon, lat]) => [lon, lat, groundAlt + 0.2]).flat()
      );

      const entity = viewer.entities.add({
        id: `building-detail-osm-${building.id}`,
        name: 'OSM Footprint Boundary',
        polyline: {
          positions,
          width: 3.5,
          material: Cesium.Color.fromCssColorString('#f59e0b')
        }
      });
      osmEntityRef.current = entity;
    }
  }, [layers.osm, building]);

  // LiDAR Point Cloud Stream
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (pointPrimitivesRef.current) {
      viewer.scene.primitives.remove(pointPrimitivesRef.current);
      pointPrimitivesRef.current = null;
    }

    if (layers.lidar) {
      lidarService.getLAPointCloudData().then((pointData) => {
        if (!viewer || viewer.isDestroyed()) return;
        const pointsCollection = new Cesium.PointPrimitiveCollection();

        const count = pointData.count;
        const bldIndex = building.buildingIndex;
        // Bounding box filter around building for maximum performance and focus
        const bufferLon = 0.0015;
        const bufferLat = 0.0015;

        for (let i = 0; i < count; i += 2) {
          const dx = pointData.positions[i * 3];
          const dy = pointData.positions[i * 3 + 1];
          const dz = pointData.positions[i * 3 + 2];

          const lon = -118.260903 + dx / (111320 * Math.cos((34.037095 * Math.PI) / 180));
          const lat = 34.037095 + dy / 110540;
          const alt = groundAlt + dz;

          // Check if point is within local vicinity of this building
          if (
            Math.abs(lon - centerLon) > bufferLon ||
            Math.abs(lat - centerLat) > bufferLat
          ) {
            continue;
          }

          const isThisBld =
            bldIndex !== undefined &&
            pointData.buildingIndices &&
            pointData.buildingIndices[i] === bldIndex;

          const r = isThisBld ? 0 : pointData.colorsRgb[i * 3] / 255;
          const g = isThisBld ? 242 / 255 : pointData.colorsRgb[i * 3 + 1] / 255;
          const b = isThisBld ? 254 / 255 : pointData.colorsRgb[i * 3 + 2] / 255;

          pointsCollection.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
            pixelSize: isThisBld ? 4 : 2.5,
            color: new Cesium.Color(r, g, b, isThisBld ? 0.95 : 0.6)
          });
        }

        viewer.scene.primitives.add(pointsCollection);
        pointPrimitivesRef.current = pointsCollection;
      });
    }
  }, [layers.lidar, building, centerLon, centerLat]);

  // Floor Cadastre Volumes (with selection, isolation, and exploded views)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    floorEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    floorEntitiesRef.current = [];

    if (layers.floors && building.footprintCoordinates?.length >= 3) {
      const explode = floorInspectionOptions.isExplodedView
        ? (floorInspectionOptions.explodeSpacingMeters || 2.0)
        : 0;

      const flatCoords: number[] = [];
      building.footprintCoordinates.forEach(([lon, lat]) => flatCoords.push(lon, lat));

      const entities: Cesium.Entity[] = [];

      for (let i = 0; i < floorResult.floors.length; i++) {
        const floorObj = floorResult.floors[i];
        const lvl = floorObj.floorNumber;
        const isTarget = selectedFloor === lvl;

        // If isolate floor is active, only render target floor
        if (isolateSelectedFloor && selectedFloor !== null && !isTarget) {
          continue;
        }

        const baseZ = groundAlt + i * perFloorH + i * explode;
        const ceilingZ = baseZ + floorObj.height;

        const slabEntity = viewer.entities.add({
          id: `building-detail-floor-${lvl}`,
          name: floorObj.floorName,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: baseZ,
            extrudedHeight: ceilingZ,
            material: isTarget
              ? Cesium.Color.fromCssColorString('#00f2fe').withAlpha(0.85)
              : Cesium.Color.fromCssColorString('#f59e0b').withAlpha(
                  selectedFloor !== null ? 0.08 : 0.28
                ),
            outline: true,
            outlineColor: isTarget
              ? Cesium.Color.WHITE
              : Cesium.Color.fromCssColorString('#f59e0b').withAlpha(
                  selectedFloor !== null ? 0.3 : 0.8
                )
          }
        });
        (slabEntity as any).floorLevel = lvl;
        entities.push(slabEntity);
      }
      floorEntitiesRef.current = entities;
    }
  }, [
    layers.floors,
    building,
    selectedFloor,
    floorInspectionOptions,
    floorResult,
    isolateSelectedFloor
  ]);

  // YOLO Segmentation Mask
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (yoloEntityRef.current) {
      viewer.entities.remove(yoloEntityRef.current);
      yoloEntityRef.current = null;
    }

    const yoloCoords =
      building.yoloMaskCoordinates ||
      (yoloDetections.length > 0 ? yoloDetections[0].maskGeoCoords : null);

    if (layers.yolo && yoloCoords && yoloCoords.length >= 3) {
      const positions = Cesium.Cartesian3.fromDegreesArray(yoloCoords.flat());
      const entity = viewer.entities.add({
        id: `building-detail-yolo-${building.id}`,
        name: 'YOLO Instance Segmentation Mask',
        polyline: {
          positions,
          width: 3.0,
          clampToGround: true,
          material: Cesium.Color.fromCssColorString('#ec4899')
        }
      });
      yoloEntityRef.current = entity;
    }
  }, [layers.yolo, building, yoloDetections]);

  return (
    <div className="relative w-full h-[450px] sm:h-[520px] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />

      {/* Top Floating View Controls & Presets */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-black/85 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-xl">
        <button
          onClick={() => toggleLayer('lidar')}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
            layers.lidar
              ? 'bg-emerald-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
          title="Toggle LiDAR Point Cloud"
        >
          <span>⁖ LiDAR</span>
        </button>

        <button
          onClick={() => toggleLayer('mesh')}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
            layers.mesh
              ? 'bg-cyan-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
          title="Toggle 3D LOD2 Reconstructed Mesh"
        >
          <Box className="w-3.5 h-3.5" />
          <span>Mesh</span>
        </button>

        <button
          onClick={() => toggleLayer('osm')}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
            layers.osm
              ? 'bg-amber-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
          title="Toggle OSM Cadastral Vector Footprint"
        >
          <Building className="w-3.5 h-3.5" />
          <span>OSM</span>
        </button>

        <button
          onClick={() => toggleLayer('yolo')}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
            layers.yolo
              ? 'bg-pink-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
          title="Toggle YOLOv8 Aerial Segmentation Mask"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>YOLO</span>
        </button>

        <button
          onClick={() => toggleLayer('floors')}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
            layers.floors
              ? 'bg-amber-400 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
          title="Toggle Vertical Floor Volumes"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Floors</span>
        </button>

        <button
          onClick={() => toggleLayer('satellite')}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
            layers.satellite
              ? 'bg-blue-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
          title="Toggle Satellite Base Imagery"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          onClick={() => {
            const modes: ElevationMode[] = ['none', 'dem', 'dsm', 'ndsm'];
            const next = modes[(modes.indexOf(elevationMode) + 1) % modes.length];
            setElevationMode(next);
          }}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
            elevationMode !== 'none'
              ? elevationMode === 'dem'
                ? 'bg-emerald-500 text-black shadow-sm'
                : elevationMode === 'dsm'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-amber-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
          title="Toggle DEM / DSM / nDSM Elevation Raster Overlay"
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>{elevationMode === 'none' ? 'Elev: OFF' : elevationMode.toUpperCase()}</span>
        </button>

        <button
          onClick={handleResetCamera}
          className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floor Selection Quick-Bar directly inside 3D Viewer */}
      <div className="absolute bottom-16 left-4 right-4 z-20 flex items-center justify-between gap-2 p-2 bg-black/85 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl overflow-x-auto custom-scrollbar font-mono text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-white text-[11px]">Floor:</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
          <button
            onClick={() => onSelectFloor?.(Math.max(1, (selectedFloor || 1) - 1))}
            disabled={(selectedFloor || 1) <= 1}
            className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-white font-bold text-[11px] transition-colors"
            title="Previous Floor"
          >
            ◀
          </button>

          {Array.from({ length: count }, (_, i) => {
            const lvl = i + 1;
            const isSelected = selectedFloor === lvl;
            return (
              <button
                key={lvl}
                onClick={() => onSelectFloor?.(isSelected ? null : lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-md scale-105'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                }`}
              >
                F{lvl}
              </button>
            );
          })}

          <button
            onClick={() => onSelectFloor?.(Math.min(count, (selectedFloor || 1) + 1))}
            disabled={(selectedFloor || 1) >= count}
            className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-white font-bold text-[11px] transition-colors"
            title="Next Floor"
          >
            ▶
          </button>
        </div>

        {selectedFloor !== null && (
          <button
            onClick={() => onSelectFloor?.(null)}
            className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] shrink-0 font-sans"
            title="Deselect Floor"
          >
            Deselect
          </button>
        )}
      </div>

      {/* Bottom Floating Inspection Mode HUD */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2 p-1.5 bg-black/85 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-xl text-xs font-mono">
        <button
          onClick={() =>
            onChangeFloorInspectionOptions?.({
              isInspectionMode: !floorInspectionOptions.isInspectionMode
            })
          }
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            floorInspectionOptions.isInspectionMode
              ? 'bg-cyan-500 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          {floorInspectionOptions.isInspectionMode ? '3D X-RAY ON' : '3D X-RAY'}
        </button>

        <button
          onClick={() =>
            onChangeFloorInspectionOptions?.({
              isExplodedView: !floorInspectionOptions.isExplodedView
            })
          }
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            floorInspectionOptions.isExplodedView
              ? 'bg-white text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          {floorInspectionOptions.isExplodedView ? 'EXPLODED' : 'STACKED'}
        </button>

        {selectedFloor !== null && (
          <div className="px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
            Selected: Floor {selectedFloor}
          </div>
        )}
      </div>

      {/* Coordinate & Altitude Indicator */}
      <div className="absolute bottom-3 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-zinc-800 text-[10px] font-mono text-zinc-400">
        <span>Lat: <strong className="text-zinc-200">{centerLat.toFixed(6)}°</strong></span>
        <span>Lon: <strong className="text-zinc-200">{centerLon.toFixed(6)}°</strong></span>
        <span>Height: <strong className="text-cyan-400">{bldHeight}m</strong></span>
      </div>
    </div>
  );
};
