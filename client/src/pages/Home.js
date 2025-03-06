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

    return (
        <div className="home-container" ref={containerRef}>
            {/* Electric particle effect - ensure this container exists */}
            <div className="electric-mouse-effect" ref={mouseEffectRef} style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 200
            }}></div>
            
            {/* Rest of your component */}
            <div className="tech-circles">
                <div className="tech-circle"></div>
                <div className="tech-circle"></div>
                <div className="tech-circle"></div>
            </div>
            
            <div className="home-hero">
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
            
            <div className="credit-badge">
                Powered by AI
            </div>
        </div>
    );
};

export default Home;
