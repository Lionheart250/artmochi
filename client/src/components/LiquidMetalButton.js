import React from 'react';
import LiquidMetalContainer from './LiquidMetalContainer';
import { Link } from 'react-router-dom';
import './LiquidMetalButton.css';

const LiquidMetalButton = ({ 
  to, 
  children, 
  className,
  onClick,
  borderWidth = 3,
  speed = 1.0,
  external = false
}) => {
  // For non-router links (external URLs)
  if (external && to) {
    return (
      <LiquidMetalContainer 
        borderWidth={borderWidth} 
        speed={speed}
        className={`liquid-metal-button ${className || ''}`}
      >
        <a 
          href={to} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="button-link"
          onClick={onClick}
        >
          {children}
        </a>
      </LiquidMetalContainer>
    );
  }
  
  // For router links
  if (to) {
    return (
      <LiquidMetalContainer 
        borderWidth={borderWidth} 
        speed={speed}
        className={`liquid-metal-button ${className || ''}`}
      >
        <Link 
          to={to} 
          className="button-link"
          onClick={onClick}
        >
          {children}
        </Link>
      </LiquidMetalContainer>
    );
  }
  
  // For regular buttons (no link)
  return (
    <LiquidMetalContainer 
      borderWidth={borderWidth} 
      speed={speed}
      className={`liquid-metal-button ${className || ''}`}
    >
      <button 
        className="button-link" 
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
    </LiquidMetalContainer>
  );
};

export default LiquidMetalButton;