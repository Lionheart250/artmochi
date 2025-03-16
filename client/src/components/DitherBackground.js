import React, { useEffect, useRef } from 'react';

const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;

  varying highp vec2 vTextureCoord;

  void main(void) {
    gl_Position = aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

const fragmentShaderSource = `
  precision highp float;
  
  varying highp vec2 vTextureCoord;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_touch;
  uniform int u_pointerCount;
  
  #define PI 3.14159265
  #define TAU 6.28318530
  
  // Random function
  vec2 random2(vec2 st) {
    st = vec2(
      dot(st, vec2(127.1, 311.7)),
      dot(st, vec2(269.5, 183.3))
    );
    return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
  }
  
  // Gradient Noise
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
      mix(
        dot(random2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)),
        u.x
      ),
      mix(
        dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)),
        u.x
      ),
      u.y
    );
  }
  
  // Modulo operation for dithering
  float mod2(float a, float b) {
    return a - (b * floor(a / b));
  }
  
  // Bayer dither matrix 4x4
  float indexMatrix4x4(int index) {
    if(index==0) return 0.0; if(index==1) return 8.0; if(index==2) return 2.0; if(index==3) return 10.0;
    if(index==4) return 12.0; if(index==5) return 4.0; if(index==6) return 14.0; if(index==7) return 6.0;
    if(index==8) return 3.0; if(index==9) return 11.0; if(index==10) return 1.0; if(index==11) return 9.0;
    if(index==12) return 15.0; if(index==13) return 7.0; if(index==14) return 13.0; if(index==15) return 5.0;
    return 0.0;
  }
  
  // Get dither index value
  float indexValue(vec2 fragCoord) {
    int x = int(mod2(fragCoord.x, 4.0));
    int y = int(mod2(fragCoord.y, 4.0));
    return indexMatrix4x4(x + y * 4) / 16.0;
  }
  
  // Matrix rotation
  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }
  
  // Apply dithering
  vec3 dither(vec3 color, vec2 fragCoord) {
    float c = (color.r + color.g + color.b) / 3.0;
    float closestColor = (c < 0.5) ? 0.0 : 1.0;
    float secondClosestColor = 1.0 - closestColor;
    float d = indexValue(fragCoord);
    float distance = abs(closestColor - c);
    
    return (distance < d) ? vec3(closestColor) : vec3(secondClosestColor);
  }
  
  // Color palette from third example
  vec3 palette(float k) {
    vec3
    a = vec3(.75, .5, .5),
    b = vec3(.5, .5, .75),
    c = vec3(1, 1.8, 1),
    d = vec3(.2, .4, .8);

    return a + b * cos(TAU * (c * k + d));
  }
  
  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = st * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    // Touch position as normalized coordinates
    vec2 touch = u_touch.xy / u_resolution.xy;
    touch = touch * 2.0 - 1.0;
    touch.x *= u_resolution.x / u_resolution.y;
    
    // Base color
    vec3 color = vec3(0.0);
    
    // Time variables
    float time = u_time * 0.5;
    float T = mod(time * 2.0, 300.0);
    
    // Create complex animated patterns based on third example
    // But simplified and adapted for our needs
    vec3 p = vec3(uv, -20.0 + sin(time) * 5.0);
    
    // Rotate based on time
    p.xz *= rot(time * 0.2);
    p.xy *= rot(time * 0.15);
    
    // Create repeating patterns
    for (float i = 0.0; i < 3.0; i++) {
      float t = T * 0.15 + sin(p.z * 0.125 + T * 0.5) * 0.2;
      p.xz *= rot(t * 0.2);
      p.xy *= rot(t * 0.15);
      p.xz = abs(p.xz);
      p.xz -= 1.0 + sin(T * 0.1 + p.x * 0.1) * 0.5;
    }
    
    // Add dynamic grid patterns
    vec2 grid = abs(fract(st * (10.0 + sin(time) * 2.0)) - 0.5);
    float gridLines = smoothstep(0.05, 0.0, min(grid.x, grid.y)) * 0.1;
    
    // Create animated noise field like shader-doodle
    st += noise(st * 2.0 + time * 0.1);
    float noiseVal = noise(st * 3.0 + time * 0.2);
    float blobs = smoothstep(0.0, 0.3, noiseVal);
    
    // Create waves emanating from touch point if active
    float touchEffect = 0.0;
    if (u_pointerCount > 0) {
      float dist = length(uv - touch);
      touchEffect = sin(dist * 10.0 - time * 3.0) * 0.5 + 0.5;
      touchEffect *= smoothstep(2.0, 0.0, dist);
    }
    
    // Combine effects
    color = vec3(0.2) * blobs;
    color += vec3(0.3) * smoothstep(0.05, 0.7, noise(st * 5.0));
    color += vec3(0.1, 0.3, 0.5) * gridLines;
    
    // Add palette color from third example
    float intensity = length(p) * 0.01;
    color += palette(0.1 / (0.1 + intensity)) * 0.1;
    
    // Add touch effect
    color += vec3(0.0, 0.8, 1.0) * touchEffect * 0.3;
    
    // Apply various visual distortions
    float tr = (2.0 * time) - length(uv) * 2.0;
    color.yz *= rot(tr * 0.3);
    color.xz *= rot(tr * 0.2);
    
    // Add vertical scan line
    float scanLine = smoothstep(0.01, 0.0, abs(mod(st.y * 100.0 - time * 20.0, 100.0) - 50.0) / 100.0);
    color += vec3(0.0, 0.6, 0.8) * scanLine * 0.1;
    
    // Clamp values
    color = clamp(color, 0.0, 1.0);
    
    // Apply dithering
    color = dither(color, gl_FragCoord.xy);
    
    // Add cyan tint to whites
    color = mix(color, vec3(0.0, 0.8, 1.0), color.r * 0.2);
    
    // Output final color
    gl_FragColor = vec4(color, 1.0);
  }
`;

const DitherBackground = () => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const animationRef = useRef(null);
  const touchesRef = useRef(new Map());
  
  // Initialize WebGL
  const initWebGL = () => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    
    // Create shader program
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;
    
    // Save references
    glRef.current = gl;
    programRef.current = program;
    
    // Setup buffers
    setupBuffers(gl, program);
    
    // Start animation
    startAnimation();
  };
  
  // Create shader program
  const createProgram = (gl, vsSource, fsSource) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Unable to initialize shader program: ' + gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  };
  
  // Load shader
  const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  };
  
  // Setup buffers
  const setupBuffers = (gl, program) => {
    // Vertices for a quad that fills the canvas
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ];
    
    const textureCoords = [
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
    ];
    
    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    const positionAttributeLocation = gl.getAttribLocation(program, 'aVertexPosition');
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);
    
    // Texture coordinate buffer
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    
    const textureCoordAttributeLocation = gl.getAttribLocation(program, 'aTextureCoord');
    gl.vertexAttribPointer(textureCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textureCoordAttributeLocation);
  };
  
  // Start animation
  const startAnimation = () => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    
    // Starting time
    let startTime = Date.now();
    
    gl.useProgram(program);
    
    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const touchLocation = gl.getUniformLocation(program, 'u_touch');
    const pointerCountLocation = gl.getUniformLocation(program, 'u_pointerCount');
    
    // Update and render
    const render = () => {
      if (!gl || !canvas) return;
      
      // Resize canvas if needed
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      
      // Get touch position
      const touchPos = getTouchPosition();
      
      // Update uniforms
      gl.uniform1f(timeLocation, (Date.now() - startTime) / 1000);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(touchLocation, touchPos[0], touchPos[1]);
      gl.uniform1i(pointerCountLocation, touchesRef.current.size);
      
      // Draw
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
  };

  // Get touch position  
  const getTouchPosition = () => {
    if (touchesRef.current.size === 0) {
      return [0, 0];
    }
    
    // Get first touch
    for (let [_, touch] of touchesRef.current.entries()) {
      return [
        touch.clientX,
        window.innerHeight - touch.clientY
      ];
    }
    
    return [0, 0];
  };
  
  // Handle pointer events
  const handlePointerDown = (e) => {
    touchesRef.current.set(e.pointerId, e);
  };
  
  const handlePointerMove = (e) => {
    if (touchesRef.current.has(e.pointerId)) {
      touchesRef.current.set(e.pointerId, e);
    }
  };
  
  const handlePointerUp = (e) => {
    touchesRef.current.delete(e.pointerId);
  };

  // Add key press handler for special effects
  const handleKeyPress = (e) => {
    if (e.key === 'v' || e.key === 'g') {
      // Simulate two touches for 'Sven Väth' mode as in the third example
      touchesRef.current.set(1, {clientX: 100, clientY: 100});
      touchesRef.current.set(2, {clientX: 200, clientY: 200});
    } else {
      // Clear touches for normal mode
      touchesRef.current.clear();
    }
  };
  
  useEffect(() => {
    // Init WebGL when component mounts
    initWebGL();
    
    // Add event listeners
    window.addEventListener('keyup', handleKeyPress);
    
    // Cleanup
    return () => {
      window.removeEventListener('keyup', handleKeyPress);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="dither-background" 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
};

export default DitherBackground;