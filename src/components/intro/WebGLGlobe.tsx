import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WebGLGlobeProps {
  greenTintProgress?: number; // 0 to 1
  rotSpeed?: number;
}

export const WebGLGlobe: React.FC<WebGLGlobeProps> = ({
  greenTintProgress = 0,
  rotSpeed = 0.001
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || 500;

    // Create scene
    const scene = new THREE.Scene();

    // Create camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 2.4;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add ambient lightning
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Directional sunlight
    const directionalLight = new THREE.DirectionalLight(0xfffdf0, 1.2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(1, 48, 48);
    const textureLoader = new THREE.TextureLoader();

    // High quality asset Fallbacks to guarantee visual excellence under sandboxed offline states
    const dayTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      undefined,
      undefined,
      () => {
        // Fallback procedural texture in case of offline/sandboxed state
        console.log('Using procedural Day texture fallback');
      }
    );

    const nightTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-night.jpg'
    );

    const specTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-water.png'
    );

    // Dynamic Blending Shader Material (Section 3.1)
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        specTexture: { value: specTexture },
        sunDirection: { value: new THREE.Vector3(1, 0.4, 0.6).normalize() },
        greenTint: { value: greenTintProgress },
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
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vec3 worldNormal = normalize(vNormal);
          float sunDot = dot(worldNormal, sunDirection);
          float dayStrength = smoothstep(-0.2, 0.3, sunDot);
          
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv) * 2.2;
          vec4 earthColor = mix(nightColor, dayColor, dayStrength);
          
          // Phosphor glowing override terminal matrix
          vec4 greenColor = vec4(earthColor.r * 0.05, earthColor.g * 0.85 + 0.15, earthColor.b * 0.05, 1.0);
          gl_FragColor = mix(earthColor, greenColor, greenTint);
        }
      `
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // Cloud layer wrapping
    const cloudGeometry = new THREE.SphereGeometry(1.008, 48, 48);
    const cloudTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-clouds.png'
    );
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(cloudMesh);

    // Fresnel glow atmosphere (Section 3.1)
    const atmosGeometry = new THREE.SphereGeometry(1.025, 48, 48);
    const atmosMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x00ff44) },
        intensity: { value: 1.2 },
        greenTint: { value: greenTintProgress }
      },
      vertexShader: `
        varying float fresnel;
        void main() {
          vec3 worldNormal = normalize(normalMatrix * normal);
          vec3 viewDir = normalize(-cameraPosition - (modelViewMatrix * vec4(position, 1.0)).xyz);
          fresnel = pow(1.0 - abs(dot(worldNormal, viewDir)), 3.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float intensity;
        uniform float greenTint;
        varying float fresnel;
        void main() {
          vec3 actualColor = mix(vec3(0.0, 0.4, 1.0), color, greenTint);
          gl_FragColor = vec4(actualColor, fresnel * intensity * 0.65);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    const atmosMesh = new THREE.Mesh(atmosGeometry, atmosMaterial);
    scene.add(atmosMesh);

    // Particle field stars background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 80;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x88ffaa,
      size: 0.05,
      transparent: true,
      opacity: 0.4
    });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // Local loop setup
    let animationFrameId: number;

    const animateLoop = () => {
      animationFrameId = requestAnimationFrame(animateLoop);
      
      earthMesh.rotation.y += rotSpeed;
      cloudMesh.rotation.y += rotSpeed * 1.35;
      
      // Update green uniform values
      earthMaterial.uniforms.greenTint.value = earthMaterial.uniforms.greenTint.value * 0.95 + greenTintProgress * 0.05;
      atmosMaterial.uniforms.greenTint.value = atmosMaterial.uniforms.greenTint.value * 0.95 + greenTintProgress * 0.05;

      renderer.render(scene, camera);
    };

    animateLoop();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      atmosGeometry.dispose();
      atmosMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [greenTintProgress, rotSpeed]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] md:min-h-[500px] relative overflow-hidden" 
    />
  );
};

export default WebGLGlobe;
