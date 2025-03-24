import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './LiquidMetalContainer.css';

// Update the component definition to accept a speed prop for the animation
const LiquidMetalContainer = ({ children, className, style, borderWidth = 20, speed = 1.0 }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const uniformsRef = useRef(null);
  const animationRef = useRef(null);
  
  useEffect(() => {
    let scene, camera, renderer, material, mesh;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Delay initialization to ensure DOM is fully rendered with proper dimensions
    const initTimer = setTimeout(() => {
      init();
    }, 100);
    
    const init = () => {
      if (!containerRef.current) return;
      
      // Get container dimensions
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Create scene
      scene = new THREE.Scene();
      sceneRef.current = scene;
      
      // Create orthographic camera for 2D border effect
      camera = new THREE.OrthographicCamera(
        -width/2, width/2, height/2, -height/2, 0.1, 100
      );
      camera.position.z = 5;
      
      // Create renderer
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
      });
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;
      
      // Position canvas absolutely within container
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through
      renderer.domElement.style.zIndex = '1'; // Above background, below content
      
      // Append canvas to container
      const borderElement = containerRef.current.querySelector('.liquid-metal-border');
      const existingCanvas = borderElement.querySelector('canvas');
      if (existingCanvas) {
        borderElement.removeChild(existingCanvas);
      }
      borderElement.appendChild(renderer.domElement);
      
      // Create shader uniforms
      const uniforms = {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(width, height) },
        borderWidth: { value: borderWidth },
        innerRadius: { value: 0.0 }, // For rounded corners if desired
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
        timeScale: { value: (isMobile ? 0.0001 : 0.00015) * speed }
      };
      uniformsRef.current = uniforms;
      
      // Create material with custom shader
      material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          varying vec2 vUv;
          
          uniform float time;
          uniform vec2 resolution;
          uniform float borderWidth;
          uniform float innerRadius;
          uniform float scale;
          uniform vec3 color1, color2, color3, color4, color5, color6, color7;
          uniform float ax, ay, az, aw;
          uniform float bx, by;
          
          // Noise function for chrome effect
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
          
          // SDF for rounded rectangle
          float sdRoundBox(vec2 p, vec2 b, float r) {
            vec2 q = abs(p) - b + r;
            return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
          }
          
          // Function to create border
          float border(vec2 p, float thickness, float radius) {
            // Convert from uv [0,1] to centered coordinates
            p = p * 2.0 - 1.0;
            
            // Box dimensions - IMPORTANT: use slightly larger box size to avoid gaps
            // 1.01 gives a little extra coverage to prevent gaps at edges
            vec2 boxSize = vec2(1.01, 1.01);
            
            // Calculate distance to border
            float distToBox = sdRoundBox(p, boxSize, radius);
            
            // Create border of given thickness - adjust softness for sharper border edges
            float borderMask = 1.0 - smoothstep(0.0, 0.005, abs(distToBox) - thickness);
            
            return borderMask;
          }
          
          void main() {
            // Create normalized border thickness
            float normBorderWidth = borderWidth / min(resolution.x, resolution.y);
            
            // Calculate border mask
            float mask = border(vUv, normBorderWidth, innerRadius);
            
            if (mask < 0.01) {
              discard; // Transparent where no border
            }
            
            // Scale UVs for noise
            vec2 st = vUv * scale;
            
            // More dynamic movement for the chrome effect
            float timeValue = time;
            float S = sin(timeValue);
            float C = cos(timeValue);
            
            // Generate the base noise pattern
            vec2 v1 = vec2(
              cheapNoise(vec3(st, 2.0)), 
              cheapNoise(vec3(st, 1.0))
            );
            
            // Create more complex, flowing reflections
            vec2 v2 = vec2(
              cheapNoise(vec3(st + bx*v1 + vec2(C * 2.1, S * 8.7), 0.18 * timeValue)),
              cheapNoise(vec3(st + by*v1 + vec2(S * 7.2, C * 3.4), 0.15 * timeValue))
            );
            
            // Create organic flowing noise
            float n = .5 + .5 * cheapNoise(vec3(st + v2, timeValue * 0.05));
            
            // Sharpen reflections for chrome look
            float sharpN = pow(n, 4.8);
            
            // Create different reflection zones with multiple colors
            vec3 color = mix(color1, color2, clamp((sharpN*sharpN)*6.5, 0.0, 1.0));
            
            // Mix in mid-tones
            color = mix(color, color3, clamp(length(v1*1.2)*0.8, 0.0, 1.0));
            
            // Add deeper reflections
            color = mix(color, color4, clamp(length(v2.x)*1.1, 0.0, 1.0));
            
            // Create highlight areas
            float h1 = pow(smoothstep(0.65, 0.85, n), 3.2);
            float h2 = pow(smoothstep(0.45, 0.65, n), 2.5);
            
            // Mix in bright highlights for chrome effect
            color = mix(color, color5, h1);
            color = mix(color, color6, h2 * (1.0-h1) * 0.8);
            
            // Add subtle color variations for richer chrome
            color += vec3(0.03) * sin(v1.x * 8.0 + timeValue * 0.02);
            color += vec3(0.02) * cos(v2.y * 6.0 - timeValue * 0.01);
            
            // Enhance contrast for shiny chrome look
            color = pow(color, vec3(1.1));
            
            gl_FragColor = vec4(color, mask);
          }
        `,
        transparent: true,
        depthWrite: false
      });
      
      // Create simple quad geometry for the container
      const geometry = new THREE.PlaneGeometry(width, height);
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      
      // Add resize handler
      window.addEventListener('resize', onResize);
    };
    
    const animate = () => {
      if (uniformsRef.current) {
        uniformsRef.current.time.value += uniformsRef.current.timeScale.value * speed;
      }
      
      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !uniformsRef.current) return;
      
      // Get updated dimensions
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Update camera
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      
      // Update renderer
      rendererRef.current.setSize(width, height);
      
      // Update uniforms
      uniformsRef.current.resolution.value.x = width;
      uniformsRef.current.resolution.value.y = height;
      
      // Update mesh size
      if (mesh) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(width, height);
      }
    };
    
    animate();
    
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('resize', onResize);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
      }
      
      if (material) material.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [borderWidth, speed]);
  
  // Change the container return statement:
  return (
    <div 
      ref={containerRef} 
      className={`liquid-metal-container-wrapper ${className || ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        margin: '0 auto',
        // The key fix - apply consistent padding all around equal to borderWidth
        padding: `${borderWidth}px`,
        boxSizing: 'border-box',
        background: 'transparent',
        // This ensures overflow from the border doesn't create scrollbars
        overflow: 'hidden',
        ...style
      }}
    >
      {/* This is the actual border element */}
      <div 
        className="liquid-metal-border"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          // Remove any unexpected margin/padding
          margin: 0,
          padding: 0
        }}
      >
        {/* ThreeJS will render here */}
      </div>
      
      {/* Content container */}
      <div 
        className="liquid-metal-content"
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(10, 10, 10, 0.7)',
          backdropFilter: 'blur(8px)',
          width: '100%',
          height: '100%',
          padding: '30px',
          boxSizing: 'border-box',
          // Add a slight inset shadow to help with visual definition
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default LiquidMetalContainer;