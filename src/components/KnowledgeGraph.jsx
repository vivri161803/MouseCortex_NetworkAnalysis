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

// Pre-calculate positions on a sphere
const generatePositions = (nodes) => {
  const map = new Map();
  nodes.forEach((node, i) => {
    const phi = Math.acos(-1 + (2 * i) / nodes.length);
    const theta = Math.sqrt(nodes.length * Math.PI) * phi;
    const radius = 60; // spread

    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    const noise = 3;
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

export default function KnowledgeGraph() {
  const meshRef = useRef(null);
  const currentSection = useStore(activeSection);
  
  // Create matrices for InstancedMesh
  const matrices = useMemo(() => {
    const arr = new Float32Array(graphData.nodes.length * 16);
    graphData.nodes.forEach((node, i) => {
      const pos = positionsMap.get(node.id);
      tempObject.position.copy(pos);
      tempObject.scale.setScalar(0.4); // Node size
      tempObject.updateMatrix();
      tempObject.matrix.toArray(arr, i * 16);
    });
    return arr;
  }, []);

  // Create Float32Array for LineSegments positions
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

  useFrame((state, delta) => {
    const target = CONFIG.cameraStops[currentSection] || CONFIG.cameraStops.hero;
    
    // Smooth camera lerping
    tempVec3.set(...target.position);
    state.camera.position.lerp(tempVec3, delta * 2.5);

    tempLookAt.set(...target.lookAt);
    if (!state.camera.userData.currentLookAt) {
      state.camera.userData.currentLookAt = new THREE.Vector3(0, 0, 0);
    }
    state.camera.userData.currentLookAt.lerp(tempLookAt, delta * 2.5);
    state.camera.lookAt(state.camera.userData.currentLookAt);
    
    // Slow rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={meshRef}>
      <instancedMesh args={[null, null, graphData.nodes.length]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={CONFIG.theme.graphNode} />
        <instancedBufferAttribute attach="instanceMatrix" args={[matrices, 16]} />
      </instancedMesh>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={CONFIG.theme.graphEdge} transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}
