import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Unit } from '../../types';

// ==========================================
// 1. PROCEDURAL BUILDERS (AAA STANDARDS)
// ==========================================

export function createProceduralCarrier(): THREE.Group {
  const group = new THREE.Group();

  // Elongated main deck (rough metal texture grey steel)
  const deckGeo = new THREE.BoxGeometry(0.09, 0.005, 0.024);
  const deckMat = new THREE.MeshPhongMaterial({
    color: 0x1f2326,
    emissive: 0x07080a,
    shininess: 30,
    flatShading: true,
  });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.name = "deck";
  group.add(deck);

  // Angled flight deck offset left
  const angledGeo = new THREE.BoxGeometry(0.05, 0.004, 0.012);
  const angledMat = new THREE.MeshPhongMaterial({
    color: 0x181b1d,
    emissive: 0x050607,
    shininess: 30,
    flatShading: true,
  });
  const angledDeck = new THREE.Mesh(angledGeo, angledMat);
  angledDeck.position.set(-0.01, 0.001, -0.006);
  angledDeck.rotation.y = -Math.PI / 18; // ~10 degrees out
  group.add(angledDeck);

  // Tower / Island superstructure (Right side)
  const towerGeo = new THREE.BoxGeometry(0.012, 0.018, 0.006);
  const towerMat = new THREE.MeshPhongMaterial({
    color: 0x2b3136,
    shininess: 45,
    flatShading: true,
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.set(0.015, 0.01, 0.007);
  group.add(tower);

  // Master Radar Mast
  const mastGeo = new THREE.CylinderGeometry(0.0008, 0.0015, 0.012, 4);
  const mast = new THREE.Mesh(mastGeo, towerMat);
  mast.position.set(0.015, 0.022, 0.007);
  group.add(mast);

  // Glowing warning signal lights (Navigational Red / Green beacons)
  const beaconMatRed = new THREE.MeshBasicMaterial({ color: 0xff003c });
  const beaconMatGreen = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
  const beaconGeo = new THREE.SphereGeometry(0.0012, 4, 4);

  const starRed = new THREE.Mesh(beaconGeo, beaconMatRed);
  starRed.position.set(-0.043, 0.003, -0.011);
  group.add(starRed);

  const starGreen = new THREE.Mesh(beaconGeo, beaconMatGreen);
  starGreen.position.set(0.043, 0.003, 0.011);
  group.add(starGreen);

  // Runway lines (visual authenticity)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  const centerlineGeo = new THREE.BoxGeometry(0.065, 0.001, 0.0008);
  const centerline = new THREE.Mesh(centerlineGeo, lineMat);
  centerline.position.set(0.0, 0.0031, 0.002);
  group.add(centerline);

  const angleLineGeo = new THREE.BoxGeometry(0.045, 0.001, 0.0006);
  const angleLine = new THREE.Mesh(angleLineGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
  angleLine.position.set(-0.01, 0.0032, -0.006);
  angleLine.rotation.y = -Math.PI / 18;
  group.add(angleLine);

  group.scale.set(1, 1, 1);
  return group;
}

export function createProceduralSubmarine(): THREE.Group {
  const group = new THREE.Group();

  // Main teardrop pressure hull
  const hullGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.045, 8);
  const hullMat = new THREE.MeshPhongMaterial({
    color: 0x0e1114,
    emissive: 0x020304,
    shininess: 15,
    flatShading: true,
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.rotation.x = Math.PI / 2; // lie horizontal along z-axis
  group.add(hull);

  // Pointy hull rounded bow cap
  const bowGeo = new THREE.SphereGeometry(0.006, 8, 8);
  const bow = new THREE.Mesh(bowGeo, hullMat);
  bow.position.set(0, 0, 0.0225);
  group.add(bow);

  // Tapered stern cap
  const sternGeo = new THREE.ConeGeometry(0.006, 0.015, 8);
  const stern = new THREE.Mesh(sternGeo, hullMat);
  stern.position.set(0, 0, -0.03);
  stern.rotation.x = -Math.PI / 2;
  group.add(stern);

  // Conning Tower / Sail (sleek profile on top)
  const sailGeo = new THREE.BoxGeometry(0.003, 0.007, 0.010);
  const sail = new THREE.Mesh(sailGeo, hullMat);
  sail.position.set(0, 0.007, 0.006);
  group.add(sail);

  // Mini Dive Planes/Fins
  const finGeo = new THREE.BoxGeometry(0.012, 0.001, 0.004);
  const fin = new THREE.Mesh(finGeo, hullMat);
  fin.position.set(0, 0, -0.03);
  group.add(fin);

  const vertFinGeo = new THREE.BoxGeometry(0.001, 0.012, 0.004);
  const vertFin = new THREE.Mesh(vertFinGeo, hullMat);
  vertFin.position.set(0, 0, -0.03);
  group.add(vertFin);

  group.scale.set(1, 1, 1);
  return group;
}

export function createProceduralFighter(): THREE.Group {
  const group = new THREE.Group();

  // Sleek tapered fuselage
  const bodyGeo = new THREE.CylinderGeometry(0.0005, 0.0035, 0.03, 6);
  const bodyMat = new THREE.MeshPhongMaterial({
    color: 0x4d555c,
    emissive: 0x050607,
    shininess: 50,
    flatShading: true,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2; // face forward along z-axis
  group.add(body);

  // Radome pointed nose
  const noseGeo = new THREE.ConeGeometry(0.0035, 0.012, 6);
  const noseMat = new THREE.MeshPhongMaterial({
    color: 0x222629,
    shininess: 40,
  });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 0, 0.021);
  nose.rotation.x = Math.PI / 2;
  group.add(nose);

  // Delta Wings (swept back)
  const wingGeo = new THREE.BoxGeometry(0.025, 0.0006, 0.009);
  const wing = new THREE.Mesh(wingGeo, bodyMat);
  wing.position.set(0, -0.0005, -0.003);
  wing.rotation.y = Math.PI / 36; // slight angle sweep
  group.add(wing);

  // Twin Tail fins angled outward
  const tailGeo = new THREE.BoxGeometry(0.0005, 0.007, 0.006);
  const tailLeft = new THREE.Mesh(tailGeo, bodyMat);
  tailLeft.position.set(-0.002, 0.004, -0.012);
  tailLeft.rotation.z = -Math.PI / 12; // angled outward
  group.add(tailLeft);

  const tailRight = new THREE.Mesh(tailGeo, bodyMat);
  tailRight.position.set(0.002, 0.004, -0.012);
  tailRight.rotation.z = Math.PI / 12;
  group.add(tailRight);

  // Glowing Engine exhausts (yellow glow)
  const exhaustGeo = new THREE.CylinderGeometry(0.0018, 0.001, 0.004, 6);
  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  exhaust.position.set(0, 0, -0.016);
  exhaust.rotation.x = Math.PI / 2;
  group.add(exhaust);

  group.scale.set(1, 1, 1);
  return group;
}

export function createProceduralMissile(): THREE.Group {
  const group = new THREE.Group();

  // Cylindrical fuselage rocket booster
  const bodyGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 0.025, 6);
  const bodyMat = new THREE.MeshPhongMaterial({
    color: 0xd9e3eb,
    emissive: 0x11151a,
    shininess: 80,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Warning nose cone payload
  const noseGeo = new THREE.ConeGeometry(0.0022, 0.008, 6);
  const noseMat = new THREE.MeshPhongMaterial({
    color: 0xff253b,
    emissive: 0x4a0008,
    shininess: 90,
  });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 0, 0.0165);
  nose.rotation.x = Math.PI / 2;
  group.add(nose);

  // Guidance stability fins
  const finGeo = new THREE.BoxGeometry(0.007, 0.0005, 0.004);
  const fin = new THREE.Mesh(finGeo, noseMat);
  fin.position.set(0, 0, -0.010);
  group.add(fin);

  const vertFin = new THREE.Mesh(finGeo, noseMat);
  vertFin.position.set(0, 0, -0.010);
  vertFin.rotation.z = Math.PI / 2;
  group.add(vertFin);

  // Glowing thruster
  const emitterGeo = new THREE.CylinderGeometry(0.0012, 0.0008, 0.002, 6);
  const emitterMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
  const emitter = new THREE.Mesh(emitterGeo, emitterMat);
  emitter.position.set(0, 0, -0.013);
  emitter.rotation.x = Math.PI / 2;
  group.add(emitter);

  group.scale.set(1, 1, 1);
  return group;
}


// ==========================================
// 2. GLB LOADING PASS & CACHE SYSTEM
// ==========================================

export class MilitaryLoader {
  private loader: GLTFLoader;
  private cache: Record<string, THREE.Group> = {};

  constructor() {
    this.loader = new GLTFLoader();
  }

  loadModel(
    type: 'carrier' | 'sub' | 'fighter' | 'missile',
    url: string,
    onSuccess: (g: THREE.Group) => void
  ) {
    if (this.cache[type]) {
      onSuccess(this.cache[type].clone());
      return;
    }

    this.loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;
        this.normalizeModel(root, type);
        this.cache[type] = root;
        onSuccess(root.clone());
      },
      undefined,
      (err) => {
        console.warn(`[3D-ASSETS-WARN] Failed loading GLB: ${url}. Gracefully deploying procedural fallback.`, err);
        // Invoke fallback creation directly!
        let fallback: THREE.Group;
        if (type === 'carrier') fallback = createProceduralCarrier();
        else if (type === 'sub') fallback = createProceduralSubmarine();
        else if (type === 'fighter') fallback = createProceduralFighter();
        else fallback = createProceduralMissile();
        
        this.cache[type] = fallback;
        onSuccess(fallback);
      }
    );
  }

  // Model consolidation, normalization pass
  private normalizeModel(root: THREE.Group, type: string) {
    // 1. Compute bounds
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // 2. Reset coordinates pivot offset so it rests squarely centered
    root.position.sub(center);

    // 3. Define bounding parameters based on targets
    let targetSize = 0.05;
    if (type === 'carrier') targetSize = 0.11;
    else if (type === 'sub') targetSize = 0.07;
    else if (type === 'fighter') targetSize = 0.035;
    else if (type === 'missile') targetSize = 0.025;

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = targetSize / maxDim;
      root.scale.set(scale, scale, scale);
    }

    // 4. Force serious professional military materials
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (m instanceof THREE.MeshStandardMaterial) {
              m.roughness = Math.max(m.roughness ?? 0, 0.7);
              m.metalness = Math.max(m.metalness ?? 0, 0.1);
              m.flatShading = true;
            } else if (m instanceof THREE.MeshPhongMaterial) {
              m.flatShading = true;
            }
          });
        }
      }
    });
  }
}


// ==========================================
// 3. WAKE & PARTICLE EFFECT SYSTEM MANAGERS
// ==========================================

interface ParticleItem {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  age: number; // 0 (new) to 1 (dead)
  maxAge: number;
  spreadWidth: number;
}

export class WakeSystemManager {
  private particles: ParticleItem[] = [];
  private points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private positions: Float32Array;
  private opacities: Float32Array;
  private maxPoints = 200;

  constructor(color = 0x88ccff) {
    this.geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxPoints * 3);
    this.opacities = new Float32Array(this.maxPoints);

    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    // Custom material with canvas textures or point texture
    const mat = new THREE.PointsMaterial({
      color: color,
      size: 0.007,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geo, mat);
  }

  getMesh(): THREE.Points {
    return this.points;
  }

  emit(position: THREE.Vector3, forward: THREE.Vector3, speed = 0.004) {
    // Find first dead/empty particle, or eject oldest
    const sternPos = position.clone().addScaledVector(forward, -0.045); // offset to carrier rear
    const backward = forward.clone().negate().normalize();

    // Spawn 1 or 2 particles per frame
    for (let j = 0; j < 2; j++) {
      const p: ParticleItem = {
        pos: sternPos.clone(),
        dir: backward.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15
        )).normalize(),
        age: 0,
        maxAge: 40 + Math.random() * 30,
        spreadWidth: 0.001 + Math.random() * 0.0015,
      };

      if (this.particles.length < this.maxPoints) {
        this.particles.push(p);
      } else {
        // Recycle oldest
        this.particles.shift();
        this.particles.push(p);
      }
    }
  }

  update() {
    const posAttr = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const opAttr = this.geo.getAttribute('opacity') as THREE.BufferAttribute;

    for (let i = 0; i < this.maxPoints; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        p.age += 1;
        const progress = p.age / p.maxAge;

        // Drift backward
        p.pos.addScaledVector(p.dir, 0.001);

        // Expand V-width slightly
        const normalDir = p.pos.clone().normalize();
        const lateral = new THREE.Vector3().crossVectors(p.dir, normalDir).normalize();
        p.pos.addScaledVector(lateral, (Math.random() - 0.5) * p.spreadWidth);

        posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
        
        // Exponential fade
        const op = Math.max(0, 1.0 - Math.pow(progress, 1.8)) * 0.6;
        opAttr.setX(i, op);

        if (progress >= 1.0) {
          // Remove/reset
          this.particles.splice(i, 1);
          i--;
        }
      } else {
        posAttr.setXYZ(i, 0, 0, 0);
        opAttr.setX(i, 0.0);
      }
    }

    posAttr.needsUpdate = true;
    opAttr.needsUpdate = true;
  }

  destroy() {
    this.geo.dispose();
    if (Array.isArray(this.points.material)) {
      this.points.material.forEach((m) => m.dispose());
    } else {
      this.points.material.dispose();
    }
  }
}

export class BubbleSystemManager {
  private particles: ParticleItem[] = [];
  private points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private positions: Float32Array;
  private opacities: Float32Array;
  private maxPoints = 120;

  constructor() {
    this.geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxPoints * 3);
    this.opacities = new Float32Array(this.maxPoints);

    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xaaddee,
      size: 0.005,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geo, mat);
  }

  getMesh() { return this.points; }

  emit(position: THREE.Vector3, forward: THREE.Vector3) {
    const sternPos = position.clone().addScaledVector(forward, -0.025);
    for (let j = 0; j < 1; j++) {
      const p: ParticleItem = {
        pos: sternPos.clone(),
        dir: position.clone().normalize().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        )).normalize(), // flows towards surface (normal axis out)
        age: 0,
        maxAge: 30 + Math.random() * 20,
        spreadWidth: 0.0005,
      };
      if (this.particles.length < this.maxPoints) this.particles.push(p);
      else {
        this.particles.shift();
        this.particles.push(p);
      }
    }
  }

  update() {
    const posAttr = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const opAttr = this.geo.getAttribute('opacity') as THREE.BufferAttribute;

    for (let i = 0; i < this.maxPoints; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        p.age += 1;
        const progress = p.age / p.maxAge;

        // Rise to surface
        p.pos.addScaledVector(p.dir, 0.001);

        posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
        const op = Math.max(0, 1.0 - progress) * 0.45;
        opAttr.setX(i, op);

        if (progress >= 1.0) {
          this.particles.splice(i, 1);
          i--;
        }
      } else {
        posAttr.setXYZ(i, 0, 0, 0);
        opAttr.setX(i, 0.0);
      }
    }
    posAttr.needsUpdate = true;
    opAttr.needsUpdate = true;
  }

  destroy() {
    this.geo.dispose();
    if (Array.isArray(this.points.material)) {
      this.points.material.forEach((m) => m.dispose());
    } else {
      this.points.material.dispose();
    }
  }
}

export class RocketExhaustManager {
  private particles: ParticleItem[] = [];
  private points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private positions: Float32Array;
  private opacities: Float32Array;
  private maxPoints = 150;

  constructor() {
    this.geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxPoints * 3);
    this.opacities = new Float32Array(this.maxPoints);

    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xff3a12, // bright fire red-orange
      size: 0.012,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geo, mat);
  }

  getMesh() { return this.points; }

  emit(sternPos: THREE.Vector3, backwardDir: THREE.Vector3) {
    for (let j = 0; j < 3; j++) {
      const p: ParticleItem = {
        pos: sternPos.clone(),
        dir: backwardDir.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        )).normalize(), 
        age: 0,
        maxAge: 15 + Math.random() * 10,
        spreadWidth: 0.002,
      };
      if (this.particles.length < this.maxPoints) this.particles.push(p);
      else {
        this.particles.shift();
        this.particles.push(p);
      }
    }
  }

  update() {
    const posAttr = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const opAttr = this.geo.getAttribute('opacity') as THREE.BufferAttribute;

    for (let i = 0; i < this.maxPoints; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        p.age += 1;
        const progress = p.age / p.maxAge;

        p.pos.addScaledVector(p.dir, 0.0018); // move outward fast

        posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
        const op = Math.max(0, 1.0 - progress) * 0.85;
        opAttr.setX(i, op);

        if (progress >= 1.0) {
          this.particles.splice(i, 1);
          i--;
        }
      } else {
        posAttr.setXYZ(i, 0, 0, 0);
        opAttr.setX(i, 0.0);
      }
    }
    posAttr.needsUpdate = true;
    opAttr.needsUpdate = true;
  }

  destroy() {
    this.geo.dispose();
    if (Array.isArray(this.points.material)) {
      this.points.material.forEach((m) => m.dispose());
    } else {
      this.points.material.dispose();
    }
  }
}
