import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { getCentroid } from './countryCentroids';
import { MAP_THEME } from './mapStyles';
import { LayerToggleState } from './MapLayerPanel';

/**
 * Maps Longitude & Latitude to 3D spherical positions on the Earth sphere of a given radius.
 */
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface InGameGlobeProps {
  theme?: 'dark' | 'light';
  layers: LayerToggleState;
}

// Satellite Object Definition for Orbital simulation
interface SatelliteSim {
  name: string;
  altitude: number;
  speed: number;
  color: number;
  tiltedAngle: number;
  mesh?: THREE.Group;
  cone?: THREE.Mesh;
  orbitLine?: THREE.Line;
  angle: number;
}

export function InGameGlobe({ theme = 'dark', layers }: InGameGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Tactical State subscriptions
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const countries = useWorldStore((s) => s.countries);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const hudMode = usePlayerStore((s) => s.hudMode);
  const targetCountryId = usePlayerStore((s) => s.selectedTargetCountryId);

  // Store action triggers
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);
  const setCountryInspector = useUIStore((s) => s.setCountryInspector);

  // Interactive control and diagnostic parameters
  const [autoLock, setAutoLock] = useState(true);
  const [showOrbitTracks, setShowOrbitTracks] = useState(true);
  const [activeDiagnosticSat, setActiveDiagnosticSat] = useState<string | null>(null);

  // Group references to inject runtime graphics from React/Zustand updates
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const sparksGroupRef = useRef<THREE.Group | null>(null);
  const satellitesGroupRef = useRef<THREE.Group | null>(null);

  // Mesh/Light refs for theme transitions
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const starPointsRef = useRef<THREE.Points | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Camera, rotation and zoom interactive targets
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ y: 1.2, x: 0.3 }); // Defaults looking towards Red Sea/India
  const targetRotation = useRef({ y: 1.2, x: 0.3 });
  
  const zoomFactor = useRef(2.5); // Current camera distance z-factor
  const targetZoomFactor = useRef(2.5);

  const isDark = theme === 'dark';

  // Satellite simulation array setup in ref to prevent instanced resets
  const satellitesRef = useRef<SatelliteSim[]>([
    { name: 'KOSMOS-2544 (RECON)', altitude: 1.28, speed: 0.009, color: 0x00ffaa, tiltedAngle: 35, angle: 0 },
    { name: 'AEGIS ORBITAL-3 (ABM)', altitude: 1.34, speed: 0.006, color: 0x00cfff, tiltedAngle: -45, angle: 2.1 },
    { name: 'NROL-44 (SIGINT ELITE)', altitude: 1.41, speed: 0.005, color: 0xff4d00, tiltedAngle: 75, angle: 4.5 },
    { name: 'CHINASAT-1C (EARLY WARN)', altitude: 1.31, speed: 0.011, color: 0xeec152, tiltedAngle: 15, angle: 1.3 },
  ]);

  // Handle auto-centering glide when a new target or player nation is focused
  useEffect(() => {
    if (!autoLock) return;

    // Focus Target country if selected, otherwise focus player country
    const focusedId = targetCountryId || playerCountryId;
    if (!focusedId) return;

    const coords = getCentroid(focusedId);
    if (coords[0] !== 0 || coords[1] !== 0) {
      const lng = coords[0];
      const lat = coords[1];

      // Convert spherical coordinates to face the camera center front viewport
      const targetY = - (lng * Math.PI) / 180 - Math.PI / 2;
      const targetX = (lat * Math.PI) / 180;

      targetRotation.current.y = targetY;
      targetRotation.current.x = Math.max(-1.0, Math.min(1.0, targetX));
      
      // Zoom camera in closer to highlight the active theater
      targetZoomFactor.current = 1.9;
    }
  }, [targetCountryId, playerCountryId, autoLock]);

  // Main UI Action - zoom buttons
  const triggerZoom = (amount: number) => {
    targetZoomFactor.current = Math.max(1.4, Math.min(3.8, targetZoomFactor.current + amount));
  };

  const triggerReset = () => {
    targetZoomFactor.current = 2.5;
    targetRotation.current = { y: 1.2, x: 0.3 };
  };

  // INITIALIZE THREE.JS WEBGL RENDERER PIPELINE
  useEffect(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth || 600;
    const H = mountRef.current.clientHeight || 500;

    // SCENE & CAMERA CONFIG
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDark ? 0x020508 : 0xf4f4f5, 0.28);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.z = zoomFactor.current;

    // RENDERER Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mountRef.current.appendChild(renderer.domElement);

    // GLOBE ROOT BUNDLE
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // BLUE MARBLE RASTER CORES
    const loader = new THREE.TextureLoader();
    const dayTex = loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const nightTex = loader.load('https://unpkg.com/three-globe/example/img/earth-night.jpg');
    const cloudsTex = loader.load('https://unpkg.com/three-globe/example/img/earth-clouds.png');

    // 1. Solid Earth Core (Day / Night Shaded)
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: dayTex,
      emissiveMap: nightTex,
      emissive: new THREE.Color(isDark ? 0x112135 : 0x1e1e1e),
      emissiveIntensity: isDark ? 1.6 : 0.35,
      specular: new THREE.Color(isDark ? 0x0d283c : 0x111111),
      shininess: isDark ? 28 : 6,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // 2. Drifting Volumetric Cloud layer
    const cloudsGeo = new THREE.SphereGeometry(1.008, 64, 64);
    const cloudsMat = new THREE.MeshPhongMaterial({
      alphaMap: cloudsTex,
      transparent: true,
      opacity: isDark ? 0.35 : 0.45,
      color: 0xffffff,
      blending: THREE.NormalBlending,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    globeGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // 3. Cybernetic Metropolis Communications Grid Overlay
    const gridGeo = new THREE.SphereGeometry(1.018, 48, 48);
    const gridMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x00cfff : 0x007399,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.08 : 0.04,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // 4. Atmosphere Glow Rim
    const atmGeo = new THREE.SphereGeometry(1.04, 32, 32);
    const atmMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x00cfff : 0x73a2bf,
      transparent: true,
      opacity: isDark ? 0.085 : 0.045,
      side: THREE.BackSide,
    });
    const atmMesh = new THREE.Mesh(atmGeo, atmMat);
    globeGroup.add(atmMesh);

    // 5. Starfield cluster (ambient deep space backdrop)
    const starCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.0 + Math.random() * 4.0;
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: isDark ? 0x6ca1bf : 0xd1d5db,
      size: 0.013,
      transparent: true,
      opacity: isDark ? 0.5 : 0.15,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);
    starPointsRef.current = starPoints;

    // SUBSYSTEM GROUPS
    const pins = new THREE.Group();
    globeGroup.add(pins);
    pinsGroupRef.current = pins;

    const arcs = new THREE.Group();
    globeGroup.add(arcs);
    arcsGroupRef.current = arcs;

    const sparks = new THREE.Group();
    globeGroup.add(sparks);
    sparksGroupRef.current = sparks;

    const satellitesGroup = new THREE.Group();
    globeGroup.add(satellitesGroup);
    satellitesGroupRef.current = satellitesGroup;

    // PROCEDURAL SATELLITE STRUCTURE INJECTION
    satellitesRef.current.forEach((sat) => {
      // Orbit Ring Visualizer
      const ringPoints: THREE.Vector3[] = [];
      const tiltRad = sat.tiltedAngle * (Math.PI / 180);
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        // Calculate orbital plane tilted around the primary Z/X axes
        const x = Math.cos(theta) * sat.altitude;
        const y = Math.sin(theta) * sat.altitude * Math.cos(tiltRad);
        const z = Math.sin(theta) * sat.altitude * Math.sin(tiltRad);
        ringPoints.push(new THREE.Vector3(x, y, z));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringMat = new THREE.LineBasicMaterial({
        color: sat.color,
        transparent: true,
        opacity: isDark ? 0.18 : 0.08,
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      satellitesGroup.add(ringLine);
      sat.orbitLine = ringLine;

      // Compound Satellite Mesh Assembly (Core body + Wings)
      const satGroup = new THREE.Group();

      // Main core chassis box
      const bodyGeo = new THREE.BoxGeometry(0.015, 0.015, 0.024);
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 90 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      satGroup.add(bodyMesh);

      // Solar Panel Left Wing (Cyan emissive solar grid)
      const panelLGeo = new THREE.PlaneGeometry(0.038, 0.012);
      const panelMat = new THREE.MeshPhongMaterial({
        color: 0x009bff,
        emissive: 0x002e66,
        side: THREE.DoubleSide,
      });
      const panelLMesh = new THREE.Mesh(panelLGeo, panelMat);
      panelLMesh.position.x = -0.024;
      satGroup.add(panelLMesh);

      // Solar Panel Right Wing
      const panelRMesh = panelLMesh.clone();
      panelRMesh.position.x = 0.024;
      satGroup.add(panelRMesh);

      // Instrument sensor / antenna lens
      const lensGeo = new THREE.CylinderGeometry(0.003, 0.005, 0.008, 8);
      const lensMat = new THREE.MeshBasicMaterial({ color: sat.color });
      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      lensMesh.position.y = -0.01;
      lensMesh.rotation.z = Math.PI / 2;
      satGroup.add(lensMesh);

      satellitesGroup.add(satGroup);
      sat.mesh = satGroup;

      // Translucent Satellite Radar sweeping sensor cone
      const coneGeo = new THREE.CylinderGeometry(0.001, 0.035, sat.altitude - 1.0, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: sat.color,
        transparent: true,
        opacity: isDark ? 0.05 : 0.022,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      satellitesGroup.add(coneMesh);
      sat.cone = coneMesh;
    });

    // SUNLIGHTS FOR EXCELLENT GLOBE RENDERING
    const sunLight = new THREE.DirectionalLight(0xfffae5, isDark ? 1.6 : 2.2);
    sunLight.position.set(5, 3.5, 5);
    scene.add(sunLight);

    const polarFilament = new THREE.DirectionalLight(isDark ? 0x00c4ff : 0x2288bb, isDark ? 0.55 : 0.95);
    polarFilament.position.set(-5, -3, -5);
    scene.add(polarFilament);

    const ambientLight = new THREE.AmbientLight(isDark ? 0x0b131c : 0xd1d5db, isDark ? 0.75 : 1.45);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // CAPTURING INTERACTIVE ROTATION MOUSE EVENTS
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;

      targetRotation.current.y += dx * 0.0045;
      targetRotation.current.x += dy * 0.0045;

      // Clamp vertical pole tilts to avoid camera invert glitch
      targetRotation.current.x = Math.max(-1.1, Math.min(1.1, targetRotation.current.x));
      lastMouse.current = { x: e.clientX, y: e.clientY };

      // Temporarily bypass auto-lock centering if the operator drags purposefully
      if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
        setAutoLock(false);
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    // TRACK ADAPTIVE SCROLL WHEEL FOR ZOOMS OR PINCHES
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoomFactor.current = Math.max(1.3, Math.min(3.8, targetZoomFactor.current + e.deltaY * 0.0015));
    };

    // INTEL SURFACE RAYCAST CLICKS (Raycasting to select countries on the sphere geometry)
    const onCanvasClick = (e: MouseEvent) => {
      if (Math.abs(deltaToX) > 4 || Math.abs(deltaToY) > 4) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const intersects = raycaster.intersectObjects(pins.children, true);
      if (intersects.length > 0) {
        // Hit detected on country tactical pin
        const hit = intersects[0].object;
        const mappedId = hit.userData?.countryId;
        if (mappedId) {
          if (hudMode === 'WAR_ROOM') {
            if (mappedId !== playerCountryId) {
              setTargetCountry(mappedId);
            }
          } else {
            setCountryInspector(mappedId);
          }
        }
      }
    };

    let deltaToX = 0, deltaToY = 0;
    const traceDown = (e: MouseEvent) => {
      deltaToX = e.clientX;
      deltaToY = e.clientY;
    };
    const traceUp = (e: MouseEvent) => {
      deltaToX = e.clientX - deltaToX;
      deltaToY = e.clientY - deltaToY;
      onCanvasClick(e);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousedown', traceDown);
    dom.addEventListener('mouseup', traceUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // RESIZE MONITOR OBSERVER
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mountRef.current);

    // Detonation tracking ages
    const activeExplosions: Array<{
      ring: THREE.Mesh;
      age: number;
      limit: number;
    }> = [];

    // ANIMATED TICKING RENDERING LOOP
    let rafId: number;
    const tick = () => {
      rafId = requestAnimationFrame(tick);

      // 1. Camera Zoom Damping
      zoomFactor.current += (targetZoomFactor.current - zoomFactor.current) * 0.12;
      camera.position.z = zoomFactor.current;

      // 2. Earth Rotation Damping
      rotation.current.y += (targetRotation.current.y - rotation.current.y) * 0.1;
      rotation.current.x += (targetRotation.current.x - rotation.current.x) * 0.1;

      // Planatary idle rotation drift if user isn't interacting actively
      if (!isDragging.current && !autoLock) {
        targetRotation.current.y += 0.0004;
      }

      globeGroup.rotation.y = rotation.current.y;
      globeGroup.rotation.x = rotation.current.x;

      // Starfield drifts at slower parallax speed
      starPoints.rotation.y = rotation.current.y * 0.12;

      // 3. Volumetric Clouds Drift
      cloudsMesh.rotation.y += 0.0003;

      // 4. Satellite Keplerian Trajectory updates
      satellitesRef.current.forEach((sat) => {
        sat.angle += sat.speed;
        const tiltRad = sat.tiltedAngle * (Math.PI / 180);

        // Position current satellite coordinates
        const x = Math.cos(sat.angle) * sat.altitude;
        const y = Math.sin(sat.angle) * sat.altitude * Math.cos(tiltRad);
        const z = Math.sin(sat.angle) * sat.altitude * Math.sin(tiltRad);

        if (sat.mesh) {
          sat.mesh.position.set(x, y, z);
          // Orient the satellite body to point its camera lens straight down to the center axis
          sat.mesh.lookAt(0, 0, 0);
          // Tilt matching solar panels
          sat.mesh.rotateY(Math.PI / 2);
        }

        // Project the downward scanning cones
        if (sat.cone) {
          // Mid position between the satellite block and the Earth point (0,0,0)
          const satPos = new THREE.Vector3(x, y, z);
          const midPos = satPos.clone().multiplyScalar(0.5);
          sat.cone.position.copy(midPos);

          // Align cone axis to point straight down to core
          sat.cone.lookAt(satPos);
          sat.cone.rotateX(Math.PI / 2);
        }
      });

      // 5. Strike arcs spark flow animations
      arcs.children.forEach((c: any) => {
        if (c.userData?.isSpark && c.userData?.curve) {
          c.userData.pct += 0.005;
          if (c.userData.pct > 1.0) {
            c.userData.pct = 0.0;
          }
          const pt = c.userData.curve.getPointAt(c.userData.pct);
          c.position.copy(pt);
        }
      });

      // 6. Impact Detonation Waves fading pulses
      for (let i = activeExplosions.length - 1; i >= 0; i--) {
        const exp = activeExplosions[i];
        exp.age += 1;
        const pct = exp.age / exp.limit;
        const s = 1.0 + pct * 0.45;
        exp.ring.scale.set(s, s, s);

        if (exp.ring.material instanceof THREE.Material) {
          exp.ring.material.opacity = 1.0 - pct;
        }

        if (exp.age >= exp.limit) {
          sparks.remove(exp.ring);
          activeExplosions.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    tick();

    // CLEANUP STAGE
    return () => {
      cancelAnimationFrame(rafId);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('mousedown', traceDown);
      dom.removeEventListener('mouseup', traceUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      resizeObserver.disconnect();
      renderer.dispose();
      try {
        mountRef.current?.removeChild(dom);
      } catch (err) {}
    };
  }, []);

  // Sync thematic graphics on background transitions
  useEffect(() => {
    const starPoints = starPointsRef.current;
    const ambientLight = ambientLightRef.current;
    const earthMesh = earthMeshRef.current;
    const cloudsMesh = cloudsMeshRef.current;
    const satellites = satellitesGroupRef.current;
    if (!starPoints || !ambientLight || !earthMesh || !cloudsMesh) return;

    if (isDark) {
      if (starPoints.material instanceof THREE.PointsMaterial) {
        starPoints.material.color.setHex(0x6ca1bf);
        starPoints.material.opacity = 0.50;
      }
      ambientLight.color.setHex(0x0b131c);
      ambientLight.intensity = 0.75;

      if (earthMesh.material instanceof THREE.MeshPhongMaterial) {
        earthMesh.material.emissive.setHex(0x112135);
        earthMesh.material.emissiveIntensity = 1.6;
        earthMesh.material.shininess = 28;
      }
      if (cloudsMesh.material instanceof THREE.MeshPhongMaterial) {
        cloudsMesh.material.opacity = 0.35;
      }
      if (satellites) {
        satellites.children.forEach((c) => {
          if (c instanceof THREE.Line && c.material instanceof THREE.LineBasicMaterial) {
            c.material.opacity = 0.18;
          }
        });
      }
    } else {
      if (starPoints.material instanceof THREE.PointsMaterial) {
        starPoints.material.color.setHex(0x9ca3af);
        starPoints.material.opacity = 0.10;
      }
      ambientLight.color.setHex(0xd1d5db);
      ambientLight.intensity = 1.45;

      if (earthMesh.material instanceof THREE.MeshPhongMaterial) {
        earthMesh.material.emissive.setHex(0x0d0d0d);
        earthMesh.material.emissiveIntensity = 0.22;
        earthMesh.material.shininess = 6;
      }
      if (cloudsMesh.material instanceof THREE.MeshPhongMaterial) {
        cloudsMesh.material.opacity = 0.45;
      }
      if (satellites) {
        satellites.children.forEach((c) => {
          if (c instanceof THREE.Line && c.material instanceof THREE.LineBasicMaterial) {
            c.material.opacity = 0.08;
          }
        });
      }
    }
  }, [theme, isDark]);

  // Orbit lines diagnostics toggling
  useEffect(() => {
    const satellites = satellitesGroupRef.current;
    if (!satellites) return;

    satellitesRef.current.forEach((sat) => {
      if (sat.orbitLine) {
        sat.orbitLine.visible = showOrbitTracks;
      }
    });
  }, [showOrbitTracks]);

  // ON-DEMAND GRAPHIC REDRAWS ACCORDING TO LIVE SIMULATION AND MULTI-SELECT OVERLAYS
  useEffect(() => {
    const pins = pinsGroupRef.current;
    const arcs = arcsGroupRef.current;
    const sparks = sparksGroupRef.current;
    if (!pins || !arcs || !sparks) return;

    // Helper to safely eject children elements
    const clearGroup = (g: THREE.Group) => {
      while (g.children.length > 0) {
        const c = g.children[0];
        g.remove(c);
        if (c instanceof THREE.Mesh || c instanceof THREE.Line) {
          c.geometry.dispose();
          if (c.material instanceof Array) {
            c.material.forEach((m) => m.dispose());
          } else {
            c.material.dispose();
          }
        }
      }
    };

    clearGroup(pins);
    clearGroup(arcs);
    clearGroup(sparks);

    // 1. POPULATE MULTI-LAYER PIN MARKERS
    Object.entries(countries).forEach(([id, c]) => {
      const coord = getCentroid(id);
      if (coord[0] === 0 && coord[1] === 0) return;

      const extCoord = latLngToVector3(coord[1], coord[0], 1.0);

      let pinColor = 0x5c7a8c;
      let pinScale = 0.012;
      let shouldRender = false;
      let isCapitalOrCore = false;

      // Handle custom alignment tags and multi-layered toggles
      if (id === playerCountryId) {
        pinColor = 0x00ffaa; // Emerald Green player HQ
        pinScale = 0.025;
        shouldRender = true;
        isCapitalOrCore = true;
      } else if (id === targetCountryId) {
        pinColor = 0xff1e46; // Target locked neon crimson
        pinScale = 0.024;
        shouldRender = true;
        isCapitalOrCore = true;
      } else if (layers.conflicts && c.atWarWith && c.atWarWith.length > 0) {
        pinColor = 0xff3b4e; // Active war regions
        pinScale = 0.018;
        shouldRender = true;
      } else if (layers.military && c.arsenal?.totalPowerRating && c.arsenal.totalPowerRating > 100) {
        pinColor = 0xf5a623; // High base power capacity points
        pinScale = 0.014;
        shouldRender = true;
      } else if (layers.nuclear && c.arsenal?.nuclearCapable) {
        pinColor = 0x00cfff; // Nuclear Launch Complexes / Alert zones
        pinScale = 0.015;
        shouldRender = true;
      } else if (layers.economic && c.economic?.gdpB && c.economic.gdpB > 200) {
        pinColor = 0x39d98a; // Financial metropolis lines
        pinScale = 0.013;
        shouldRender = true;
      } else if (layers.cyber && c.intelligence?.cyberFirewallLevel && c.intelligence.cyberFirewallLevel > 2) {
        pinColor = 0xb87fff; // Signal relays and optic junctions
        pinScale = 0.014;
        shouldRender = true;
      } else if (layers.population && c.political?.popularUnrest && c.political.popularUnrest > 45) {
        pinColor = 0xeec152; // Civil unrest centers
        pinScale = 0.014;
        shouldRender = true;
      } else if (layers.political) {
        shouldRender = true;
        if (c.allianceBlock === 'NATO') {
          pinColor = 0x0090ff;
        } else if (c.allianceBlock === 'BRICS') {
          pinColor = 0xff4d00;
        } else {
          pinColor = 0x768790;
        }
      }

      if (shouldRender) {
        // High budget rotating 3D Pyramids for critical hubs (Player, Target)
        if (isCapitalOrCore) {
          const pyrGeo = new THREE.ConeGeometry(pinScale * 1.3, pinScale * 2.8, 4);
          const pyrMat = new THREE.MeshPhongMaterial({
            color: pinColor,
            emissive: pinColor,
            emissiveIntensity: 0.8,
            shininess: 90,
          });
          const pyrMesh = new THREE.Mesh(pyrGeo, pyrMat);
          pyrMesh.position.copy(extCoord);
          
          // Align pyramid upwards flat on top of the curvature
          const originAx = new THREE.Vector3(0, 0, 0);
          const upVector = extCoord.clone().normalize();
          pyrMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), upVector);

          pyrMesh.userData = { countryId: id };
          pins.add(pyrMesh);

          // Add pulsing radar scanner loops around critical locations
          const rGeo = new THREE.RingGeometry(pinScale * 1.8, pinScale * 2.5, 16);
          const rMat = new THREE.MeshBasicMaterial({
            color: pinColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
          });
          const rMesh = new THREE.Mesh(rGeo, rMat);
          rMesh.position.copy(extCoord);
          rMesh.lookAt(originAx);
          pins.add(rMesh);

        } else {
          // Standard defense pin spheres
          const pGeo = new THREE.SphereGeometry(pinScale, 16, 16);
          const pMat = new THREE.MeshBasicMaterial({
            color: pinColor,
            transparent: true,
            opacity: 0.85,
          });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.position.copy(extCoord);
          pMesh.userData = { countryId: id };
          pins.add(pMesh);
        }
      }
    });

    // 2. BALLISTIC ARC MODELS (Traversing missile trails)
    const displayStrikes = layers.conflicts || layers.nuclear || layers.political;
    if (displayStrikes) {
      activeStrikes.forEach((strike) => {
        const srcCent = getCentroid(strike.sourceCountryId);
        const tgtCent = getCentroid(strike.targetCountryId);

        if (srcCent[0] === 0 || tgtCent[0] === 0) return;

        const pStart = latLngToVector3(srcCent[1], srcCent[0], 1.0);
        const pEnd = latLngToVector3(tgtCent[1], tgtCent[0], 1.0);

        // Generate dynamic curves over the spherical terrain
        const midPoint = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
        const dist = pStart.distanceTo(pEnd);
        const arcHeight = Math.min(0.45, Math.max(0.12, dist * 0.25));
        const pMid = midPoint.normalize().multiplyScalar(1.0 + arcHeight);

        const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
        const pts = curve.getPoints(36);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);

        const isNuke = strike.warheadYieldMT && strike.warheadYieldMT > 0;
        const trailColor = isNuke ? 0x00cfff : 0xff3b4e;

        const arcMat = new THREE.LineBasicMaterial({
          color: trailColor,
          transparent: true,
          opacity: strike.status === 'IN_FLIGHT' ? 0.8 : 0.18,
        });

        const line = new THREE.Line(arcGeo, arcMat);
        arcs.add(line);

        // Render traveling projectile plasma heads
        if (strike.status === 'IN_FLIGHT') {
          const phGeo = new THREE.SphereGeometry(0.012, 8, 8);
          const phMat = new THREE.MeshBasicMaterial({
            color: trailColor,
            transparent: true,
            opacity: 0.95,
          });
          const phMesh = new THREE.Mesh(phGeo, phMat);
          phMesh.userData = {
            isSpark: true,
            curve,
            pct: Math.min(0.99, Math.max(0.01, strike.progressPct / 100)),
          };
          const startPos = curve.getPointAt(phMesh.userData.pct);
          phMesh.position.copy(startPos);
          arcs.add(phMesh);
        }

        // Add fading shock rings to Completed launch impacts
        if (strike.status === 'IMPACT' || strike.status === 'INTERCEPTED') {
          const pulseColor = strike.status === 'INTERCEPTED' ? 0x00ffaa : 0xff1e46;
          const shGeo = new THREE.RingGeometry(0.02, 0.04, 16);
          const shMat = new THREE.MeshBasicMaterial({
            color: pulseColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          });
          const shMesh = new THREE.Mesh(shGeo, shMat);
          shMesh.position.copy(pEnd);
          shMesh.lookAt(0, 0, 0);
          sparks.add(shMesh);
        }
      });
    }

    // 3. DRAW TETHERING LINKS FOR ENGAGEMENTS
    if (layers.conflicts && playerCountryId && targetCountryId) {
      const srcCent = getCentroid(playerCountryId);
      const tgtCent = getCentroid(targetCountryId);

      if (srcCent[0] !== 0 && tgtCent[0] !== 0) {
        const pStart = latLngToVector3(srcCent[1], srcCent[0], 1.01);
        const pEnd = latLngToVector3(tgtCent[1], tgtCent[0], 1.01);

        const tetherGeo = new THREE.BufferGeometry().setFromPoints([pStart, pEnd]);
        const tetherMat = new THREE.LineDashedMaterial({
          color: 0xff4d00,
          dashSize: 0.02,
          gapSize: 0.015,
        });
        const line = new THREE.Line(tetherGeo, tetherMat);
        line.computeLineDistances();
        arcs.add(line);
      }
    }

  }, [activeStrikes, countries, playerCountryId, targetCountryId, theme, layers]);

  return (
    <div className="relative w-full h-full" id="tactical-3d-sphere-monitor">
      {/* WebGL Mount Surface */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center, #050d14 0%, #010305 100%)'
            : 'radial-gradient(ellipse at center, #ffffff 0%, #f4f4f7 100%)',
        }}
      />

      {/* FLOATING TACTICAL INSTRUCTIONAL DIAGNOSTIC OVERLAY PANEL */}
      <div className={`absolute top-16 left-3 z-[115] w-[180px] p-2.5 border backdrop-blur-md rounded-[1px] flex flex-col gap-2 font-mono text-[8px] transition-all duration-200 select-none
        ${isDark
          ? 'bg-slate-950/85 border-cyan-950/60 text-cyan-400'
          : 'bg-white/95 border-zinc-300 text-zinc-800 shadow-md'
        }
      `}>
        <div className={`border-b pb-1 flex justify-between items-center ${isDark ? 'border-cyan-950/50' : 'border-zinc-200'}`}>
          <span className="font-bold tracking-wider uppercase">SATELLITE INTEL FEED</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-700'}`} />
        </div>

        {/* Orbit Tracks Diagnostic Control */}
        <div className="flex items-center justify-between">
          <span>SHOW ORBIT TRACKS:</span>
          <button
            onClick={() => setShowOrbitTracks(!showOrbitTracks)}
            className={`px-1.5 py-0.5 rounded-[1px] font-bold border transition-colors
              ${showOrbitTracks
                ? (isDark ? 'bg-cyan-950/30 border-cyan-400/80 text-cyan-400' : 'bg-cyan-100 border-cyan-600 text-cyan-800')
                : (isDark ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-zinc-200 border-zinc-300 text-zinc-400')
              }
            `}
          >
            {showOrbitTracks ? 'ACTIVE' : 'OFF'}
          </button>
        </div>

        {/* Diagnostic satellite tracking list */}
        <div className="flex flex-col gap-1 mt-1">
          <span className={`font-bold ${isDark ? 'text-slate-500' : 'text-zinc-500'} text-[7px] uppercase`}>Active Constellation</span>
          {satellitesRef.current.map((sat) => {
            const isDiagnosed = activeDiagnosticSat === sat.name;
            return (
              <button
                key={sat.name}
                onClick={() => {
                  setActiveDiagnosticSat(isDiagnosed ? null : sat.name);
                  // Glow selected line
                  if (sat.orbitLine && sat.orbitLine.material instanceof THREE.LineBasicMaterial) {
                    sat.orbitLine.material.opacity = isDiagnosed ? (isDark ? 0.18 : 0.08) : 0.75;
                  }
                }}
                className={`text-left text-[7px] font-sans px-1 py-0.5 rounded-[1px] transition-colors border border-transparent hover:border-current/10 flex justify-between items-center
                  ${isDiagnosed 
                    ? (isDark ? 'bg-cyan-500/10 text-cyan-300 font-bold' : 'bg-cyan-100 text-cyan-800 font-bold') 
                    : (isDark ? 'text-slate-400' : 'text-zinc-650')
                  }
                `}
              >
                <span>{sat.name}</span>
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#' + sat.color.toString(16) }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM CENTER DYNAMIC INTERACTION CONSOLE KEYS */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[115] flex gap-1 bg-current/5 p-1 backdrop-blur-md rounded-[2px] select-none border border-current/10">
        <button
          onClick={() => setAutoLock(!autoLock)}
          className={`font-mono text-[9px] font-bold px-2 py-1 rounded-[1px] transition-all border
            ${autoLock
              ? (isDark ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.2)]' : 'bg-cyan-700 text-white border-cyan-800')
              : (isDark ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300' : 'bg-zinc-200 border-zinc-300 text-zinc-500')
            }
          `}
          title="Toggles centering cameras over selected theaters automatically"
        >
          🛰 AUTO-TRACK: {autoLock ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={() => triggerZoom(-0.25)}
          className={`font-mono text-[9px] font-bold px-2 py-1 rounded-[1px] transition-all border
            ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-zinc-200 border-zinc-300 text-zinc-700 hover:bg-zinc-300'}
          `}
        >
          🔍 ZOOM IN
        </button>

        <button
          onClick={() => triggerZoom(0.25)}
          className={`font-mono text-[9px] font-bold px-2 py-1 rounded-[1px] transition-all border
            ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-zinc-200 border-zinc-300 text-zinc-700 hover:bg-zinc-300'}
          `}
        >
          🔍 ZOOM OUT
        </button>

        <button
          onClick={triggerReset}
          className={`font-mono text-[9px] font-bold px-2 py-1 rounded-[1px] transition-all border
            ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-zinc-200 border-zinc-300 text-zinc-700 hover:bg-zinc-300'}
          `}
        >
          🔄 RESET VIEW
        </button>
      </div>

      {/* SATELLITE HUD WATERMARKS & GRATICULE LAYOUT */}
      <div className={`absolute inset-0 pointer-events-none z-[10] border flex flex-col justify-between p-4 select-none transition-colors duration-200
        ${isDark ? 'border-cyan-950/25 mix-blend-screen' : 'border-zinc-300/40 mix-blend-multiply'}
      `}>
        <div className={`flex justify-between items-start font-mono text-[8.5px] ${isDark ? 'text-cyan-600/70' : 'text-zinc-500/80'}`}>
          <div className="flex flex-col gap-0.5">
            <span>ORBIT RANGE: DEEP GEO-SYNCHRONOUS APEX</span>
            <span>ALTITUDE DETECTOR: 35,786 KM STATS</span>
          </div>
          <div className="text-right">
            <span>BEARING ORIENTATION: AUTO-ROTATION LOCK</span>
            <span>SWEEP DETECTORS: ACTIVE / G-55 SCAN</span>
          </div>
        </div>

        {/* Circular Graticule overlay */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center items-center">
          <div className={`w-[360px] h-[360px] border rounded-full flex justify-center items-center relative animate-pulse
            ${isDark ? 'border-cyan-500/5' : 'border-zinc-300/20'}
          `}>
            <div className={`w-[200px] h-[200px] border rounded-full flex justify-center items-center relative
              ${isDark ? 'border-cyan-500/10' : 'border-zinc-300/40'}
            `}>
              <span className={`absolute w-5 h-[1.5px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isDark ? 'bg-cyan-400/35' : 'bg-zinc-400/50'}`} />
              <span className={`absolute w-[1.5px] h-5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isDark ? 'bg-cyan-400/35' : 'bg-zinc-400/50'}`} />
            </div>
          </div>
        </div>

        <div className={`flex justify-between items-end font-mono text-[8.5px] ${isDark ? 'text-cyan-600/70' : 'text-zinc-500/80'}`}>
          <span>VECTOR STATUS: OPERATIVE 3D SPATIAL MAP</span>
          <span>INTELLIGENCE CONSOLE FEED // v5.4 INTEL SURFACE</span>
        </div>
      </div>
    </div>
  );
}

export default InGameGlobe;
