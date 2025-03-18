import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [dataPackets, setDataPackets] = useState([]);
    const [shouldRender, setShouldRender] = useState(false);
    const location = useLocation();
    const timeoutRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            // Get current scroll position
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Check if user has scrolled to near bottom (within 20px)
            const isNearBottom = scrollTop + windowHeight >= documentHeight - 20;
            
            // Update visibility state
            setIsVisible(isNearBottom);
            
            // If becoming visible, ensure it's rendered
            if (isNearBottom) {
                setShouldRender(true);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
            } 
            // If becoming invisible, delay the actual removal
            else if (shouldRender) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    setShouldRender(false);
                }, 500); // Match this to your transition duration
            }
        };

        // Initial check in case user is already at bottom
        handleScroll();
        
        // Add scroll event listener with throttle for performance
        let scrollTimeout;
        const throttledScroll = () => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    handleScroll();
                    scrollTimeout = null;
                }, 100);
            }
        };
        
        window.addEventListener('scroll', throttledScroll);
        
        // Clean up event listener
        return () => {
            window.removeEventListener('scroll', throttledScroll);
            clearTimeout(scrollTimeout);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [shouldRender]);

    // Data packets effect remains the same
    useEffect(() => {
        if (!isVisible) return;

        // Create data packets that travel across footer
        const footerEl = document.querySelector('.footer');
        if (!footerEl) return;

        const maxPackets = 3;
        const interval = setInterval(() => {
            if (dataPackets.length >= maxPackets) return;

            // Create a new data packet with unique ID
            const newPacket = {
                id: Date.now(),
                position: Math.random() * 80 + 10, // Random position 10-90%
                speed: 0.5 + Math.random() * 0.5 // Random speed
            };

            setDataPackets(prev => [...prev, newPacket]);

            // Remove packet after animation completes
            setTimeout(() => {
                setDataPackets(prev => prev.filter(p => p.id !== newPacket.id));
            }, 4000);
        }, 2000);

        return () => clearInterval(interval);
    }, [isVisible, dataPackets.length]);

    // Only render footer on main pages
    if (!['/', '/following'].includes(location.pathname) || !shouldRender) {
        return null;
    }

    return (
        <footer 
            className={`footer bottom-footer ${isVisible ? 'visible' : ''}`}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                transform: `translateY(${isVisible ? '0' : '100%'})`,
                transition: 'transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none'
            }}
        >
            {/* Footer content remains the same */}
            <div className="footer-content">
                {/* Tech "data packets" */}
                {dataPackets.map(packet => (
                    <div 
                        key={packet.id}
                        className="footer-data-packet"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '0%',
                            width: '8px',
                            height: '3px',
                            background: 'rgba(0, 210, 255, 0.9)',
                            borderRadius: '4px',
                            boxShadow: '0 0 10px rgba(0, 210, 255, 0.7)',
                            transform: 'translateY(-50%)',
                            animation: `data-travel ${6/packet.speed}s linear forwards`,
                            animationDelay: `${Math.random() * 0.5}s`,
                            zIndex: 10
                        }}
                    />
                ))}
                
                <div className="footer-brand">
                    <h3>ArtMochi</h3>
                </div>
                <div className="footer-links">
                    <a href="/about">About</a>
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Terms</a>
                </div>
                
                {/* Circuit node points */}
                <div className="circuit-node-left" style={{
                    position: 'absolute',
                    left: '5%',
                    top: '50%',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'rgba(0, 210, 255, 0.7)',
                    boxShadow: '0 0 8px rgba(0, 210, 255, 0.5)',
                    transform: 'translateY(-50%)'
                }}></div>
                
                <div className="circuit-node-right" style={{
                    position: 'absolute',
                    right: '5%',
                    top: '50%',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'rgba(0, 210, 255, 0.7)',
                    boxShadow: '0 0 8px rgba(0, 210, 255, 0.5)',
                    transform: 'translateY(-50%)'
                }}></div>
            </div>
        </footer>
    );
};

export default Footer;