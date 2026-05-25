import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@nanostores/react';
import { activeSection } from '../store/scrollStore';
import { CONFIG } from '../config';
import graphData from '../data/graph_data.json';

const tempObject = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();
const tempLookAt = new THREE.Vector3();
const tempColor = new THREE.Color();

// Type1 → glow color for nodes
const TYPE_GLOW = {
  'Characterized pyramidal neuron': new THREE.Color('#a8c8f0'), // soft blue
  'Cell body in EM volume':         new THREE.Color('#a8e6c0'), // soft green
  'Dendritic fragment':              new THREE.Color('#d0d0d5'), // soft grey
};
const DEFAULT_GLOW = new THREE.Color('#c8c8cc');

// Pre-calculate positions on a sphere with organic noise
const generatePositions = (nodes) => {
  const map = new Map();
  nodes.forEach((node, i) => {
    const phi = Math.acos(-1 + (2 * i) / nodes.length);
    const theta = Math.sqrt(nodes.length * Math.PI) * phi;
    const radius = 55;

    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    const noise = 5;
    const pos = new THREE.Vector3(
      x + (Math.random() - 0.5) * noise,
      y + (Math.random() - 0.5) * noise,
      z + (Math.random() - 0.5) * noise
    );

    map.set(node.id, pos);
  });
  return map;
};

const positionsMap = generatePositions(graphData.nodes);

// Custom shader for pulsing glow nodes
const nodeVertexShader = `
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;
  
  void main() {
    vColor = aColor;
    // Gentle pulse per node
    float pulse = 0.7 + 0.3 * sin(uTime * 0.8 + aPhase * 6.28);
    vAlpha = pulse;
    
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const nodeFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Soft circular glow
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, dist);
    gl_FragColor = vec4(vColor, glow * vAlpha * 0.85);
  }
`;

// Custom shader for pulsing edges with depth-based opacity
const edgeVertexShader = `
  varying float vDepth;
  uniform float uTime;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const edgeFragmentShader = `
  varying float vDepth;
  uniform float uTime;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3 uColor;
  
  void main() {
    // Depth-based fade (fog effect)
    float fogFactor = smoothstep(uFogNear, uFogFar, vDepth);
    float pulse = 0.5 + 0.2 * sin(uTime * 0.5 + vDepth * 0.05);
    float alpha = (1.0 - fogFactor) * pulse * 0.35;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export default function KnowledgeGraph() {
  const meshRef = useRef(null);
  const edgeMaterialRef = useRef(null);
  const nodeMaterialRef = useRef(null);
  const currentSection = useStore(activeSection);

  // Create per-instance phase offsets and colors
  const { matrices, phases, colors } = useMemo(() => {
    const mat = new Float32Array(graphData.nodes.length * 16);
    const ph = new Float32Array(graphData.nodes.length);
    const col = new Float32Array(graphData.nodes.length * 3);

    graphData.nodes.forEach((node, i) => {
      const pos = positionsMap.get(node.id);
      tempObject.position.copy(pos);
      tempObject.scale.setScalar(0.6);
      tempObject.updateMatrix();
      tempObject.matrix.toArray(mat, i * 16);
      
      ph[i] = Math.random(); // random phase offset for pulse

      const glowColor = TYPE_GLOW[node.type1] || DEFAULT_GLOW;
      col[i * 3]     = glowColor.r;
      col[i * 3 + 1] = glowColor.g;
      col[i * 3 + 2] = glowColor.b;
    });

    return { matrices: mat, phases: ph, colors: col };
  }, []);

  // Create Float32Array for line positions
  const linePositions = useMemo(() => {
    const positions = [];
    graphData.links.forEach((link) => {
      const start = positionsMap.get(link.source);
      const end = positionsMap.get(link.target);
      if (start && end) {
        positions.push(start.x, start.y, start.z);
        positions.push(end.x, end.y, end.z);
      }
    });
    return new Float32Array(positions);
  }, []);

  // Edge shader uniforms
  const edgeUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFogNear: { value: 30 },
    uFogFar: { value: 120 },
    uColor: { value: new THREE.Color('#c0c0c8') },
  }), []);

  // Node shader uniforms
  const nodeUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    const target = CONFIG.cameraStops[currentSection] || CONFIG.cameraStops.hero;

    // Smooth camera lerping
    tempVec3.set(...target.position);
    state.camera.position.lerp(tempVec3, delta * 2.0);

    tempLookAt.set(...target.lookAt);
    if (!state.camera.userData.currentLookAt) {
      state.camera.userData.currentLookAt = new THREE.Vector3(0, 0, 0);
    }
    state.camera.userData.currentLookAt.lerp(tempLookAt, delta * 2.0);
    state.camera.lookAt(state.camera.userData.currentLookAt);

    // Very slow organic rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.015;
      meshRef.current.rotation.x += delta * 0.005;
    }

    // Update shader time uniforms
    const elapsed = state.clock.getElapsedTime();
    if (edgeMaterialRef.current) {
      edgeMaterialRef.current.uniforms.uTime.value = elapsed;
    }
    if (nodeMaterialRef.current) {
      nodeMaterialRef.current.uniforms.uTime.value = elapsed;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Glowing nodes with per-instance color and phase */}
      <instancedMesh args={[null, null, graphData.nodes.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <shaderMaterial
          ref={nodeMaterialRef}
          vertexShader={nodeVertexShader}
          fragmentShader={nodeFragmentShader}
          uniforms={nodeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
        <instancedBufferAttribute attach="instanceMatrix" args={[matrices, 16]} />
        <instancedBufferAttribute
          attach="geometry-attributes-aPhase"
          args={[phases, 1]}
        />
        <instancedBufferAttribute
          attach="geometry-attributes-aColor"
          args={[colors, 3]}
        />
      </instancedMesh>

      {/* Pulsing edges with depth-fog */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={edgeMaterialRef}
          vertexShader={edgeVertexShader}
          fragmentShader={edgeFragmentShader}
          uniforms={edgeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </lineSegments>
    </group>
  );
}
