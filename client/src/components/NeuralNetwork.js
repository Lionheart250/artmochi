import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NeuralNetwork = () => {
  const group = useRef();
  // Initialize these state values with empty arrays to prevent 'undefined.length' errors
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  
  // Use a ref to track component mount status
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Generate network data only once when component mounts
  useEffect(() => {
    // Create neural network nodes with improved aesthetics
    const layerCount = 4; // Increased layer count for more depth
    const nodesPerLayer = [6, 9, 12, 6]; // More varied layer sizes
    const generatedNodes = [];
    const generatedConnections = [];
    
    // Define a more refined color palette
    const nodeColors = [
      new THREE.Color(0.0, 0.9, 1.0),   // Bright blue
      new THREE.Color(0.1, 0.7, 1.0),   // Medium blue
      new THREE.Color(0.4, 0.8, 1.0),   // Light blue
      new THREE.Color(0.0, 0.5, 0.9)    // Deep blue
    ];
    
    // Generate nodes with more deliberate positioning
    let nodeIndex = 0;
    for (let layer = 0; layer < layerCount; layer++) {
      const count = nodesPerLayer[layer];
      const zPos = (layer - layerCount / 2) * 1.8; // Slightly compressed z-spacing
      
      for (let i = 0; i < count; i++) {
        // Create elegant elliptical arrangement instead of perfect circle
        const angle = (i / count) * Math.PI * 2;
        const radius = layer % 2 === 0 ? 1.8 : 1.4; // Alternating layer sizes
        // Add slight vertical offset based on position in layer
        const yOffset = Math.sin(i * 1.5) * 0.2;
        
        const x = Math.sin(angle) * radius * 1.2; // Stretch horizontally
        const y = Math.cos(angle) * radius + yOffset;
        
        // Vary node sizes more deliberately - important nodes are larger
        const baseSize = 0.08 + (Math.abs(Math.sin(angle * 2)) * 0.15);
        
        generatedNodes.push({
          id: nodeIndex,
          position: new THREE.Vector3(x, y, zPos),
          size: baseSize,
          color: nodeColors[layer % nodeColors.length],
          // Add pulse frequency variation for more organic movement
          pulseSpeed: 1 + Math.random() * 1.5,
          pulsePhase: Math.random() * Math.PI * 2
        });
        
        // Create more strategic connections between layers
        if (layer > 0) {
          // Find nodes in previous layer
          const prevLayerNodes = generatedNodes.filter(n => 
            Math.abs(n.position.z - (zPos - 1.8)) < 0.1
          );
          
          if (prevLayerNodes.length > 0) {
            // Connect to strategic nodes in previous layer - avoid too many connections
            const connectionsPerNode = 2 + Math.floor(Math.random() * 2); // 2-3 connections per node
            
            // Shuffle the previous layer nodes to randomize connections
            const shuffled = [...prevLayerNodes].sort(() => 0.5 - Math.random());
            
            // Take only a few connections for cleaner visualization
            for (let c = 0; c < Math.min(connectionsPerNode, shuffled.length); c++) {
              const prevNode = shuffled[c];
              
              generatedConnections.push({
                id: `${prevNode.id}-${nodeIndex}`,
                start: prevNode.id,
                end: nodeIndex,
                strength: 0.4 + Math.random() * 0.6, // Stronger connections
                active: Math.random() > 0.3 // Some connections are active, some dormant
              });
            }
          }
        }
        
        nodeIndex++;
      }
    }
    
    // Ensure we're not updating state after unmount
    if (mountedRef.current) {
      setNodes(generatedNodes);
      setConnections(generatedConnections);
      setInitialized(true);
    }
    
    // Enhanced mouse tracking for more responsive interaction
    const handleMouseMove = (e) => {
      if (mountedRef.current) {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        setMousePosition({ x, y });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Enhanced animation with data flows and node pulse effects
  useFrame(({ clock }) => {
    if (!mountedRef.current || !group.current || nodes.length === 0) return;
    
    // Subtle base rotation
    group.current.rotation.y += 0.0007;
    
    // More responsive mouse interaction
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x || 0,
      mousePosition.y * 0.4, // Increased tilt response
      0.03
    );
    
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z || 0,
      -mousePosition.x * 0.1, // Slight z-rotation for depth
      0.03
    );
    
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y || 0,
      mousePosition.x * 0.3 + clock.getElapsedTime() * 0.05,
      0.03
    );
    
    const time = clock.getElapsedTime();
    
    // Safety check for children
    if (!group.current.children) return;
    
    // Update node animations
    for (let i = 0; i < Math.min(nodes.length, group.current.children.length / 2); i++) {
      const mesh = group.current.children[i];
      if (!mesh) continue;
      
      const node = nodes[i];
      if (!node) continue;
      
      if (mesh.scale && node) {
        // More organic, varied pulsing
        const pulse = 1 + Math.sin(time * node.pulseSpeed + node.pulsePhase) * 0.2;
        mesh.scale.set(node.size * pulse, node.size * pulse, node.size * pulse);
        
        // Subtly vary node colors over time
        if (mesh.material) {
          const hue = (time * 0.05 + i * 0.01) % 1;
          const color = new THREE.Color().setHSL(
            0.55 + Math.sin(hue) * 0.05, // Subtle hue shift in blue range
            0.8, // High saturation
            0.6 + Math.sin(time * 0.5 + i) * 0.1 // Brightness pulsing
          );
          
          mesh.material.color.copy(color);
          mesh.material.emissive.copy(color);
          mesh.material.emissiveIntensity = 0.7 + Math.sin(time + i) * 0.3;
        }
      }
    }
    
    // Safety check for connections
    if (group.current.children.length <= nodes.length) return;
    
    // Animate connections - data flowing through the network
    const lineIndex = nodes.length;
    connections.forEach((connection, i) => {
      const lineIdx = lineIndex + i;
      if (lineIdx >= group.current.children.length) return;
      
      const lineObj = group.current.children[lineIdx];
      if (lineObj && lineObj.material) {
        // Animate line opacity to simulate data flow
        const flowSpeed = 0.7 + connection.strength * 2;
        const flowPhase = (time * flowSpeed + i) % 1;
        
        // Create wave-like pulses along connections
        let opacity = connection.strength * 0.4;
        if (connection.active) {
          opacity += Math.sin(flowPhase * Math.PI * 2) * 0.3;
        }
        
        lineObj.material.opacity = Math.max(0.05, Math.min(0.8, opacity));
      }
    });
  });
  
  // Return null while not initialized to prevent rendering with incomplete data
  if (!initialized) return null;
  
  // Generate JSX with safety checks
  return (
    <group ref={group}>
      {/* Enhanced nodes */}
      {nodes.map((node) => (
        <mesh key={`node-${node.id}`} position={node.position} castShadow>
          <sphereGeometry args={[node.size, 32, 32]} />
          <meshStandardMaterial 
            color={node.color} 
            emissive={node.color} 
            emissiveIntensity={0.9} 
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={1.5}
          />
        </mesh>
      ))}
      
      {/* Enhanced connections */}
      {connections.map((connection) => {
        const startNode = nodes.find(n => n.id === connection.start);
        const endNode = nodes.find(n => n.id === connection.end);
        
        if (!startNode || !endNode) return null;
        
        const start = startNode.position;
        const end = endNode.position;
        
        // Create curved paths for more organic connections
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        // Add some natural curve
        midPoint.y += (start.distanceTo(end) * 0.1) * (Math.random() - 0.5);
        
        // Create smooth curve
        const curve = new THREE.QuadraticBezierCurve3(
          start,
          midPoint,
          end
        );
        
        // More points for smoother curves on longer connections
        const pointCount = Math.max(10, Math.floor(start.distanceTo(end) * 8));
        const points = curve.getPoints(pointCount);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line key={`line-${connection.id}`}>
            <bufferGeometry attach="geometry" {...lineGeometry} />
            <lineBasicMaterial 
              attach="material" 
              color={new THREE.Color(0.0, 0.8, 1.0)} 
              opacity={connection.strength * 0.5 + 0.1}
              transparent={true}
              toneMapped={false}
              linewidth={1} // Note: this doesn't work in WebGL but kept for future compatibility
            />
          </line>
        );
      })}
    </group>
  );
};

export default NeuralNetwork;