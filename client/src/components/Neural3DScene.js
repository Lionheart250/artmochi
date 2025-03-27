import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import NeuralNetwork from './NeuralNetwork';

// Ambient particles that float around the scene
const AmbientParticles = () => {
  const points = useRef();
  const count = 80;
  
  // Create particle positions
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);
  
  useFrame(({ clock }) => {
    if (!points.current) return;
    
    const time = clock.getElapsedTime();
    const positionArray = points.current.geometry.attributes.position.array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Gentle movement
      positionArray[i3] += Math.sin(time * 0.1 + i) * 0.005;
      positionArray[i3 + 1] += Math.cos(time * 0.1 + i) * 0.005;
    }
    
    points.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#0088ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Subtle ambient glow effect
const AmbientGlow = () => {
  const mesh = useRef();
  
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    
    const time = clock.getElapsedTime();
    mesh.current.material.opacity = 0.3 + Math.sin(time * 0.5) * 0.1;
  });
  
  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshBasicMaterial 
        color="#003A80" 
        transparent={true} 
        opacity={0.3}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// Camera controller with smooth damping
const CameraController = () => {
  const { camera } = useThree();
  
  useFrame(({ mouse }) => {
    // Set initial position if needed
    if (!camera.userData.initialized) {
      camera.position.set(4, 2, 8);
      camera.lookAt(0, 0, 0);
      camera.userData.initialized = true;
    }
    
    // Subtle camera movement following mouse
    const damping = 0.05;
    const x = mouse.x * 2;
    const y = mouse.y * 1;
    
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 4 + x, damping);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2 + y, damping);
    
    camera.lookAt(0, 0, 0);
  });
  
  return null;
};

// Main scene component - NO POST PROCESSING EFFECTS AT ALL
const Neural3DScene = () => {
  return (
    <Canvas 
      shadows 
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance" 
      }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#000']} />
      
      <CameraController />
      
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={0.8} 
        castShadow 
      />
      <pointLight position={[-3, 0, -3]} intensity={0.4} color="#0066FF" />
      <pointLight position={[3, 2, 3]} intensity={0.3} color="#00AAFF" />
      
      <Suspense fallback={null}>
        <NeuralNetwork />
        <AmbientParticles />
        <AmbientGlow />
        
        <Environment preset="warehouse" />
        
        <ContactShadows 
          opacity={0.5} 
          scale={10} 
          blur={2} 
          far={5} 
          resolution={256} 
          color="#000000" 
        />
      </Suspense>
      
      {/* Manual bloom fallback */}
      <mesh scale={[30, 30, 30]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="black" side={THREE.BackSide} />
      </mesh>
    </Canvas>
  );
};

export default Neural3DScene;