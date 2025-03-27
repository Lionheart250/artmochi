import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import NeuralNetwork from './NeuralNetwork';

// Import Three.js post-processing classes directly
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

// Extend Three.js classes so they can be used in JSX
extend({ EffectComposer, RenderPass, UnrealBloomPass, ShaderPass });

// Custom post-processing using raw Three.js classes - no react-postprocessing
const Effects = () => {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef();
  
  useEffect(() => {
    // Create a new effect composer
    composer.current = new EffectComposer(gl);
    
    // Add render pass
    const renderPass = new RenderPass(scene, camera);
    composer.current.addPass(renderPass);
    
    // Add bloom pass
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      1.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    composer.current.addPass(bloomPass);
    
    // Handle resize
    return () => {
      composer.current.dispose();
    };
  }, [gl, scene, camera, size]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (composer.current) {
        composer.current.setSize(size.width, size.height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);
  
  // Use composer for rendering instead of default WebGLRenderer
  useFrame((_, delta) => {
    if (composer.current) {
      composer.current.render(delta);
    }
  }, 1);
  
  return null;
};

// Main 3D scene
const Neural3DScene = ({ className }) => {
  return (
    <div className={className || "neural-scene-container"} style={{ width: "100%", height: "100%" }}>
      <Canvas 
        dpr={[1, 1.5]} 
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ 
          powerPreference: "high-performance",
          antialias: true,
          alpha: true
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-5, 0, -5]} intensity={1} color="#2080ff" />
        
        <Suspense fallback={null}>
          <NeuralNetwork />
          <Effects />
        </Suspense>
        
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default Neural3DScene;