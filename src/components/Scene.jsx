import React from 'react';
import { Canvas } from '@react-three/fiber';
import KnowledgeGraph from './KnowledgeGraph';

export default function Scene() {
  return (
    <div className="w-full h-full absolute inset-0" style={{ backgroundColor: '#fbfbfd' }}>
      <Canvas camera={{ fov: 45, position: [0, 0, 100], near: 0.1, far: 2000 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={0.6} color="#ffffff" />
        <KnowledgeGraph />
      </Canvas>
    </div>
  );
}
