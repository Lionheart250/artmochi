import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const LiquidMetal = () => {
  const mountRef = useRef(null);
  
  useEffect(() => {
    let scene, camera, renderer, uniforms, material, mesh;
    let animationFrameId;

    // Initialize scene
    const init = () => {
      // Create scene
      scene = new THREE.Scene();
      
      // Create camera (orthographic for full screen shader)
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      
      // Create renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      // Replace any existing canvas
      if (mountRef.current.childNodes.length > 0) {
        mountRef.current.removeChild(mountRef.current.childNodes[0]);
      }
      mountRef.current.appendChild(renderer.domElement);
      
      // Create shader uniforms - Enhanced for Sorayama chrome look
      uniforms = {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        scale: { value: 3.5 },  // Increased scale for more detailed reflections
        ax: { value: 5.3 },     // Modified coefficients for more complex patterns
        ay: { value: 4.4 },
        az: { value: 4.2 },
        aw: { value: 5.1 },
        bx: { value: 0.78 },
        by: { value: 1.94 },
        // Sorayama chrome color palette - expanded for richer chrome effect
        color1: { value: new THREE.Color(0xFFFFFF) }, // Pure white for extreme highlights
        color2: { value: new THREE.Color(0x050505) }, // Deep black shadow
        color3: { value: new THREE.Color(0xE6E6E6) }, // Bright silver highlight
        color4: { value: new THREE.Color(0x9C9C9C) }, // Mid-tone silver
        color5: { value: new THREE.Color(0x2A2A2A) }, // Dark shadow
        color6: { value: new THREE.Color(0x666666) }, // Medium shadow
        // Additional colors for iridescence and depth
        color7: { value: new THREE.Color(0xCCD6F6) }, // Cool blue highlight tint
        color8: { value: new THREE.Color(0xE0CCFF) }, // Subtle purple reflection
        color9: { value: new THREE.Color(0xFFE5CC) }, // Warm reflection tone
        reflectionStrength: { value: 6.5 },  // Higher contrast for chrome look
        reflectionSharpness: { value: 4.8 }, // More defined edges
        highlightIntensity: { value: 3.2 }   // Brighter highlights
      };
      
      // Enhanced shader material for Sorayama chrome effect
      material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          varying vec2 vUv;
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
            vec2 aR = vec2(resolution.x/resolution.y, 1.);
            vec2 st = vUv * aR * scale;
            
            // More dynamic movement for the chrome effect
            float timeScale = 0.004;
            float S = sin(time * timeScale);
            float C = cos(time * timeScale);
            
            // Generate the base noise pattern
            vec2 v1 = vec2(cheapNoise(vec3(st, 2.)), cheapNoise(vec3(st, 1.)));
            
            // Create more complex, flowing reflections
            vec2 v2 = vec2(
              cheapNoise(vec3(st + bx*v1 + vec2(C * 2.1, S * 8.7), 0.18 * time)),
              cheapNoise(vec3(st + by*v1 + vec2(S * 7.2, C * 3.4), 0.15 * time))
            );
            
            // Create organic flowing noise
            float n = .5 + .5 * cheapNoise(vec3(st + v2, time * 0.05));
            
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
            
            // Mix in bright highlights for chrome effect
            color = mix(color, color5, h1);
            color = mix(color, color6, h2 * (1.0-h1) * 0.8);
            
            // Add subtle color variations for richer chrome
            color += vec3(0.03) * sin(v1.x * 8.0 + time * 0.02);
            color += vec3(0.02) * cos(v2.y * 6.0 - time * 0.01);
            
            // Enhance contrast for shiny chrome look
            color = pow(color, vec3(1.1));
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });
      
      // Plane geometry that fills the screen
      const geometry = new THREE.PlaneGeometry(2, 2);
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      
      // Add window resize handler
      window.addEventListener('resize', onWindowResize);
    };
    
    // Animation loop - slowed down for smoother reflections
    const animate = () => {
      uniforms.time.value += 0.002; // Slower movement for more realistic chrome
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Handle window resize
    const onWindowResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.resolution.value.x = window.innerWidth;
      uniforms.resolution.value.y = window.innerHeight;
    };
    
    // Initialize and start animation
    init();
    animate();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationFrameId);
      if (mesh) scene.remove(mesh);
      if (material) material.dispose();
      renderer.dispose();
    };
  }, []);
  
  return <div ref={mountRef} className="liquid-metal-container" />;
};

export default LiquidMetal;