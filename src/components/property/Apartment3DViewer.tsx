import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2, RotateCcw, Eye, Layers } from 'lucide-react';
import { PropertyRecord, RoomItem } from '../../types/property';

interface Apartment3DViewerProps {
  property: PropertyRecord;
  onOpenFullscreen?: () => void;
  selectedRoomId?: string | null;
  onSelectRoom?: (room: RoomItem | null) => void;
}

export const Apartment3DViewer: React.FC<Apartment3DViewerProps> = ({
  property,
  onOpenFullscreen,
  selectedRoomId,
  onSelectRoom
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'unit' | 'stack'>('unit');
  const [activeRoom, setActiveRoom] = useState<RoomItem | null>(null);
  const [roomScreenCoords, setRoomScreenCoords] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 220;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);


    // 2. Camera Setup (Isometric / Axonometric perspective)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(7.5, 7.5, 7.5);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // don't go below ground
    controls.minDistance = 3.5;
    controls.maxDistance = 18;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting Setup (warm architectural soft illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfff7ed, 2.2);
    mainSun.position.set(8, 12, 6);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 1024;
    mainSun.shadow.mapSize.height = 1024;
    mainSun.shadow.camera.near = 0.5;
    mainSun.shadow.camera.far = 30;
    mainSun.shadow.camera.left = -6;
    mainSun.shadow.camera.right = 6;
    mainSun.shadow.camera.top = 6;
    mainSun.shadow.camera.bottom = -6;
    mainSun.shadow.bias = -0.0005;
    scene.add(mainSun);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.9);
    fillLight.position.set(-6, 8, -6);
    scene.add(fillLight);

    const warmInteriorPoint = new THREE.PointLight(0xfde047, 1.2, 10);
    warmInteriorPoint.position.set(0, 2.2, 0);
    scene.add(warmInteriorPoint);

    // 6. Materials
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.05
    });

    const floorWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0xc4a482,
      roughness: 0.55,
      metalness: 0.05
    });

    const floorTileMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.1
    });

    const balconyTileMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.88,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      ior: 1.5
    });

    const furnitureFabric = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      roughness: 0.8
    });

    const darkWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.4
    });

    const greenPlantMaterial = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.7
    });

    // 7. Model Container Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // ==========================================
    // BUILD ISOMETRIC ARCHITECTURAL CUTAWAY UNIT
    // ==========================================
    const unitGroup = new THREE.Group();
    unitGroup.visible = viewMode === 'unit';
    modelGroup.add(unitGroup);

    // Floor Base (Slab)
    const floorSlabGeo = new THREE.BoxGeometry(5.2, 0.2, 4.4);

    const floorSlabMesh = new THREE.Mesh(floorSlabGeo, wallMaterial);
    floorSlabMesh.position.set(0, -0.1, 0);
    floorSlabMesh.receiveShadow = true;
    unitGroup.add(floorSlabMesh);

    // Living Room Floor (light wood)
    const livingFloorGeo = new THREE.BoxGeometry(2.8, 0.02, 2.5);
    const livingFloor = new THREE.Mesh(livingFloorGeo, floorWoodMaterial);
    livingFloor.position.set(1.0, 0.01, 0.8);
    livingFloor.receiveShadow = true;
    unitGroup.add(livingFloor);

    // Bedroom Floor (warm oak wood)
    const bedFloorGeo = new THREE.BoxGeometry(2.2, 0.02, 2.4);
    const bedFloor = new THREE.Mesh(bedFloorGeo, floorWoodMaterial);
    bedFloor.position.set(-1.3, 0.01, -0.8);
    bedFloor.receiveShadow = true;
    unitGroup.add(bedFloor);

    // Kitchen Floor (porcelain tile)
    const kitchenFloorGeo = new THREE.BoxGeometry(2.8, 0.02, 1.7);
    const kitchenFloor = new THREE.Mesh(kitchenFloorGeo, floorTileMaterial);
    kitchenFloor.position.set(1.0, 0.01, -1.2);
    kitchenFloor.receiveShadow = true;
    unitGroup.add(kitchenFloor);

    // Balcony Floor (grey tiles)
    const balconyFloorGeo = new THREE.BoxGeometry(2.2, 0.02, 1.8);
    const balconyFloor = new THREE.Mesh(balconyFloorGeo, balconyTileMaterial);
    balconyFloor.position.set(-1.3, 0.01, 1.2);
    balconyFloor.receiveShadow = true;
    unitGroup.add(balconyFloor);

    // Exterior & Partition Walls (Cutaway height: 1.1m)
    const wallH = 1.1;
    const wallT = 0.12;

    const createWall = (w: number, d: number, x: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, wallH, d);
      const mesh = new THREE.Mesh(geo, wallMaterial);
      mesh.position.set(x, wallH / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      unitGroup.add(mesh);
      return mesh;
    };

    // Back Exterior Wall
    createWall(5.2, wallT, 0, -2.15);
    // Right Exterior Wall
    createWall(wallT, 4.4, 2.55, 0);
    // Front Exterior Wall (partial)
    createWall(3.0, wallT, 1.1, 2.15);
    // Left Exterior Wall (back section)
    createWall(wallT, 2.6, -2.55, -0.9);

    // Interior Divider Walls
    createWall(wallT, 2.2, -0.3, -1.05); // Divider between Bedroom and Kitchen
    createWall(2.8, wallT, 1.1, -0.4);   // Divider between Kitchen and Living
    createWall(2.3, wallT, -1.3, 0.2);   // Divider between Bedroom and Balcony

    // Balcony Glass Railing
    const glassRailingGeo = new THREE.BoxGeometry(2.2, 0.65, 0.04);
    const glassRailing = new THREE.Mesh(glassRailingGeo, glassMaterial);
    glassRailing.position.set(-1.3, 0.35, 2.15);
    unitGroup.add(glassRailing);

    const glassRailingSideGeo = new THREE.BoxGeometry(0.04, 0.65, 1.8);
    const glassRailingSide = new THREE.Mesh(glassRailingSideGeo, glassMaterial);
    glassRailingSide.position.set(-2.55, 0.35, 1.2);
    unitGroup.add(glassRailingSide);

    // ----------------------------------------
    // FURNITURE: LIVING ROOM
    // ----------------------------------------
    // Sofa (Sleek 3-seater)
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.65), furnitureFabric);
    sofaBase.position.set(1.1, 0.2, 1.55);
    sofaBase.castShadow = true;
    unitGroup.add(sofaBase);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.18), furnitureFabric);
    sofaBack.position.set(1.1, 0.55, 1.8);
    sofaBack.castShadow = true;
    unitGroup.add(sofaBack);

    // Coffee table
    const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.5), darkWoodMaterial);
    coffeeTable.position.set(1.1, 0.14, 1.0);
    coffeeTable.castShadow = true;
    unitGroup.add(coffeeTable);

    // TV Console Unit
    const tvUnit = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.25), darkWoodMaterial);
    tvUnit.position.set(1.1, 0.15, 0.35);
    tvUnit.castShadow = true;
    unitGroup.add(tvUnit);

    // Rug
    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.015, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
    );
    rug.position.set(1.1, 0.015, 1.1);
    unitGroup.add(rug);

    // ----------------------------------------
    // FURNITURE: BEDROOM
    // ----------------------------------------
    // Bed frame & headboard
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.7), darkWoodMaterial);
    bedFrame.position.set(-1.3, 0.18, -1.0);
    bedFrame.castShadow = true;
    unitGroup.add(bedFrame);

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.12), darkWoodMaterial);
    headboard.position.set(-1.3, 0.48, -1.85);
    headboard.castShadow = true;
    unitGroup.add(headboard);

    // Mattress & White Duvet
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.2, 1.55),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 })
    );
    mattress.position.set(-1.3, 0.38, -0.95);
    mattress.castShadow = true;
    unitGroup.add(mattress);

    // Pillows
    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.3), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    pillow1.position.set(-1.6, 0.5, -1.55);
    const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.3), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    pillow2.position.set(-1.0, 0.5, -1.55);
    unitGroup.add(pillow1);
    unitGroup.add(pillow2);

    // ----------------------------------------
    // FURNITURE: KITCHEN & DINING
    // ----------------------------------------
    // Kitchen L-Counter
    const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 0.5), darkWoodMaterial);
    kitchenCounter.position.set(1.35, 0.32, -1.8);
    kitchenCounter.castShadow = true;
    unitGroup.add(kitchenCounter);

    // Dining table & 4 chairs
    const diningTable = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.65), darkWoodMaterial);
    diningTable.position.set(0.6, 0.26, -1.0);
    diningTable.castShadow = true;
    unitGroup.add(diningTable);

    // Chairs around dining table
    [-0.3, 0.3].forEach((offset) => {
      const chair1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.25), furnitureFabric);
      chair1.position.set(0.6 + offset, 0.2, -0.55);
      const chair2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.25), furnitureFabric);
      chair2.position.set(0.6 + offset, 0.2, -1.45);
      unitGroup.add(chair1);
      unitGroup.add(chair2);
    });

    // ----------------------------------------
    // BALCONY PLANTS & ACCENTS
    // ----------------------------------------
    const plantPotGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.25, 12);
    const plantPot = new THREE.Mesh(plantPotGeo, darkWoodMaterial);
    plantPot.position.set(-2.2, 0.15, 1.8);
    unitGroup.add(plantPot);

    const plantLeavesGeo = new THREE.DodecahedronGeometry(0.2);
    const plantLeaves = new THREE.Mesh(plantLeavesGeo, greenPlantMaterial);
    plantLeaves.position.set(-2.2, 0.35, 1.8);
    plantLeaves.castShadow = true;
    unitGroup.add(plantLeaves);

    // ==========================================
    // BUILD VERTICAL 3D CADASTRE STACK (TOWER)
    // ==========================================
    const stackGroup = new THREE.Group();
    stackGroup.visible = viewMode === 'stack';
    modelGroup.add(stackGroup);

    // Multi-story building slices
    const totalFloors = property.totalFloors || 14;
    const activeFloorNum = property.floorNumber || 3;
    const floorHeight = 0.45;

    for (let f = 1; f <= Math.min(totalFloors, 10); f++) {
      const isTarget = f === activeFloorNum;
      const fGeo = new THREE.BoxGeometry(3.6, floorHeight * 0.75, 3.2);
      
      const fMat = isTarget
        ? new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            emissive: 0x0284c7,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
          })
        : new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            transparent: true,
            opacity: 0.4,
            wireframe: false,
            roughness: 0.6
          });

      const floorMesh = new THREE.Mesh(fGeo, fMat);
      floorMesh.position.set(0, (f - 1) * (floorHeight + 0.08) - 1.5, 0);
      stackGroup.add(floorMesh);

      // Floor wireframe border
      const edges = new THREE.EdgesGeometry(fGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: isTarget ? 0x38bdf8 : 0x475569,
        linewidth: isTarget ? 2 : 1
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.copy(floorMesh.position);
      stackGroup.add(wireframe);
    }

    // 8. Animation & Screen Coordinate Projection Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Project room positions to 2D screen coordinates for floating tags
      if (viewMode === 'unit') {
        const coords: Record<string, { x: number; y: number; visible: boolean }> = {};
        const tempVec = new THREE.Vector3();

        property.rooms.forEach((room) => {
          tempVec.set(room.position3D[0], room.position3D[1] + 0.6, room.position3D[2]);
          tempVec.project(camera);

          // Check if behind camera
          const isBehind = tempVec.z > 1;
          const x = (tempVec.x * 0.5 + 0.5) * width;
          const y = (-(tempVec.y * 0.5) + 0.5) * height;

          coords[room.id] = {
            x,
            y,
            visible: !isBehind && x >= 0 && x <= width && y >= 0 && y <= height
          };
        });

        setRoomScreenCoords(coords);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [property, viewMode]);

  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(7.5, 7.5, 7.5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleRoomClick = (room: RoomItem) => {
    setActiveRoom(activeRoom?.id === room.id ? null : room);
    onSelectRoom?.(activeRoom?.id === room.id ? null : room);
  };

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-sky-500/25 bg-slate-950/80 shadow-2xl">
      {/* 3D Canvas Mounting Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Room Hotspot Labels */}
      {viewMode === 'unit' &&
        property.rooms.map((room) => {
          const coord = roomScreenCoords[room.id];
          if (!coord || !coord.visible) return null;
          const isSelected = selectedRoomId === room.id || activeRoom?.id === room.id;

          return (
            <div
              key={room.id}
              onClick={(e) => {
                e.stopPropagation();
                handleRoomClick(room);
              }}
              style={{
                left: `${coord.x}px`,
                top: `${coord.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
              className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 z-10 flex flex-col items-center ${
                isSelected ? 'scale-110' : 'hover:scale-105 opacity-90'
              }`}
            >
              <div
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide flex items-center gap-1 backdrop-blur-md shadow-lg transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-white border border-sky-300 shadow-glow-cyan'
                    : 'bg-slate-900/80 text-sky-200 border border-sky-500/40 hover:border-sky-300 hover:text-white'
                }`}
              >
                <span>{room.name}</span>
                {isSelected && <span className="text-[10px] opacity-80">({room.areaSqM} m²)</span>}
              </div>
              {/* Pointer arrow down */}
              <div
                className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
                  isSelected ? 'border-t-sky-400' : 'border-t-slate-800'
                }`}
              />
            </div>
          );
        })}

      {/* Top Controls Overlay */}
      <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-20">
        {/* Unit vs Floor Stack Mode Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-sky-500/30">
          <button
            onClick={() => setViewMode('unit')}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
              viewMode === 'unit'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Inspect Unit Layout"
          >
            Unit
          </button>
          <button
            onClick={() => setViewMode('stack')}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
              viewMode === 'stack'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Inspect Estimated Vertical Stack"
          >
            Stack
          </button>
        </div>

        <button
          onClick={handleResetCamera}
          title="Reset 3D Camera"
          className="p-1.5 rounded-lg bg-slate-900/80 border border-sky-500/20 text-slate-300 hover:text-white hover:border-sky-400 transition-colors shadow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {onOpenFullscreen && (
          <button
            onClick={onOpenFullscreen}
            title="Inspect 3D Model in Fullscreen"
            className="p-1.5 rounded-lg bg-slate-900/80 border border-sky-500/20 text-slate-300 hover:text-white hover:border-sky-400 transition-colors shadow"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>


      {/* Bottom overlay: View Mode toggle & Hint */}
      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
        <span className="text-[10px] text-slate-400 font-mono bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800 backdrop-blur">
          Interactive 3D · Drag to rotate · Scroll to zoom
        </span>

        {activeRoom && (
          <div className="pointer-events-auto text-[11px] bg-sky-950/90 border border-sky-400/50 text-sky-200 px-2.5 py-0.5 rounded-lg font-medium backdrop-blur shadow-sm flex items-center gap-1.5">
            <span>{activeRoom.name}: {activeRoom.dimensions} ({activeRoom.areaSqM} m²)</span>
          </div>
        )}
      </div>
    </div>
  );
};
