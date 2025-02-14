import React, { useEffect, useRef, memo } from 'react';

const LoadingSpirals = memo(() => {
  const containerRef = useRef(null);
  const animationInitialized = useRef(false);

  useEffect(() => {
    if (animationInitialized.current) return;
    animationInitialized.current = true;

    const text = "Generating your image";
    const duration = 2000;
    const baseOffset = 500;
    const secondSpiralOffset = 4000;

    const createSpiral = (isSecond) => {
      const spiral = document.createElement('div');
      spiral.className = 'spiral-text';
      
      text.split('').forEach((char, i) => {
        const div = document.createElement('div');
        div.innerText = char;
        div.className = 'character';
        div.style.setProperty('--i', i + 1);
        
        // Calculate different delays for each spiral
        const delay = isSecond 
          ? -(baseOffset + secondSpiralOffset) + (i * duration / text.length)
          : -baseOffset + (i * duration / text.length);
          
        div.style.animationDelay = `${delay}ms`;
        spiral.appendChild(div);
      });

      return spiral;
    };

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(createSpiral(false)); // First spiral
      containerRef.current.appendChild(createSpiral(true));  // Second spiral with offset
    }

    return () => {
      animationInitialized.current = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} className="loading-text" />;
}, () => true);

LoadingSpirals.displayName = 'LoadingSpirals';

export default LoadingSpirals;