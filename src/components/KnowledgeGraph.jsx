import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@nanostores/react';
import { activeSection } from '../store/scrollStore';
import { CONFIG } from '../config';

// ── Palette: 3 colors from UI ──────────────────────────────────
const NODE_PALETTE = [
  [0.0, 0.443, 0.890],  // #0071e3 — Apple blue
  [0.525, 0.525, 0.545], // #86868b — mid grey
  [0.824, 0.824, 0.843], // #d2d2d7 — silver
];

const EDGE_BASE_R = 0.78, EDGE_BASE_G = 0.78, EDGE_BASE_B = 0.80;  // #c7c7cc
const PULSE_R = 1.0, PULSE_G = 0.42, PULSE_B = 0.21;               // #ff6b35

const NODE_COUNT = 350;
const SPHERE_R = 55;
const K_NEIGHBORS = 3;

const tempVec3 = new THREE.Vector3();
const tempLookAt = new THREE.Vector3();

// ── Build point cloud + edges ───────────────────────────────────
function buildGraph() {
  // Fibonacci sphere with radial jitter
  const pts = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
    const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
    const r = SPHERE_R * (0.35 + Math.random() * 0.65);
    const jitter = 5;
    pts.push(new THREE.Vector3(
      r * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * jitter,
      r * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * jitter,
      r * Math.cos(phi) + (Math.random() - 0.5) * jitter,
    ));
  }

  // Node geometry (Points)
  const nodePositions = new Float32Array(NODE_COUNT * 3);
  const nodeColors = new Float32Array(NODE_COUNT * 3);
  const nodeSizes = new Float32Array(NODE_COUNT);
  const nodePhases = new Float32Array(NODE_COUNT);

  for (let i = 0; i < NODE_COUNT; i++) {
    nodePositions[i * 3] = pts[i].x;
    nodePositions[i * 3 + 1] = pts[i].y;
    nodePositions[i * 3 + 2] = pts[i].z;

    const c = NODE_PALETTE[Math.floor(Math.random() * NODE_PALETTE.length)];
    nodeColors[i * 3] = c[0];
    nodeColors[i * 3 + 1] = c[1];
    nodeColors[i * 3 + 2] = c[2];

    nodeSizes[i] = 1.5 + Math.random() * 2.0;
    nodePhases[i] = Math.random() * Math.PI * 2;
  }

  // K-NN edges
  const edgeList = [];
  const edgeSet = new Set();
  for (let i = 0; i < NODE_COUNT; i++) {
    const dists = [];
    for (let j = 0; j < NODE_COUNT; j++) {
      if (i === j) continue;
      dists.push({ j, d: pts[i].distanceTo(pts[j]) });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let m = 0; m < K_NEIGHBORS; m++) {
      const j = dists[m].j;
      const key = Math.min(i, j) + '_' + Math.max(i, j);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edgeList.push([i, j]);
      }
    }
  }

  // Edge geometry (LineSegments: pairs of vertices)
  const edgeCount = edgeList.length;
  const edgePositions = new Float32Array(edgeCount * 6);  // 2 verts × 3
  const edgeColors = new Float32Array(edgeCount * 6);     // 2 verts × 3 (vertex colors)
  const edgeMeta = [];  // per-edge metadata for animation

  for (let e = 0; e < edgeCount; e++) {
    const [i, j] = edgeList[e];
    edgePositions[e * 6] = pts[i].x;
    edgePositions[e * 6 + 1] = pts[i].y;
    edgePositions[e * 6 + 2] = pts[i].z;
    edgePositions[e * 6 + 3] = pts[j].x;
    edgePositions[e * 6 + 4] = pts[j].y;
    edgePositions[e * 6 + 5] = pts[j].z;

    // Base color
    edgeColors[e * 6] = EDGE_BASE_R;
    edgeColors[e * 6 + 1] = EDGE_BASE_G;
    edgeColors[e * 6 + 2] = EDGE_BASE_B;
    edgeColors[e * 6 + 3] = EDGE_BASE_R;
    edgeColors[e * 6 + 4] = EDGE_BASE_G;
    edgeColors[e * 6 + 5] = EDGE_BASE_B;

    edgeMeta.push({
      phase: Math.random() * 10,        // random time offset
      speed: 0.3 + Math.random() * 0.4, // pulse speed variation
      duration: 0.8 + Math.random() * 0.4,
      cooldown: 2.0 + Math.random() * 3.0,
    });
  }

  return { nodePositions, nodeColors, nodeSizes, nodePhases, edgePositions, edgeColors, edgeCount, edgeMeta };
}

// ── Node shaders (these work — proven) ──────────────────────────
const nodeVert = `
  attribute float aSize;
  attribute float aPhase;

  varying vec3 vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uDpr;

  void main() {
    vColor = color;
    float breath = 0.55 + 0.45 * sin(uTime * 0.35 + aPhase);
    vAlpha = breath;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uDpr * (150.0 / -mv.z) * (0.8 + 0.2 * breath);
    gl_Position = projectionMatrix * mv;
  }
`;

const nodeFrag = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.02, d);
    float halo = smoothstep(0.5, 0.25, d);
    float i = core * 0.85 + halo * 0.25;
    gl_FragColor = vec4(vColor, i * vAlpha * 0.7);
  }
`;

// ── Main component ──────────────────────────────────────────────
export default function KnowledgeGraph() {
  const groupRef = useRef(null);
  const edgeColorRef = useRef(null);
  const nodeMatRef = useRef(null);
  const currentSection = useStore(activeSection);

  const graph = useMemo(buildGraph, []);

  const nodeUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDpr: { value: Math.min(window.devicePixelRatio, 2) },
  }), []);

  useFrame((state, delta) => {
    // ── Camera fly-through ──
    const target = CONFIG.cameraStops[currentSection] || CONFIG.cameraStops.hero;
    tempVec3.set(...target.position);
    state.camera.position.lerp(tempVec3, delta * 1.8);

    tempLookAt.set(...target.lookAt);
    if (!state.camera.userData.currentLookAt) {
      state.camera.userData.currentLookAt = new THREE.Vector3(0, 0, 0);
    }
    state.camera.userData.currentLookAt.lerp(tempLookAt, delta * 1.8);
    state.camera.lookAt(state.camera.userData.currentLookAt);

    // Dreamy rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.012;
      groupRef.current.rotation.x += delta * 0.004;
    }

    // ── Animate edge vertex colors (pulse effect) ──
    const t = state.clock.getElapsedTime();
    if (edgeColorRef.current) {
      const colors = edgeColorRef.current.array;

      for (let e = 0; e < graph.edgeCount; e++) {
        const meta = graph.edgeMeta[e];
        const totalCycle = meta.duration + meta.cooldown;
        const cycle = ((t * meta.speed + meta.phase) % totalCycle);
        
        let pulseIntensity = 0;
        if (cycle < meta.duration) {
          // Active pulse — both vertices glow simultaneously
          const progress = cycle / meta.duration;
          // Bell curve: peak at middle of duration
          pulseIntensity = Math.sin(progress * Math.PI);
        }

        // Lerp between base color and pulse color
        const r = EDGE_BASE_R + (PULSE_R - EDGE_BASE_R) * pulseIntensity;
        const g = EDGE_BASE_G + (PULSE_G - EDGE_BASE_G) * pulseIntensity;
        const b = EDGE_BASE_B + (PULSE_B - EDGE_BASE_B) * pulseIntensity;

        // Both vertices of this edge
        colors[e * 6]     = r;
        colors[e * 6 + 1] = g;
        colors[e * 6 + 2] = b;
        colors[e * 6 + 3] = r;
        colors[e * 6 + 4] = g;
        colors[e * 6 + 5] = b;
      }

      edgeColorRef.current.needsUpdate = true;
    }

    // Update node time
    if (nodeMatRef.current) {
      nodeMatRef.current.uniforms.uTime.value = t;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Edges: standard LineSegments + vertex colors ── */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={graph.edgePositions.length / 3}
            array={graph.edgePositions}
            itemSize={3}
          />
          <bufferAttribute
            ref={edgeColorRef}
            attach="attributes-color"
            count={graph.edgeColors.length / 3}
            array={graph.edgeColors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </lineSegments>

      {/* ── Nodes: Points with glow shader ── */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={NODE_COUNT} array={graph.nodePositions} itemSize={3} />
          <bufferAttribute attach="attributes-color"    count={NODE_COUNT} array={graph.nodeColors}    itemSize={3} />
          <bufferAttribute attach="attributes-aSize"    count={NODE_COUNT} array={graph.nodeSizes}     itemSize={1} />
          <bufferAttribute attach="attributes-aPhase"   count={NODE_COUNT} array={graph.nodePhases}    itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          ref={nodeMatRef}
          vertexShader={nodeVert}
          fragmentShader={nodeFrag}
          uniforms={nodeUniforms}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
