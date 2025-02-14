import React, { useEffect, useRef, memo } from 'react';

const LoadingSpirals = memo(() => {
  const spiralRef = useRef(null);
  const spiral2Ref = useRef(null);
  const text = "Generating your image";

  useEffect(() => {
    const setupSpiral = (ref, additionalOffset = 0) => {
      if (!ref.current) return;
      ref.current.innerHTML = '';
      
      const baseDelay = 500;
      const duration = 2000;
      const charCount = 16;

      text.split('').forEach((char, i) => {
        const div = document.createElement('div');
        div.innerText = char;
        div.classList.add('character');
        div.style.setProperty('--i', i + 1);
        div.style.animationDelay = `${-(baseDelay + additionalOffset) + (i * duration / charCount)}ms`;
        ref.current.appendChild(div);
      });
    };

    setupSpiral(spiralRef);
    setupSpiral(spiral2Ref, 4000);

    return () => {
      if (spiralRef.current) spiralRef.current.innerHTML = '';
      if (spiral2Ref.current) spiral2Ref.current.innerHTML = '';
    };
  }, []);

  return (
    <div className="loading-text">
      <div ref={spiralRef} className="spiral-text" />
      <div ref={spiral2Ref} className="spiral-text" />
    </div>
  );
});

LoadingSpirals.displayName = 'LoadingSpirals';

export default LoadingSpirals;