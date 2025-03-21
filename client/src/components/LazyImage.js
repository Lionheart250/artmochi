import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

// Global state tracker
if (typeof window !== 'undefined') {
  if (!window.__imageLoadingState) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    window.__imageLoadingState = {
      activeLoads: 0,
      maxConcurrent: isMobile ? 3 : 6
    };
  }
}

const LazyImage = ({ src, alt, className, onClick, columnIndex, onLoadStart, onLoadComplete, height }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const imgRef = useRef(null);
  const hasStartedLoadingRef = useRef(false);
  
  // Notification system for parent components
  useEffect(() => {
    if (isInView && !isLoaded && !hasError && typeof onLoadStart === 'function') {
      onLoadStart(columnIndex);
    }
  }, [isInView, isLoaded, hasError, onLoadStart, columnIndex]);
  
  useEffect(() => {
    if ((isLoaded || hasError) && typeof onLoadComplete === 'function') {
      onLoadComplete(columnIndex);
    }
  }, [isLoaded, hasError, onLoadComplete, columnIndex]);
  
  // High-performance intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '1000px' }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    // Force load after brief timeout
    const timeoutId = setTimeout(() => {
      if (!isInView && !isLoaded && !hasStartedLoadingRef.current) {
        setIsInView(true);
        observer.disconnect();
      }
    }, 500);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [columnIndex, isInView, isLoaded]);

  // Simple image loading without canvas
  useEffect(() => {
    if (!isInView || isLoaded || hasError || isProcessingRef.current) return;
    if (typeof window === 'undefined') return;
    
    const state = window.__imageLoadingState;
    hasStartedLoadingRef.current = true;
    
    if (state.activeLoads >= state.maxConcurrent) {
      const checkTimer = setInterval(() => {
        if (state.activeLoads < state.maxConcurrent) {
          clearInterval(checkTimer);
          loadImage();
        }
      }, 50);
      
      return () => clearInterval(checkTimer);
    } else {
      loadImage();
    }
    
    function loadImage() {
      isProcessingRef.current = true;
      state.activeLoads++;
      
      if (typeof onLoadStart === 'function') {
        onLoadStart(columnIndex);
      }
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        setIsLoaded(true);
        state.activeLoads--;
        isProcessingRef.current = false;
        
        if (typeof onLoadComplete === 'function') {
          onLoadComplete(columnIndex);
        }
      };
      
      img.onerror = () => {
        setIsLoaded(true);
        setHasError(true);
        state.activeLoads--;
        isProcessingRef.current = false;
        
        if (typeof onLoadComplete === 'function') {
          onLoadComplete(columnIndex);
        }
      };
      
      // Direct loading from server-optimized source
      img.src = src;
    }
  }, [isInView, isLoaded, hasError, src, columnIndex, onLoadStart, onLoadComplete]);

  // Simple error handling
  function handleImageError() {
    setHasError(true);
    setIsLoaded(true);
  }

  return (
    <div 
      ref={containerRef}
      className={`lazy-image-container ${className || ''}`} 
      onClick={onClick}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Animated placeholder with skeleton loading effect */}
      {!isLoaded && (
        <div className="lazy-image-placeholder pulse"></div>
      )}
      
      {/* Error state with retry option */}
      {hasError && (
        <div className="lazy-image-error">
          <div className="error-icon"></div>
          <div className="error-message">{alt || 'Image could not be loaded'}</div>
        </div>
      )}
      
      {/* Progressive image loading */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          crossOrigin="anonymous"
          onLoad={() => {
            if (!isLoaded) setIsLoaded(true);
          }}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

export default LazyImage;