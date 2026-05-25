import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@nanostores/react';
import { activeSection } from '../store/scrollStore';
import { CONFIG } from '../config';
import graphData from '../data/graph_data.json';

// ── Three UI-coherent colors ────────────────────────────────────
const NODE_COLORS = [
  new THREE.Color('#0071e3'), // Apple accent blue
  new THREE.Color('#86868b'), // Apple mid-grey
  new THREE.Color('#d2d2d7'), // Apple border silver
];

const EDGE_BASE   = new THREE.Color('#d2d2d7');
const EDGE_PULSE  = new THREE.Color('#0071e3');

const tempVec3   = new THREE.Vector3();
const tempLookAt = new THREE.Vector3();

// ── Node count & layout ─────────────────────────────────────────
const NODE_COUNT = 400;
const SPHERE_R   = 58;

// ── Shaders: Nodes ──────────────────────────────────────────────
const nodeVert = `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3  aColor;

  varying vec3  vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uDpr;

  void main() {
    vColor = aColor;

    // Soft breath per particle
    float breath = 0.55 + 0.45 * sin(uTime * 0.35 + aPhase * 6.2831);
    vAlpha = breath;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uDpr * (160.0 / -mv.z) * (0.8 + 0.2 * breath);
    gl_Position  = projectionMatrix * mv;
  }
`;

const nodeFrag = `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    // Tight bright core + soft outer halo
    float core = smoothstep(0.5, 0.02, d);
    float halo = smoothstep(0.5, 0.25, d);
    float i    = core * 0.85 + halo * 0.25;

    gl_FragColor = vec4(vColor, i * vAlpha * 0.7);
  }
`;

// ── Shaders: Edges (with electric pulses) ───────────────────────
const edgeVert = `
  attribute float aEdgePhase;
  attribute float aEdgeFrac;

  varying float vFrac;
  varying float vPhase;
  varying float vDepth;

  void main() {
    vFrac  = aEdgeFrac;
    vPhase = aEdgePhase;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth  = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const edgeFrag = `
  uniform float uTime;
  uniform vec3  uBaseColor;
  uniform vec3  uPulseColor;

  varying float vFrac;
  varying float vPhase;
  varying float vDepth;

  void main() {
    // Depth fog — fade far edges
    float fog = smoothstep(30.0, 130.0, vDepth);

    // Base edge opacity (very subtle)
    float baseAlpha = (1.0 - fog) * 0.12;

    // ── Electric pulse ──
    // Each edge has a random phase. The pulse travels from frac=0 → 1
    // with a speed modulated by time. Only some edges pulse at any moment.
    float cycle   = mod(uTime * 0.25 + vPhase * 3.7, 4.0);  // 4s cycle, staggered
    float active  = step(cycle, 1.0);                          // pulse active first 1s of 4s
    float waveFront = mod(cycle, 1.0);                         // 0→1 travel along edge
    float pulse   = active * exp(-12.0 * (vFrac - waveFront) * (vFrac - waveFront));

    // Mix base and pulse
    vec3  col   = mix(uBaseColor, uPulseColor, pulse * 0.9);
    float alpha = baseAlpha + pulse * (1.0 - fog) * 0.55;

    gl_FragColor = vec4(col, alpha);
  }
`;

// ── Helpers ─────────────────────────────────────────────────────
function fibonacciSphere(i, total, radius) {
  const phi   = Math.acos(-1 + (2 * i) / total);
  const theta = Math.sqrt(total * Math.PI) * phi;
  const r     = radius * (0.45 + Math.random() * 0.55);
  const jitter = 6;
  return new THREE.Vector3(
    r * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * jitter,
    r * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * jitter,
    r * Math.cos(phi)                   + (Math.random() - 0.5) * jitter,
  );
}

// Build proximity-based connections (k nearest neighbors)
function buildEdges(positions, k = 3) {
  const edges = [];
  const n = positions.length;

  for (let i = 0; i < n; i++) {
    // Compute distances to all others
    const dists = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      dists.push({ j, d: positions[i].distanceTo(positions[j]) });
    }
    dists.sort((a, b) => a.d - b.d);

    // Connect to k nearest (avoid duplicates via i < j only)
    for (let m = 0; m < Math.min(k, dists.length); m++) {
      const j = dists[m].j;
      if (i < j) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

// ── Component ───────────────────────────────────────────────────
export default function KnowledgeGraph() {
  const groupRef    = useRef(null);
  const nodMatRef   = useRef(null);
  const edgeMatRef  = useRef(null);
  const currentSection = useStore(activeSection);

  const { nodePos, nodeSizes, nodePhases, nodeColors, edgePositions, edgePhases, edgeFracs } = useMemo(() => {
    // ── Generate nodes ──
    const pts = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      pts.push(fibonacciSphere(i, NODE_COUNT, SPHERE_R));
    }

    const pos    = new Float32Array(NODE_COUNT * 3);
    const sizes  = new Float32Array(NODE_COUNT);
    const phases = new Float32Array(NODE_COUNT);
    const colors = new Float32Array(NODE_COUNT * 3);

    for (let i = 0; i < NODE_COUNT; i++) {
      pos[i * 3]     = pts[i].x;
      pos[i * 3 + 1] = pts[i].y;
      pos[i * 3 + 2] = pts[i].z;

      sizes[i]  = 1.0 + Math.random() * 2.2;
      phases[i] = Math.random();

      const c = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    // ── Generate edges (k-NN proximity) ──
    const edges = buildEdges(pts, 3);

    // For each edge, we need 2 vertices (start & end).
    // We also need per-vertex attributes: aEdgePhase (same for both verts of an edge)
    // and aEdgeFrac (0.0 for start, 1.0 for end) so the pulse can travel.
    const ePos    = new Float32Array(edges.length * 6); // 2 verts × 3 coords
    const ePhases = new Float32Array(edges.length * 2); // 2 verts × 1 phase
    const eFracs  = new Float32Array(edges.length * 2); // 2 verts × 1 frac

    for (let e = 0; e < edges.length; e++) {
      const [i, j] = edges[e];
      const phase = Math.random();

      // Start vertex
      ePos[e * 6]     = pts[i].x;
      ePos[e * 6 + 1] = pts[i].y;
      ePos[e * 6 + 2] = pts[i].z;
      // End vertex
      ePos[e * 6 + 3] = pts[j].x;
      ePos[e * 6 + 4] = pts[j].y;
      ePos[e * 6 + 5] = pts[j].z;

      ePhases[e * 2]     = phase;
      ePhases[e * 2 + 1] = phase;

      eFracs[e * 2]     = 0.0;
      eFracs[e * 2 + 1] = 1.0;
    }

    return {
      nodePos: pos, nodeSizes: sizes, nodePhases: phases, nodeColors: colors,
      edgePositions: ePos, edgePhases: ePhases, edgeFracs: eFracs,
    };
  }, []);

  const nodeUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDpr:  { value: Math.min(window.devicePixelRatio, 2) },
  }), []);

  const edgeUniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uBaseColor:  { value: EDGE_BASE },
    uPulseColor: { value: EDGE_PULSE },
  }), []);

  useFrame((state, delta) => {
    const target = CONFIG.cameraStops[currentSection] || CONFIG.cameraStops.hero;

    tempVec3.set(...target.position);
    state.camera.position.lerp(tempVec3, delta * 1.8);

    tempLookAt.set(...target.lookAt);
    if (!state.camera.userData.currentLookAt) {
      state.camera.userData.currentLookAt = new THREE.Vector3(0, 0, 0);
    }
    state.camera.userData.currentLookAt.lerp(tempLookAt, delta * 1.8);
    state.camera.lookAt(state.camera.userData.currentLookAt);

    // Dreamy slow rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.012;
      groupRef.current.rotation.x += delta * 0.004;
    }

    const t = state.clock.getElapsedTime();
    if (nodMatRef.current)  nodMatRef.current.uniforms.uTime.value = t;
    if (edgeMatRef.current) edgeMatRef.current.uniforms.uTime.value = t;
  });

  return (
    <group ref={groupRef}>
      {/* ── Edges with electric pulses ── */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position"   count={edgePositions.length / 3} array={edgePositions} itemSize={3} />
          <bufferAttribute attach="attributes-aEdgePhase" count={edgePhases.length}        array={edgePhases}    itemSize={1} />
          <bufferAttribute attach="attributes-aEdgeFrac"  count={edgeFracs.length}         array={edgeFracs}     itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          ref={edgeMatRef}
          vertexShader={edgeVert}
          fragmentShader={edgeFrag}
          uniforms={edgeUniforms}
          transparent
          depthWrite={false}
        />
      </lineSegments>

      {/* ── Glowing nodes ── */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={NODE_COUNT} array={nodePos}    itemSize={3} />
          <bufferAttribute attach="attributes-aSize"    count={NODE_COUNT} array={nodeSizes}  itemSize={1} />
          <bufferAttribute attach="attributes-aPhase"   count={NODE_COUNT} array={nodePhases} itemSize={1} />
          <bufferAttribute attach="attributes-aColor"   count={NODE_COUNT} array={nodeColors} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          ref={nodMatRef}
          vertexShader={nodeVert}
          fragmentShader={nodeFrag}
          uniforms={nodeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
