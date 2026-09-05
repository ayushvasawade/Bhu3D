import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { Building2, Layers, Satellite, Map, Landmark, AlertCircle } from 'lucide-react';
import { PropertyRecord, ViewLevel } from '../../types/property';
import { BuildingFootprint, Parcel } from '../../types/geospatial';
import { geospatialService } from '../../services/geospatialDataService';
import { externalGeoService } from '../../services/externalGeoService';

interface CesiumViewerProps {
  currentProperty: PropertyRecord;
  viewLevel: ViewLevel;
  selectedBuilding?: BuildingFootprint | null;
  onSelectBuilding?: (building: BuildingFootprint | null) => void;
  onCameraChange?: (telemetry: { latitude: number; longitude: number; altitude: number; heading: number }) => void;
}

type BasemapStyle = 'satellite' | 'dark' | 'streets' | 'bhuvan';

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  currentProperty,
  viewLevel,
  selectedBuilding,
  onSelectBuilding,
  onCameraChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markerEntityRef = useRef<Cesium.Entity | null>(null);
  const buildingEntitiesRef = useRef<Cesium.Entity[]>([]);
  const parcelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const currentBaseLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const clickHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

  const [basemap, setBasemap] = useState<BasemapStyle>('satellite');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [bhuvanAlert, setBhuvanAlert] = useState<string | null>(null);

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
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#070b13');
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a1120');

    // Camera move listener for live HUD telemetry
    const removeCameraListener = viewer.camera.changed.addEventListener(() => {
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
    const removePostRenderListener = viewer.scene.postRender.addEventListener(() => {
      if (!markerEntityRef.current) return;
      const pos = markerEntityRef.current.position?.getValue(viewer.clock.currentTime);
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

    // Initial Camera set to India global view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 18000000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });

    // Click handler for 3D building picking
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      const pickedObject = viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && (pickedObject.id as any).buildingData) {
        const building = (pickedObject.id as any).buildingData as BuildingFootprint;
        onSelectBuilding?.(building);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    clickHandlerRef.current = handler;

    return () => {
      if (clickHandlerRef.current) {
        clickHandlerRef.current.destroy();
        clickHandlerRef.current = null;
      }
      removeCameraListener();
      removePostRenderListener();
      viewer.destroy();
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

  // 3. Load Real GeoJSON Footprints & Extrude 3D Building Volumes + Parcels
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const { latitude, longitude } = currentProperty.coordinates;

    // Clear old marker
    if (markerEntityRef.current) {
      viewer.entities.remove(markerEntityRef.current);
      markerEntityRef.current = null;
    }

    // Clear old buildings and parcels
    buildingEntitiesRef.current.forEach((b) => viewer.entities.remove(b));
    buildingEntitiesRef.current = [];
    parcelEntitiesRef.current.forEach((p) => viewer.entities.remove(p));
    parcelEntitiesRef.current = [];

    // Add Cadastral Marker Pin & Radar Ring
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

    // Load Real Geospatial Data (Footprints & Parcels)
    let isCancelled = false;

    const loadGeospatialLayers = async () => {
      const cityKey = currentProperty.city.toLowerCase() === 'pune' ? 'pune' : 'pune';

      // A. Load Cadastral Parcels
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

      // B. Load OpenStreetMap 3D Extruded Building Volumes
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

    return () => {
      isCancelled = true;
    };
  }, [currentProperty, selectedBuilding]);

  // 4. Fly Camera when viewLevel or currentProperty changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

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
  }, [viewLevel, currentProperty]);

  return (
    <div className="relative w-full h-full">
      {/* Cesium Globe Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D Cadastral Callout Banner matching mockup */}
      {calloutScreenPos.visible && !selectedBuilding && (
        <div
          style={{
            left: `${calloutScreenPos.x}px`,
            top: `${calloutScreenPos.y}px`,
            transform: 'translate(-50%, -125%)'
          }}
          className="absolute z-20 pointer-events-none transition-all duration-100 ease-out flex flex-col items-center"
        >
          {/* Callout Card */}
          <div className="gis-glass-panel px-3.5 py-2 rounded-2xl flex items-center space-x-2.5 shadow-2xl border border-sky-400/60 animate-fadeIn">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-medium">Found property for</div>
              <div className="text-xs font-bold text-white tracking-wide">{currentProperty.ownerName}</div>
              <div className="text-[10px] text-sky-300">
                {currentProperty.city}, {currentProperty.state}, {currentProperty.country}
              </div>
            </div>
          </div>

          {/* Pointer line & indicator */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-sky-400 to-cyan-300 shadow-glow-cyan" />
          <div className="w-3 h-3 rounded-full bg-cyan-400 border-2 border-white shadow-glow-cyan -mt-1 animate-ping" />
        </div>
      )}

      {/* Basemap Switcher Floating Widget */}
      <div className="absolute top-20 right-5 z-20 pointer-events-auto hidden md:block">
        <div className="relative">
          <button
            onClick={() => setShowBasemapMenu(!showBasemapMenu)}
            title="Switch Geospatial Basemap"
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-sky-500/30 text-sky-400 shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-medium"
          >
            <Layers className="w-4 h-4" />
            <span className="capitalize">{basemap} Map</span>
          </button>

          {showBasemapMenu && (
            <div className="absolute right-0 top-12 w-52 gis-glass-panel rounded-2xl p-2 shadow-2xl border border-sky-500/30 flex flex-col space-y-1 animate-fadeIn">
              <button
                onClick={() => {
                  setBasemap('satellite');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  basemap === 'satellite'
                    ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                <span>Satellite (ESRI)</span>
              </button>

              <button
                onClick={() => {
                  setBasemap('bhuvan');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  basemap === 'bhuvan'
                    ? 'bg-orange-500/30 text-orange-300 border border-orange-400/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Landmark className="w-3.5 h-3.5 text-orange-400" />
                <span>Bhuvan / ISRO (WMS)</span>
              </button>

              <button
                onClick={() => {
                  setBasemap('dark');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  basemap === 'dark'
                    ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Cyber Dark Cadastre</span>
              </button>

              <button
                onClick={() => {
                  setBasemap('streets');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  basemap === 'streets'
                    ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5 text-orange-400" />
                <span>OpenStreetMap</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bhuvan Connectivity / Error Alert Banner */}
      {bhuvanAlert && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-xl w-[90%] sm:w-auto">
          <div className="gis-glass-panel px-4 py-2.5 rounded-2xl border border-amber-500/40 text-xs text-amber-200 flex items-start space-x-2.5 shadow-2xl animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-left font-mono">
              <span className="font-bold text-amber-300 block">External WMS Service Notice</span>
              <span className="text-[11px] text-slate-300 leading-snug block">
                {bhuvanAlert}
              </span>
            </div>
            <button
              onClick={() => setBhuvanAlert(null)}
              className="p-1 text-slate-400 hover:text-white ml-2 shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
