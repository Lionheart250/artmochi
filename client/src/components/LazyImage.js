import React, { useState, useEffect, useRef } from 'react';

// Simple global state tracker
if (typeof window !== 'undefined') {
  if (!window.__imageLoadingState) {
    window.__imageLoadingState = {
      // Track concurrent loads
      activeLoads: 0,
      maxConcurrent: 8
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
  
  // Base64 encoded simple dark gradient placeholder
  const placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhgJAi2Nw0wAAAABJRU5ErkJggg==";
  
  // Notify parent when starting load
  useEffect(() => {
    if (isInView && !isLoaded && !hasError && typeof onLoadStart === 'function') {
      onLoadStart(columnIndex);
    }
  }, [isInView, isLoaded, hasError, onLoadStart, columnIndex]);
  
  // Notify parent when load completes
  useEffect(() => {
    if ((isLoaded || hasError) && typeof onLoadComplete === 'function') {
      onLoadComplete(columnIndex);
    }
  }, [isLoaded, hasError, onLoadComplete, columnIndex]);
  
  // FIXED: Improved intersection observer with larger margin and fallback
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      // INCREASED rootMargin for earlier detection
      { threshold: 0.01, rootMargin: '1500px' }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    // ADD FALLBACK: Force load after a timeout even if never scrolled into view
    const timeoutId = setTimeout(() => {
      if (!isInView && !isLoaded && !hasStartedLoadingRef.current) {
        console.log(`Force loading image in column ${columnIndex} after timeout`);
        setIsInView(true);
        observer.disconnect();
      }
    }, 500); // half second fallback
    
    return () => {
      if (observer) observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [columnIndex, isInView, isLoaded]);

  // Process image when it comes into view - with simpler loading approach
  useEffect(() => {
    if (!isInView || isLoaded || hasError || isProcessingRef.current) return;
    if (typeof window === 'undefined') return;
    
    const state = window.__imageLoadingState;
    hasStartedLoadingRef.current = true;
    
    // Wait if too many concurrent loads
    if (state.activeLoads >= state.maxConcurrent) {
      const checkTimer = setInterval(() => {
        if (state.activeLoads < state.maxConcurrent) {
          clearInterval(checkTimer);
          loadImage();
        }
      }, 100);
      
      return () => clearInterval(checkTimer);
    } else {
      loadImage();
    }
    
    function loadImage() {
      isProcessingRef.current = true;
      state.activeLoads++;
      
      // Notify parent when starting load
      if (typeof onLoadStart === 'function') {
        onLoadStart(columnIndex);
      }
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          // Skip optimization for small images
          if (img.naturalWidth <= 400 && img.naturalHeight <= 400) {
            setDisplayOriginal(true);
          } else {
            // Create optimized version with canvas
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            const targetWidth = 800;
            const targetHeight = Math.round(targetWidth * aspectRatio);
            
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              
              try {
                // Try WebP first
                const dataUrl = canvas.toDataURL('image/webp', 0.8);
                if (dataUrl.length > 100) {
                  setCanvasDataUrl(dataUrl);
                } else {
                  // If WebP fails, try JPEG
                  const jpegUrl = canvas.toDataURL('image/jpeg', 0.85);
                  setCanvasDataUrl(jpegUrl);
                }
              } catch (err) {
                // Fall back to original if canvas fails
                setDisplayOriginal(true);
              }
            } else {
              setDisplayOriginal(true);
            }
          }
        } catch (error) {
          setDisplayOriginal(true);
        } finally {
          setIsLoaded(true);
          state.activeLoads--;
          isProcessingRef.current = false;
          
          // Make sure we call the callback with the column index
          if (typeof onLoadComplete === 'function') {
            console.log(`Image in column ${columnIndex} loaded, calling completion callback`);
            onLoadComplete(columnIndex);
          }
        }
      };
      
      img.onerror = () => {
        setDisplayOriginal(true);
        setIsLoaded(true);
        setHasError(true);
        state.activeLoads--;
        isProcessingRef.current = false;
        
        if (typeof onLoadComplete === 'function') {
          onLoadComplete(columnIndex);
        }
      };
      
      // Start loading the image
      img.src = src;
    }
  }, [isInView, isLoaded, hasError, src, columnIndex, onLoadStart, onLoadComplete]);

  return (
    <div 
      ref={containerRef}
      className={`lazy-image-container ${className || ''}`} 
      onClick={onClick}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {(!isLoaded || !isInView) && (
        <div className="lazy-image-placeholder" 
          style={{
            backgroundImage: `url(${placeholderImage})`,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(10, 5, 20, 0.2)'
          }} 
        />
      )}
      
      {isInView && (
        <img
          ref={imgRef}
          src={canvasDataUrl || src}
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
          onError={() => {
            if (canvasDataUrl) {
              setCanvasDataUrl(null); // Try original if optimized fails
              setDisplayOriginal(true);
            } else {
              setHasError(true);
              setIsLoaded(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default LazyImage;