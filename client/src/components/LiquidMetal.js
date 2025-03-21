import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const LiquidMetal = () => {
  const mountRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const uniformsRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  
  useEffect(() => {
    let scene, camera, renderer, uniforms, material, mesh;
    let animationFrameId;

    // Initialize scene
    const init = () => {
      // Create scene
      scene = new THREE.Scene();
      sceneRef.current = scene;
      
      // Create camera (orthographic for full screen shader)
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      
      // Create renderer with preserveDrawingBuffer to prevent flicker on scroll
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit to 1.5 on mobile
      rendererRef.current = renderer;
      
      // Replace any existing canvas
      if (mountRef.current.childNodes.length > 0) {
        mountRef.current.removeChild(mountRef.current.childNodes[0]);
      }
      mountRef.current.appendChild(renderer.domElement);
      
      // Enhanced shader uniforms for hyper-reflective Sorayama chrome
      uniforms = {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        scale: { value: 1.5 },
        ax: { value: 5.3 },
        ay: { value: 4.4 },
        az: { value: 4.2 },
        aw: { value: 5.1 },
        bx: { value: 0.78 },
        by: { value: 1.94 },
        // Enhanced color palette for more dramatic chrome nawm sayin homie
        color1: { value: new THREE.Color(0xFFFFFF) }, // Pure white for extreme highlights
        color2: { value: new THREE.Color(0x050505) }, // Deep black shadow
        color3: { value: new THREE.Color(0xE6E6E6) }, // Bright silver highlight
        color4: { value: new THREE.Color(0x9C9C9C) }, // Mid-tone silver
        color5: { value: new THREE.Color(0x2A2A2A) }, // Dark shadow
        color6: { value: new THREE.Color(0x666666) }, // Medium shadow
        // Iridescence colors
        color7: { value: new THREE.Color(0xCCD6F6) }, // Cool blue highlight tint
        color8: { value: new THREE.Color(0xE0CCFF) }, // Subtle purple reflection
        color9: { value: new THREE.Color(0xFFE5CC) }, // Warm reflection tone
        // Sky reflection colors
        skyTop: { value: new THREE.Color(0xCCDDFF) }, // Sky color for reflections
        skyBottom: { value: new THREE.Color(0x333344) }, // Ground color for reflections
        // Enhanced parameters
        reflectionStrength: { value: 7.2 },    // Increased for more contrast
        reflectionSharpness: { value: 5.5 },   // Sharper reflections
        highlightIntensity: { value: 3.8 },    // Brighter highlights
        fresnelPower: { value: 4.0 },          // Edge highlight intensity
        iridescenceStrength: { value: 0.2 },   // Color shifting amount
        streakIntensity: { value: 0.15 },      // Anisotropic streak amount
        timeScale: { value: 0.003 }            // Animation speed
      };
      uniformsRef.current = uniforms;
      
      // Enhanced shader material for hyper-reflective Sorayama chrome
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
          uniform vec3 skyTop, skyBottom;
          uniform float ax, ay, az, aw;
          uniform float bx, by;
          uniform float reflectionStrength;
          uniform float reflectionSharpness;
          uniform float highlightIntensity;
          uniform float fresnelPower;
          uniform float iridescenceStrength;
          uniform float streakIntensity;
          
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
            // Narrower transition for sharper highlights
            return pow(smoothstep(threshold - 0.08, threshold + 0.08, n), intensity);
          }
          
          // Fresnel effect for edge highlighting
          float fresnel(vec2 st) {
            vec2 centered = st * 2.0 - 1.0;
            float dist = 1.0 - min(1.0, length(centered)); 
            return pow(dist, fresnelPower);
          }
          
          void main() {
            vec2 aR = vec2(resolution.x/resolution.y, 1.);
            vec2 st = vUv * aR * scale;
            
            // Slower movement for more realistic chrome
            float timeScale = 0.003;
            float S = sin(time * timeScale);
            float C = cos(time * timeScale);
            
            // IMPROVEMENT 4: Multi-layered noise for more complex reflections
            // Generate fine detail noise
            float fineNoise = cheapNoise(vec3(st * 3.0, time * 0.02));
            
            // Generate coarse base noise
            float coarseNoise = cheapNoise(vec3(st * 0.7, time * 0.01));
            
            // Mix for more organic patterns
            float mixedNoiseBase = mix(fineNoise, coarseNoise, 0.6);
            
            // Generate the base noise pattern
            vec2 v1 = vec2(
              cheapNoise(vec3(st, 2.)) + fineNoise * 0.2,
              cheapNoise(vec3(st, 1.)) + fineNoise * 0.15
            );
            
            // Create more complex, flowing reflections
            vec2 v2 = vec2(
              cheapNoise(vec3(st + bx*v1 + vec2(C * 2.1, S * 8.7), 0.18 * time)),
              cheapNoise(vec3(st + by*v1 + vec2(S * 7.2, C * 3.4), 0.15 * time))
            );
            
            // Create organic flowing noise with multi-layered detail
            float n = .5 + .5 * (cheapNoise(vec3(st + v2, time * 0.05)) + fineNoise * 0.2);
            
            // Sharpen reflections for chrome look
            float sharpN = pow(n, reflectionSharpness);

            // Base chrome gradient - extreme contrast between white and black
            vec3 color = mix(color1, color2, clamp(pow(sharpN, 1.6) * reflectionStrength, 0.0, 1.0));

            // IMPROVEMENT 1: Fake environment map reflection (simulated HDR)
            // Sky to ground gradient reflection
            vec3 skyReflection = mix(skyBottom, skyTop, pow(vUv.y, 0.8));
            color = mix(color, skyReflection, mixedNoiseBase * 0.30);
            
            // Add silver mid-tones in a more controlled way
            color = mix(color, color3, smoothstep(0.3, 0.4, n) * 0.8);
            color = mix(color, color4, smoothstep(0.5, 0.6, n) * 0.7);
            
            // IMPROVEMENT 3: Dynamic iridescence (color shift based on angle & time)
            // Create iridescent color palette that shifts over time
            vec3 iridescence1 = mix(vec3(0.8, 0.9, 1.0), vec3(0.9, 0.8, 1.0), sin(time * 0.2) * 0.5 + 0.5);
            vec3 iridescence2 = mix(vec3(1.0, 0.9, 0.8), vec3(0.9, 0.8, 1.0), cos(time * 0.3) * 0.5 + 0.5);
            
            // Add subtle iridescent blue reflections - key to Sorayama's chrome
            float coolReflection = smoothstep(0.4, 0.7, length(v1) * 0.9);
            color = mix(color, mix(color7, iridescence1, 0.4), coolReflection * 0.18);
            
            // Add subtle warm reflections
            float warmReflection = smoothstep(0.2, 0.5, length(v2) * 1.1);
            color = mix(color, mix(color9, iridescence2, 0.3), warmReflection * 0.15);
            
            // Add subtle purple tint to certain angles
            float purpleTint = smoothstep(0.3, 0.6, abs(dot(normalize(v1), normalize(v2))));
            color = mix(color, color8, purpleTint * 0.1);

            // Create highlight areas - sharper transitions for more defined highlights
            float h1 = highlight(n, 0.8, highlightIntensity);
            float h2 = highlight(n, 0.65, highlightIntensity * 0.7);
            float h3 = highlight(n, 0.45, highlightIntensity * 0.4);
            
            // Mix in bright highlights for chrome effect - more precisely
            color = mix(color, color1, h1); // Pure white highlights
            color = mix(color, color3, h2 * (1.0-h1) * 0.9);
            color = mix(color, color5, h3 * (1.0-h1) * (1.0-h2) * 0.7);
            
            // IMPROVEMENT 2: Enhanced fresnel reflection for edge highlighting
            float edgeFactor = pow(1.0 - abs(dot(normalize(vec2(v1.x, v1.y)), normalize(v2))), 3.0);
            color = mix(color, color1, edgeFactor * 0.5);
            
            // Add extra edge highlight for that perfect Sorayama rim
            float fresnelFactor = fresnel(vUv);
            color = mix(color, color1, fresnelFactor * 0.4);
            
            // IMPROVEMENT 6: Subtle anisotropic streaking for silky metal look
            float streaks = pow(abs(sin(st.x * 20.0 + st.y * 5.0 + time * 0.05)), 2.0);
            color = mix(color, mix(color4, color3, streaks), streaks * streakIntensity);
            
            // Add subtle color variations for richer chrome
            color += vec3(0.02, 0.02, 0.04) * sin(v1.x * 10.0 + time * 0.02); // Blue tint
            color += vec3(0.03, 0.01, 0.00) * cos(v2.y * 8.0 - time * 0.01); // Warm tint
            
            // IMPROVEMENT 5: Stronger contrast & gamma correction
            // Enhance contrast for shiny chrome look
            color = pow(color, vec3(1.5)); // Increased gamma for more pop
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });
      
      // Plane geometry that fills the screen
      const geometry = new THREE.PlaneGeometry(2, 2);
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      
      // Detect if mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Lower quality on mobile for better performance
        renderer.setPixelRatio(1.0); // Force to 1.0 on mobile
        uniforms.scale.value = 2.0; // Slightly larger scale for mobile
        uniforms.timeScale.value = 0.001; // Reduce animation speed on mobile to prevent context loss
      } else {
        uniforms.timeScale.value = 0.003;
      }

      setIsReady(true);
    };
    
    // Simple animation loop - consistent speed regardless of scrolling
    const animate = () => {
      // Always animate at constant speed
      if (uniformsRef.current) {
        uniformsRef.current.time.value += uniformsRef.current.timeScale.value; // Use the new timeScale uniform instead of hardcoded value
      }
      
      // Always render
      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    // Simplified - just keep track of window dimensions for rendering quality
    const onWindowResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      // Use a timeout to limit resize operations on mobile
      resizeTimeoutRef.current = setTimeout(() => {
        if (rendererRef.current && uniformsRef.current) {
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          rendererRef.current.setSize(width, height);
          uniformsRef.current.resolution.value.x = width;
          uniformsRef.current.resolution.value.y = height;
        }
      }, 300);
    };
    
    // Initialize and start animation
    init();
    animate();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    
    // Setup viewport meta tag for mobile
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(viewportMeta);
    
    // Handle lost context
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.log('WebGL context lost. Trying to restore...');
      
      // Stop animation temporarily
      cancelAnimationFrame(animationFrameId);
      
      // Force the browser to acknowledge the event
      setTimeout(() => {
        // Attempt to restart
        if (rendererRef.current) {
          animationFrameId = requestAnimationFrame(animate);
        }
      }, 500);
    }, false);
    
    // Add touch event handlers to prevent default behavior
    const preventDefaultTouch = (e) => {
      // Only prevent scrolling when touching the canvas itself
      if (e.target === renderer.domElement) {
        e.preventDefault();
      }
    };

    // Passive: false is important to allow preventDefault
    renderer.domElement.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    renderer.domElement.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationFrameId);
      if (mesh) scene.remove(mesh);
      if (material) material.dispose();
      if (renderer) renderer.dispose();
      document.head.removeChild(viewportMeta);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('touchstart', preventDefaultTouch);
        renderer.domElement.removeEventListener('touchmove', preventDefaultTouch);
        renderer.domElement.removeEventListener('webglcontextlost', () => {});
      }
    };
  }, []);
  
  return (
    <div 
      ref={mountRef} 
      className="liquid-metal-container" 
      style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: -1,
        overflow: 'hidden',
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
    />
  );
};

export default LiquidMetal;