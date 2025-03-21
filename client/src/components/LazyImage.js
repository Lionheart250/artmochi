import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';
import { getImageUrl } from '../utils/imageUtils';

// Global state with performance tuning
if (typeof window !== 'undefined') {
  if (!window.__imageLoadingState) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    window.__imageLoadingState = {
      activeLoads: 0,
      // Higher concurrency for HTTP/2 benefits
      maxConcurrent: isMobile ? 6 : 12,
      isMobile: isMobile,
      // Cache optimized images
      optimizedCache: new Map(),
      // Keep track of preloaded images
      preloaded: new Set()
    };
  }
}

const LazyImage = ({ src, alt, className, onClick, columnIndex, onLoadStart, onLoadComplete, height }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [displayOriginal, setDisplayOriginal] = useState(false);
  const containerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const imgRef = useRef(null);
  const hasStartedLoadingRef = useRef(false);
  
  // Get reliable mobile detection
  const state = typeof window !== 'undefined' ? window.__imageLoadingState : null;
  const isMobile = state ? state.isMobile : false;
  
  // ADVANCED: Predictive prefetching for nearby images
  useEffect(() => {
    if (isInView && state && !state.preloaded.has(src)) {
      // Mark this image as being preloaded
      state.preloaded.add(src);
      
      // Find next/prev images based on columnIndex pattern and prefetch them
      // This assumes your images are in a grid and columnIndex indicates position
      setTimeout(() => {
        // Advanced prefetching logic would go here
        // For now, we'll just prefetch this image at high quality
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = src;
        link.as = 'image';
        document.head.appendChild(link);
      }, 100);
    }
  }, [isInView, src, columnIndex, state]);
  
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
  
  // High-performance intersection observer with larger preload zone
  useEffect(() => {
    // Use larger buffer on desktop for smoother experience
    const margin = isMobile ? '1000px' : '2000px';
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: margin }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    // Force load after brief timeout to ensure all images load eventually
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
  }, [columnIndex, isInView, isLoaded, isMobile]);

  // Optimized image loading with advanced caching & fallbacks
  useEffect(() => {
    if (!isInView || isLoaded || hasError || isProcessingRef.current) return;
    if (!state) return;
    
    hasStartedLoadingRef.current = true;
    
    // Prioritized loading queue based on viewport position
    if (state.activeLoads >= state.maxConcurrent) {
      const checkTimer = setInterval(() => {
        if (state.activeLoads < state.maxConcurrent) {
          clearInterval(checkTimer);
          loadImage();
        }
      }, 50); // Smaller interval for faster response
      
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
      
      // Check if we have a cached version
      if (state.optimizedCache.has(src)) {
        setCanvasDataUrl(state.optimizedCache.get(src));
        setIsLoaded(true);
        state.activeLoads--;
        isProcessingRef.current = false;
        
        if (typeof onLoadComplete === 'function') {
          onLoadComplete(columnIndex);
        }
        return;
      }
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          // Skip optimization for small images or SVGs
          if (img.naturalWidth <= 400 || src.endsWith('.svg')) {
            setDisplayOriginal(true);
          } else {
            // Pick optimal size based on device capabilities
            const targetWidth = isMobile ? 600 : 
                                (window.devicePixelRatio > 1) ? 1200 : 800;
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            const targetHeight = Math.round(targetWidth * aspectRatio);
            
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // High quality rendering
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              
              try {
                // WebP for best compression on supporting browsers
                const canUseWebP = !!(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
                let dataUrl;
                
                if (canUseWebP) {
                  dataUrl = canvas.toDataURL('image/webp', 0.85);
                } else {
                  dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                }
                
                if (dataUrl.length > 100) {
                  setCanvasDataUrl(dataUrl);
                  // Cache the optimized version
                  state.optimizedCache.set(src, dataUrl);
                } else {
                  setDisplayOriginal(true);
                }
              } catch (err) {
                setDisplayOriginal(true);
              }
            } else {
              setDisplayOriginal(true);
            }
          }
        } catch (error) {
          console.error('Canvas optimization failed:', error);
          setDisplayOriginal(true);
        } finally {
          setIsLoaded(true);
          state.activeLoads--;
          isProcessingRef.current = false;
          
          if (typeof onLoadComplete === 'function') {
            onLoadComplete(columnIndex);
          }
        }
      };
      
      img.onerror = () => {
        console.error('Image failed to load:', src);
        setDisplayOriginal(true);
        setIsLoaded(true);
        setHasError(true);
        state.activeLoads--;
        isProcessingRef.current = false;
        
        if (typeof onLoadComplete === 'function') {
          onLoadComplete(columnIndex);
        }
      };
      
      // Load image from source - server has already optimized this
      img.src = src;
    }
  }, [isInView, isLoaded, hasError, src, columnIndex, onLoadStart, onLoadComplete, isMobile]);

  // Progressive fallback for error handling
  function handleImageError() {
    if (canvasDataUrl) {
      // Clear from cache since it failed
      if (state) {
        state.optimizedCache.delete(src);
      }
      setCanvasDataUrl(null);
      
      if (!displayOriginal) {
        setDisplayOriginal(true);
        return;
      }
    }
    
    setHasError(true);
    setIsLoaded(true);
  }
  
  // Intelligent source selection with fallbacks
  function getImageSource() {
    // Canvas-optimized version (highest performance)
    if (canvasDataUrl) {
      return canvasDataUrl;
    }
    
    // Server-optimized version (already in src)
    return src;
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
          src={getImageSource()}
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