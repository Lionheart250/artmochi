import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NeuralNetwork = () => {
  const group = useRef();
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  
  // Use a ref to track component mount status
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false; // Set to false when component unmounts
    };
  }, []);
  
  // Generate network data only once when component mounts
  useEffect(() => {
    // Create neural network nodes
    const layerCount = 3;
    const nodesPerLayer = [5, 8, 4];
    const generatedNodes = [];
    const generatedConnections = [];
    
    // Generate nodes
    let nodeIndex = 0;
    for (let layer = 0; layer < layerCount; layer++) {
      const count = nodesPerLayer[layer];
      const zPos = (layer - layerCount / 2) * 2;
      
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 1.5;
        const x = Math.sin(angle) * radius;
        const y = Math.cos(angle) * radius;
        
        generatedNodes.push({
          id: nodeIndex,
          position: new THREE.Vector3(x, y, zPos),
          size: Math.random() * 0.2 + 0.1,
          color: new THREE.Color(0, 0.7, 1)
        });
        
        // Connect to previous layer
        if (layer > 0) {
          const prevLayerStart = nodeIndex - nodesPerLayer[layer - 1];
          for (let j = prevLayerStart; j < nodeIndex; j++) {
            if (Math.random() > 0.3) { // 70% chance to create connection
              generatedConnections.push({
                id: `${j}-${nodeIndex}`,
                start: j,
                end: nodeIndex,
                strength: Math.random()
              });
            }
          }
        }
        
        nodeIndex++;
      }
    }
    
    setNodes(generatedNodes);
    setConnections(generatedConnections);
    setInitialized(true);
    
    // Mouse position tracking for interactive nodes
    const handleMouseMove = (e) => {
      // Convert screen coordinates to normalized device coordinates (-1 to +1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Animation frame update
  useFrame(({ clock }) => {
    // Return early if component is unmounting or not ready
    if (
      !mountedRef.current ||
      !group.current || 
      !initialized || 
      nodes.length === 0 || 
      !group.current.children
    ) return;
    
    // Base rotation
    group.current.rotation.y += 0.001;
    
    // Respond to mouse - slight tilt toward mouse position
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x || 0,
      mousePosition.y * 0.2,
      0.05
    );
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y || 0,
      mousePosition.x * 0.2,
      0.05
    );
    
    // Make nodes pulse with sine wave
    const time = clock.getElapsedTime();
    
    for (let i = 0; i < Math.min(nodes.length, group.current.children.length); i++) {
      const mesh = group.current.children[i];
      const node = nodes[i];
      
      if (mesh && mesh.scale && node) {
        const pulse = 1 + Math.sin(time * 2 + i) * 0.1;
        mesh.scale.set(node.size * pulse, node.size * pulse, node.size * pulse);
      }
    }
  });
  
  if (!initialized) return null;
  
  return (
    <group ref={group}>
      {/* Render nodes */}
      {nodes.map((node) => (
        <mesh key={`node-${node.id}`} position={node.position}>
          <sphereGeometry args={[node.size, 32, 32]} />
          <meshStandardMaterial 
            color={node.color} 
            emissive={node.color} 
            emissiveIntensity={0.7} 
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
      
      {/* Render connections */}
      {connections.map((connection) => {
        if (!nodes[connection.start] || !nodes[connection.end]) return null;
        
        const start = nodes[connection.start].position;
        const end = nodes[connection.end].position;
        
        const points = [start, end];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line key={`line-${connection.id}`}>
            <bufferGeometry attach="geometry" {...lineGeometry} />
            <lineBasicMaterial 
              attach="material" 
              color="#00BBFF" 
              opacity={connection.strength * 0.7 + 0.2}
              transparent={true}
              toneMapped={false} // Makes lines brighter for post-processing
            />
          </line>
        );
      })}
    </group>
  );
};

export default NeuralNetwork;