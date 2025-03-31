import React, { useRef, Suspense, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import NeuralNetwork from './NeuralNetwork';

// Ambient particles that float around the scene
const AmbientParticles = () => {
  const points = useRef();
  const count = 150;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [count]);
  
  useFrame(({ clock }) => {
    if (!points.current) return;
    
    try {
      const time = clock.getElapsedTime();
      const positionArray = points.current.geometry.attributes.position.array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positionArray[i3] += Math.sin(time * 0.1 + i) * 0.005;
        positionArray[i3 + 1] += Math.cos(time * 0.1 + i) * 0.005;
      }
      
      points.current.geometry.attributes.position.needsUpdate = true;
    } catch (err) {
      // Silent catch
    }
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
        size={0.15}
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
    
    try {
      const time = clock.getElapsedTime();
      mesh.current.material.opacity = 0.3 + Math.sin(time * 0.5) * 0.1;
    } catch (err) {
      // Silent catch
    }
  });
  
  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <sphereGeometry args={[8, 32, 32]} />
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
    try {
      if (!camera.userData.initialized) {
        camera.position.set(8, 4, 16);
        camera.lookAt(0, 0, 0);
        camera.userData.initialized = true;
      }
      
      const damping = 0.05;
      const x = mouse.x * 4;
      const y = mouse.y * 2;
      
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 8 + x, damping);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4 + y, damping);
      
      camera.lookAt(0, 0, 0);
    } catch (err) {
      // Silent catch
    }
  });
  
  return null;
};

// Chrome Sphere component with full shape transformation and liquid metal shader
const ChromeSphere = () => {
  const mesh = useRef();
  const materialRef = useRef();
  const geometryRefs = useRef({
    sphere: null,
    spikes: null,
    cube: null
  });
  
  // State
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [shapeState, setShapeState] = useState('sphere'); // sphere, spikes, cube
  
  // Constants
  const baseScale = 2.5;
  const expandedScale = 2.0;
  const sphereRadius = 2.0;

  // Add shape-specific scale constants
  const shapeScales = {
    sphere: 1.0,     // Default scale multiplier for sphere
    spikes: 0.7,     // Scale multiplier for spiky sphere
    cube: 2.3        // Scale multiplier for cube (much larger)
  };
  
  // Create geometries on mount
  useEffect(() => {
    // Create perfect sphere geometry with higher quality
    const sphereGeo = new THREE.SphereGeometry(sphereRadius * 1.0, 256, 256); // Higher resolution for perfect smoothness
    geometryRefs.current.sphere = sphereGeo;
    
    // CREATE CONE-SPIKE BALL - Fewer, longer, more cone-like spikes
    const spikesGeo = new THREE.SphereGeometry(sphereRadius * 1.0, 128, 128); // Full size base sphere
    const spikePositions = spikesGeo.attributes.position;
    
    // Create array to track which vertices get spike treatment
    const spikeVertices = [];
    
    // First pass: identify fewer spike vertices (about 3% of surface points)
    for (let i = 0; i < spikePositions.count; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(spikePositions, i);
      const normalized = vertex.clone().normalize();
      
      // Use more restrictive pattern to create sparser spikes
      const shouldSpike = Math.random() < 0.03; // Much fewer spikes (3% vs 5%)
      
      if (shouldSpike) {
        spikeVertices.push(i);
      } else {
        // Set non-spike vertices to base sphere size - perfect sphere base
        vertex.copy(normalized.multiplyScalar(sphereRadius * 1.0));
        spikePositions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }
    
    // Second pass: create longer, thinner cone-shaped spikes
    for (const centerIdx of spikeVertices) {
      const centerVertex = new THREE.Vector3();
      centerVertex.fromBufferAttribute(spikePositions, centerIdx);
      const direction = centerVertex.clone().normalize();
      
      // Create much longer, thin spike at center point
      const spikeLength = 2.5 + Math.random() * 0.5; // Longer spikes (2.5-3.0x base radius)
      const tipPosition = direction.clone().multiplyScalar(sphereRadius * spikeLength);
      spikePositions.setXYZ(centerIdx, tipPosition.x, tipPosition.y, tipPosition.z);
      
      // Find and adjust nearby vertices to create cone shape
      for (let i = 0; i < spikePositions.count; i++) {
        if (i === centerIdx || spikeVertices.includes(i)) continue; // Skip spike centers
        
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(spikePositions, i);
        
        // Check if this vertex is close to our spike center
        const distance = centerVertex.distanceTo(vertex);
        if (distance < sphereRadius * 0.2) { // Slightly larger influence for better cones
          
          // Calculate how far up the spike this should be based on distance
          const influenceFactor = 1.0 - (distance / (sphereRadius * 0.2));
          const influenceCurve = Math.pow(influenceFactor, 2.5); // Even sharper falloff for more pointed cones
          
          // Base position calculation - perfect sphere surface 
          const basePosition = direction.clone().multiplyScalar(sphereRadius);
          
          // Move vertex towards spike axis for thinner cones
          const toAxis = new THREE.Vector3();
          toAxis.subVectors(
            direction.clone().multiplyScalar(vertex.dot(direction)), 
            vertex
          );
          
          // Pull more aggressively towards the spike axis for very thin cones
          const thinnessFactor = influenceCurve * 0.9; // Increased from 0.7 to 0.9 for thinner cones
          vertex.add(toAxis.multiplyScalar(thinnessFactor));
          
          // Adjust height according to the cone shape - more cone-like profile
          const targetLength = basePosition.length() + 
            (tipPosition.length() - basePosition.length()) * influenceCurve;
          
          vertex.normalize().multiplyScalar(targetLength);
          
          spikePositions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
      }
    }
    
    // Recompute normals for proper lighting
    spikesGeo.computeVertexNormals();
    geometryRefs.current.spikes = spikesGeo;
    
    // Create perfect cube geometry (keep as is)
    const boxSize = sphereRadius * 2.0;
    const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize, 1, 1, 1); // Perfect cube
    boxGeo.computeVertexNormals();
    geometryRefs.current.cube = boxGeo;
    
    // Set initial geometry
    if (mesh.current) {
      mesh.current.geometry = geometryRefs.current.sphere;
    }
  }, [sphereRadius]);
  
  // Create advanced shader material with all effects
  useEffect(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        // Basic uniforms
        time: { value: 0.0 },
        mousePosition: { value: new THREE.Vector2(0, 0) },
        hovered: { value: 0.0 },
        expanded: { value: 0.0 },
        
        // Reflection params
        reflectionStrength: { value: 8.0 },
        reflectionSharpness: { value: 6.0 },
        highlightIntensity: { value: 4.5 },
        
        // Shape transition params
        shapeType: { value: 0.0 }, // 0=sphere, 1=spikes, 2=cube
        morphProgress: { value: 0.0 }, // 0-1 for transitions
        spikesIntensity: { value: 0.0 }, // 0-1 for spike size
        
        // Chrome colors
        color1: { value: new THREE.Color(0xFFFFFF) }, // Base color
        color2: { value: new THREE.Color(0x000000) }, // Shadow color
        color3: { value: new THREE.Color(0xDDDDDD) }, // Highlight color 1
        color4: { value: new THREE.Color(0x555555) }, // Reflection color 1
        color5: { value: new THREE.Color(0x333333) }, // Reflection color 2
        color6: { value: new THREE.Color(0x999999) }, // Highlight color 2
        color7: { value: new THREE.Color(0xCCD6F6) }, // Edge highlight
        
        // Chrome noise params
        ax: { value: 5.3 },
        ay: { value: 4.4 },
        az: { value: 4.2 },
        aw: { value: 5.1 },
        bx: { value: 0.78 },
        by: { value: 1.94 },
        
        // Ripple effect
        rippleCenter: { value: new THREE.Vector3(0, 0, 0) },
        rippleTime: { value: 0.0 },
        rippleIntensity: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        uniform float time;
        uniform float shapeType;
        uniform float morphProgress;
        uniform float spikesIntensity;
        
        const float PI = 3.141592654;
        
        // Noise function for deformation
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float n = i.x + i.y * 157.0 + 113.0 * i.z;
          return mix(
            mix(
              mix(sin(n), sin(n + 1.0), f.x),
              mix(sin(n + 157.0), sin(n + 158.0), f.x),
              f.y),
            mix(
              mix(sin(n + 113.0), sin(n + 114.0), f.x),
              mix(sin(n + 270.0), sin(n + 271.0), f.x),
              f.y),
            f.z);
        }
        
        // Add spikes to a sphere
        vec3 addSpikes(vec3 p, float intensity) {
          if (intensity <= 0.0) return p;
          
          vec3 n = normalize(p);
          float noiseVal = noise(n * 3.0 + time * 0.1) * 0.5 + 0.5;
          
          // Add movement to spikes
          float spikeFactor = noiseVal * intensity;
          
          // Apply spikes perpendicular to surface
          return p + n * spikeFactor;
        }
        
        // Transform sphere to cube
        vec3 sphereToCube(vec3 p) {
          // Normalize to get direction
          vec3 dir = normalize(p);
          
          // Find maximum component
          float maxComp = max(abs(dir.x), max(abs(dir.y), abs(dir.z)));
          
          // Calculate intersection with cube
          float t = min(min(
            abs(1.0 / dir.x), 
            abs(1.0 / dir.y)),
            abs(1.0 / dir.z)
          ) * maxComp;
          
          // Get cube point
          vec3 cubePoint = dir * t;
          
          // Control sharpness
          return mix(p, cubePoint, 0.9);
        }
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          // Apply shape transformations
          vec3 morphedPosition = position;
          
          if (shapeType < 1.0) {
            // Sphere to spikes transition
            morphedPosition = mix(
              position,
              addSpikes(position, spikesIntensity),
              max(0.0, shapeType)
            );
          } 
          else if (shapeType < 2.0) {
            // Spikes to cube transition
            float cubeBlend = max(0.0, shapeType - 1.0);
            vec3 spikedPos = addSpikes(position, spikesIntensity);
            vec3 cubePos = sphereToCube(position);
            morphedPosition = mix(spikedPos, cubePos, cubeBlend);
          }
          else {
            // Pure cube state
            morphedPosition = sphereToCube(position);
          }
          
          // Add size change during morph (bell curve scaling effect)
          // Scale grows in middle of transition then returns to normal
          if (morphProgress > 0.0) {
            float scaleFactor = 1.0 + 0.2 * sin(morphProgress * PI);
            morphedPosition *= scaleFactor;
          }
          
          // Add subtle noise-based movement for liquid metal effect
          float noiseValue = sin(position.x * 10.0 + time) * 0.005;
          morphedPosition += normalize(normal) * noiseValue;
          
          // Set world position for fragment shader
          vWorldPosition = (modelMatrix * vec4(morphedPosition, 1.0)).xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        uniform float time;
        uniform vec2 mousePosition;
        uniform float hovered;
        uniform float expanded;
        uniform float shapeType;
        
        // Chrome reflection parameters
        uniform float reflectionStrength;
        uniform float reflectionSharpness;
        uniform float highlightIntensity;
        
        // Color parameters
        uniform vec3 color1, color2, color3, color4, color5, color6, color7;
        
        // Chrome noise parameters
        uniform float ax, ay, az, aw;
        uniform float bx, by;
        
        // Ripple effect
        uniform vec3 rippleCenter;
        uniform float rippleTime;
        uniform float rippleIntensity;
        
        // Enhanced noise function for chrome
        float cheapNoise(vec3 p) {
          vec3 stp = p;
          return mix(
            sin(stp.z + stp.x * ax + cos(stp.x * ax - stp.z)) * 
            cos(stp.z + stp.y * ay + cos(stp.y * ax + stp.z)),
            sin(1. + stp.x * az + stp.z + cos(stp.y * aw - stp.z)) * 
            cos(1. + stp.y * aw + stp.z + cos(stp.x * ax + stp.z)), 
            .436
          );
        }
        
        // Function to create reflective highlights
        float highlight(float n, float threshold, float intensity) {
          return pow(smoothstep(threshold - 0.1, threshold + 0.1, n), intensity);
        }
        
        // Function to get colors based on shape
        vec3 getShapeColor(float shapeType, vec3 baseColor) {
          if (shapeType < 0.5) {
            // Sphere: pure chrome base
            return baseColor;
          } else if (shapeType < 1.5) {
            // Spike ball: mix in a neutral silver (remove blue tint)
            return mix(baseColor, vec3(0.85, 0.85, 0.85), 0.15);
          } else {
            // Cube: a subtle silver tint
            return mix(baseColor, vec3(0.95, 0.95, 0.95), 0.1);
          }
        }
        
        void main() {
          // Get normal for shading
          vec3 normal = normalize(vNormal);
          
          // Calculate view direction
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          
          // Transform UVs for chrome pattern
          vec2 st = vUv;
          
          // Dynamic time-based movement for chrome
          float timeScale = 0.2;
          float S = sin(time * timeScale);
          float C = cos(time * timeScale);
          
          // Generate chrome noise pattern
          vec2 v1 = vec2(
            cheapNoise(vec3(st, 2.0)), 
            cheapNoise(vec3(st, 1.0))
          );
          
          vec2 v2 = vec2(
            cheapNoise(vec3(st + bx*v1 + vec2(C * 0.1, S * 0.7), 0.18 * time)),
            cheapNoise(vec3(st + by*v1 + vec2(S * 0.2, C * 0.4), 0.15 * time))
          );
          
          // Calculate ripple effect
          float rippleEffect = 0.0;
          if (rippleIntensity > 0.0) {
            float dist = length(vPosition - rippleCenter);
            float rippleWave = sin(dist * 10.0 - rippleTime * 5.0) * exp(-dist * 2.0);
            rippleEffect = rippleWave * rippleIntensity * (1.0 - smoothstep(0.0, 2.0, dist));
          }
          
          // Calculate base noise with shape-specific effects
          float n = .5 + .5 * cheapNoise(vec3(st + v2, time * 0.05));
          
          // Add shape-specific effects
          if (shapeType < 0.5) {
            // Sphere - subtle wave patterns
            n += sin(vPosition.x * 10.0 + time) * sin(vPosition.z * 10.0 + time) * 0.05;
          } else if (shapeType < 1.5) {
            // Spikes - sharper pattern
            n = pow(n, 1.2) + 0.1 * sin(vPosition.y * 20.0 + time * 2.0);
          } else {
            // Cube - grid pattern
            float gridSize = 5.0;
            vec3 gridPosition = vPosition * gridSize;
            float gridPattern = 
              smoothstep(0.03, 0.0, abs(fract(gridPosition.x + 0.5) - 0.5)) +
              smoothstep(0.03, 0.0, abs(fract(gridPosition.y + 0.5) - 0.5)) +
              smoothstep(0.03, 0.0, abs(fract(gridPosition.z + 0.5) - 0.5));
            n = mix(n, n * (1.0 - gridPattern * 0.3), 0.3);
          }
          
          // Add hover effect
          if (hovered > 0.0) {
            n += sin(time * 3.0) * 0.05 * hovered;
          }
          
          // Add ripple effect
          n += rippleEffect * 0.2;
          
          // Edge highlighting
          float edgeEffect = pow(1.0 - abs(dot(normal, viewDirection)), 3.0);
          n = mix(n, 0.9, edgeEffect * 0.7);
          
          // Sharpen reflections for chrome look
          float sharpN = pow(n, reflectionSharpness);
          
          // Get shape-specific base color
          vec3 baseColor = getShapeColor(shapeType, color1);
          
          // Apply chrome reflections
          vec3 color = mix(baseColor, color2, clamp((sharpN*sharpN)*reflectionStrength * 0.7, 0.0, 1.0));
          
          // Create different reflection zones with multiple colors
          color = mix(color, color3, clamp(length(v1*1.2)*0.8, 0.0, 1.0));
          color = mix(color, color4, clamp(length(v2.x)*1.1, 0.0, 1.0));
          
          // Create highlight areas
          float h1 = highlight(n, 0.75, highlightIntensity);
          float h2 = highlight(n, 0.55, highlightIntensity * 0.7);
          
          // Mix in bright highlights for chrome effect
          color = mix(color, color5, h1);
          color = mix(color, color6, h2 * (1.0-h1) * 0.8);
          color = mix(color, color7, edgeEffect * 0.8);
          
          // Add subtle color variations
          color += vec3(0.03) * sin(v1.x * 8.0 + time * 0.02);
          
          // Apply expanded state effect
          if (expanded > 0.0) {
            color += vec3(0.0, 0.1, 0.2) * expanded;
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false
    });
    
    // Initial material assignment
    if (mesh.current) {
      mesh.current.material = material;
    }
    
    materialRef.current = material;
    
    return () => {
      if (material) material.dispose();
    };
  }, []);
  
  // Start ripple effect on click
  const startRipple = (clickPoint) => {
    if (!materialRef.current || !materialRef.current.uniforms) return;
    
    // Convert to local coordinates 
    const localPoint = clickPoint.clone();
    if (mesh.current) {
      mesh.current.worldToLocal(localPoint);
    }
    
    // Set ripple center and reset ripple time
    materialRef.current.uniforms.rippleCenter.value.copy(localPoint);
    materialRef.current.uniforms.rippleTime.value = 0.0;
    materialRef.current.uniforms.rippleIntensity.value = 0.5;
  };
  
  // Handle pointer events
  const handlePointerOver = () => {
    setHovered(true);
  };
  
  const handlePointerOut = () => {
    setHovered(false);
  };
  
  // Handle click to cycle through shapes
  const handleClick = (event) => {
    event.stopPropagation();
    
    // Start ripple effect
    startRipple(event.point);
    
    // Cycle through shapes: sphere -> spikes -> cube -> sphere
    setShapeState(current => {
      if (current === 'sphere') return 'spikes';
      if (current === 'spikes') return 'cube';
      return 'sphere';
    });
  };
  
  // Handle shape transitions with cleaner goo effect
  useEffect(() => {
    if (!materialRef.current || !materialRef.current.uniforms) return;
    
    // Set target shape values
    const targetShape = 
      shapeState === 'sphere' ? 0.0 :
      shapeState === 'spikes' ? 1.0 : 2.0;
    
    // Get current values
    const currentShape = materialRef.current.uniforms.shapeType.value;
    
    // Skip if no change
    if (Math.abs(currentShape - targetShape) < 0.01) return;
    
    // Animation config
    const duration = 1800; // 1.8 seconds total
    const gooPhase1Duration = 600; // 0.6s - shrink to goo
    const gooHoldDuration = 400;  // 0.4s - stay as goo while changing shape
    const gooPhase2Duration = 800; // 0.8s - expand from goo (slightly longer)
    
    const startTime = performance.now();
    
    // Clear any existing animation
    if (window.shapeAnimationId) {
      cancelAnimationFrame(window.shapeAnimationId);
    }
    
    // Animation function
    const animate = (time) => {
      if (!materialRef.current || !materialRef.current.uniforms) return;
      
      const elapsed = time - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      
      // PHASE 1: Shrink to goo (0-33%)
      if (elapsed < gooPhase1Duration) {
        const phaseProgress = elapsed / gooPhase1Duration;
        
        // Smoother shrink curve
        const shrinkFactor = 1.0 - (0.3 * Math.sin(phaseProgress * Math.PI * 0.5)); 
        
        // Cleaner wobble that intensifies as it shrinks
        const wobbleFreq = 0.05 + phaseProgress * 0.1; // Increase frequency as we shrink
        const wobbleAmp = 0.3 * phaseProgress; // Increase amplitude as we shrink
        const wobble = wobbleAmp * Math.sin(elapsed * wobbleFreq);
        
        // Apply morphing effect
        materialRef.current.uniforms.morphProgress.value = wobble + phaseProgress * 0.7;
        
        // Keep original shape still visible but shrinking
        materialRef.current.uniforms.shapeType.value = currentShape;
        
        // Apply scale reduction
        if (mesh.current) {
          const scale = expanded ? expandedScale : baseScale;
          mesh.current.scale.set(
            scale * shrinkFactor,
            scale * shrinkFactor,
            scale * shrinkFactor
          );
        }
      }
      // PHASE 2: Hold as goo while changing shape params (33-67%)
      else if (elapsed < (gooPhase1Duration + gooHoldDuration)) {
        const phaseProgress = (elapsed - gooPhase1Duration) / gooHoldDuration;
        
        // More interesting goo wobble
        const wobble = 0.25 * Math.sin(elapsed * 0.04) + 0.15 * Math.cos(elapsed * 0.08);
        materialRef.current.uniforms.morphProgress.value = 0.8 + wobble;
        
        // Gradually change shape parameters with ease in/out
        const easedProgress = 0.5 - 0.5 * Math.cos(phaseProgress * Math.PI);
        materialRef.current.uniforms.shapeType.value = 
          currentShape + (targetShape - currentShape) * easedProgress;
        
        // Handle spike intensity with same easing
        if (shapeState === 'spikes') {
          materialRef.current.uniforms.spikesIntensity.value = easedProgress;
        } else if (currentShape > 0.5 && currentShape < 1.5) {
          materialRef.current.uniforms.spikesIntensity.value = 1.0 - easedProgress;
        }
        
        // Keep scale at minimum
        if (mesh.current) {
          const scale = expanded ? expandedScale : baseScale;
          
          // Add subtle pulsing while in goo state
          const pulse = 0.7 + Math.sin(elapsed * 0.01) * 0.03;
          
          mesh.current.scale.set(
            scale * pulse,
            scale * pulse,
            scale * pulse
          );
        }
      }
      // PHASE 3: Expand from goo to final form (67-100%)
      else {
        const phaseProgress = (elapsed - gooPhase1Duration - gooHoldDuration) / gooPhase2Duration;
        
        // Smoother expansion curve
        const easedProgress = 0.5 - 0.5 * Math.cos(phaseProgress * Math.PI);
        
        // Decreased wobble as it stabilizes with smoother falloff
        const wobble = 0.25 * (1.0 - easedProgress) * Math.sin(elapsed * 0.03);
        materialRef.current.uniforms.morphProgress.value = Math.max(0, 0.6 - 0.6 * easedProgress) + wobble;
        
        // Set final shape
        materialRef.current.uniforms.shapeType.value = targetShape;
        
        // Finalize spike intensity
        if (shapeState === 'spikes') {
          materialRef.current.uniforms.spikesIntensity.value = 1.0;
        } else {
          materialRef.current.uniforms.spikesIntensity.value = 0.0;
        }
        
        // Expand back to full size with smoother curve
        if (mesh.current) {
          const scale = expanded ? expandedScale : baseScale;
          const expandFactor = 0.7 + (0.3 * Math.sin(phaseProgress * Math.PI * 0.5));
          mesh.current.scale.set(
            scale * expandFactor,
            scale * expandFactor,
            scale * expandFactor
          );
        }
      }
      
      if (progress < 1) {
        // Continue animation
        window.shapeAnimationId = requestAnimationFrame(animate);
      } else {
        // Animation complete
        materialRef.current.uniforms.shapeType.value = targetShape;
        materialRef.current.uniforms.morphProgress.value = 0;
        materialRef.current.uniforms.spikesIntensity.value = shapeState === 'spikes' ? 1.0 : 0.0;

        // Reset scale to normal with shape-specific scale factor
        if (mesh.current) {
          const scale = expanded ? expandedScale : baseScale;
          const shapeScale = shapeScales[shapeState];
          mesh.current.scale.set(
            scale * shapeScale, 
            scale * shapeScale, 
            scale * shapeScale
          );
        }

        // Update geometry to final shape
        if (mesh.current && geometryRefs.current[shapeState]) {
          mesh.current.geometry = geometryRefs.current[shapeState];
        }
      }
    };
    
    // Start animation
    window.shapeAnimationId = requestAnimationFrame(animate);
    
    return () => {
      if (window.shapeAnimationId) {
        cancelAnimationFrame(window.shapeAnimationId);
      }
    };
  }, [shapeState, expanded, baseScale, expandedScale]);
  
  // Update uniforms based on state changes
  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms) {
      materialRef.current.uniforms.hovered.value = hovered ? 1.0 : 0.0;
    }
  }, [hovered]);
  
  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms) {
      materialRef.current.uniforms.expanded.value = expanded ? 1.0 : 0.0;
    }
  }, [expanded]);
  
  // Animation update
  useFrame(({ clock, mouse }) => {
    if (materialRef.current && materialRef.current.uniforms) {
      // Update time uniform
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
      
      // Update mouse position
      materialRef.current.uniforms.mousePosition.value.set(mouse.x, mouse.y);
      
      // Update ripple effect
      if (materialRef.current.uniforms.rippleIntensity.value > 0) {
        materialRef.current.uniforms.rippleTime.value += 0.1;
        materialRef.current.uniforms.rippleIntensity.value *= 0.95;
        
        if (materialRef.current.uniforms.rippleIntensity.value < 0.01) {
          materialRef.current.uniforms.rippleIntensity.value = 0;
        }
      }
    }
  });
  
  return (
    <mesh
      ref={mesh}
      scale={
        expanded 
          ? expandedScale * shapeScales[shapeState]  // Use shape-specific scale for expanded
          : baseScale * shapeScales[shapeState]      // Use shape-specific scale for normal
      }
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Geometry is set dynamically */}
    </mesh>
  );
};

// Main scene component
const Neural3DScene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <Suspense fallback={null}>
        <CameraController />
        <ChromeSphere />
        <AmbientParticles />
        <AmbientGlow />
        <NeuralNetwork />
        <Environment preset="city" />
        <ContactShadows
          position={[0, -5, 0]}
          opacity={0.25}
          scale={10}
          blur={1.5}
          far={10}
        />
      </Suspense>
    </Canvas>
  );
};

export default Neural3DScene;