import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { audio } from '../../utils/audio';
import { GLOBE_HOTSPOTS, createGlobeMarker, updateMarkerCanvas } from './GlobeMarkers';

export interface WebGLGlobeRef {
  setGreenTint: (progress: number) => void;
}

interface WebGLGlobeProps {
  rotSpeed?: number;
  elapsedMs?: number;
}

export const WebGLGlobe = forwardRef<WebGLGlobeRef, WebGLGlobeProps>(({
  rotSpeed = 0.0006,
  elapsedMs = 0
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const elapsedMsRef = useRef<number>(0);

  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

  useImperativeHandle(ref, () => ({
    setGreenTint: (progress: number) => {
      if (materialRef.current) {
        materialRef.current.uniforms.greenTint.value = progress;
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || 500;

    // Create scene
    const scene = new THREE.Scene();

    // Create camera with cinematic viewing frustum
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.z = 2.65; // Perfectly frames the Earth centered

    // Dynamic renderer with anti-aliasing and pixel-ratio optimization
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false); // false = let CSS control container constraints
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === DIAGNOSTIC CHECKPOINT 1: Canvas size vs container size ===
    console.log('[GLOBE-DEBUG-1] Container size:', {
      containerW: containerRef.current?.clientWidth,
      containerH: containerRef.current?.clientHeight,
      containerOffsetW: containerRef.current?.offsetWidth,
      containerOffsetH: containerRef.current?.offsetHeight,
      innerW: window.innerWidth,
      innerH: window.innerHeight,
    });
    console.log('[GLOBE-DEBUG-2] Renderer pixel ratio:', renderer.getPixelRatio());
    console.log('[GLOBE-DEBUG-3] Renderer size:', renderer.getSize(new THREE.Vector2()));
    console.log('[GLOBE-DEBUG-4] Device pixel ratio:', window.devicePixelRatio);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // --- HIGH-FIDELITY SEAMLESS SEEDABLE 3D VALUE NOISE GENERATION ENGINE ---
    // Deterministic 3D value noise to generate highly realistic, organic geographic contours that wrap seamlessly.
    const noiseTableSize = 256;
    const perm: number[] = [];
    for (let i = 0; i < noiseTableSize; i++) {
      perm.push(Math.floor(Math.sin(i * 12.9898) * 43758.5453) & 255);
    }
    const noisePerm = [...perm, ...perm];
    
    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t: number, a: number, b: number) => a + t * (b - a);
    
    const valueNoise3D = (x: number, y: number, z: number): number => {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      
      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);
      const zf = z - Math.floor(z);
      
      const u = fade(xf);
      const v = fade(yf);
      const w = fade(zf);
      
      const aaa = noisePerm[noisePerm[noisePerm[X] + Y] + Z] / 255;
      const aba = noisePerm[noisePerm[noisePerm[X] + Y + 1] + Z] / 255;
      const aab = noisePerm[noisePerm[noisePerm[X] + Y] + Z + 1] / 255;
      const abb = noisePerm[noisePerm[noisePerm[X] + Y + 1] + Z + 1] / 255;
      const baa = noisePerm[noisePerm[noisePerm[X + 1] + Y] + Z] / 255;
      const bba = noisePerm[noisePerm[noisePerm[X + 1] + Y + 1] + Z] / 255;
      const bab = noisePerm[noisePerm[noisePerm[X + 1] + Y] + Z + 1] / 255;
      const bbb = noisePerm[noisePerm[noisePerm[X + 1] + Y + 1] + Z + 1] / 255;
      
      const x1 = lerp(u, aaa, baa);
      const x2 = lerp(u, aba, bba);
      const x3 = lerp(u, aab, bab);
      const x4 = lerp(u, abb, bbb);
      
      const y1 = lerp(v, x1, x2);
      const y2 = lerp(v, x3, x4);
      
      return lerp(w, y1, y2);
    };

    // Synthesizes multi-octave FBM mapped onto a cylinder for horizontal seamless wrapping
    const getSeamlessElevation = (u: number, v: number): number => {
      const r = 1.6;
      const angle = u * Math.PI * 2;
      const nx = r * Math.cos(angle);
      const ny = r * Math.sin(angle);
      const nz = (v - 0.5) * 3.2;

      let val = 0;
      let amp = 1.0;
      let freq = 0.85;
      let totalAmp = 0;
      
      for (let i = 0; i < 5; i++) {
        val += valueNoise3D(nx * freq + 8.2, ny * freq + 4.9, nz * freq + 3.1) * amp;
        totalAmp += amp;
        amp *= 0.5;
        freq *= 2.05;
      }
      val /= totalAmp;

      // Realistic Geographical Bias Map (simulates accurate Earth continent clustering)
      let bias = -0.16;

      // Americas Continent cluster
      if (u > 0.15 && u < 0.40) {
        const amerDist = Math.sin((u - 0.15) / 0.25 * Math.PI) * Math.sin((v - 0.12) / 0.74 * Math.PI);
        bias += amerDist * 0.48;
      }

      // Afro-Eurasian Continent cluster
      if (u > 0.46 && u < 0.88) {
        const eurasiaDist = Math.sin((u - 0.46) / 0.42 * Math.PI) * Math.sin((v - 0.10) / 0.72 * Math.PI);
        bias += eurasiaDist * 0.52;
      }

      // Australian sub-continent
      if (u > 0.74 && u < 0.90 && v > 0.56 && v < 0.78) {
        bias += 0.28;
      }

      // Polar Ice caps
      if (v < 0.14) bias += (0.14 - v) * 2.5;
      if (v > 0.82) bias += (v - 0.82) * 2.5;

      return Math.max(0, Math.min(1, val * 0.44 + bias));
    };

    const smoothstep = (edge0: number, edge1: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    // --- HIGH-FIDELITY PROCEDURAL TEXTURE GENERATOR ---
    // Instantly renders a stunning 2048x1024 high-res satellite-style Earth map to guarantee zero latency and extreme crispness
    const createFallbackTexture = (type: 'day' | 'night' | 'specular' | 'clouds') => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;
      const imgData = ctx.createImageData(2048, 1024);
      const data = imgData.data;

      for (let y = 0; y < 1024; y++) {
        const v = y / 1023;
        for (let x = 0; x < 2048; x++) {
          const u = x / 2047;
          const idx = (y * 2048 + x) * 4;

          const elev = getSeamlessElevation(u, v);
          const isLand = elev > 0.44;

          if (type === 'day') {
            if (isLand) {
              if (v < 0.16 || v > 0.83 || elev > 0.76) {
                // Majestic ice fields & snow-capped peaks
                data[idx] = 245;
                data[idx+1] = 248;
                data[idx+2] = 250;
                data[idx+3] = 255;
              } else {
                // Detailed geographical satellite terrain (deserts, forests, highlands)
                const isDesert = v > 0.32 && v < 0.54 && getSeamlessElevation(u * 1.5, v * 1.5) > 0.48;
                if (isDesert) {
                  const dFactor = Math.floor(elev * 18);
                  data[idx] = 210 + dFactor;
                  data[idx+1] = 175 + dFactor;
                  data[idx+2] = 125;
                  data[idx+3] = 255;
                } else {
                  data[idx] = Math.floor(34 + elev * 12);
                  data[idx+1] = Math.floor(74 + (1.0 - elev) * 22);
                  data[idx+2] = Math.floor(36 + elev * 8);
                  data[idx+3] = 255;
                }
              }
            } else {
              // Deep navy oceans with luminous teal continental shelves on shelves
              const shelf = smoothstep(0.36, 0.44, elev);
              data[idx] = Math.floor(4 * (1 - shelf) + 12 * shelf);
              data[idx+1] = Math.floor(18 * (1 - shelf) + 52 * shelf);
              data[idx+2] = Math.floor(38 * (1 - shelf) + 98 * shelf);
              data[idx+3] = 255;
            }
          } else if (type === 'night') {
            if (isLand) {
              // Deep dark twilight landmass
              data[idx] = 8;
              data[idx+1] = 10;
              data[idx+2] = 14;
              data[idx+3] = 255;

              // Glowing golden energy lines and city clusters concentrated near coastlines
              const isCoastal = elev > 0.44 && elev < 0.51;
              const popDensity = getSeamlessElevation(u * 3.5, v * 3.5);
              if ((isCoastal && popDensity > 0.62) || popDensity > 0.72) {
                data[idx] = 255;
                data[idx+1] = 188 + Math.floor(popDensity * 50);
                data[idx+2] = 80;
                data[idx+3] = 255;
              }
            } else {
              // Space-dark navy ocean
              data[idx] = 2;
              data[idx+1] = 3;
              data[idx+2] = 6;
              data[idx+3] = 255;
            }
          } else if (type === 'specular') {
            // High-shine ocean reflecting solar specular; land is completely matte
            const spec = isLand ? 10 : 255;
            data[idx] = spec;
            data[idx+1] = spec;
            data[idx+2] = spec;
            data[idx+3] = 255;
          } else if (type === 'clouds') {
            // Elegant sweeping circular storm patterns
            const cloudFactor = getSeamlessElevation(u * 1.8 + 0.5, v * 1.6 - 0.2);
            const clOpacity = smoothstep(0.48, 0.78, cloudFactor) * 235;
            data[idx] = 255;
            data[idx+1] = 255;
            data[idx+2] = 255;
            data[idx+3] = Math.floor(clOpacity);
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = maxAnisotropy;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      return texture;
    };

    // Create high-fidelity fallback assets immediately (for absolute zero latency)
    const fallbackDay = createFallbackTexture('day');
    const fallbackNight = createFallbackTexture('night');
    const fallbackSpec = createFallbackTexture('specular');
    const fallbackClouds = createFallbackTexture('clouds');

    fallbackDay.colorSpace = THREE.SRGBColorSpace;
    fallbackNight.colorSpace = THREE.SRGBColorSpace;

    // Sculpted Directional Lighting Core
    const sunDirection = new THREE.Vector3(7.5, 3.8, 4.5).normalize();

    // --- EARTH SURFACE COHERENT CUSTOM SHADER ---
    // Implements realistic day-side shading, dark-side emissive cities, a gorgeous 
    // sunset/sunrise twilight band (terminator scattering), and high-contrast surface textures.
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: fallbackDay },
        nightTexture: { value: fallbackNight },
        specTexture: { value: fallbackSpec },
        sunDirection: { value: sunDirection },
        greenTint: { value: 0.0 },
        darkenFactor: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D specTexture;
        uniform vec3 sunDirection;
        uniform float greenTint;
        uniform float darkenFactor;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 worldNormal = normalize(vNormal);
          vec3 viewDir = normalize(-vPosition);
          
          float sunDot = dot(worldNormal, sunDirection);
          
          // Smooth day-to-night gradient
          float dayStrength = smoothstep(-0.12, 0.12, sunDot);
          
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          vec4 specValue = texture2D(specTexture, vUv);

          // Subtle night lights on the dark hemisphere
          vec3 nightLights = nightColor.rgb * 3.5;
          
          // Realistic glossy ocean solar specular reflection
          float specIntensity = 0.0;
          if (sunDot > 0.0) {
            vec3 reflectDir = reflect(-sunDirection, worldNormal);
            specIntensity = pow(max(dot(reflectDir, viewDir), 0.0), 38.0);
          }
          vec3 sunSpecular = vec3(1.0, 0.95, 0.88) * specIntensity * specValue.r * 1.5;
          
          // Physically based day rendering
          float diffuse = max(sunDot, 0.0);
          vec3 litDay = dayColor.rgb * (0.04 + 0.96 * diffuse) + sunSpecular;
          
          // Atmospheric twilight scattering (the elegant orange-red terminator ribbon)
          float sunsetFactor = smoothstep(0.18, -0.05, sunDot) * smoothstep(-0.12, 0.22, sunDot);
          vec3 twilightGlow = vec3(0.96, 0.40, 0.10) * sunsetFactor * 0.72;
          
          // Composite Day and Night hemispherical blending
          vec3 finalSurface = mix(nightLights, litDay, dayStrength) + twilightGlow;
          
          // Darken during tactical nuclear scenarios
          finalSurface = finalSurface * (1.0 - darkenFactor);
          
          // Apply phosphorus tint transition
          vec3 tintedSurface = vec3(finalSurface.g * 0.1, finalSurface.g * 1.4 + 0.05, finalSurface.g * 0.3);
          finalSurface = mix(finalSurface, tintedSurface, greenTint);
          
          // Extreme grazing-angle limb highlighting (thin, crisp outer horizon accent)
          float rimFactor = 1.0 - max(dot(worldNormal, viewDir), 0.0);
          float thinEdgeAccent = pow(rimFactor, 6.0) * (0.2 + 0.8 * dayStrength);
          vec3 rimGlowCol = vec3(0.20, 0.55, 1.0) * thinEdgeAccent * 1.3;
          
          // Force edge back to green when green-tinting
          vec3 rimGlowMuted = mix(rimGlowCol, vec3(0.01, 1.2, 0.4) * thinEdgeAccent * 1.5, greenTint);
          
          gl_FragColor = vec4(finalSurface + rimGlowMuted, 1.0);
        }
      `
    });

    materialRef.current = earthMaterial;

    // === DIAGNOSTIC CHECKPOINT 3: Material type check ===
    console.log('[GLOBE-DEBUG-7] Earth material type:', earthMaterial.type);
    console.log('[GLOBE-DEBUG-7b] Is ShaderMaterial:', earthMaterial instanceof THREE.ShaderMaterial);
    if (earthMaterial instanceof THREE.ShaderMaterial) {
      console.log('[GLOBE-DEBUG-7c] Uniforms:', Object.keys(earthMaterial.uniforms));
      console.log('[GLOBE-DEBUG-7d] greenTint value:', earthMaterial.uniforms?.greenTint?.value);
    }

    // Earth Sphere Core
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // --- CLOUDS SPHERE LAYER ---
    // Slow-moving semi-transparent vapor layer rotating on a slightly larger shell
    const cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        cloudTexture: { value: fallbackClouds },
        sunDirection: { value: sunDirection }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D cloudTexture;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vec4 cloudCol = texture2D(cloudTexture, vUv);
          float sunDot = dot(normalize(vNormal), sunDirection);
          float light = smoothstep(-0.15, 0.25, sunDot);
          
          // Clouds illuminated by direct solar projection
          gl_FragColor = vec4(cloudCol.rgb * light, cloudCol.r * 0.28 * light);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const cloudGeometry = new THREE.SphereGeometry(1.006, 64, 64);
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(cloudMesh);

    // --- COHERENT ATMOSPHERE SPACE BUFFER ---
    // Beautiful backside atmospheric rim scattering concentrated strictly at the outer silhouette
    const atmosGeometry = new THREE.SphereGeometry(1.020, 64, 64);
    const atmosMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: sunDirection }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 worldNormal = normalize(vNormal);
          vec3 viewDir = normalize(-vPosition);
          
          // Concentrates the density solely at the grazing silhouette
          float fresnel = pow(1.0 - max(dot(worldNormal, viewDir), 0.0), 3.2);
          float sunDot = dot(worldNormal, sunDirection);
          float lightScattering = smoothstep(-0.4, 0.3, sunDot);
          
          vec3 outerSpaceBlue = vec3(0.02, 0.38, 1.0);
          vec3 upperAtmosCyan = vec3(0.35, 0.75, 1.0);
          vec3 atmosCol = mix(outerSpaceBlue, upperAtmosCyan, fresnel);
          
          gl_FragColor = vec4(atmosCol * lightScattering, fresnel * 0.65 * lightScattering);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    const atmosMesh = new THREE.Mesh(atmosGeometry, atmosMaterial);
    scene.add(atmosMesh);

    // Helper: Dynamic Deep Space Starfield with custom high-fidelity alpha radial glow texture
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.3, 'rgba(139, 229, 255, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    
    const starTexture = createStarTexture();

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 40 + Math.random() * 60;
      starPositions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = dist * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
      map: starTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // --- PROGRESSIVE TEXTURE ENHANCEMENT ENGINE (SELF-HEALING LOCAL-FIRST) ---
    // Loads premium textures from the local workspace origin first to avoid CORS/sandbox sandbox isolation, 
    // falling back to resilient CDN paths with full diagnostic checkpoints.
    const loadGlobeTextures = async (): Promise<{
      day: THREE.Texture;
      night: THREE.Texture;
      specular: THREE.Texture;
      clouds: THREE.Texture;
    }> => {
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = 'anonymous';

      function applyQualitySettings(tex: THREE.Texture): THREE.Texture {
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = maxAnisotropy;
        tex.generateMipmaps = true;
        tex.needsUpdate = true;
        return tex;
      }

      async function tryLoadTexture(urls: string[], name: 'day' | 'night' | 'spec' | 'clouds'): Promise<THREE.Texture> {
        for (const url of urls) {
          try {
            const tex = await new Promise<THREE.Texture>((resolve, reject) => {
              loader.load(url, resolve, undefined, reject);
            });
            const img = tex.image as any;
            if (img && img.width > 8) {
              console.log(`[GLOBE-TEXTURE] ✅ Successfully loaded ${name} texture from:`, url);

              // === DIAGNOSTIC CHECKPOINT 2: Texture loading ===
              if (name === 'day') {
                console.log('[GLOBE-DEBUG-5] ✅ Day texture loaded:', {
                  imageWidth:  img.width,
                  imageHeight: img.height,
                  format:      tex.format,
                  minFilter:   tex.minFilter,
                  magFilter:   tex.magFilter,
                  src:         img.src?.slice(0, 80),
                });
              } else if (name === 'night') {
                console.log('[GLOBE-DEBUG-6] ✅ Night texture loaded:', {
                  imageWidth:  img.width,
                  imageHeight: img.height,
                });
              }
              return applyQualitySettings(tex);
            }
            console.warn(`[GLOBE-TEXTURE] ⚠ Texture for ${name} loaded but dimensions too small (fallback detected), trying next URL:`, url);
          } catch (err) {
            console.error(`[GLOBE-TEXTURE] ❌ Failed to load ${name} texture from URL: ${url}. Error:`, err);
            if (name === 'day') {
              console.error('[GLOBE-DEBUG-5] ❌ Day texture FAILED to load from URL:', url);
            } else if (name === 'night') {
              console.error('[GLOBE-DEBUG-6] ❌ Night texture FAILED to load from URL:', url);
            }
          }
        }

        console.warn(`[GLOBE-TEXTURE] All URLs for ${name} texture failed loading. Reverting to procedural local canvas fallback.`);
        if (name === 'day') return fallbackDay;
        if (name === 'night') return fallbackNight;
        if (name === 'spec') return fallbackSpec;
        return fallbackClouds;
      }

      const [day, night, specular, clouds] = await Promise.all([
        tryLoadTexture([
          '/textures/earth-blue-marble.jpg',
          'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
          'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg'
        ], 'day'),
        tryLoadTexture([
          '/textures/earth-night.jpg',
          'https://unpkg.com/three-globe/example/img/earth-night.jpg',
          'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-night.jpg'
        ], 'night'),
        tryLoadTexture([
          '/textures/earth-water.png',
          'https://unpkg.com/three-globe/example/img/earth-water.png',
          'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-water.png'
        ], 'spec'),
        tryLoadTexture([
          '/textures/earth-clouds.png',
          'https://unpkg.com/three-globe/example/img/earth-clouds.png',
          'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_1024.png'
        ], 'clouds')
      ]);

      return { day, night, specular, clouds };
    };

    // Begin async asset streams with correct color spacing
    loadGlobeTextures().then(({ day, night, specular, clouds }) => {
      day.colorSpace = THREE.SRGBColorSpace;
      night.colorSpace = THREE.SRGBColorSpace;

      earthMaterial.uniforms.dayTexture.value = day;
      earthMaterial.uniforms.nightTexture.value = night;
      earthMaterial.uniforms.specTexture.value = specular;

      if (cloudMesh && cloudMesh.material) {
        (cloudMesh.material as THREE.ShaderMaterial).uniforms.cloudTexture.value = clouds;
      }
    });

    // Helper: Convert Lat/Lon coordinates to spherical points
    const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phi) * Math.sin(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);

      return new THREE.Vector3(x, y, z);
    };

    // Fine, Elegant Orbits (highly transparent threads)
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    const createFineOrbit = (radius: number, color: number, rx: number, ry: number, rz: number) => {
      const points: THREE.Vector3[] = [];
      const segments = 120;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.06, // Retains supreme visual focus inside the globe core
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(geo, mat);
      line.rotation.set(rx, ry, rz);
      orbitGroup.add(line);

      return {
        getPosition: (angle: number) => {
          const p = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
          p.applyEuler(new THREE.Euler(rx, ry, rz));
          return p;
        }
      };
    };

    const orbitSystems = [
      createFineOrbit(1.26, 0x00ff77, 0.42, 0.4, 0.1),
      createFineOrbit(1.34, 0x00d2ff, -0.28, 0.70, -0.4),
      createFineOrbit(1.20, 0xff3b55, 0.80, -0.25, 0.45)
    ];

    // Tactical micro satellites
    const satellites: { mesh: THREE.Mesh; orbitIdx: number; speed: number; offset: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const satGeo = new THREE.SphereGeometry(0.0075, 6, 6);
      const satMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x00ff77 : i === 1 ? 0x00d2ff : 0xff3b55,
        transparent: true,
        opacity: 0.85
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      scene.add(satMesh);
      satellites.push({
        mesh: satMesh,
        orbitIdx: i,
        speed: 0.18 + i * 0.05,
        offset: Math.random() * Math.PI * 2
      });
    }

    // Geopolitical monitoring telemetry nodes
    const activeTargets = [
      { lat: 31.9, lon: 35.2, label: 'LEVANT_BASIN', color: 0xff3144 },
      { lat: 48.3, lon: 31.2, label: 'EURO_SECTOR', color: 0xffb300 },
      { lat: 23.5, lon: 121.0, label: 'TAIWAN_STRAIT', color: 0xff3144 },
      { lat: 37.8, lon: 127.1, label: 'EAST_SEA_DMZ', color: 0x00d2ff }
    ];

    const radarRingsList: THREE.Mesh[] = [];
    activeTargets.forEach((tgt) => {
      const surfacePos = latLonToVector3(tgt.lat, tgt.lon, 1.002);
      const locatorGroup = new THREE.Group();
      locatorGroup.position.copy(surfacePos);

      const dir = surfacePos.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
      locatorGroup.setRotationFromQuaternion(quat);

      // Fine, sub-millimeter tactical locator rings
      const circleGeo = new THREE.RingGeometry(0.009, 0.013, 16);
      const circleMat = new THREE.MeshBasicMaterial({
        color: tgt.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const circleMesh = new THREE.Mesh(circleGeo, circleMat);
      circleMesh.rotation.x = Math.PI / 2;
      locatorGroup.add(circleMesh);

      const dotGeo = new THREE.SphereGeometry(0.003, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({ color: tgt.color });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      locatorGroup.add(dotMesh);

      earthMesh.add(locatorGroup);
      radarRingsList.push(circleMesh);
    });

    const globeMarkersList: (any)[] = [];
    GLOBE_HOTSPOTS.forEach(hotspot => {
      const marker = createGlobeMarker(hotspot.lat, hotspot.lon, hotspot.type, earthMesh);
      globeMarkersList.push({
        ...marker,
        phase: hotspot.phase,
        name: hotspot.name
      });
    });

    let firstFrameRendered = false;

    let animationId: number;
    const animateLoop = () => {
      animationId = requestAnimationFrame(animateLoop);

      // Spherical orbital rotations
      earthMesh.rotation.y += rotSpeed;
      cloudMesh.rotation.y += rotSpeed * 1.22;

      // Update satellites coordinates
      satellites.forEach((sat) => {
        const theta = Date.now() * 0.001 * sat.speed + sat.offset;
        const p = orbitSystems[sat.orbitIdx].getPosition(theta);
        sat.mesh.position.copy(p);
      });

      // Pulse tactical coordinate locator dots
      radarRingsList.forEach((ring, idx) => {
        const pulse = 1.0 + Math.sin(Date.now() * 0.0053 + idx * 3.1) * 0.42;
        ring.scale.set(pulse, pulse, 1);
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.70 - (pulse - 1.0) * 1.8);
      });

      // Elegant cinematic camera drift (gives grand sense of space) and slow zoom
      const ticks = Date.now() * 0.00008;
      camera.position.x = Math.sin(ticks) * 0.12;
      camera.position.y = Math.cos(ticks * 0.78) * 0.08;
      
      const curElapsed = elapsedMsRef.current;
      if (curElapsed > 1500) {
        const zoomProgress = Math.min((curElapsed - 1500) / 12000, 1.0);
        camera.position.z = 2.65 - zoomProgress * 0.50; // Subtle z-position zoom down to 2.15
      } else {
        camera.position.z = 2.65;
      }

      // Update each marker's visibility and canvas frames based on curElapsed
      globeMarkersList.forEach((m) => {
        let isRevealed = false;

        // Custom progressive reveal pacing matching exact timeline requirements:
        if (m.phase === 1 && curElapsed >= 4000) {
          // Conflicts (phase 1): 9 hotspots stagger every 400ms from 4.0s
          const staggerIndex = GLOBE_HOTSPOTS.filter(h => h.phase === 1).findIndex(h => h.name === m.name);
          if (curElapsed >= 4000 + staggerIndex * 400) {
            isRevealed = true;
          }
        } else if (m.phase === 2 && curElapsed >= 9000) {
          // Military bases (phase 2): 7 markers stagger every 500ms from 9.0s
          const staggerIndex = GLOBE_HOTSPOTS.filter(h => h.phase === 2).findIndex(h => h.name === m.name);
          if (curElapsed >= 9000 + staggerIndex * 500) {
            isRevealed = true;
          }
        } else if (m.phase === 3 && curElapsed >= 14000) {
          // Nuclear sites (phase 3): 7 markers stagger every 500ms from 14.0s
          const staggerIndex = GLOBE_HOTSPOTS.filter(h => h.phase === 3).findIndex(h => h.name === m.name);
          if (curElapsed >= 14000 + staggerIndex * 500) {
            isRevealed = true;
          }
        } else if (m.phase === 4 && curElapsed >= 19000) {
          // Economic chokepoints (phase 4): 6 markers stagger every 600ms from 19.0s
          const staggerIndex = GLOBE_HOTSPOTS.filter(h => h.phase === 4).findIndex(h => h.name === m.name);
          if (curElapsed >= 19000 + staggerIndex * 600) {
            isRevealed = true;
          }
        }

        if (isRevealed) {
          if (!m.sprite.visible) {
            m.sprite.visible = true;
            try {
              audio.playMarkerPing(m.type);
            } catch (err) {}
          }
          // Animate is active on the HTML Canvas texture
          updateMarkerCanvas(m);
        } else {
          m.sprite.visible = false;
        }
      });

      // Darken during tactical nuclear scenarios (starts at 14.0s)
      let darkenValue = 0.0;
      if (curElapsed >= 14000) {
        darkenValue = Math.min((curElapsed - 14000) / 4000, 1.0) * 0.40;
      }
      if (materialRef.current) {
        materialRef.current.uniforms.darkenFactor.value = darkenValue;
      }

      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);

      if (!firstFrameRendered) {
        firstFrameRendered = true;

        const gl = renderer.getContext();
        const programs = renderer.info.programs;

        // === DIAGNOSTIC CHECKPOINT 4: Shader compilation ===
        console.log('[GLOBE-DEBUG-8] Shader programs compiled:', programs?.length);
        programs?.forEach((prog: any) => {
          console.log('[GLOBE-DEBUG-8-prog]', prog.name, '| usedTimes:', prog.usedTimes);
        });

        // === DIAGNOSTIC CHECKPOINT 5: Check for WebGL errors ===
        const glError = gl.getError();
        if (glError !== gl.NO_ERROR) {
          console.error('[GLOBE-DEBUG-9] ❌ WebGL ERROR code:', glError);
        } else {
          console.log('[GLOBE-DEBUG-9] ✅ No WebGL errors');
        }

        // === DIAGNOSTIC CHECKPOINT 6: Renderer capabilities ===
        console.log('[GLOBE-DEBUG-10] Renderer capabilities:', {
          maxTextures:      renderer.capabilities.maxTextures,
          maxTextureSize:   renderer.capabilities.maxTextureSize,
          floatFragTextures:(renderer.capabilities as any).floatFragmentTextures,
          isWebGL2:         renderer.capabilities.isWebGL2,
          precision:        renderer.capabilities.precision,
        });

        // FIX E: Self healing shader compile crash recovery check
        if (glError !== 0) {
          console.error('[GLOBE-SHADER-ERROR] WebGL error detected. Initializing self-healing fallback to standard MeshPhongMaterial...');
          const fallbackMat = new THREE.MeshPhongMaterial({
            map:              earthMaterial.uniforms.dayTexture.value,
            emissiveMap:      earthMaterial.uniforms.nightTexture.value,
            emissive:         new THREE.Color(0x112244),
            emissiveIntensity: 0.5,
            specular:         new THREE.Color(0x1a4a6a),
            shininess:        30,
          });
          earthMesh.material = fallbackMat as any;
          console.log('[GLOBE-FALLBACK] Successfully recovered using standard MeshPhongMaterial');
        }
      }
    };

    animateLoop();

    // FIX B: Robust resize observer instead of window event listener
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      atmosGeometry.dispose();
      atmosMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      
      // Clean up Globe sprites and textures
      globeMarkersList.forEach(m => {
        try {
          if (m.sprite) {
            earthMesh.remove(m.sprite);
            if (m.sprite.geometry) m.sprite.geometry.dispose();
            if (m.sprite.material) m.sprite.material.dispose();
          }
          if (m.texture) m.texture.dispose();
        } catch (err) {}
      });

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [rotSpeed]);

  return (
    <div 
      id="sovereign-globe-viewport"
      ref={containerRef} 
      className="w-full h-full min-h-[500px] md:min-h-[600px] xl:min-h-[700px] relative overflow-hidden" 
    />
  );
});

export default WebGLGlobe;
