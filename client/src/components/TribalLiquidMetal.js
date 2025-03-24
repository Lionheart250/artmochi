import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { tribalShapes } from './shapes/tribalShapes';

const TribalLiquidMetal = () => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);
  const uniformsRef = useRef(null);
  const isScrollingRef = useRef(false);
  const shapesRef = useRef([]);
  
  useEffect(() => {
    let scene, camera, renderer, material, meshes = [];
    let animationFrameId;
    
    // Detect if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Initialize scene
    const init = () => {
      // Create scene
      scene = new THREE.Scene();
      sceneRef.current = scene;
      
      // Create camera (perspective for 3D shapes)
      camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 3; // Closer camera position
      
      // Create renderer with optimized settings
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Adjust pixel ratio - lower on mobile for performance
      renderer.setPixelRatio(isMobile ? 
        Math.min(window.devicePixelRatio, 1.5) : 
        window.devicePixelRatio
      );
      
      rendererRef.current = renderer;
      
      // Apply critical properties to prevent layout shifts
      renderer.domElement.style.position = 'fixed';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.zIndex = '-1';
      
      // Apply GPU-accelerated styles
      renderer.domElement.style.transform = 'translateZ(0)';
      renderer.domElement.style.backfaceVisibility = 'hidden';
      renderer.domElement.style.perspective = '1000px';
      renderer.domElement.style.willChange = 'transform';
      
      // Replace any existing canvas
      if (mountRef.current.childNodes.length > 0) {
        mountRef.current.removeChild(mountRef.current.childNodes[0]);
      }
      mountRef.current.appendChild(renderer.domElement);
      
      // Create shader uniforms for liquid metal effect
      const uniforms = {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        scale: { value: isMobile ? 4.0 : 3.5 },
        ax: { value: 5.3 },
        ay: { value: 4.4 },
        az: { value: 4.2 },
        aw: { value: 5.1 },
        bx: { value: 0.78 },
        by: { value: 1.94 },
        color1: { value: new THREE.Color(0xFFFFFF) },
        color2: { value: new THREE.Color(0x050505) },
        color3: { value: new THREE.Color(0xE6E6E6) },
        color4: { value: new THREE.Color(0x9C9C9C) },
        color5: { value: new THREE.Color(0x2A2A2A) },
        color6: { value: new THREE.Color(0x666666) },
        color7: { value: new THREE.Color(0xCCD6F6) },
        color8: { value: new THREE.Color(0xE0CCFF) },
        color9: { value: new THREE.Color(0xFFE5CC) },
        reflectionStrength: { value: 6.5 },
        reflectionSharpness: { value: 4.8 },
        highlightIntensity: { value: 3.2 },
        timeScale: { value: isMobile ? 0.0015 : 0.002 }
      };
      
      uniformsRef.current = uniforms;
      
      // Create liquid metal shader material
      material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          uniform float time;
          uniform float scale;
          uniform vec2 resolution;
          uniform vec3 color1, color2, color3, color4, color5, color6, color7, color8, color9;
          uniform float ax, ay, az, aw;
          uniform float bx, by;
          uniform float reflectionStrength;
          uniform float reflectionSharpness;
          uniform float highlightIntensity;
          
          const float PI = 3.141592654;
          
          // Enhanced noise function for more detailed reflections
          float cheapNoise(vec3 stp) {
            vec3 p = vec3(stp.st, stp.p);
            vec4 a = vec4(ax, ay, az, aw);
            return mix(
              sin(p.z + p.x * a.x + cos(p.x * a.x - p.z)) * 
              cos(p.z + p.y * a.y + cos(p.y * a.x + p.z)),
              sin(1. + p.x * a.z + p.z + cos(p.y * a.w - p.z)) * 
              cos(1. + p.y * a.w + p.z + cos(p.x * a.x + p.z)), 
              .436
            );
          }
          
          // Function to create reflective highlights
          float highlight(float n, float threshold, float intensity) {
            return pow(smoothstep(threshold - 0.1, threshold + 0.1, n), intensity);
          }

          void main() {
            // Create UV coordinates based on position and normal for 3D effect
            vec2 st = vUv;
            
            // Add normal influence for 3D shading
            vec3 normal = normalize(vNormal);
            float normalInfluence = pow(abs(dot(normal, vec3(0.0, 0.0, 1.0))), 0.5);
            
            // More dynamic movement for the chrome effect
            float timeScale = 0.004;
            float S = sin(time * timeScale);
            float C = cos(time * timeScale);
            
            // Combine position and normal for better 3D chrome
            vec2 positionSt = vec2(
              vPosition.x * 0.1 + normal.x * 0.2,
              vPosition.y * 0.1 + normal.y * 0.2
            );
            
            // Generate the base noise pattern
            vec2 v1 = vec2(
              cheapNoise(vec3(st + positionSt, 2.0)), 
              cheapNoise(vec3(st - positionSt, 1.0))
            );
            
            // Create more complex, flowing reflections
            vec2 v2 = vec2(
              cheapNoise(vec3(st + bx*v1 + vec2(C * 2.1, S * 8.7), 0.18 * time)),
              cheapNoise(vec3(st + by*v1 + vec2(S * 7.2, C * 3.4), 0.15 * time))
            );
            
            // Create organic flowing noise
            float n = .5 + .5 * cheapNoise(vec3(st + v2, time * 0.05));
            
            // Add edge highlighting for tribal shapes
            float edgeEffect = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 3.0);
            n = mix(n, 0.9, edgeEffect * 0.7);
            
            // Sharpen reflections for chrome look
            float sharpN = pow(n, reflectionSharpness);
            
            // Create different reflection zones with multiple colors
            vec3 color = mix(color1, color2, clamp((sharpN*sharpN)*reflectionStrength, 0.0, 1.0));
            
            // Mix in mid-tones
            color = mix(color, color3, clamp(length(v1*1.2)*0.8, 0.0, 1.0));
            
            // Add deeper reflections
            color = mix(color, color4, clamp(length(v2.x)*1.1, 0.0, 1.0));
            
            // Create highlight areas
            float h1 = highlight(n, 0.75, highlightIntensity);
            float h2 = highlight(n, 0.55, highlightIntensity * 0.7);
            
            // Add edge highlights
            float edgeHighlight = pow(edgeEffect, 1.5) * 0.8;
            
            // Mix in bright highlights for chrome effect
            color = mix(color, color5, h1);
            color = mix(color, color6, h2 * (1.0-h1) * 0.8);
            color = mix(color, color7, edgeHighlight);
            
            // Add subtle color variations for richer chrome
            color += vec3(0.03) * sin(v1.x * 8.0 + time * 0.02);
            color += vec3(0.02) * cos(v2.y * 6.0 - time * 0.01);
            
            // Add normal-based shading for 3D effect
            color *= mix(0.8, 1.0, normalInfluence);
            
            // Enhance contrast for shiny chrome look
            color = pow(color, vec3(1.1));
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });
      
      // Create tribal shapes
      createTribalShapes(scene, material);
      
      // Add event listeners
      window.addEventListener('resize', onWindowResize, { passive: true });
      
      // WebGL context loss handler
      renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.log('WebGL context lost, trying to restore...');
        cancelAnimationFrame(animationFrameId);
        
        // Try to restore after a short delay
        setTimeout(() => {
          if (rendererRef.current) animationFrameId = requestAnimationFrame(animate);
        }, 300);
      }, false);
      
      // Add scroll listener to pause animation during scroll on mobile
      if (isMobile) {
        window.addEventListener('scroll', onScroll, { passive: true });
      }
    };
    
    // Create tribal shapes from the shapes data
    const createTribalShapes = (scene, material) => {
      // Clear existing meshes
      meshes.forEach(mesh => scene.remove(mesh));
      meshes = [];
      
      // Increase shape count
      const numShapes = isMobile ? 25 : 45;
      
      // Create each shape and position it randomly
      for (let i = 0; i < numShapes; i++) {
        // Pick a random shape from the tribal shapes
        const shapeIndex = Math.floor(Math.random() * tribalShapes.length);
        const shapeData = tribalShapes[shapeIndex];
        
        // Create geometry from shape data
        const shape = new THREE.Shape();
        
        // Start path
        shape.moveTo(shapeData.points[0].x, shapeData.points[0].y);
        
        // Add points
        for (let j = 1; j < shapeData.points.length; j++) {
          shape.lineTo(shapeData.points[j].x, shapeData.points[j].y);
        }
        
        // Close shape
        shape.closePath();
        
        // Create extruded geometry for 3D effect
        const extrudeSettings = {
          steps: 1,
          depth: 0.2,
          bevelEnabled: true,
          bevelThickness: 0.1,
          bevelSize: 0.1,
          bevelOffset: 0,
          bevelSegments: 3
        };
        
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Scale down the geometry
        geometry.scale(0.5, 0.5, 0.5);
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position randomly in view - wider distribution
        mesh.position.x = (Math.random() - 0.5) * 14;
        mesh.position.y = (Math.random() - 0.5) * 14;
        mesh.position.z = (Math.random() - 0.5) * 4 - 2;
        
        // Random scaling for more variety
        const scale = 0.5 + Math.random() * 0.8;
        mesh.scale.set(scale, scale, scale);
        
        // Random rotation for variety
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.z = Math.random() * Math.PI;
        
        // Add to scene and store
        scene.add(mesh);
        meshes.push(mesh);
      }
      
      shapesRef.current = meshes;
    };
    
    // Animation loop
    const animate = () => {
      if (!isScrollingRef.current || !isMobile) {
        // Only update animation when not scrolling on mobile
        if (uniformsRef.current) {
          uniformsRef.current.time.value += uniformsRef.current.timeScale.value;
        }
        
        // Rotate each shape slightly for dynamic effect
        shapesRef.current.forEach((mesh, index) => {
          const speed = (index % 4 + 1) * 0.0005;
          mesh.rotation.x += speed;
          mesh.rotation.y += speed * 1.2;
        });
      }
      
      // Always render
      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
      
      animationRef.current = requestAnimationFrame(animate);
      animationFrameId = animationRef.current;
    };
    
    // Resize handler
    const onWindowResize = () => {
      if (rendererRef.current && uniformsRef.current) {
        setTimeout(() => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          
          rendererRef.current.setSize(width, height);
          uniformsRef.current.resolution.value.x = width;
          uniformsRef.current.resolution.value.y = height;
        }, isMobile ? 300 : 100);
      }
    };
    
    // Scroll handler for mobile
    const onScroll = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        
        clearTimeout(window.scrollEndTimer);
        window.scrollEndTimer = setTimeout(() => {
          isScrollingRef.current = false;
        }, 200);
      }
    };
    
    // Initialize and animate
    init();
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('scroll', onScroll);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.removeEventListener('webglcontextlost', () => {});
      }
      
      cancelAnimationFrame(animationFrameId);
      
      meshes.forEach(mesh => {
        scene.remove(mesh);
        mesh.geometry.dispose();
      });
      
      if (material) material.dispose();
      if (renderer) renderer.dispose();
      
      clearTimeout(window.scrollEndTimer);
    };
  }, []);
  
  return (
    <div 
      ref={mountRef} 
      className="tribal-metal-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh',
        zIndex: -1, // Keep behind content
        overflow: 'hidden',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    />
  );
};

export default TribalLiquidMetal;