import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import SunCalc from 'suncalc';
import { useWorldStore } from '../../store/worldStore';
import { useNuclearStore } from '../../store/nuclearStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { useDefconStore } from '../../store/defconStore';
import { SEEDED_HOTSPOTS } from '../../data/hotspots';
import { getCentroid } from './countryCentroids';
import { MAP_THEME } from './mapStyles';
import { LayerToggleState } from './MapLayerPanel';
import { useMapSync } from './mapSync';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { useUnitStore } from '../../store/unitStore';
import { latLonToVec3 } from '../intro/GlobeMarkers';
import {
  MilitaryLoader,
  WakeSystemManager,
  BubbleSystemManager,
  RocketExhaustManager,
  createProceduralCarrier,
  createProceduralSubmarine,
  createProceduralFighter,
  createProceduralMissile
} from './MilitaryAsset3D';

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

/**
 * Procedurally generates a glowing, smoky high-fidelity mushroom cloud canvas texture
 */
function createMushroomTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);

  // Flame glow effect configuration
  ctx.shadowColor = 'rgba(255, 69, 0, 0.45)';
  ctx.shadowBlur = 8;

  // Render smoke-and-fire core column stem
  const stemGrad = ctx.createLinearGradient(64, 40, 64, 120);
  stemGrad.addColorStop(0.0, '#555555');
  stemGrad.addColorStop(0.3, '#333333');
  stemGrad.addColorStop(0.65, '#ff3b21'); // boiling thermal core
  stemGrad.addColorStop(0.85, '#ff7711'); // burning ignition flare
  stemGrad.addColorStop(1.0, '#111111');
  ctx.fillStyle = stemGrad;

  ctx.beginPath();
  ctx.moveTo(58, 120);
  ctx.quadraticCurveTo(60, 65, 54, 40);
  ctx.lineTo(74, 40);
  ctx.quadraticCurveTo(68, 65, 70, 120);
  ctx.closePath();
  ctx.fill();

  // Draw mushroom-shaped billow caps (layered smoky circles)
  ctx.shadowBlur = 12;
  const capGrad = ctx.createRadialGradient(64, 32, 5, 64, 32, 40);
  capGrad.addColorStop(0.0, '#ffcca8'); // intense explosion white-hot light
  capGrad.addColorStop(0.2, '#de4a1d'); // hot expansion ring
  capGrad.addColorStop(0.5, '#404040'); // dark condensing ash
  capGrad.addColorStop(1.0, '#1a1a1a'); // cooled external soot
  ctx.fillStyle = capGrad;

  // Main high-altitude expansion bubble
  ctx.beginPath();
  ctx.arc(64, 32, 25, 0, Math.PI * 2);
  ctx.fill();

  // Secondary cloud cushions
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.arc(44, 36, 15, 0, Math.PI * 2);
  ctx.arc(84, 36, 15, 0, Math.PI * 2);
  ctx.arc(54, 20, 17, 0, Math.PI * 2);
  ctx.arc(74, 20, 17, 0, Math.PI * 2);
  ctx.fill();

  // Ambient flame overlay highlights
  ctx.fillStyle = 'rgba(255, 80, 20, 0.32)';
  ctx.beginPath();
  ctx.arc(64, 32, 16, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
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

  // Connect cleanly to our Unified Map Integration Synchronizer (100% Shared Truth)
  const { mapState, focusCountry } = useMapSync(layers, theme);

  // Unpack synchronized states
  const countries = useWorldStore((s) => s.countries);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const selectedHotspotId = useUIStore((s) => s.selectedHotspotId);
  const playerCountryId = mapState.playerCountryId;
  const hudMode = mapState.activeHudMode;
  const targetCountryId = mapState.targetCountryId;
  const currentDefcon = useDefconStore((s) => s.currentDefconLevel);

  // Track actions
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);
  const setCountryInspector = useUIStore((s) => s.setCountryInspector);
  const isDossierOpen = useUIStore((s) => s.countryInspectorId !== null);

  // Interactive control and diagnostic parameters
  const [autoLock, setAutoLock] = useState(true);
  const [showOrbitTracks, setShowOrbitTracks] = useState(true);
  const [activeDiagnosticSat, setActiveDiagnosticSat] = useState<string | null>(null);

  // Group references to inject runtime graphics from React/Zustand updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const sparksGroupRef = useRef<THREE.Group | null>(null);
  const satellitesGroupRef = useRef<THREE.Group | null>(null);
  const militaryGroupRef = useRef<THREE.Group | null>(null);
  
  // Shared WebGL resources cache for major 3D hotspot graphics performance
  const sharedOctahedronGeoRef = useRef<THREE.OctahedronGeometry | null>(null);
  const sharedSelRingGeoRef = useRef<THREE.RingGeometry | null>(null);
  const sharedUnselRingGeoRef = useRef<THREE.RingGeometry | null>(null);
  const sharedMatsRef = useRef<Record<string, THREE.Material>>({});

  // Live trackers for luxury military presentations
  const loaderRef = useRef<MilitaryLoader | null>(null);
  const wakesRef = useRef<Record<string, WakeSystemManager>>({});
  const bubblesRef = useRef<Record<string, BubbleSystemManager>>({});
  const exhaustRef = useRef<Record<string, RocketExhaustManager>>({});
  const prevPositionsRef = useRef<Record<string, THREE.Vector3>>({});
  const subAltitudesRef = useRef<Record<string, number>>({});
  const jetRollsRef = useRef<Record<string, number>>({});
  const escortsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const units = useUnitStore((s) => s.units);

  // Mesh/Light refs for theme transitions
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const starPointsRef = useRef<THREE.Points | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  const atmMeshRef = useRef<THREE.Mesh | null>(null);

  // Camera, rotation and zoom interactive targets
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ y: 1.2, x: 0.3 }); // Defaults looking towards Red Sea/India
  const targetRotation = useRef({ y: 1.2, x: 0.3 });
  
  const zoomFactor = useRef(2.5); // Current camera distance z-factor
  const targetZoomFactor = useRef(2.5);

  const layersRef = useRef(layers);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  const defconRef = useRef(currentDefcon);
  useEffect(() => {
    defconRef.current = currentDefcon;
  }, [currentDefcon]);

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
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(isDark ? 0x020508 : 0xf4f4f5, 0.28);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.z = zoomFactor.current;

    // RENDERER Setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.2));
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);

    // GLOBE ROOT BUNDLE
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // --- RESILIENT, NON-BLOCKING ASYNCHRONOUS TEXTURE PIPELINE ---
    const loadTextureWithFallback = (localPath: string, fallbacks: string[]) => {
      const tex = new THREE.Texture();
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.anisotropy = maxAnisotropy;

      const img = new Image();
      const urls = [localPath, ...fallbacks];
      let attemptIndex = 0;

      const tryLoadNext = () => {
        if (attemptIndex >= urls.length) {
          console.warn(`[GLOBE-INGAME] All attempts failed for texture: ${localPath}`);
          return;
        }
        const currentUrl = urls[attemptIndex];
        attemptIndex++;
        
        const isLocal = !currentUrl.startsWith('http') && !currentUrl.startsWith('//');
        img.crossOrigin = isLocal ? undefined : 'anonymous';
        img.src = currentUrl;
      };

      img.onload = () => {
        tex.image = img;
        tex.needsUpdate = true;
        console.log(`[GLOBE-INGAME] ✅ Loaded texture: ${img.src}`);
      };

      img.onerror = () => {
        console.warn(`[GLOBE-INGAME] ⚠ Load failed for: ${img.src}. Trying fallback...`);
        tryLoadNext();
      };

      tryLoadNext();
      return tex;
    };

    const dayTex = loadTextureWithFallback('/textures/earth-blue-marble.jpg', [
      'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg',
      'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
      'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg'
    ]);
    const nightTex = loadTextureWithFallback('/textures/earth-night.jpg', [
      'https://eoimages.gsfc.nasa.gov/images/imagerecords/55000/55167/earth_lights_lrg.jpg',
      'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg',
      'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-night.jpg'
    ]);

    // 1. Solid Earth Core (Day / Night Shaded)
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
          uDayTex: { value: dayTex },
          uNightTex: { value: nightTex },
          uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
          uScarCenters: { value: [] },
          uScarRadii: { value: [] },
          uScarCount: { value: 0 },
          uEmissiveIntensity: { value: isDark ? 1.6 : 0.35 }
        }
      ]),
      lights: true,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vModelPosition;
        void main() {
          vUv = uv;
          vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vModelPosition = vec3(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uDayTex;
        uniform sampler2D uNightTex;
        uniform vec3 uSunDirection;
        uniform vec3 uScarCenters[15];
        uniform float uScarRadii[15];
        uniform int uScarCount;
        uniform float uEmissiveIntensity;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vModelPosition;
        
        void main() {
          vec3 dayColor = texture2D(uDayTex, vUv).rgb;
          vec3 nightColor = texture2D(uNightTex, vUv).rgb * uEmissiveIntensity;
          
          float intensity = dot(vNormal, uSunDirection);
          float blend = smoothstep(-0.2, 0.2, intensity);
          
          vec3 baseColor = mix(nightColor, dayColor, blend);
          
          float darkFactor = 1.0;
          vec3 normPos = normalize(vModelPosition);
          for(int i = 0; i < 15; i++) {
            if (i >= uScarCount) break;
            float d = distance(normPos, uScarCenters[i]);
            float r = uScarRadii[i];
            if (d < r) {
              float t = smoothstep(r, r * 0.4, d);
              darkFactor *= mix(1.0, 0.12, t);
            }
          }
          gl_FragColor = vec4(baseColor * darkFactor, 1.0);
        }
      `
    });

    earthMat.userData = {
      uScarCenters: earthMat.uniforms.uScarCenters,
      uScarRadii: earthMat.uniforms.uScarRadii,
      uScarCount: earthMat.uniforms.uScarCount
    };

    // Load initial scars synchronously
    const initialScars = useNuclearStore.getState().nuclearScars || [];
    const initCenters: THREE.Vector3[] = [];
    const initRadii: number[] = [];
    initialScars.forEach((scar) => {
      initCenters.push(latLngToVector3(scar.lat, scar.lon, 1.0));
      initRadii.push(scar.radius);
    });
    while (initCenters.length < 15) {
      initCenters.push(new THREE.Vector3(0, 0, 0));
      initRadii.push(0.0);
    }
    earthMat.userData.uScarCenters.value = initCenters;
    earthMat.userData.uScarRadii.value = initRadii;
    earthMat.userData.uScarCount.value = Math.min(15, initialScars.length);

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

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
      color: 0x00cfff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const atmMesh = new THREE.Mesh(atmGeo, atmMat);
    globeGroup.add(atmMesh);
    atmMeshRef.current = atmMesh;

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

    const military = new THREE.Group();
    globeGroup.add(military);
    militaryGroupRef.current = military;

    loaderRef.current = new MilitaryLoader();

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

      // Ground footprint ring tracking the satellite projection on outer crust
      const footprintGeo = new THREE.RingGeometry(0.016, 0.034, 32);
      const footprintMat = new THREE.MeshBasicMaterial({
        color: sat.color,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const footprintMesh = new THREE.Mesh(footprintGeo, footprintMat);
      satellitesGroup.add(footprintMesh);
      sat.footprint = footprintMesh;
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
        // Hit detected on country tactical pin or hotspot
        const hit = intersects[0].object;
        const mappedId = hit.userData?.countryId;
        const hotspotId = hit.userData?.hotspotId;
        const isHotspot = hit.userData?.isHotspot;

        if (isHotspot && hotspotId) {
          useLinkedAnalysisStore.getState().selectCountry(mappedId);
          useUIStore.getState().setSelectedHotspot(hotspotId, mappedId);
        } else if (mappedId) {
          useLinkedAnalysisStore.getState().selectCountry(mappedId);
          useUIStore.getState().setSelectedHotspot(null);
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
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mountRef.current);

    // Detonation tracking ages
    const activeExplosions: Array<{
      ring: THREE.Mesh;
      age: number;
      limit: number;
    }> = [];

    // ACTIVE HIGH-FIDELITY TAC-NUCLEAR SHOCKWAVES & MUSHROOM CLOUDS
    const activeNuclearVFX: Array<{
      shockwave: THREE.Mesh | null;
      mushroomSprite: THREE.Sprite | null;
      targetVec: THREE.Vector3;
      age: number;
      shockwaveMaxAge: number;
      mushroomMaxAge: number;
      mushroomLingerAge: number;
    }> = [];

    const handleNuclearImpactEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lon, yieldMT } = customEvent.detail;
      const targetVec = latLngToVector3(lat, lon, 1.0);

      // A. SHOCKWAVE WIREFRAME SPHERE GEOMETRY
      const shGeo = new THREE.SphereGeometry(0.001, 32, 32);
      const shMat = new THREE.MeshBasicMaterial({
        color: 0xff3b4e,
        wireframe: true,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
      });
      const shMesh = new THREE.Mesh(shGeo, shMat);
      shMesh.position.copy(targetVec);
      globeGroup.add(shMesh);

      // B. MUSHROOM CLOUD PROCEDURAL CANVAS SPRITE
      const spriteMat = new THREE.SpriteMaterial({
        map: createMushroomTexture(),
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const sprite = new THREE.Sprite(spriteMat);
      const spritePos = targetVec.clone().multiplyScalar(1.002);
      sprite.position.copy(spritePos);
      sprite.scale.set(0, 0, 0);
      globeGroup.add(sprite);

      activeNuclearVFX.push({
        shockwave: shMesh,
        mushroomSprite: sprite,
        targetVec: targetVec.clone(),
        age: 0,
        shockwaveMaxAge: 90, // 1500ms at 60fps
        mushroomMaxAge: 180, // 3000ms at 60fps
        mushroomLingerAge: 240, // remains full scale until frame 240, then fades
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('nuclear-impact', handleNuclearImpactEvent);
    }

    const unsubscribeNuclearEvents = useWorldStore.subscribe((state, prevState) => {
       const newCount = state.globalEventLog.length - prevState.globalEventLog.length;
       if (newCount > 0) {
          const newEvents = state.globalEventLog.slice(0, newCount); // Logs are inserted at beginning
          newEvents.forEach(evt => {
             if (evt.text.toLowerCase().includes('nuclear detonation') || evt.text.toLowerCase().includes('thermonuclear')) {
                // Approximate random location for global event if needed, but the actual window event handled it
             }
          });
       }
    });

    // Subscribe to useNuclearStore to sync physical scars dynamically in our custom shader uniforms
    const unsubscribeNuclear = useNuclearStore.subscribe((state) => {
      const activeScars = state.nuclearScars || [];
      const centers: THREE.Vector3[] = [];
      const radii: number[] = [];

      activeScars.forEach((scar, idx) => {
        if (idx >= 15) return;
        centers.push(latLngToVector3(scar.lat, scar.lon, 1.0));
        radii.push(scar.radius);
      });

      while (centers.length < 15) {
        centers.push(new THREE.Vector3(0, 0, 0));
        radii.push(0.0);
      }

      if (earthMat && earthMat.userData && earthMat.userData.uScarCenters) {
        earthMat.userData.uScarCenters.value = centers;
        earthMat.userData.uScarRadii.value = radii;
        earthMat.userData.uScarCount.value = Math.min(15, activeScars.length);
      }
    });

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

      // SunCalc day/night terminator blend
      if (earthMeshRef.current && earthMeshRef.current.material instanceof THREE.ShaderMaterial) {
        const now = new Date();
        const pos = SunCalc.getPosition(now, 0, 0); 
        const sunLat = pos.altitude * (180 / Math.PI);
        const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
        const sunLng = (12 - utcHours) * 15;
        const sunDir = latLngToVector3(sunLat, sunLng, 1.0).normalize();
        earthMeshRef.current.material.uniforms.uSunDirection.value.copy(sunDir);
      }

      // Starfield drifts at slower parallax speed
      starPoints.rotation.y = rotation.current.y * 0.12;

      // 3. Volumetric Clouds Drift has been disabled per user request to simplify and polish the renders.

      // 4. Satellite Keplerian Trajectory updates
      satellitesRef.current.forEach((sat) => {
        sat.angle += sat.speed;
        const tiltRad = sat.tiltedAngle * (Math.PI / 180);

        // Position current satellite coordinates
        const x = Math.cos(sat.angle) * sat.altitude;
        const y = Math.sin(sat.angle) * sat.altitude * Math.cos(tiltRad);
        const z = Math.sin(sat.angle) * sat.altitude * Math.sin(tiltRad);

        const satPos = new THREE.Vector3(x, y, z);

        if (sat.mesh) {
          sat.mesh.position.copy(satPos);
          // Orient the satellite body to point its camera lens straight down to the center axis
          sat.mesh.lookAt(0, 0, 0);
          // Tilt matching solar panels
          sat.mesh.rotateY(Math.PI / 2);
        }

        // Project the downward scanning cones according to the ISR layer toggle
        const isrEnabled = !!layersRef.current.isr;
        if (sat.cone) {
          sat.cone.visible = isrEnabled;
          // Mid position between the satellite block and the Earth point (0,0,0)
          const midPos = satPos.clone().multiplyScalar(0.5);
          sat.cone.position.copy(midPos);

          // Align cone axis to point straight down to core
          sat.cone.lookAt(satPos);
          sat.cone.rotateX(Math.PI / 2);
        }

        // Position ground footprint tracking rings directly on the sphere crust
        if (sat.footprint) {
          sat.footprint.visible = isrEnabled;
          const groundPos = satPos.clone().normalize().multiplyScalar(1.002);
          sat.footprint.position.copy(groundPos);
          sat.footprint.lookAt(0, 0, 0);
          if (sat.footprint.material instanceof THREE.MeshBasicMaterial) {
            sat.footprint.material.opacity = isrEnabled ? (0.25 + Math.sin(Date.now() * 0.004) * 0.1) : 0;
          }
        }
      });

      // 5. Strike arcs spark flow animations and air patrol loops
      arcs.children.forEach((c: any) => {
        if (c.userData?.isSpark && c.userData?.curve) {
          c.userData.pct += 0.005;
          if (c.userData.pct > 1.0) {
            c.userData.pct = 0.0;
          }
          const pt = c.userData.curve.getPointAt(c.userData.pct);
          c.position.copy(pt);
        }

        // Animate combat air patrol jets crawling over the Earth
        if (c.userData?.isPatrolJet && c.userData?.center) {
          c.userData.phase += 0.012;
          const theta = c.userData.phase;

          const center = c.userData.center as THREE.Vector3;
          // Build local tangent coordinate axes (perpendicular basis)
          const u = new THREE.Vector3(1, 0, 0).projectOnPlane(center).normalize();
          const v = new THREE.Vector3().crossVectors(center, u).normalize();

          const offsetPos = center.clone()
            .add(u.clone().multiplyScalar(Math.cos(theta) * c.userData.radius))
            .add(v.clone().multiplyScalar(Math.sin(theta) * c.userData.radius))
            .multiplyScalar(1.004); // lift slightly above surface

          c.position.copy(offsetPos);
          c.lookAt(center.clone().multiplyScalar(1.05));
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

      // 6.5 HIGH-FIDELITY TAC-NUCLEAR SHOCKWAVES & MUSHROOM CLOUDS ANIMS
      for (let i = activeNuclearVFX.length - 1; i >= 0; i--) {
        const vfx = activeNuclearVFX[i];
        vfx.age += 1;

        // Shockwave expands to 0.08, opacity lines out
        if (vfx.shockwave) {
          const sPct = Math.min(1.0, vfx.age / vfx.shockwaveMaxAge);
          const currentRadius = 0.001 + 0.08 * sPct;
          vfx.shockwave.geometry.dispose();
          vfx.shockwave.geometry = new THREE.SphereGeometry(currentRadius, 24, 24);

          if (vfx.shockwave.material instanceof THREE.Material) {
            vfx.shockwave.material.opacity = 1.0 - sPct;
          }

          if (vfx.age >= vfx.shockwaveMaxAge) {
            globeGroup.remove(vfx.shockwave);
            vfx.shockwave.geometry.dispose();
            if (vfx.shockwave.material instanceof THREE.Material) {
              vfx.shockwave.material.dispose();
            }
            vfx.shockwave = null;
          }
        }

        // Mushroom Cloud scales to 0.06
        if (vfx.mushroomSprite) {
          if (vfx.age <= vfx.mushroomMaxAge) {
            const mPct = vfx.age / vfx.mushroomMaxAge;
            const currentScale = 0.06 * mPct;
            vfx.mushroomSprite.scale.set(currentScale, currentScale, currentScale);
            // Rise upwards slightly as it bursts to resemble a tall updraft
            const risePos = vfx.targetVec.clone().multiplyScalar(1.002 + currentScale * 0.45);
            vfx.mushroomSprite.position.copy(risePos);
          } else if (vfx.age > vfx.mushroomLingerAge) {
            // Smooth fade out
            const fadePct = (vfx.age - vfx.mushroomLingerAge) / 60; // 60 frames (1s) fade
            if (vfx.mushroomSprite.material instanceof THREE.Material) {
              vfx.mushroomSprite.material.opacity = Math.max(0, 1.0 - fadePct);
            }

            if (fadePct >= 1.0) {
              globeGroup.remove(vfx.mushroomSprite);
              if (vfx.mushroomSprite.material instanceof THREE.Material) {
                if (vfx.mushroomSprite.material.map) vfx.mushroomSprite.material.map.dispose();
                vfx.mushroomSprite.material.dispose();
              }
              vfx.mushroomSprite = null;
            }
          }
        }

        if (!vfx.shockwave && !vfx.mushroomSprite) {
          activeNuclearVFX.splice(i, 1);
        }
      }

      // 7. HIGH-FIDELITY 3D MILITARY ASSET GRAPHICS ENGINE
      const military = militaryGroupRef.current;
      if (military) {
        military.children.forEach((mesh: any) => {
          if (mesh.userData && mesh.userData.unitId) {
            const unitId = mesh.userData.unitId;
            const targetPos = mesh.userData.targetPos as THREE.Vector3;
            
            // Submarine Altitude Overrides
            if (mesh.userData.type === 'Submarine') {
              const status = mesh.userData.status;
              const targetDepthOffset = (status === 'MOVING') ? -0.015 : 0.003;
              let currentDepth = subAltitudesRef.current[unitId];
              if (currentDepth === undefined) currentDepth = targetDepthOffset;
              currentDepth += (targetDepthOffset - currentDepth) * 0.05; // 2 seconds transition rate at 60fps
              subAltitudesRef.current[unitId] = currentDepth;

              const normal = targetPos.clone().normalize();
              mesh.userData.interpTargetPos = normal.clone().multiplyScalar(1.0 + currentDepth);
            } else {
              mesh.userData.interpTargetPos = targetPos;
            }

            const interpTarget = mesh.userData.interpTargetPos as THREE.Vector3;
            const lastPos = mesh.position.clone();
            
            // 8-ticks butter-smooth continuous coordinate slide
            mesh.position.lerp(interpTarget, 0.08);

            const normal = mesh.position.clone().normalize();
            const motionVec = mesh.position.clone().sub(prevPositionsRef.current[unitId] || lastPos);

            if (motionVec.lengthSq() > 1e-8) {
              const forward = motionVec.clone().projectOnPlane(normal).normalize();
              const right = new THREE.Vector3().crossVectors(forward, normal).normalize();
              const up = new THREE.Vector3().crossVectors(right, forward).normalize();

              const rotMatrix = new THREE.Matrix4().makeBasis(right, up, forward);
              mesh.quaternion.setFromRotationMatrix(rotMatrix);

              const prevHeading = prevPositionsRef.current[unitId + '_h'] || forward.clone();

              // Emit Carrier wake foam particles
              if (mesh.userData.type === 'CarrierGroup') {
                if (wakesRef.current[unitId]) {
                  wakesRef.current[unitId].emit(mesh.position, forward);
                }
              }

              // Emit Submarine bubbles
              else if (mesh.userData.type === 'Submarine') {
                if (bubblesRef.current[unitId]) {
                  bubblesRef.current[unitId].emit(mesh.position, forward);
                }
              }

              // Apply Fighter banking / rolling
              else if (mesh.userData.type === 'AirWing') {
                const cross = prevHeading.clone().cross(forward);
                const dot = cross.dot(normal);
                const turnAngle = prevHeading.angleTo(forward) * (dot > 0 ? 1 : -1);
                const targetRoll = THREE.MathUtils.clamp(turnAngle * 22.0, -Math.PI / 4, Math.PI / 4);

                let currentRoll = jetRollsRef.current[unitId] || 0;
                currentRoll += (targetRoll - currentRoll) * 0.12;
                jetRollsRef.current[unitId] = currentRoll;

                mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), currentRoll);
              }

              prevPositionsRef.current[unitId + '_h'] = forward.clone();
            } else {
              // Stationary heading alignment
              const up = normal.clone();
              const right = new THREE.Vector3(1, 0, 0).projectOnPlane(up).normalize();
              const forward = new THREE.Vector3().crossVectors(up, right).normalize();
              const rotMatrix = new THREE.Matrix4().makeBasis(right, up, forward);
              mesh.quaternion.setFromRotationMatrix(rotMatrix);
            }

            prevPositionsRef.current[unitId] = mesh.position.clone();
          }
        });

        // Update Escort Destroyer instances matrix
        const escMesh = escortsMeshRef.current;
        if (escMesh) {
          let insCount = 0;
          military.children.forEach((mesh: any) => {
            if (mesh.userData?.type === 'CarrierGroup') {
              const carrierMatrix = mesh.matrixWorld;

              // Back-Left and Back-Right tactical destroyers
              const leftRear = new THREE.Vector3(-0.024, -0.001, -0.02);
              leftRear.applyMatrix4(carrierMatrix);

              const rightRear = new THREE.Vector3(0.024, -0.001, -0.025);
              rightRear.applyMatrix4(carrierMatrix);

              const q = mesh.quaternion;
              const sizeScale = new THREE.Vector3(0.45, 0.45, 0.45);

              const m1 = new THREE.Matrix4().compose(leftRear, q, sizeScale);
              const m2 = new THREE.Matrix4().compose(rightRear, q, sizeScale);

              if (insCount + 1 < escMesh.count) {
                escMesh.setMatrixAt(insCount++, m1);
                escMesh.setMatrixAt(insCount++, m2);
              }
            }
          });

          const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
          while (insCount < escMesh.count) {
            escMesh.setMatrixAt(insCount++, zeroMatrix);
          }

          escMesh.instanceMatrix.needsUpdate = true;
        }
      }

      // 8. UPDATE ACTIVE PARTICLE SYSTEMS
      Object.values(wakesRef.current).forEach((w: any) => w.update());
      Object.values(bubblesRef.current).forEach((b: any) => b.update());
      Object.values(exhaustRef.current).forEach((e: any) => e.update());

      // 9. ANIMATE ACTIVE PROJECTS (Active flying ICBMs / Air Patrols)
      arcs.children.forEach((c: any) => {
        if (c.userData?.isMissile && c.userData?.curve) {
          // Progress location
          const pt = c.userData.curve.getPointAt(c.userData.pct);
          c.position.copy(pt);

          // Rotate missile forward along tangent
          const tangent = c.userData.curve.getTangentAt(c.userData.pct).normalize();
          const upVector = pt.clone().normalize();
          const right = new THREE.Vector3().crossVectors(tangent, upVector).normalize();
          const correctedUp = new THREE.Vector3().crossVectors(right, tangent).normalize();

          const rotMat = new THREE.Matrix4().makeBasis(right, correctedUp, tangent);
          c.quaternion.setFromRotationMatrix(rotMat);

          // Emit exhaust particles
          const rocketId = c.userData.strikeId;
          if (rocketId && exhaustRef.current[rocketId]) {
            const backDir = tangent.clone().negate().normalize();
            const rearPos = pt.clone().addScaledVector(tangent, -0.015);
            exhaustRef.current[rocketId].emit(rearPos, backDir);
          }
        }
      });

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

      unsubscribeNuclear();
      unsubscribeNuclearEvents();
      if (typeof window !== 'undefined') {
        window.removeEventListener('nuclear-impact', handleNuclearImpactEvent);
      }

      // Dispose of military models and particle systems to prevent GPU memory leaks
      Object.values(wakesRef.current).forEach((w: any) => w.destroy());
      Object.values(bubblesRef.current).forEach((b: any) => b.destroy());
      Object.values(exhaustRef.current).forEach((e: any) => e.destroy());
      wakesRef.current = {};
      bubblesRef.current = {};
      exhaustRef.current = {};
      
      if (escortsMeshRef.current) {
        escortsMeshRef.current.geometry.dispose();
        if (Array.isArray(escortsMeshRef.current.material)) {
          escortsMeshRef.current.material.forEach((m) => m.dispose());
        } else {
          escortsMeshRef.current.material.dispose();
        }
      }

      // Dispose of shared hotspot resources cache to prevent GPU leaks on route shift
      if (sharedOctahedronGeoRef.current) {
        sharedOctahedronGeoRef.current.dispose();
        sharedOctahedronGeoRef.current = null;
      }
      if (sharedSelRingGeoRef.current) {
        sharedSelRingGeoRef.current.dispose();
        sharedSelRingGeoRef.current = null;
      }
      if (sharedUnselRingGeoRef.current) {
        sharedUnselRingGeoRef.current.dispose();
        sharedUnselRingGeoRef.current = null;
      }
      Object.values(sharedMatsRef.current).forEach((material: any) => {
        material.dispose();
      });
      sharedMatsRef.current = {};

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
    if (!starPoints || !ambientLight || !earthMesh) return;

    if (isDark) {
      if (starPoints.material instanceof THREE.PointsMaterial) {
        starPoints.material.color.setHex(0x6ca1bf);
        starPoints.material.opacity = 0.50;
      }
      ambientLight.color.setHex(0x0b131c);
      ambientLight.intensity = 0.75;

      if (earthMesh.material instanceof THREE.MeshPhongMaterial) {
        earthMesh.material.color.setHex(0xffffff);
        earthMesh.material.emissive.setHex(0x112135);
        earthMesh.material.emissiveIntensity = 1.6;
        earthMesh.material.shininess = 28;
      }
      if (cloudsMesh && cloudsMesh.material instanceof THREE.MeshPhongMaterial) {
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
        earthMesh.material.color.setHex(0xffffff);
        earthMesh.material.emissive.setHex(0x0d0d0d);
        earthMesh.material.emissiveIntensity = 0.22;
        earthMesh.material.shininess = 6;
      }
      if (cloudsMesh && cloudsMesh.material instanceof THREE.MeshPhongMaterial) {
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
    const activeScene = sceneRef.current;
    if (!pins || !arcs || !sparks || !activeScene) return;

    // Helper to safely eject children elements
    const clearGroup = (g: THREE.Group) => {
      while (g.children.length > 0) {
        const c = g.children[0];
        g.remove(c);
        if (c instanceof THREE.Mesh || c instanceof THREE.Line) {
          if (!c.userData.sharedGeom) {
            c.geometry.dispose();
          }
          if (!c.userData.sharedMat) {
            if (c.material instanceof Array) {
              c.material.forEach((m) => m.dispose());
            } else {
              c.material.dispose();
            }
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
      } else if (hudMode === 'ANALYST') {
        const confidence = ((id.charCodeAt(0) * 11 + id.charCodeAt(id.length - 1) * 7) % 100);
        if (confidence > 70) {
           pinColor = 0x00ffaa;
        } else if (confidence > 30) {
           pinColor = 0xeec152;
        } else {
           pinColor = 0xff3b4e;
        }
        pinScale = 0.016;
        shouldRender = true;
      }

      // If we are zoomed out, filter out low-priority pins to keep scene content legible
      const isZoomedOut = zoomFactor.current > 2.2;
      const isHighPriorityPin = id === playerCountryId || id === targetCountryId || (c.atWarWith && c.atWarWith.length > 0);
      if (isZoomedOut && !isHighPriorityPin) {
        const hasHighPower = c.arsenal?.totalPowerRating && c.arsenal.totalPowerRating > 200;
        const hasHighGdp = c.economic?.gdpB && c.economic.gdpB > 600;
        const isNuclear = c.arsenal?.nuclearCapable;
        if (!hasHighPower && !hasHighGdp && !isNuclear) {
          shouldRender = false;
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

    // --- T4.5 GEOGRAPHIC HOTSPOTS RENDERING ---
    // Ensure shared geometries are initialized
    if (!sharedOctahedronGeoRef.current) {
      sharedOctahedronGeoRef.current = new THREE.OctahedronGeometry(1.0);
    }
    if (!sharedSelRingGeoRef.current) {
      sharedSelRingGeoRef.current = new THREE.RingGeometry(1.0, 1.46, 16);
    }
    if (!sharedUnselRingGeoRef.current) {
      sharedUnselRingGeoRef.current = new THREE.RingGeometry(1.0, 1.23, 12);
    }

    SEEDED_HOTSPOTS.forEach((hotspot) => {
      const hVec = latLngToVector3(hotspot.lat, hotspot.lon, 1.0);

      // Establish visual language type specific color:
      let color = 0x90a4ae;
      if (hotspot.type === 'NAVAL_BASE') color = 0x00b0ff;
      else if (hotspot.type === 'AIR_BASE') color = 0x00e5ff;
      else if (hotspot.type === 'NUCLEAR_FACILITY') color = 0xff2a4a;
      else if (hotspot.type === 'MISSILE_SITE') color = 0xffa100;
      else if (hotspot.type === 'DIPLOMATIC_COMPOUND') color = 0xffea00;
      else if (hotspot.type === 'COVERT_SITE') color = 0xd500f9;
      else if (hotspot.type === 'CYBER_FACILITY') color = 0x00e676;
      else if (hotspot.type === 'INDUSTRIAL_SITE') color = 0xb0bec5;

      const isSelected = selectedHotspotId === hotspot.id;
      const markerSize = isSelected ? 0.016 : 0.009;

      // Leverage cached reusable material or instantiate once
      const matKey = `${color}_${isSelected ? 'sel' : 'unsel'}`;
      let octMat = sharedMatsRef.current[matKey] as THREE.MeshPhongMaterial;
      if (!octMat) {
        octMat = new THREE.MeshPhongMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: isSelected ? 0.95 : 0.45,
          shininess: 90,
          transparent: true,
          opacity: 0.95,
        });
        sharedMatsRef.current[matKey] = octMat;
      }

      // Instantiate octahedron with shared unit geometry and scale appropriately
      const octMesh = new THREE.Mesh(sharedOctahedronGeoRef.current!, octMat);
      octMesh.scale.setScalar(markerSize);
      octMesh.position.copy(hVec);
      octMesh.userData = { 
        isHotspot: true, 
        hotspotId: hotspot.id, 
        countryId: hotspot.countryId,
        sharedGeom: true,
        sharedMat: true
      };
      pins.add(octMesh);

      // Draw active target locking scanner ring around the selected hotspot (using shared selection geometry)
      if (isSelected) {
        const ringMatKey = `ring_${color}_sel`;
        let ringMat = sharedMatsRef.current[ringMatKey] as THREE.MeshBasicMaterial;
        if (!ringMat) {
          ringMat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          });
          sharedMatsRef.current[ringMatKey] = ringMat;
        }

        const ringMesh = new THREE.Mesh(sharedSelRingGeoRef.current!, ringMat);
        ringMesh.scale.setScalar(markerSize * 1.5);
        ringMesh.position.copy(hVec);
        ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
        ringMesh.userData = {
          sharedGeom: true,
          sharedMat: true
        };
        pins.add(ringMesh);
      } else if (hotspot.importance >= 4) {
        // Draw subtle radar warning orbit rings for critical unselected hotspots (using shared warning geometry)
        const ringMatKey = `ring_${color}_unsel`;
        let ringMat = sharedMatsRef.current[ringMatKey] as THREE.MeshBasicMaterial;
        if (!ringMat) {
          ringMat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.22,
          });
          sharedMatsRef.current[ringMatKey] = ringMat;
        }

        const ringMesh = new THREE.Mesh(sharedUnselRingGeoRef.current!, ringMat);
        ringMesh.scale.setScalar(markerSize * 1.3);
        ringMesh.position.copy(hVec);
        ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
        ringMesh.userData = {
          sharedGeom: true,
          sharedMat: true
        };
        pins.add(ringMesh);
      }
    });

    // 2. BALLISTIC ARC MODELS (Traversing missile trails)
    const displayStrikes = layers.conflicts || layers.nuclear || layers.political;
    if (displayStrikes) {
      (activeStrikes || []).forEach((strike) => {
        if (!strike || !strike.id) return;
        const srcCent = getCentroid(strike.sourceCountryId);
        const tgtCent = getCentroid(strike.targetCountryId);

        if (srcCent[0] === 0 || tgtCent[0] === 0) return;

        const pStart = latLngToVector3(srcCent[1], srcCent[0], 1.0);
        const pEnd = latLngToVector3(tgtCent[1], tgtCent[0], 1.0);

        // Generate dynamic curves over the spherical terrain using CatmullRomCurve3
        const midPoint = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
        const dist = pStart.distanceTo(pEnd);
        const isNuke = strike.warheadYieldMT && strike.warheadYieldMT > 0;
        const arcHeight = isNuke ? 2.0 : 1.2;

        const pMid = midPoint.normalize().multiplyScalar(1.0 + arcHeight * dist);

        const curve = new THREE.CatmullRomCurve3([pStart, pMid, pEnd]);
        const pts = curve.getPoints(48);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);

        const trailColor = isNuke ? 0x00cfff : 0xff3b4e;

        const arcMat = new THREE.LineDashedMaterial({
          color: trailColor,
          transparent: true,
          opacity: strike.status === 'IN_FLIGHT' ? 0.8 : 0.15,
          dashSize: 0.02,
          gapSize: 0.02,
        });

        const line = new THREE.Line(arcGeo, arcMat);
        line.computeLineDistances();
        arcs.add(line);

        // Render volumetric missile flight trail using TubeGeometry
        if (strike.status === 'IN_FLIGHT') {
          const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.002, 6, false);
          const tubeMat = new THREE.MeshBasicMaterial({
            color: trailColor,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
          });
          const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
          arcs.add(tubeMesh);
        }

        // Render traveling 3D rocket bodies with real active engines
        if (strike.status === 'IN_FLIGHT') {
          const phMesh = createProceduralMissile();
          const pct = Math.min(0.99, Math.max(0.01, strike.progressPct / 100));

          phMesh.userData = {
            isMissile: true,
            strikeId: strike.id,
            curve,
            pct,
          };

          const startPos = curve.getPointAt(pct);
          phMesh.position.copy(startPos);

          const tangent = curve.getTangentAt(pct).normalize();
          const upVector = startPos.clone().normalize();
          const right = new THREE.Vector3().crossVectors(tangent, upVector).normalize();
          const correctedUp = new THREE.Vector3().crossVectors(right, tangent).normalize();

          const rotMat = new THREE.Matrix4().makeBasis(right, correctedUp, tangent);
          phMesh.quaternion.setFromRotationMatrix(rotMat);

          arcs.add(phMesh);

          // Configure exhaust trails
          if (!exhaustRef.current[strike.id]) {
            exhaustRef.current[strike.id] = new RocketExhaustManager();
            activeScene.add(exhaustRef.current[strike.id].getMesh());
          }
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

    // 4. RADAR & AIR DEFENSE WARNING ARCHITECTURAL DOME FIELDS (TRANS-AMBER WIREFRAMES)
    if (layers.radar) {
      Object.entries(countries).forEach(([id, c]) => {
        const power = c.arsenal?.totalPowerRating ?? 0;
        if (power > 150) {
          const coord = getCentroid(id);
          if (coord[0] !== 0) {
            const pCent = latLngToVector3(coord[1], coord[0], 1.0);
            const isPlayer = id === playerCountryId;
            const domeColor = isPlayer ? 0x00ffaa : 0xff7700;

            const domeGeo = new THREE.SphereGeometry(0.045, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
            const domeMat = new THREE.MeshBasicMaterial({
              color: domeColor,
              transparent: true,
              opacity: 0.12,
              wireframe: true,
              side: THREE.DoubleSide,
            });
            const domeMesh = new THREE.Mesh(domeGeo, domeMat);
            domeMesh.position.copy(pCent);
            domeMesh.lookAt(pCent.clone().multiplyScalar(1.1));
            domeMesh.rotateX(Math.PI / 2);

            arcs.add(domeMesh);
          }
        }
      });
    }

    // 5. STRATEGIC TRANSPORT LOGISTICS PATHWAYS (CYAN GREAT ARCS)
    if (layers.logistics) {
      const corridors = [
        { from: 'US', to: 'GB' },
        { from: 'US', to: 'JP' },
        { from: 'CN', to: 'SA' },
        { from: 'RU', to: 'IN' },
        { from: 'DE', to: 'BR' },
      ];

      corridors.forEach((corr) => {
        const fromCent = getCentroid(corr.from);
        const toCent = getCentroid(corr.to);
        if (fromCent[0] !== 0 && toCent[0] !== 0) {
          const pStart = latLngToVector3(fromCent[1], fromCent[0], 1.002);
          const pEnd = latLngToVector3(toCent[1], toCent[0], 1.002);

          const midPoint = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
          const dist = pStart.distanceTo(pEnd);
          const arcHeight = dist * 0.15;
          const pMid = midPoint.normalize().multiplyScalar(1.0 + arcHeight);

          const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
          const pts = curve.getPoints(24);
          const corridorGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const corridorMat = new THREE.LineDashedMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.50,
            dashSize: 0.012,
            gapSize: 0.008,
          });
          const line = new THREE.Line(corridorGeo, corridorMat);
          line.computeLineDistances();
          arcs.add(line);
        }
      });
    }

    // 6. FIGHTER SURVEILLANCE RADIALS & CAP FLIGHT PATROLS
    if (layers.traces) {
      const patrols3D = [
        { center: [121.5, 23.5], radius: 0.045 },
        { center: [37.6, 55.7], radius: 0.055 },
        { center: [-77.0, 38.9], radius: 0.050 },
        { center: [35.0, 31.5], radius: 0.038 },
      ];

      patrols3D.forEach((pat, index) => {
        const centerPos = latLngToVector3(pat.center[1], pat.center[0], 1.003);
        const radius = pat.radius;

        // Visual radar sweep boundary orbit line
        const ringGeo = new THREE.RingGeometry(radius - 0.0015, radius + 0.0015, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xb87fff,
          transparent: true,
          opacity: 0.30,
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(centerPos);
        ringMesh.lookAt(0, 0, 0);
        arcs.add(ringMesh);

        // Rotating dynamic recon air asset cone
        const jetGeo = new THREE.ConeGeometry(0.005, 0.012, 4);
        const jetMat = new THREE.MeshBasicMaterial({
          color: 0x00ffaa,
          transparent: true,
          opacity: 0.90,
        });
        const jetMesh = new THREE.Mesh(jetGeo, jetMat);
        jetMesh.userData = {
          isPatrolJet: true,
          center: centerPos,
          radius: radius,
          phase: index * 1.5,
        };
        arcs.add(jetMesh);
      });
    }

    // 7. DEPLOY CINEMATIC, HIGH-FIDELITY 3D MILITARY ASSETS (Carriers, Submarines, Fighter Wings)
    const military = militaryGroupRef.current;
    if (military && activeScene) {
      clearGroup(military);

      // Create InstancedMesh for Destroyers (Fleet Escorts accompanying Carriers)
      const carrierUnits = units.filter((u) => u.type === 'CarrierGroup');
      const maxDestroyers = carrierUnits.length * 2;

      if (escortsMeshRef.current) {
        military.remove(escortsMeshRef.current);
        escortsMeshRef.current.geometry.dispose();
        if (Array.isArray(escortsMeshRef.current.material)) {
          escortsMeshRef.current.material.forEach((m) => m.dispose());
        } else {
          escortsMeshRef.current.material.dispose();
        }
        escortsMeshRef.current = null;
      }

      if (maxDestroyers > 0) {
        const destGeo = new THREE.CylinderGeometry(0, 0.0035, 0.024, 5);
        const destMat = new THREE.MeshPhongMaterial({
          color: 0x4d555c,
          emissive: 0x050607,
          shininess: 35,
          flatShading: true,
        });
        const escMesh = new THREE.InstancedMesh(destGeo, destMat, maxDestroyers);
        escMesh.name = "destroyerEscorts";
        military.add(escMesh);
        escortsMeshRef.current = escMesh;
      }

      // Render actual 3D Military Assets
      (units || []).forEach((unit) => {
        if (!unit || !unit.id || !unit.position) return;
        // Position targets based on altitude layers
        const isAir = unit.type === 'AirWing';
        const baseRadius = isAir ? 1.055 : 1.018;
        const targetVec = latLonToVec3(unit.position.lat, unit.position.lon, baseRadius);

        // Pivot group representing the unit
        const pivot = new THREE.Group();
        pivot.name = `unit_${unit.id}`;

        // Retain smooth interpolation history
        const prevPos = prevPositionsRef.current[unit.id];
        if (prevPos) {
          pivot.position.copy(prevPos);
        } else {
          pivot.position.copy(targetVec);
          prevPositionsRef.current[unit.id] = targetVec.clone();
        }

        pivot.userData = {
          unitId: unit.id,
          type: unit.type,
          status: unit.status,
          owner: unit.owner,
          targetPos: targetVec,
        };

        military.add(pivot);

        // Map class models or fallbacks
        let modelKey: 'carrier' | 'sub' | 'fighter' | 'missile' = 'carrier';
        let modelUrl = '/models/carrier.glb';

        if (unit.type === 'CarrierGroup') {
          modelKey = 'carrier';
          modelUrl = '/models/carrier.glb';

          // Emit trail Wake in world coordinates
          if (!wakesRef.current[unit.id]) {
            wakesRef.current[unit.id] = new WakeSystemManager();
            activeScene.add(wakesRef.current[unit.id].getMesh());
          }
        } else if (unit.type === 'Submarine') {
          modelKey = 'sub';
          modelUrl = '/models/submarine.glb';

          // Emit dive bubbles in world coordinates
          if (!bubblesRef.current[unit.id]) {
            bubblesRef.current[unit.id] = new BubbleSystemManager();
            activeScene.add(bubblesRef.current[unit.id].getMesh());
          }
        } else if (unit.type === 'AirWing') {
          modelKey = 'fighter';
          modelUrl = '/models/fighter.glb';
        } else {
          return; // Skip non-moving profiles (such as static silos)
        }

        if (loaderRef.current) {
          loaderRef.current.loadModel(modelKey, modelUrl, (loadedMesh) => {
            const isPlayer = unit.owner === playerCountryId;
            loadedMesh.traverse((childElement) => {
              if (childElement instanceof THREE.Mesh && childElement.material) {
                const mats = Array.isArray(childElement.material) ? childElement.material : [childElement.material];
                mats.forEach((m) => {
                  if (m instanceof THREE.MeshPhongMaterial || m instanceof THREE.MeshStandardMaterial) {
                    if (isPlayer) {
                      m.emissive.setHex(0x00260c);
                    } else if (unit.owner === targetCountryId) {
                      m.emissive.setHex(0x2d0003);
                    }
                  }
                });
              }
            });
            pivot.add(loadedMesh);
          });
        }
      });
    }

  }, [activeStrikes, countries, playerCountryId, targetCountryId, theme, layers, units, selectedHotspotId]);

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
      {!isDossierOpen && (
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
      )}

      {/* BOTTOM CENTER DYNAMIC INTERACTION CONSOLE KEYS */}
      {!isDossierOpen && (
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
      )}

      {/* INTEL FOG OF WAR OVERLAY */}
      {hudMode === 'ANALYST' && (
        <div 
          className="absolute inset-0 pointer-events-none z-[11] opacity-[0.12] mix-blend-overlay"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
          }}
        />
      )}

      {/* SATELLITE HUD WATERMARKS & GRATICULE LAYOUT */}
      {!isDossierOpen && (
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
      )}
    </div>
  );
}

export default InGameGlobe;
