import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@nanostores/react';
import { activeSection } from '../store/scrollStore';
import { CONFIG } from '../config';

// ── Point cloud config ──────────────────────────────────────────
const POINT_COUNT = 600;
const SPHERE_RADIUS = 65;

// Soft pastel palette — Apple Vision Pro vibes
const PALETTE = [
  new THREE.Color('#b8c6db'), // steel blue
  new THREE.Color('#c4b7d4'), // lavender
  new THREE.Color('#a8d8c8'), // mint
  new THREE.Color('#d4c5a9'), // warm sand
  new THREE.Color('#c0d6e4'), // ice blue
  new THREE.Color('#d1b8c3'), // rose
];

const tempVec3 = new THREE.Vector3();
const tempLookAt = new THREE.Vector3();

// ── Custom shaders ──────────────────────────────────────────────
const vertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3  aColor;

  varying vec3  vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vColor = aColor;

    // Gentle breathing per particle
    float breath = 0.6 + 0.4 * sin(uTime * 0.4 + aPhase * 6.2831);
    vAlpha = breath;

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);

    // Size attenuates with distance (like gl_PointSize)
    gl_PointSize = aSize * uPixelRatio * (180.0 / -mvPos.z) * breath;
    gl_Position  = projectionMatrix * mvPos;
  }
`;

const fragmentShader = `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Radial gradient → soft circle with feathered edge
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    // Two-band glow: bright core + soft halo
    float core = smoothstep(0.5, 0.05, d);   // tight bright center
    float halo = smoothstep(0.5, 0.20, d);   // wider soft glow

    float intensity = core * 0.9 + halo * 0.3;
    float alpha     = intensity * vAlpha * 0.55;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ── Generate random points on a sphere with jitter ──────────────
function generateCloud() {
  const positions = new Float32Array(POINT_COUNT * 3);
  const sizes     = new Float32Array(POINT_COUNT);
  const phases    = new Float32Array(POINT_COUNT);
  const colors    = new Float32Array(POINT_COUNT * 3);

  for (let i = 0; i < POINT_COUNT; i++) {
    // Fibonacci sphere distribution for even coverage
    const phi   = Math.acos(-1 + (2 * i) / POINT_COUNT);
    const theta = Math.sqrt(POINT_COUNT * Math.PI) * phi;

    // Vary radius so it's not a perfect shell — more like a cloud
    const r = SPHERE_RADIUS * (0.4 + Math.random() * 0.6);

    positions[i * 3]     = r * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = r * Math.cos(phi)                   + (Math.random() - 0.5) * 8;

    sizes[i]  = 1.2 + Math.random() * 2.5;   // varied dot sizes
    phases[i] = Math.random();                 // desync breathing

    const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  return { positions, sizes, phases, colors };
}

// ── Component ───────────────────────────────────────────────────
export default function KnowledgeGraph() {
  const groupRef    = useRef(null);
  const materialRef = useRef(null);
  const currentSection = useStore(activeSection);

  const { positions, sizes, phases, colors } = useMemo(generateCloud, []);

  const uniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  }), []);

  useFrame((state, delta) => {
    // Camera fly-through driven by scroll section
    const target = CONFIG.cameraStops[currentSection] || CONFIG.cameraStops.hero;

    tempVec3.set(...target.position);
    state.camera.position.lerp(tempVec3, delta * 1.8);

    tempLookAt.set(...target.lookAt);
    if (!state.camera.userData.currentLookAt) {
      state.camera.userData.currentLookAt = new THREE.Vector3(0, 0, 0);
    }
    state.camera.userData.currentLookAt.lerp(tempLookAt, delta * 1.8);
    state.camera.lookAt(state.camera.userData.currentLookAt);

    // Slow dreamy rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.012;
      groupRef.current.rotation.x += delta * 0.003;
    }

    // Update time
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={POINT_COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-aSize"    count={POINT_COUNT} array={sizes}     itemSize={1} />
          <bufferAttribute attach="attributes-aPhase"   count={POINT_COUNT} array={phases}    itemSize={1} />
          <bufferAttribute attach="attributes-aColor"   count={POINT_COUNT} array={colors}    itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
