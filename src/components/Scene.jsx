import React from 'react';
import { Canvas } from '@react-three/fiber';
import KnowledgeGraph from './KnowledgeGraph';

export default function Scene() {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ fov: 50, position: [0, 0, 100], near: 1, far: 200 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <KnowledgeGraph />
      </Canvas>
    </div>
  );
}
