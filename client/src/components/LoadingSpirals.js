import React, { useEffect, useRef } from 'react';

const LoadingSpirals = () => {
  const spiralRef = useRef(null);
  const spiral2Ref = useRef(null);
  const spiral = "Generating your image";
  const ANIMATION_DURATION = 2000;
  const ANIMATION_OFFSET = 500;
  const SPIRAL2_OFFSET = 4000;

  useEffect(() => {
    if (spiralRef.current) {
      spiralRef.current.innerHTML = '';
      
      spiral.split('').forEach((char, i) => {
        const div = document.createElement('div');
        div.innerText = char;
        div.classList.add('character');
        div.style.setProperty('--i', i + 1);
        div.style.animationDelay = `${(i * ANIMATION_DURATION / 16) - ANIMATION_OFFSET - ANIMATION_DURATION}ms`;
        spiralRef.current.appendChild(div);
      });
    }
  }, []);

  useEffect(() => {
    if (spiral2Ref.current) {
      spiral2Ref.current.innerHTML = '';
      
      spiral.split('').forEach((char, i) => {
        const div = document.createElement('div');
        div.innerText = char;
        div.classList.add('character');
        div.style.setProperty('--i', i + 1);
        div.style.animationDelay = `${-(ANIMATION_OFFSET + SPIRAL2_OFFSET) + (i * ANIMATION_DURATION / 16)}ms`;
        spiral2Ref.current.appendChild(div);
      });
    }

    return () => {
      if (spiral2Ref.current) {
        spiral2Ref.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="loading-text">
      <div ref={spiralRef} className="spiral-text" />
      <div ref={spiral2Ref} className="spiral-text" />
    </div>
  );
};

export default LoadingSpirals;