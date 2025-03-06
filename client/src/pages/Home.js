import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const { fetchUserProfile } = useProfile();
    const mouseEffectRef = useRef(null);
    const containerRef = useRef(null);
    const particlesRef = useRef([]);
    const mousePositionRef = useRef({ x: -1000, y: -1000 });
    const mouseActiveRef = useRef(false);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        const loadProfile = async () => {
            const token = localStorage.getItem('token');
            if (user && token) {
                try {
                    await fetchUserProfile(token);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            }
        };

        loadProfile();
    }, [user, fetchUserProfile]);

    // Electric particle system
    useEffect(() => {
        if (!containerRef.current || !mouseEffectRef.current) return;
        
        const container = containerRef.current;
        const electricEffect = mouseEffectRef.current;
        
        // Clear existing particles
        while (electricEffect.firstChild) {
            electricEffect.removeChild(electricEffect.firstChild);
        }
        
        // Create 15-20 electric particles
        const numParticles = Math.floor(Math.random() * 6) + 15; // 15-20 particles
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Initialize particles with random positions and movement
        particlesRef.current = Array(numParticles).fill().map(() => {
            const particle = document.createElement('div');
            particle.className = 'energy-particle';
            
            // Randomly assign one of three sizes for variety
            const sizeClass = Math.random() > 0.7 ? 'large' : 
                             (Math.random() > 0.5 ? 'medium' : 'small');
            particle.classList.add(sizeClass);
            
            // Set initial styles directly to make sure they're visible
            particle.style.opacity = '0.9';
            particle.style.display = 'block';
            
            // Add to DOM
            electricEffect.appendChild(particle);
            
            // Random starting position
            const x = Math.random() * containerWidth;
            const y = Math.random() * containerHeight;
            
            // Position particle
            particle.style.transform = `translate(${x}px, ${y}px)`;
            
            // Random velocity for ambient motion
            const vx = (Math.random() - 0.5) * 2;
            const vy = (Math.random() - 0.5) * 2;
            
            return { 
                element: particle, 
                x, 
                y, 
                vx, 
                vy,
                targetX: x,
                targetY: y,
                size: sizeClass,
                // Random phase offset for ambient movement
                phaseX: Math.random() * Math.PI * 2,
                phaseY: Math.random() * Math.PI * 2,
                phaseSpeed: 0.001 + Math.random() * 0.002
            };
        });
        
        // Add console logging to debug
        console.log(`Created ${particlesRef.current.length} particles`);
        
        // Main animation loop
        const animate = () => {
            const mousePosition = mousePositionRef.current;
            const mouseActive = mouseActiveRef.current;
            const time = Date.now();
            
            // Get container dimensions in each frame in case of resize
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // Move each particle
            particlesRef.current.forEach((particle, index) => {
                // When mouse is off screen - playful spreading dance
                if (!mouseActive) {
                    // Cute playful movement in larger space
                    const spreadFactor = 0.8; // Controls how spread out the particles are
                    const bounceSpeed = 0.3 + (Math.random() * 0.2); // More bouncy movement
                    
                    // Playful looping paths - different for each particle
                    const angleX = time * 0.0008 * particle.phaseSpeed + particle.phaseX;
                    const angleY = time * 0.0009 * particle.phaseSpeed + particle.phaseY;
                    
                    // Particles move in happy swirls and spirals
                    const radiusX = containerWidth * spreadFactor * (0.2 + Math.sin(index * 0.7) * 0.2);
                    const radiusY = containerHeight * spreadFactor * (0.2 + Math.cos(index * 0.5) * 0.2);
                    
                    // Calculate multiple center points for groups of particles
                    // This creates the effect of particles playing in small groups
                    const groupIndex = index % 5; // Create 5 different groups
                    const centerX = containerWidth * (0.2 + (groupIndex * 0.15)) + 
                                   Math.sin(time * 0.00007 + groupIndex) * containerWidth * 0.1;
                    const centerY = containerHeight * (0.3 + (groupIndex * 0.1)) + 
                                   Math.cos(time * 0.00009 + groupIndex) * containerHeight * 0.1;
                    
                    // Set target position in playful pattern
                    particle.targetX = centerX + Math.sin(angleX) * radiusX;
                    particle.targetY = centerY + Math.cos(angleY) * radiusY;
                    
                    // Occasionally change direction for cute unpredictable movements
                    if (Math.random() < 0.02) {
                        particle.vx = (Math.random() - 0.5) * 1.2;
                        particle.vy = (Math.random() - 0.5) * 1.2;
                    }
                    
                    // Add some "happiness" to movement - occasional little jumps
                    if (Math.random() < 0.005) {
                        particle.vy -= 2; // Little jump
                        // Add a temporary "happy" class for visual effect
                        particle.element.classList.add('happy');
                        setTimeout(() => {
                            particle.element.classList.remove('happy');
                        }, 500);
                    }
                    
                    // Move toward target with bouncy movement
                    particle.x += (particle.targetX - particle.x) * 0.02 + particle.vx * bounceSpeed;
                    particle.y += (particle.targetY - particle.y) * 0.02 + particle.vy * bounceSpeed;
                } 
                // When mouse is active - excited swarm behavior while maintaining individuality
                else {
                    // Calculate distance from mouse
                    const distX = mousePosition.x - particle.x;
                    const distY = mousePosition.y - particle.y;
                    const dist = Math.hypot(distX, distY);
                    
                    // Base attraction strength - gentler for more playful swarming
                    let attractStrength = 0.5 + (0.01 * Math.random());
                    
                    // Add personality to particles based on their "type"
                    if (particle.size === 'large') {
                        // Larger particles are a bit slower but more stable
                        attractStrength *= 0.7;
                    } else if (particle.size === 'small') {
                        // Smaller particles are faster and more erratic
                        attractStrength *= 1.3;
                        // Small particles occasionally dart quickly toward mouse
                        if (Math.random() < 0.01) {
                            attractStrength *= 3;
                            // Add excited class briefly
                            particle.element.classList.add('excited');
                            setTimeout(() => {
                                particle.element.classList.remove('excited');
                            }, 300);
                        }
                    }
                    
                    // Reduce attraction at very close distances (creates playful orbiting)
                    if (dist < 100) {
                        attractStrength *= dist / 100;
                    }
                    
                    // Add unique individual dancing movement - more playful
                    const danceRadius = 40 + (index % 10) * 3;
                    const danceX = Math.sin(time * 0.002 + index * 0.3) * danceRadius;
                    const danceY = Math.cos(time * 0.0025 + index * 0.7) * danceRadius;
                    
                    // Combine attraction to mouse with individual dancing
                    particle.x += distX * attractStrength + danceX * 0.05;
                    particle.y += distY * attractStrength + danceY * 0.1;
                    
                    // Create playful interactions between particles
                    // Find nearby particles and interact with them
                    const nearbyParticles = particlesRef.current
                        .filter((p, i) => i !== index && Math.hypot(p.x - particle.x, p.y - particle.y) < 50);
                    
                    if (nearbyParticles.length > 0) {
                        // When particles are close, they get slightly pushed away from each other
                        // This creates a "playful bumping" effect
                        nearbyParticles.forEach(nearby => {
                            const nx = nearby.x - particle.x;
                            const ny = nearby.y - particle.y;
                            const ndist = Math.hypot(nx, ny);
                            if (ndist > 0) {
                                particle.x -= (nx / ndist) * 0.2;
                                particle.y -= (ny / ndist) * 0.2;
                            }
                        });
                    }
                }
                
                // Ensure particles stay within bounds with smooth wrapping
                if (particle.x < -50) particle.x = containerWidth + 50;
                if (particle.x > containerWidth + 50) particle.x = -50;
                if (particle.y < -50) particle.y = containerHeight + 50;
                if (particle.y > containerHeight + 50) particle.y = -50;
                
                // Apply position
                particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px)`;
                
                // Rest of your particle rendering code...
            });
            
            // Update container gradient to follow active particles' center of mass when mouse is off-screen
            if (!mouseActive) {
                // Calculate center of particle mass
                let avgX = 0, avgY = 0;
                particlesRef.current.forEach(p => {
                    avgX += p.x;
                    avgY += p.y;
                });
                avgX /= particlesRef.current.length;
                avgY /= particlesRef.current.length;
                
                const x = (avgX / containerWidth) * 100;
                const y = (avgY / containerHeight) * 100;
                container.style.setProperty('--mouse-x', `${x}%`);
                container.style.setProperty('--mouse-y', `${y}%`);
            } else {
                // When mouse is active, follow mouse position
                const x = (mousePosition.x / containerWidth) * 100;
                const y = (mousePosition.y / containerHeight) * 100;
                container.style.setProperty('--mouse-x', `${x}%`);
                container.style.setProperty('--mouse-y', `${y}%`);
            }
            
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        
        // Start animation
        animate();
        
        // Handle mouse events
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            mousePositionRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            mouseActiveRef.current = true;
        };
        
        const handleMouseEnter = () => {
            mouseActiveRef.current = true;
        };
        
        const handleMouseLeave = () => {
            mouseActiveRef.current = false;
        };
        
        // Add event listeners
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);
        
        // Cleanup
        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    // Background parallax effect
    useEffect(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const rect = container.getBoundingClientRect();
            
            // Calculate mouse position as percentage of container
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            
            // Apply subtle parallax effect to hero content
            if (containerRef.current) {
                const hero = containerRef.current.querySelector('.home-hero');
                if (hero) {
                    const moveX = (x - 50) * 0.05; // Subtle movement
                    const moveY = (y - 50) * 0.05;
                    hero.style.transform = `translate(${moveX}px, ${moveY}px)`;
                }
                
                // Make tech circles move in parallax too
                const techCircles = containerRef.current.querySelectorAll('.tech-circle');
                techCircles.forEach((circle, index) => {
                    const factor = 0.03 * (index + 1);
                    const circleX = (x - 50) * factor;
                    const circleY = (y - 50) * factor;
                    circle.style.transform = `translate(${circleX}px, ${circleY}px)`;
                });
            }
        };
        
        container.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Circuit grid system
    useEffect(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        
        // Create circuit grid container
        const circuitGrid = document.createElement('div');
        circuitGrid.className = 'circuit-grid';
        container.appendChild(circuitGrid);
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Track mouse position
        const mousePos = { x: containerWidth / 2, y: containerHeight / 2, active: false };
        
        // Create circuit grid infrastructure
        const createCircuitGrid = () => {
            // Clear existing circuit
            while (circuitGrid.firstChild) {
                circuitGrid.removeChild(circuitGrid.firstChild);
            }
            
            // Circuit grid configuration
            const gridSize = 120; // Distance between major paths
            const minorGridSize = gridSize / 3; // Distance between minor paths
            
            // Create primary horizontal paths
            for (let y = minorGridSize; y < containerHeight; y += gridSize) {
                const horizontalPath = document.createElement('div');
                horizontalPath.className = 'circuit-path horizontal';
                horizontalPath.style.top = `${y}px`;
                
                // Randomly skip some paths for organic look
                if (Math.random() > 0.3) {
                    circuitGrid.appendChild(horizontalPath);
                    
                    // Add nodes and terminals along paths
                    for (let x = gridSize; x < containerWidth; x += gridSize) {
                        // Add connection node
                        const node = document.createElement('div');
                        node.className = 'circuit-node';
                        node.style.left = `${x}px`;
                        node.style.top = `${y}px`;
                        circuitGrid.appendChild(node);
                    }
                }
            }
            
            // Create primary vertical paths
            for (let x = minorGridSize; x < containerWidth; x += gridSize) {
                const verticalPath = document.createElement('div');
                verticalPath.className = 'circuit-path vertical';
                verticalPath.style.left = `${x}px`;
                
                // Randomly skip some paths for organic look
                if (Math.random() > 0.3) {
                    circuitGrid.appendChild(verticalPath);
                }
            }
            
            // Create some diagonal connectors
            for (let y = 0; y < containerHeight; y += gridSize) {
                for (let x = 0; x < containerWidth; x += gridSize) {
                    // Random chance to add diagonal connector
                    if (Math.random() < 0.2) {
                        const connector = document.createElement('div');
                        connector.className = 'circuit-connector';
                        connector.style.top = `${y}px`;
                        connector.style.left = `${x}px`;
                        
                        // Randomize rotation
                        const rotation = Math.floor(Math.random() * 4) * 90;
                        connector.style.transform = `rotate(${rotation}deg)`;
                        
                        circuitGrid.appendChild(connector);
                    }
                }
            }
            
            // Add terminals at key points
            for (let i = 0; i < 15; i++) {
                const terminal = document.createElement('div');
                terminal.className = 'circuit-terminal';
                
                // Position on circuit intersections for a realistic look
                const x = Math.floor(Math.random() * (containerWidth / gridSize)) * gridSize + minorGridSize;
                const y = Math.floor(Math.random() * (containerHeight / gridSize)) * gridSize + minorGridSize;
                
                terminal.style.left = `${x}px`;
                terminal.style.top = `${y}px`;
                
                circuitGrid.appendChild(terminal);
            }
            
            // Create digital noise overlay
            const noiseOverlay = document.createElement('div');
            noiseOverlay.className = 'digital-noise';
            circuitGrid.appendChild(noiseOverlay);
            
            // Create hot zone for mouse interaction
            const hotZone = document.createElement('div');
            hotZone.className = 'hot-zone';
            circuitGrid.appendChild(hotZone);
            
            return { circuitGrid, hotZone };
        };
        
        // Create the circuit layout
        const { hotZone } = createCircuitGrid();
        
        // Create and animate energy pulses
        const animateEnergy = () => {
            // Define containerRect at the top of the function so it's available everywhere
            const containerRect = container.getBoundingClientRect();
            
            // Horizontal pulse animations
            const horizontalPaths = circuitGrid.querySelectorAll('.circuit-path.horizontal');
            horizontalPaths.forEach(path => {
                // Only add new pulses occasionally
                if (Math.random() < 0.01) {
                    const pulse = document.createElement('div');
                    pulse.className = 'energy-pulse';
                    pulse.style.left = '-30px'; // Start off-screen
                    path.appendChild(pulse);
                    
                    // Speed varies slightly for each pulse
                    const duration = 3 + Math.random() * 4; // 3-7 seconds
                    
                    // Animate pulse moving across screen
                    const animation = pulse.animate([
                        { left: '-30px' },
                        { left: '100%' }
                    ], {
                        duration: duration * 1000,
                        easing: 'linear'
                    });
                    
                    // Clean up pulse after animation
                    animation.onfinish = () => pulse.remove();
                }
            });
            
            // Vertical pulse animations
            const verticalPaths = circuitGrid.querySelectorAll('.circuit-path.vertical');
            verticalPaths.forEach(path => {
                // Only add new pulses occasionally
                if (Math.random() < 0.01) {
                    const pulse = document.createElement('div');
                    pulse.className = 'energy-pulse vertical';
                    pulse.style.top = '-30px'; // Start off-screen
                    path.appendChild(pulse);
                    
                    const duration = 3 + Math.random() * 4; // 3-7 seconds
                    
                    // Animate pulse moving down screen
                    const animation = pulse.animate([
                        { top: '-30px' },
                        { top: '100%' }
                    ], {
                        duration: duration * 1000,
                        easing: 'linear'
                    });
                    
                    // Clean up pulse after animation
                    animation.onfinish = () => pulse.remove();
                }
            });
            
            // Occasionally send data packets between terminals
            if (Math.random() < 0.05) {
                const terminals = circuitGrid.querySelectorAll('.circuit-terminal');
                
                if (terminals.length > 1) {
                    const startTerminal = terminals[Math.floor(Math.random() * terminals.length)];
                    const endTerminal = terminals[Math.floor(Math.random() * terminals.length)];
                    
                    if (startTerminal !== endTerminal) {
                        const packet = document.createElement('div');
                        packet.className = 'data-packet';
                        
                        // Get terminal positions
                        const startRect = startTerminal.getBoundingClientRect();
                        const endRect = endTerminal.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();
                        
                        const startX = startRect.left - containerRect.left + startRect.width / 2;
                        const startY = startRect.top - containerRect.top + startRect.height / 2;
                        const endX = endRect.left - containerRect.left + endRect.width / 2;
                        const endY = endRect.top - containerRect.top + endRect.height / 2;
                        
                        // Set starting point
                        packet.style.left = `${startX}px`;
                        packet.style.top = `${startY}px`;
                        
                        circuitGrid.appendChild(packet);
                        
                        // Create circuit path activation along route
                        const activatePathBetweenPoints = (x1, y1, x2, y2) => {
                            // Find all circuit paths that fall on this route
                            const paths = circuitGrid.querySelectorAll('.circuit-path');
                            paths.forEach(path => {
                                const rect = path.getBoundingClientRect();
                                const pathX = rect.left - containerRect.left + rect.width / 2;
                                const pathY = rect.top - containerRect.top + rect.height / 2;
                                
                                // Check if path is on route (with tolerance)
                                const isOnRoute = 
                                    (path.classList.contains('horizontal') && 
                                        Math.abs(pathY - y1) < 5 && pathX >= Math.min(x1, x2) && pathX <= Math.max(x1, x2)) || 
                                    (path.classList.contains('vertical') && 
                                        Math.abs(pathX - x2) < 5 && pathY >= Math.min(y1, y2) && pathY <= Math.max(y1, y2));
                                
                                if (isOnRoute) {
                                    path.classList.add('active');
                                    
                                    // Remove active class after animation
                                    setTimeout(() => {
                                        path.classList.remove('active');
                                    }, 1500);
                                }
                            });
                        };
                        
                        // First go horizontally then vertically (Tron-style right angles)
                        activatePathBetweenPoints(startX, startY, endX, startY);
                        activatePathBetweenPoints(endX, startY, endX, endY);
                        
                        // Animate packet
                        // First horizontal move
                        const duration = 1.5;
                        const animation1 = packet.animate([
                            { left: `${startX}px`, top: `${startY}px` },
                            { left: `${endX}px`, top: `${startY}px` }
                        ], {
                            duration: duration * 1000 / 2,
                            easing: 'cubic-bezier(0.33, 1, 0.68, 1)'
                        });
                        
                        // Then vertical move
                        animation1.onfinish = () => {
                            packet.style.left = `${endX}px`;
                            packet.style.top = `${startY}px`;
                            
                            const animation2 = packet.animate([
                                { top: `${startY}px` },
                                { top: `${endY}px` }
                            ], {
                                duration: duration * 1000 / 2,
                                easing: 'cubic-bezier(0.33, 1, 0.68, 1)'
                            });
                            
                            animation2.onfinish = () => packet.remove();
                        };
                    }
                }
            }
            
            // Update hot zone based on mouse position
            if (mousePos.active) {
                hotZone.style.left = `${mousePos.x}px`;
                hotZone.style.top = `${mousePos.y}px`;
                hotZone.style.opacity = '1';
                
                // Attract nearby energy
                const pulses = circuitGrid.querySelectorAll('.energy-pulse');
                pulses.forEach(pulse => {
                    const pulseRect = pulse.getBoundingClientRect();
                    const pulseX = pulseRect.left - containerRect.left + pulseRect.width / 2;
                    const pulseY = pulseRect.top - containerRect.top + pulseRect.height / 2;
                    
                    // Calculate distance to mouse
                    const distX = mousePos.x - pulseX;
                    const distY = mousePos.y - pulseY;
                    const dist = Math.sqrt(distX * distX + distY * distY);
                    
                    // If close enough, intensify the pulse
                    if (dist < 200) {
                        pulse.style.filter = `blur(1px) brightness(${1.5 - dist/400})`;
                        pulse.style.opacity = 1;
                    }
                });
                
                // Intensify nearby circuit paths
                const paths = circuitGrid.querySelectorAll('.circuit-path');
                paths.forEach(path => {
                    const rect = path.getBoundingClientRect();
                    const pathX = rect.left - containerRect.left + rect.width / 2;
                    const pathY = rect.top - containerRect.top + rect.height / 2;
                    
                    const dist = path.classList.contains('horizontal') ? 
                        Math.abs(pathY - mousePos.y) : 
                        Math.abs(pathX - mousePos.x);
                    
                    if (dist < 100) {
                        const intensity = 1 - dist / 100;
                        path.style.boxShadow = `0 0 ${15 * intensity}px rgba(0, 210, 255, ${0.6 * intensity})`;
                        path.style.opacity = 0.25 + (0.75 * intensity);
                    } else {
                        path.style.boxShadow = '';
                        path.style.opacity = '';
                    }
                });
                
                // Intensify nearby nodes
                const nodes = circuitGrid.querySelectorAll('.circuit-node');
                nodes.forEach(node => {
                    const rect = node.getBoundingClientRect();
                    const nodeX = rect.left - containerRect.left + rect.width / 2;
                    const nodeY = rect.top - containerRect.top + rect.height / 2;
                    
                    const distX = nodeX - mousePos.x;
                    const distY = nodeY - mousePos.y;
                    const dist = Math.sqrt(distX * distX + distY * distY);
                    
                    if (dist < 150) {
                        const intensity = 1 - dist / 150;
                        node.style.transform = `translate(-50%, -50%) scale(${1 + intensity})`;
                        node.style.boxShadow = `0 0 ${15 * intensity}px rgba(0, 210, 255, ${0.7 * intensity})`;
                        node.style.opacity = 0.3 + (0.7 * intensity);
                    } else {
                        node.style.transform = 'translate(-50%, -50%) scale(1)';
                        node.style.boxShadow = '';
                        node.style.opacity = '';
                    }
                });
            } else {
                hotZone.style.opacity = '0';
            }
            
            // Continue animation loop
            requestAnimationFrame(animateEnergy);
        };
        
        // Mouse tracking
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            mousePos.x = e.clientX - rect.left;
            mousePos.y = e.clientY - rect.top;
            mousePos.active = true;
        };
        
        const handleMouseLeave = () => {
            mousePos.active = false;
        };
        
        // Start animation
        const animationId = requestAnimationFrame(animateEnergy);
        
        // Add event listeners
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        
        window.addEventListener('resize', createCircuitGrid);
        
        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', createCircuitGrid);
            
            // Remove circuit grid
            if (circuitGrid.parentNode) {
                circuitGrid.parentNode.removeChild(circuitGrid);
            }
        };
    }, []);

    return (
        <div className="home-container" ref={containerRef}>
            {/* Electric particle effect now with lower z-index */}
            <div className="electric-mouse-effect" ref={mouseEffectRef} style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0 // Lower z-index so circuit grid shows through
            }}></div>
            
            {/* Rest of your component */}
            <div className="tech-circles" style={{ zIndex: 5 }}>
                <div className="tech-circle"></div>
                <div className="tech-circle"></div>
                <div className="tech-circle"></div>
            </div>
            
            <div className="home-hero" style={{ position: 'relative', zIndex: 10 }}>
                <h1 className="home-title">
                    Generate Art With <span className="highlight">ArtMochi</span>
                </h1>
                <p className="home-subtitle">
                    Create mind-blowing AI-generated images in seconds. Unleash your creativity with cutting-edge technology.
                </p>
                <div className="home-cta">
                    <Link to="/imagegenerator" className="home-button primary">
                        Start Creating
                    </Link>
                    <Link to="/gallery" className="home-button secondary">
                        View Gallery
                    </Link>
                </div>
            </div>
            
            <div className="credit-badge" style={{ zIndex: 15 }}>
                Powered by AI
            </div>
        </div>
    );
};

export default Home;
