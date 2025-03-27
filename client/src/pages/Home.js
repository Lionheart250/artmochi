import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { InView } from 'react-intersection-observer';
import axios from 'axios';
import LazyImage from '../components/LazyImage';
import './Home.css';
import { Float32BufferAttribute } from 'three';

// Animated 3D sphere component
const AnimatedSphere = () => {
  const mesh = useRef();
  const [hovered, setHover] = useState(false);
  
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.01;
      mesh.current.rotation.y += 0.01;
    }
  });
  
  return (
    <mesh
      ref={mesh}
      scale={hovered ? 1.1 : 1}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial 
        color="#ffffff" 
        attach="material" 
        distort={0.3} 
        speed={2} 
        roughness={0}
        metalness={0.8}
      />
    </mesh>
  );
};

// Neural network visualization
const NeuralNetwork = () => {
  const { viewport } = useThree();
  const group = useRef();
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  
  useEffect(() => {
    // Create nodes
    const newNodes = [];
    for (let i = 0; i < 50; i++) {
      newNodes.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        ],
        size: Math.random() * 0.05 + 0.02
      });
    }
    setNodes(newNodes);
    
    // Create connections
    const newConnections = [];
    for (let i = 0; i < 70; i++) {
      const startNode = Math.floor(Math.random() * newNodes.length);
      const endNode = Math.floor(Math.random() * newNodes.length);
      if (startNode !== endNode) {
        newConnections.push({
          id: i,
          start: startNode,
          end: endNode
        });
      }
    }
    setConnections(newConnections);
  }, []);
  
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.001;
    }
  });
  
  return (
    <group ref={group}>
      {nodes.map((node) => (
        <mesh key={node.id} position={node.position}>
          <sphereGeometry args={[node.size, 16, 16]} />
          <meshBasicMaterial color="#00BBFF" transparent opacity={0.7} />
        </mesh>
      ))}
      
      {connections.map((connection) => {
        if (!nodes[connection.start] || !nodes[connection.end]) return null;
        
        const start = nodes[connection.start].position;
        const end = nodes[connection.end].position;
        
        // Use line with older version
        return (
          <line key={connection.id}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...start, ...end])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#00BBFF" opacity={0.2} transparent />
          </line>
        );
      })}
    </group>
  );
};

// Main Home component
const Home = () => {
    const { user } = useAuth();
    const { fetchUserProfile } = useProfile();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const heroRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeSection, setActiveSection] = useState(0);
    const [featuredImages, setFeaturedImages] = useState([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const [heroImage, setHeroImage] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [cursorEnlarged, setCursorEnlarged] = useState(false);
    const cursorRef = useRef(null);
    const { scrollY } = useScroll();
    
    // Animation variants for motion components
    const fadeIn = {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
      }
    };
    
    const slideUp = {
      hidden: { y: 50, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
      }
    };
    
    const staggerContainer = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.3
        }
      }
    };
    
    // Custom cursor and window event listeners
    useEffect(() => {
      const handleMouseMove = (e) => {
        const x = e.clientX;
        const y = e.clientY;
        setCursorPosition({ x, y });
        
        // Set css variables for radial gradient
        document.documentElement.style.setProperty('--mouse-x', `${(x / window.innerWidth) * 100}%`);
        document.documentElement.style.setProperty('--mouse-y', `${(y / window.innerHeight) * 100}%`);
      };
      
      const handleScroll = () => {
        // Calculate active section based on scroll position
        const sections = document.querySelectorAll('section');
        const currentPosition = window.scrollY + window.innerHeight / 2;
        
        sections.forEach((section, index) => {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;
          
          if (currentPosition >= sectionTop && currentPosition < sectionBottom) {
            setActiveSection(index);
          }
        });
      };
      
      const handleHoverStart = () => setCursorEnlarged(true);
      const handleHoverEnd = () => setCursorEnlarged(false);
      
      // Add event listeners
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll);
      
      // Add hover listeners to all interactive elements
      const interactiveElements = document.querySelectorAll('a, button, .interactive');
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', handleHoverStart);
        el.addEventListener('mouseleave', handleHoverEnd);
      });
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        
        interactiveElements.forEach(el => {
          el.removeEventListener('mouseenter', handleHoverStart);
          el.removeEventListener('mouseleave', handleHoverEnd);
        });
      };
    }, []);
    
    // Initial load and profile fetch
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
      
      // Trigger loading animation
      setTimeout(() => setIsLoaded(true), 800);
    }, [user, fetchUserProfile]);
    
    // Fetch featured images
    useEffect(() => {
      const fetchFeaturedImages = async () => {
        setLoadingImages(true);
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/images`, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.status === 200) {
            // Sort images by creation date to get recent ones
            const sortedImages = response.data.images.sort((a, b) => 
              new Date(b.created_at) - new Date(a.created_at)
            );
            
            setFeaturedImages(sortedImages.slice(0, 6));
            
            // Set hero image from first featured image
            if (sortedImages.length > 0 && !heroImage) {
              setHeroImage(sortedImages[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching featured images:', error);
        } finally {
          setLoadingImages(false);
        }
      };
      
      fetchFeaturedImages();
    }, []);
    
    // Framer-motion scroll animations

    const heroY = useTransform(scrollY, [0, 500], [0, 200]);
    const featuresY = useTransform(scrollY, [800, 1300], [0, 100]);
    
    return (
      <>
        {/* Custom cursor */}
        <div 
          className={`home-custom-cursor ${cursorEnlarged ? 'enlarged' : ''}`} 
          ref={cursorRef}
          style={{
            transform: `translate3d(${cursorPosition.x}px, ${cursorPosition.y}px, 0) scale(${cursorEnlarged ? 1.5 : 1})`,
          }}
        >
          <div className="home-cursor-dot"></div>
        </div>
      
        <div className={`artmochi-home ${isLoaded ? 'loaded' : ''}`} ref={containerRef}>
          {/* Background elements */}
          <div className="home-background-elements">
            <div className="home-digital-grid"></div>
            <div className="home-radial-gradient"></div>
            <div className="home-particle-container">
              {[...Array(50)].map((_, i) => (
                <div 
                  key={i} 
                  className="home-particle"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 20 + 10}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: Math.random() * 0.5,
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`
                  }}
                ></div>
              ))}
            </div>
            <div className="home-noise-texture"></div>
          </div>
          
          {/* Navigation */}
          <motion.header 
            className="home-main-header"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96], delay: 0.5 }}
          >
            
            
          </motion.header>

          
          {/* Hero Section */}
          <section className="home-hero-section" ref={heroRef}>
            <motion.div 
              className="home-hero-content"
              style={{ y: heroY }}
            >
              <motion.div 
                className="home-hero-text"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.span className="home-hero-overline" variants={slideUp}>
                  // NEXT GEN ARTIFICIAL INTELLIGENCE
                </motion.span>
                
                <motion.h1 className="home-hero-title" variants={slideUp}>
                  <span className="home-gradient-text">AI-Powered</span> Art
                  <div className="home-title-row">Creation <span className="home-highlight">Studio</span></div>
                </motion.h1>
                
                <motion.p className="home-hero-description" variants={slideUp}>
                  Unleash your creativity with our state-of-the-art neural engine. 
                  Create stunning visuals from simple text prompts or transform existing images into new artworks.
                </motion.p>
                
                <motion.div className="home-hero-cta" variants={slideUp}>
                  <motion.button 
                    className="home-primary-button interactive"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/imagegenerator')}
                  >
                    <span className="home-button-text">Start Creating</span>
                    <span className="home-button-icon">→</span>
                  </motion.button>
                  
                  <motion.button 
                    className="home-secondary-button interactive"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/gallery')}
                  >
                    <span className="home-button-text">Explore Gallery</span>
                  </motion.button>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="home-hero-visual"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96], delay: 0.5 }}
              >
                <div className="home-hero-canvas-wrapper">
                  <Canvas 
                    dpr={[1, 2]} 
                    camera={{ position: [0, 0, 5], fov: 45 }}
                  >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <Suspense fallback={null}>
                      <NeuralNetwork />
                    </Suspense>
                    <OrbitControls enableZoom={false} enablePan={false} />
                  </Canvas>
                  
                  <div className="home-canvas-overlay">
                    {heroImage ? (
                      <LazyImage
                        src={heroImage.image_url}
                        alt="AI-generated artwork"
                        className="home-hero-image"
                        onLoadStart={() => {}}
                        onLoadComplete={() => {}}
                      />
                    ) : (
                      <div className="home-placeholder-shimmer"></div>
                    )}
                    <div className="home-overlay-glare"></div>
                  </div>
                  
                  <div className="home-canvas-frame">
                    <div className="home-corner home-top-left"></div>
                    <div className="home-corner home-top-right"></div>
                    <div className="home-corner home-bottom-left"></div>
                    <div className="home-corner home-bottom-right"></div>
                  </div>
                </div>
                
                <div className="home-tech-elements">
                  <div className="home-tech-circle"></div>
                  <div className="home-tech-line-horizontal"></div>
                  <div className="home-tech-line-vertical"></div>
                  <div className="home-tech-dots">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="home-tech-dot" 
                        style={{ animationDelay: `${i * 0.15}s` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            <div className="home-scroll-indicator">
              <div className="home-mouse">
                <div className="home-mouse-wheel"></div>
              </div>
              <span>Scroll to explore</span>
            </div>
            
          </section>
          
          {/* Engine Features Section */}
          <section className="home-features-section">
            <InView threshold={0.1}>
              {({ inView, ref }) => (
                <motion.div 
                  ref={ref}
                  className="home-section-content"
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  variants={fadeIn}
                >
                  <motion.div 
                    className="home-section-header"
                    variants={slideUp}
                  >
                    <span className="home-section-overline">// ENGINE FEATURES</span>
                    <h2 className="home-section-title">Powerful Creation Tools</h2>
                    <p className="home-section-subtitle">Our AI platform offers a comprehensive suite of tools for digital art creation</p>
                  </motion.div>
                  
                  <motion.div 
                    className="home-features-grid"
                    style={{ y: featuresY }}
                  >
                    {[
                      {
                        icon: "text",
                        title: "Text-to-Image",
                        description: "Generate stunning artworks from text descriptions with our state-of-the-art diffusion model"
                      },
                      {
                        icon: "style",
                        title: "Style Transfer",
                        description: "Apply artistic styles to your images with precise control over transformations"
                      },
                      {
                        icon: "edit",
                        title: "Inpainting",
                        description: "Edit and modify specific parts of images with intelligent context-aware filling"
                      },
                      {
                        icon: "enhance",
                        title: "Upscaling",
                        description: "Enhance resolution and details of your images with our AI-powered upscaler"
                      },
                      {
                        icon: "variation",
                        title: "Variations",
                        description: "Create multiple variations of your artwork while maintaining the core concept"
                      },
                      {
                        icon: "animate",
                        title: "Animation",
                        description: "Bring static images to life with subtle animations and transitions"
                      }
                    ].map((feature, index) => (
                      <motion.div 
                        key={index}
                        className="home-feature-card interactive"
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
                        whileHover={{ 
                          y: -10, 
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 200, 255, 0.2)" 
                        }}
                      >
                        <div className="home-feature-icon">
                          {feature.icon === "text" && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4 5h16M4 11h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                          {feature.icon === "style" && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="12" cy="12" r="4" fill="currentColor"/>
                            </svg>
                          )}
                          {feature.icon === "edit" && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2"/>
                              <rect x="8" y="8" width="8" height="8" fill="currentColor"/>
                            </svg>
                          )}
                          {feature.icon === "enhance" && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 3v18M3 21h18M3 3h6v6H3z" stroke="currentColor" strokeWidth="2"/>
                              <path d="M15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          )}
                          {feature.icon === "variation" && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="6" cy="6" r="3" fill="currentColor"/>
                              <circle cx="18" cy="18" r="3" fill="currentColor"/>
                              <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            </svg>
                          )}
                          {feature.icon === "animate" && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M4.93 8.93l3.07 3.07-3.07 3.07M19.07 8.93l-3.07 3.07 3.07 3.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )}
                        </div>
                        <h3 className="home-feature-title">{feature.title}</h3>
                        <p className="home-feature-description">{feature.description}</p>
                        <div className="home-feature-decoration"></div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </InView>
          </section>
          
          {/* Gallery Section */}
          <section className="home-gallery-section">
            <InView threshold={0.1}>
              {({ inView, ref }) => (
                <motion.div 
                  ref={ref}
                  className="home-section-content"
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  variants={fadeIn}
                >
                  <motion.div 
                    className="home-section-header"
                    variants={slideUp}
                  >
                    <span className="home-section-overline">// SHOWCASED WORK</span>
                    <h2 className="home-section-title">Featured Gallery</h2>
                    <p className="home-section-subtitle">Explore the latest creations from our community</p>
                  </motion.div>
                  
                  <motion.div 
                    className="home-gallery-grid"
                    variants={fadeIn}
                  >
                    {loadingImages ? (
                      // Loading placeholders
                      [...Array(6)].map((_, i) => (
                        <motion.div 
                          key={i} 
                          className="home-gallery-item loading"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                          <div className="home-placeholder-shimmer"></div>
                        </motion.div>
                      ))
                    ) : featuredImages.length > 0 ? (
                      // Actual images
                      featuredImages.map((image, i) => (
                        <motion.div 
                          key={image.id} 
                          className="home-gallery-item interactive"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          whileHover={{ 
                            scale: 1.05, 
                            zIndex: 10,
                            boxShadow: "0 20px 50px rgba(0,0,0,0.4)" 
                          }}
                          onClick={() => navigate(`/image/${image.id}`)}
                        >
                          <LazyImage
                            src={image.image_url}
                            alt={image.prompt || 'Featured artwork'}
                            className="home-gallery-image"
                            onLoadStart={() => {}}
                            onLoadComplete={() => {}}
                          />
                          <div className="home-gallery-item-overlay">
                            <div className="home-item-info">
                              <h4 className="home-item-title">{image.prompt ? (image.prompt.length > 50 ? image.prompt.substring(0, 50) + '...' : image.prompt) : 'Untitled'}</h4>
                              <div className="home-item-meta">
                                <span className="home-item-author">@{image.username || 'anonymous'}</span>
                                <span className="home-item-stats">
                                  <span className="home-likes-count">❤️ {image.likes_count || 0}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      // Empty state
                      <motion.div 
                        className="home-empty-gallery"
                        variants={fadeIn}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="home-empty-icon">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <p>No featured images available yet</p>
                        <motion.button 
                          className="home-secondary-button interactive"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate('/imagegenerator')}
                        >
                          <span className="home-button-text">Create First Artwork</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                  
                  {featuredImages.length > 0 && (
                    <motion.div 
                      className="home-gallery-cta"
                      variants={slideUp}
                    >
                      <motion.button 
                        className="home-primary-button interactive"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/gallery')}
                      >
                        <span className="home-button-text">Explore Full Gallery</span>
                        <span className="home-button-icon">→</span>
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </InView>
          </section>
          
          {/* How It Works Section */}
          <section className="home-workflow-section">
            <InView threshold={0.1}>
              {({ inView, ref }) => (
                <motion.div 
                  ref={ref}
                  className="home-section-content"
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  variants={fadeIn}
                >
                  <motion.div 
                    className="home-section-header"
                    variants={slideUp}
                  >
                    <span className="home-section-overline">// PROCESS</span>
                    <h2 className="home-section-title">How It Works</h2>
                    <p className="home-section-subtitle">From prompt to masterpiece in seconds</p>
                  </motion.div>
                  
                  <motion.div 
                    className="home-workflow-steps"
                    variants={staggerContainer}
                  >
                    {[
                      {
                        number: "01",
                        title: "Describe Your Vision",
                        description: "Enter a detailed text prompt describing the artwork you want to create"
                      },
                      {
                        number: "02",
                        title: "Customize Parameters",
                        description: "Adjust style, dimensions, and other settings to fine-tune the output"
                      },
                      {
                        number: "03",
                        title: "Generate Artwork",
                        description: "Our neural engine processes your input and creates a unique image in seconds"
                      },
                      {
                        number: "04",
                        title: "Refine & Share",
                        description: "Download your creation, make adjustments if needed, and share with the community"
                      }
                    ].map((step, index) => (
                      <motion.div 
                        key={index}
                        className="home-workflow-step"
                        variants={slideUp}
                      >
                        <div className="home-step-number">{step.number}</div>
                        <div className="home-step-content">
                          <h3 className="home-step-title">{step.title}</h3>
                          <p className="home-step-description">{step.description}</p>
                        </div>
                        {index < 3 && <div className="home-step-connector"></div>}
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  <motion.div 
                    className="home-workflow-cta"
                    variants={slideUp}
                  >
                    <motion.button 
                      className="home-primary-button interactive"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/imagegenerator')}
                    >
                      <span className="home-button-text">Try It Now</span>
                      <span className="home-button-icon">→</span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </InView>
          </section>
          
          {/* Stats Section */}
          <section className="home-stats-section">
            <InView threshold={0.2}>
              {({ inView, ref }) => (
                <motion.div 
                  ref={ref}
                  className="home-section-content"
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  variants={fadeIn}
                >
                  <motion.div 
                    className="home-stats-container"
                    variants={slideUp}
                  >
                    <div className="home-stats-grid">
                      <div className="home-stat-card">
                        <div className="home-stat-header">
                          <div className="home-stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                          <div className="home-stat-value">1.2M+</div>
                        </div>
                        <div className="home-stat-label">ARTWORKS GENERATED</div>
                      </div>
                      
                      <div className="home-stat-card">
                        <div className="home-stat-header">
                          <div className="home-stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                              <path d="M20 21c0-4.418-3.582-8-8-8s-8 3.582-8 8" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                          <div className="home-stat-value">50K+</div>
                        </div>
                        <div className="home-stat-label">ACTIVE USERS</div>
                      </div>
                      
                      <div className="home-stat-card">
                        <div className="home-stat-header">
                          <div className="home-stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div className="home-stat-value">20+</div>
                        </div>
                        <div className="home-stat-label">AI MODELS</div>
                      </div>
                      
                      <div className="home-stat-card">
                        <div className="home-stat-header">
                          <div className="home-stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div className="home-stat-value">99.9%</div>
                        </div>
                        <div className="home-stat-label">UPTIME</div>
                      </div>
                    </div>
                    
                    <div className="home-engine-status">
                      <div className="home-status-indicator">
                        <span className="home-status-dot"></span>
                        <span className="home-status-text">NEURAL ENGINE ACTIVE</span>
                      </div>
                      <div className="home-status-details">
                        <div className="home-status-item">
                          <span className="home-status-label">Node Count:</span>
                          <span className="home-status-value">1,024</span>
                        </div>
                        <div className="home-status-item">
                          <span className="home-status-label">Version:</span>
                          <span className="home-status-value">3.0.8</span>
                        </div>
                        <div className="home-status-item">
                          <span className="home-status-label">Response Time:</span>
                          <span className="home-status-value">0.32s</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </InView>
          </section>
          
          {/* Home Footer - with home- prefix */}
          <section className="home-footer-section">
            <div className="home-footer-content">
              <div className="home-footer-main">
                <div className="home-footer-brand">
                  <div className="home-footer-logo">ArtMochi</div>
                  <p className="home-footer-tagline">AI-powered art creation for everyone</p>
                  <div className="home-footer-social">
                    <a href="#" className="home-social-link interactive">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                    <a href="#" className="home-social-link interactive">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                    <a href="#" className="home-social-link interactive">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v15H2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  </div>
                </div>
                
                <div className="home-footer-nav">
                  <div className="home-footer-nav-group">
                    <h4 className="home-group-title">Platform</h4>
                    <ul className="home-footer-links">
                      <li><a href="#" className="home-footer-link interactive">Features</a></li>
                      <li><a href="#" className="home-footer-link interactive">Pricing</a></li>
                      <li><a href="#" className="home-footer-link interactive">API</a></li>
                      <li><a href="#" className="home-footer-link interactive">Integration</a></li>
                    </ul>
                  </div>
                  
                  <div className="home-footer-nav-group">
                    <h4 className="home-group-title">Resources</h4>
                    <ul className="home-footer-links">
                      <li><a href="#" className="home-footer-link interactive">Documentation</a></li>
                      <li><a href="#" className="home-footer-link interactive">Tutorials</a></li>
                      <li><a href="#" className="home-footer-link interactive">Blog</a></li>
                      <li><a href="#" className="home-footer-link interactive">Community</a></li>
                    </ul>
                  </div>
                  
                  <div className="home-footer-nav-group">
                    <h4 className="home-group-title">Company</h4>
                    <ul className="home-footer-links">
                      <li><a href="#" className="home-footer-link interactive">About</a></li>
                      <li><a href="#" className="home-footer-link interactive">Team</a></li>
                      <li><a href="#" className="home-footer-link interactive">Careers</a></li>
                      <li><a href="#" className="home-footer-link interactive">Contact</a></li>
                    </ul>
                  </div>
                </div>
                
                <div className="home-footer-newsletter">
                  <h4 className="home-newsletter-title">Stay Updated</h4>
                  <p className="home-newsletter-description">Subscribe to our newsletter for the latest updates and features.</p>
                  <div className="home-newsletter-form">
                    <input type="email" className="home-newsletter-input" placeholder="Enter your email" />
                    <button className="home-newsletter-button interactive">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="home-footer-bottom">
                <p className="home-copyright">© {new Date().getFullYear()} ArtMochi. All rights reserved.</p>
                <div className="home-footer-nav-secondary">
                  <a href="#" className="home-secondary-link interactive">Terms</a>
                  <a href="#" className="home-secondary-link interactive">Privacy</a>
                  <a href="#" className="home-secondary-link interactive">Cookies</a>
                </div>
              </div>
              
              <div className="home-footer-decoration">
                <div className="home-footer-line"></div>
                <div className="home-footer-dots">
                  <div className="home-footer-dot"></div>
                  <div className="home-footer-dot"></div>
                  <div className="home-footer-dot"></div>
                </div>
              </div>
            </div>
          </section>
          
        </div>
      </>
    );
};

export default Home;
