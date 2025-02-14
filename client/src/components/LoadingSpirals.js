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

    const createSpiral = (offset) => {
      const spiral = document.createElement('div');
      spiral.className = 'spiral-text';
      
      text.split('').forEach((char, i) => {
        const div = document.createElement('div');
        div.innerText = char;
        div.className = 'character';
        div.style.setProperty('--i', i + 1);
        div.style.animationDelay = `${-(baseOffset + offset) + (i * duration / text.length)}ms`;
        spiral.appendChild(div);
      });

      return spiral;
    };

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(createSpiral(0));
      containerRef.current.appendChild(createSpiral(secondSpiralOffset));
    }

    return () => {
      animationInitialized.current = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} className="loading-text" />;
}, () => true); // Force memo to always return true, preventing all re-renders

LoadingSpirals.displayName = 'LoadingSpirals';

export default LoadingSpirals;