import React, { useState, useEffect, useRef } from 'react';

// Initialize global state once
if (typeof window !== 'undefined') {
  if (!window.__imageProcessingState) {
    window.__imageProcessingState = {
      activeCount: 0,
      queue: [],
      failed: new Set(),
      timeout: 10000,
      columnHeights: {},
      processingByColumn: {},
      maxHeightDifference: 500
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
  const processingTimerRef = useRef(null);
  const isProcessingRef = useRef(false); // Track if we're currently processing
  
  // Base64 encoded simple dark gradient placeholder
  const placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhgJAi2Nw0wAAAABJRU5ErkJggg==";
  
  // Notify parent when starting load - use ref to prevent infinite loop
  useEffect(() => {
    if (isInView && !isLoaded && !canvasDataUrl && !hasError && typeof onLoadStart === 'function') {
      onLoadStart(columnIndex);
    }
    
    return () => {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, [isInView]); // Only depend on isInView to avoid loops
  
  // Notify parent when load completes - use ref to prevent infinite loop
  useEffect(() => {
    if ((isLoaded || hasError) && isInView && typeof onLoadComplete === 'function') {
      onLoadComplete(columnIndex);
    }
  }, [isLoaded, hasError]); // Reduced dependencies to avoid loops
  
  // Set up intersection observer - this is fine as is
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '500px' }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (observer) observer.disconnect();
    };
  }, []);
  
  // Initialize column tracking - separate from state updates
  useEffect(() => {
    if (typeof window === 'undefined' || !window.__imageProcessingState || columnIndex === undefined) return;
    
    // Safely initialize column height tracking
    if (!window.__imageProcessingState.columnHeights) {
      window.__imageProcessingState.columnHeights = {};
    }
    
    if (window.__imageProcessingState.columnHeights[columnIndex] === undefined) {
      window.__imageProcessingState.columnHeights[columnIndex] = 0;
    }
    
    // Safely initialize column processing tracking
    if (!window.__imageProcessingState.processingByColumn) {
      window.__imageProcessingState.processingByColumn = {};
    }
    
    if (window.__imageProcessingState.processingByColumn[columnIndex] === undefined) {
      window.__imageProcessingState.processingByColumn[columnIndex] = 0;
    }
  }, [columnIndex]);

  // Process image when it comes into view - key fix is here
  useEffect(() => {
    // Only run if the image is in view and not already loaded/processing
    if (!isInView || isLoaded || canvasDataUrl || hasError || isProcessingRef.current) return;
    if (typeof window === 'undefined' || !window.__imageProcessingState) return;
    
    // Mark that we're starting to process
    isProcessingRef.current = true;
    
    // Ensure failed Set exists
    if (!window.__imageProcessingState.failed) {
      window.__imageProcessingState.failed = new Set();
    }
    
    const processImage = async () => {
      // Skip if already failed
      if (window.__imageProcessingState.failed.has(src)) {
        setDisplayOriginal(true);
        setIsLoaded(true);
        isProcessingRef.current = false;
        return;
      }
      
      try {
        const img = new Image();
        
        const imageLoadPromise = new Promise((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          
          // Handle cross-origin images
          if (!src.startsWith('data:') && !src.startsWith(window.location.origin)) {
            img.crossOrigin = "anonymous";
          }
        });
        
        img.src = src;
        const loadedImg = await imageLoadPromise;
        
        // Skip optimization for small images
        if (loadedImg.naturalWidth <= 400 && loadedImg.naturalHeight <= 400) {
          setDisplayOriginal(true);
          setIsLoaded(true);
          isProcessingRef.current = false;
          return;
        }
        
        const aspectRatio = loadedImg.naturalHeight / loadedImg.naturalWidth;
        const targetPixels = 360000; // 600x600 equivalent
        
        let canvasWidth, canvasHeight;
        
        if (aspectRatio >= 1) {
          canvasHeight = Math.sqrt(targetPixels * aspectRatio);
          canvasWidth = canvasHeight / aspectRatio;
        } else {
          canvasWidth = Math.sqrt(targetPixels / aspectRatio);
          canvasHeight = canvasWidth * aspectRatio;
        }
        
        canvasWidth = Math.round(Math.max(canvasWidth, 200));
        canvasHeight = Math.round(Math.max(canvasHeight, 200));
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(loadedImg, 0, 0, canvasWidth, canvasHeight);
        
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/webp', 0.85);
        } catch (err) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
        
        // Update state in a batch to avoid multiple re-renders
        setCanvasDataUrl(dataUrl);
        setIsLoaded(true);
        
        // Update column height if needed
        if (columnIndex !== undefined && window.__imageProcessingState.columnHeights) {
          const imageHeight = height || 300;
          window.__imageProcessingState.columnHeights[columnIndex] += imageHeight;
        }
      } catch (error) {
        console.error(`Error processing image ${src}:`, error);
        if (window.__imageProcessingState.failed) {
          window.__imageProcessingState.failed.add(src);
        }
        setDisplayOriginal(true);
        setIsLoaded(true);
      } finally {
        isProcessingRef.current = false;
      }
    };
    
    processImage();
    
  }, [isInView, src, height]); // Reduced dependencies to avoid loops
  
  // Render component
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
          src={displayOriginal ? src : (canvasDataUrl || src)}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onLoad={() => {
            // Use a condition to prevent unnecessary state updates
            if (!isLoaded) setIsLoaded(true);
          }}
          onError={() => {
            if (!displayOriginal) {
              setDisplayOriginal(true);
            } else if (!hasError) {
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