import React, { useState, useEffect, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path to your AuthContext
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useProfile } from '../context/ProfileContext';
import './ImageGenerator.css';
import LoraSelector from '../components/LoraSelector';
// Add useSubscription to your imports
import { useSubscription } from '../features/subscriptions/store/SubscriptionContext';
// Add new imports at the top
import { runwareService } from '../services/runwareService';
// Add import
import SelectedLoras from '../components/SelectedLoras';
// Add these imports at the top
import { artisticLoras, realisticLoras, loraExamples } from '../components/LoraSelector';
// Add this mapping near your other constants
const aspectRatioMapping = {
    'Portrait': '9:16',
    'Landscape': '16:9',
    'Square': '1:1',
    'Classic Portrait': '3:4',
    'Classic Landscape': '4:3'
};

// Add this function at the top of your component
const startProgressSimulation = (setProgressPercentage, setGenerationStage, steps) => {
    // Base duration for 20 steps
    const baseDuration = 60000; // 60 seconds base
    
    // Add 1500ms (1.5s) for each step over 20
    const extraSteps = Math.max(0, steps - 20);
    const extraDuration = extraSteps * 1500;
    const duration = baseDuration + extraDuration;
    
    const startTime = Date.now();
    let animationFrameId = null;
    let shouldAccelerate = false;
    let currentProgress = 0;
    
    const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        
        if (shouldAccelerate) {
            // Smooth acceleration to 99%
            currentProgress += (99 - currentProgress) * 0.3;
        } else {
            // Normal progress
            currentProgress = Math.min((elapsed / duration) * 99, 99);
        }
        
        // Ensure progress stays within bounds
        currentProgress = Math.min(Math.max(currentProgress, 0), 99);
        
        setProgressPercentage(Math.floor(currentProgress));
        
        // Update generation stage based on progress
        if (currentProgress < 25) {
            setGenerationStage('Preparing model...');
        } else if (currentProgress < 50) {
            setGenerationStage('Processing prompt...');
        } else if (currentProgress < 75) {
            setGenerationStage('Generating image...');
        } else {
            setGenerationStage('Adding final details...');
        }

        if (currentProgress < 99) {
            animationFrameId = requestAnimationFrame(updateProgress);
        }
    };

    // Function to accelerate progress
    const accelerateProgress = () => {
        shouldAccelerate = true;
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    // Return control object
    return {
        stop: () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        },
        accelerate: accelerateProgress
    };
};

// Add a new progress simulation function for upscaling
const startUpscaleProgressSimulation = (setUpscaleProgress, setUpscaleStage) => {
    const duration = 60000; // 60 seconds for upscale
    const startTime = Date.now();
    let animationFrameId = null;
    let shouldAccelerate = false;
    let currentProgress = 0;
    
    const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        
        if (shouldAccelerate) {
            currentProgress += (99 - currentProgress) * 0.3;
        } else {
            currentProgress = Math.min((elapsed / duration) * 99, 99);
        }
        
        currentProgress = Math.min(Math.max(currentProgress, 0), 99);
        
        setUpscaleProgress(Math.floor(currentProgress));
        setUpscaleStage('Upscaling image...');

        if (currentProgress < 99) {
            animationFrameId = requestAnimationFrame(updateProgress);
        }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return {
        stop: () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        },
        accelerate: () => { shouldAccelerate = true; }
    };
};

// Add this helper function to adjust dimensions to be multiples of 64
const adjustDimensionsToMultiplesOf64 = (width, height) => {
    // Function to round to nearest multiple of 64
    const roundToMultipleOf64 = (value) => {
      return Math.max(128, Math.min(2048, Math.round(value / 64) * 64));
    };
    
    // Adjust both dimensions
    const adjustedWidth = roundToMultipleOf64(width);
    const adjustedHeight = roundToMultipleOf64(height);
    
    return { width: adjustedWidth, height: adjustedHeight };
  };

// First, let's add a function to detect and set aspect ratio based on image dimensions
const detectAspectRatio = (width, height) => {
    const ratio = width / height;
    
    // Determine the closest standard aspect ratio
    if (ratio >= 1.7) { // 16:9 ratio is approximately 1.78
      return 'Landscape';
    } else if (ratio >= 1.25 && ratio < 1.5) { // 4:3 ratio is approximately 1.33
      return 'Classic Landscape';
    } else if (ratio > 0.9 && ratio < 1.1) { // Square is approximately 1.0 with some tolerance
      return 'Square';
    } else if (ratio >= 0.7 && ratio < 0.8) { // 3:4 ratio is approximately 0.75
      return 'Classic Portrait';
    } else if (ratio <= 0.6) { // 9:16 ratio is approximately 0.56
      return 'Portrait';
    } else {
      // Default to the closest match
      if (ratio > 1) return 'Classic Landscape';
      else return 'Classic Portrait';
    }
  };

// Add this to your ImageGenerator.js
const createConfetti = () => {
  const confettiCount = 100;
  const colors = ['#fe2c55', '#00f2ea', '#9333ea', '#ffffff'];
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-particle';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.width = `${Math.random() * 10 + 5}px`;
    confetti.style.height = `${Math.random() * 10 + 5}px`;
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
    document.body.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
      document.body.removeChild(confetti);
    }, 5000);
  }
};

// Add to your component to handle toggling without changing layout
const toggleFeature = (featureId, show) => {
  const element = document.getElementById(featureId);
  if (element) {
    if (show) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
    // Prevent layout shift by maintaining container heights
    document.querySelector('.image-generator-form-container').style.height = 
      `${document.querySelector('.image-generator-preview-container').offsetHeight}px`;
  }
};

const ImageGenerator = () => {
  const { user } = useAuth();
  const { fetchUserProfile } = useProfile(); // Add this
  const navigate = useNavigate();
  // Add subscription context
  const { currentSubscription } = useSubscription();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [cfgScale, setCfgScale] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('Portrait');
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enableUpscale, setEnableUpscale] = useState(false); // State for upscaling
  const [selectedLoras, setSelectedLoras] = useState(() => {
    const saved = localStorage.getItem('selectedLoras');
    return saved ? JSON.parse(saved) : {};
  });
  const [isLoraOpen, setIsLoraOpen] = useState(false);
  const [categories, setCategories] = useState([]); // State for categories
  const [initImage, setInitImage] = useState(null);
  const [isImageToImage, setIsImageToImage] = useState(false);
  const [denoisingStrength, setDenoisingStrength] = useState(0.75);
  const [steps, setSteps] = useState(20); // Add state for steps
  const [showAdvanced, setShowAdvanced] = useState(false); // Add state for advanced section toggle
  const [distilledCfgScale, setDistilledCfgScale] = useState(3.5);
  // Add remaining generations state
  const [remainingGenerations, setRemainingGenerations] = useState(null);
  // Add these state variables at the top with your other useState declarations
  const [generationStage, setGenerationStage] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  // Add state for upscaling
  const [isUpscaling, setIsUpscaling] = useState(false);
  // Add this state near your other states
  const [mode, setMode] = useState('generate'); // 'generate' or 'upscale'
  // Add new state for auto-upscale
  const [autoUpscale, setAutoUpscale] = useState(false);
  // Add new state for upscaling progress
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const [upscaleStage, setUpscaleStage] = useState('');
  const [isUpscalingPhase, setIsUpscalingPhase] = useState(false);
  // Add new state variables
  const [selectedModel, setSelectedModel] = useState(runwareService.DEFAULT_MODEL);
  const [controlNetSettings, setControlNetSettings] = useState(null);
  const [cost, setCost] = useState(0);
  // Add new state for private generation
  const [isPrivate, setIsPrivate] = useState(false);
  const isEnterprise = currentSubscription?.tier_name === 'Enterprise';
  // Add new state variables at the top of ImageGenerator component
  const [imageTitle, setImageTitle] = useState('');
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(true);
  const [generatedTitle, setGeneratedTitle] = useState('');
  // Add these state variables
  const [initImageDimensions, setInitImageDimensions] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef(null); // Add a ref for the file input

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const { exp } = jwtDecode(token);
      if (Date.now() >= exp * 1000) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        navigate('/login');
      } else {
        setLoading(false);
      }
    } catch (error) {
      navigate('/login');
    }
  }, [navigate]);

  const buildLoraString = () => {
    return Object.entries(selectedLoras)
        .map(([id, weight]) => `<lora:${id}:${weight}>`)
        .join(' ');
  };

  const configureModel = async () => {
    const optionPayload = {
        sd_model_checkpoint: "flux_dev.safetensors",
        CLIP_stop_at_last_layers: 2
    };
    
    await fetch(`${FORGE_URL}/sdapi/v1/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optionPayload)
    });
};

// Replace the existing generateImageTitle function with this:
const generateImageTitle = async (imageUrl) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/generate-title`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ imageUrl })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to generate title');
        return data.title;
    } catch (error) {
        console.error('Failed to generate title:', error);
        return 'Untitled';
    }
};

// Update handleSubmit to handle both modes:
const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setProgressPercentage(0);

    try {
        if (!currentSubscription) {
            setError('Please subscribe to start generating images');
            return;
        }

        // Update remaining generations immediately for free tier
        if (currentSubscription?.tier_name === 'Free') {
            if (remainingGenerations <= 0) {
                setError('You have reached your daily limit. Upgrade for unlimited generations!');
                return;
            }
            // Decrement locally immediately
            setRemainingGenerations(prev => Math.max(0, prev - 1));
        }

        const token = localStorage.getItem('token');

        if (mode === 'upscale') {
            // Handle upscaling
            if (!initImage) {
                throw new Error('Please select an image to upscale');
            }

            const progressControl = startProgressSimulation(setProgressPercentage, setGenerationStage, 20);

            const base64Image = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(initImage);
            });

            // Find original image's prompt if it exists
            let originalPrompt = null;
            if (initImage?.dataset?.prompt) {
                originalPrompt = initImage.dataset.prompt;
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upscale`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    image: base64Image,
                    originalPrompt: originalPrompt
                })
            });

            const data = await response.json();

            if (data.error === 'Daily limit reached') {
                if (currentSubscription?.tier_name === 'Free') {
                    setRemainingGenerations(prev => prev + 1);
                }
                throw new Error('You have reached your daily free tier limit. Upgrade for unlimited generations!');
            }

            // Update with server's count to stay in sync
            if (currentSubscription?.tier_name === 'Free' && data.remainingGenerations !== undefined) {
                setRemainingGenerations(data.remainingGenerations);
            }

            if (data.error) {
                throw new Error(data.error);
            }

            progressControl.accelerate();
            await new Promise(resolve => setTimeout(resolve, 600));
            setProgressPercentage(100);
            setGenerationStage('Complete!');
            setImage(data.upscaledImage);

        } else {
            // Handle image generation
            if (!prompt.trim()) {
                throw new Error('Please enter a prompt');
            }
            const progressControl = startProgressSimulation(setProgressPercentage, setGenerationStage, steps);

            // Convert image to base64 if it's image-to-image
            let imageData = null;
            if (isImageToImage && initImage) {
                imageData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        // Get the full base64 string including data URI
                        resolve(reader.result);
                    };
                    reader.readAsDataURL(initImage);
                });
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/runware`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    input: {
                        prompt: prompt,
                        negative_prompt: negativePrompt,
                        
                        // For image-to-image, use adjusted dimensions directly
                        // For text-to-image, use selected aspect ratio dimensions
                        ...(isImageToImage && initImageDimensions.width > 0 && initImageDimensions.height > 0
                          ? {
                              width: initImageDimensions.width,
                              height: initImageDimensions.height
                            }
                          : (() => {
                              // Use a function to compute dimensions based on aspect ratio
                              const getDimensions = (ratio) => {
                                switch(ratio) {
                                  case 'Portrait':
                                    return { width: 768, height: 1280 };
                                  case 'Landscape':
                                    return { width: 1280, height: 768 };
                                  case 'Square':
                                    return { width: 1024, height: 1024 };
                                  case 'Classic Portrait':
                                    return { width: 768, height: 1024 };
                                  case 'Classic Landscape':
                                    return { width: 1024, height: 768 };
                                  default:
                                    return { width: 1024, height: 1024 };
                                }
                              };
                              
                              const dims = getDimensions(aspectRatio);
                              return {
                                width: dims.width,
                                height: dims.height
                              };
                            })()
                        ),
                        
                        num_inference_steps: steps,
                        guidance_scale: distilledCfgScale,
                        
                        // Other parameters remain the same
                        ...(isImageToImage && imageData && {
                          seedImage: imageData,
                          strength: denoisingStrength
                        }),
                        // Rest of your parameters...
                      }
                })
            });

            const data = await response.json();
            console.log('Runware response:', data); // Add this for debugging

            if (data.error) {
                throw new Error(data.error);
            }

            // Update this section to properly handle the image
            progressControl.accelerate();
            await new Promise(resolve => setTimeout(resolve, 600));
            
            if (autoUpscale) {
                setProgressPercentage(100);
                setIsUpscalingPhase(true);
                const upscaleProgressControl = startUpscaleProgressSimulation(setUpscaleProgress, setUpscaleStage);
                
                const upscaleResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/upscale`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        image: data.image, // Make sure this matches your server response
                        originalPrompt: prompt
                    })
                });

                const upscaleData = await upscaleResponse.json();
                if (upscaleData.error) {
                    throw new Error(upscaleData.error);
                }
                
                upscaleProgressControl.accelerate();
                await new Promise(resolve => setTimeout(resolve, 600));
                setUpscaleProgress(100);
                setImage(upscaleData.upscaledImage);
                setIsUpscalingPhase(false);
            } else {
                setImage(data.image); // Make sure data.image is the URL from your server
            }
            
            // In handleSubmit, modify the image generation response section:
            if (data.image) {
                if (autoGenerateTitle) {
                    try {
                        // Generate title first
                        const generatedTitle = await generateImageTitle(data.image);
                        setImageTitle(generatedTitle);
                        
                        // Update the title in the database
                        const updateResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/update-image-title`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                imageUrl: data.image,
                                title: generatedTitle
                            })
                        });

                        if (!updateResponse.ok) {
                            throw new Error('Failed to update image title');
                        }
                    } catch (error) {
                        console.error('Title generation/update failed:', error);
                        setImageTitle('Untitled');
                    }
                }
                
                setImage(data.image);
                setProgressPercentage(100);
                setGenerationStage('Complete!');
                createConfetti();
                // Also add a success notification
                const notification = document.createElement('div');
                notification.className = 'image-generated-notification';
                notification.textContent = 'Image generated successfully! ✨';
                document.body.appendChild(notification);
                
                setTimeout(() => {
                  document.body.removeChild(notification);
                }, 4000);
            }

            if (data.categories) {
                setCategories(data.categories);
            }

            if (autoGenerateTitle && data.title) {
                setImageTitle(data.title);
            }
        }
    } finally {
        setLoading(false);
        setIsUpscalingPhase(false);
        setUpscaleProgress(0);
        setProgressPercentage(0);
    }
};

// Add upscale handler
const handleUpscale = async (imageToUpscale) => {
    if (!imageToUpscale) return;
    
    setIsUpscaling(true);
    setError(null);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upscale`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                image: imageToUpscale,
                originalPrompt: prompt // Add this to pass the prompt
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        return data.upscaledImage;
    } catch (error) {
        console.error('Upscaling error:', error);
        setError('Failed to upscale image: ' + error.message);
    } finally {
        setIsUpscaling(false);
    }
};

// Add useEffect to fetch initial remaining generations on component mount
useEffect(() => {
    const fetchRemainingGenerations = async () => {
        if (currentSubscription?.tier_name === 'Free') {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/remaining-generations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setRemainingGenerations(data.remaining);
            } catch (error) {
                console.error('Failed to fetch remaining generations:', error);
            }
        }
    };

    fetchRemainingGenerations();
}, [currentSubscription]);

useEffect(() => {
    const mainContainer = document.querySelector('.image-generator-container');
    let scrollY = 0; // Store scroll position

    if (isLoraOpen && mainContainer) {
        scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else if (!isLoraOpen && mainContainer) {
        const savedScrollY = Math.abs(parseInt(document.body.style.top || '0', 10));
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = ''; // Re-enable scrolling
        window.scrollTo(0, savedScrollY);
    }

    return () => {
        if (!isLoraOpen) return; // Prevents unnecessary resets
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
    };
}, [isLoraOpen]);




useEffect(() => {
    const loadEditData = async () => {
        const editDataString = localStorage.getItem('editImageData');
        if (!editDataString) return;

        try {
            const editData = JSON.parse(editDataString);
            
            // Create a simple fetch to get the image as a blob
            const response = await fetch(editData.url, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) throw new Error('Failed to load image');
            
            const blob = await response.blob();
            const file = new File([blob], 'image.webp', { type: 'image/webp' });

            // Set all states at once
            setMode(editData.mode);
            setPrompt(editData.prompt || '');
            setInitImage(file);
            setIsImageToImage(editData.isImageToImage);

            // Clean up
            localStorage.removeItem('editImageData');
        } catch (error) {
            console.error('Error loading edit data:', error);
            setError('Failed to load image for editing');
        }
    };

    loadEditData();
}, []); // Run once on component mount

useEffect(() => {
    localStorage.setItem('selectedLoras', JSON.stringify(selectedLoras));
}, [selectedLoras]);

const handleWeightChange = (loraId, newWeight) => {
    setSelectedLoras(prev => ({
        ...prev,
        [loraId]: newWeight
    }));
};

// Add helper function to get LoRA name
const getLoraName = (url) => {
    const allLoras = [...artisticLoras, ...realisticLoras];
    const lora = allLoras.find(l => l.url === url);
    return lora ? lora.name : url;
};

// Add this function inside ImageGenerator component
const preloadLoraImages = () => {
  // Get all unique image URLs
  const allImages = new Set(Object.values(loraExamples).flat());
  
  // Create a low-priority queue for preloading
  const queue = [...allImages];
  let currentIndex = 0;

  const loadNext = () => {
    if (currentIndex >= queue.length) return;

    const img = new Image();
    img.src = queue[currentIndex];
    
    img.onload = () => {
      currentIndex++;
      // Use requestIdleCallback to load next image when browser is idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => loadNext(), { timeout: 1000 });
      } else {
        setTimeout(loadNext, 100);
      }
    };

    img.onerror = () => {
      currentIndex++;
      loadNext();
    };
  };

  loadNext();
};

// Add this useEffect in your ImageGenerator component
useEffect(() => {
  // Start preloading after component mounts
  preloadLoraImages();
}, []);

// First, fix the handleRemoveImage function to properly clear the file input
const handleRemoveImage = () => {
  setInitImage(null);
  setIsImageToImage(false);
  setInitImageDimensions({
    width: 0,
    height: 0,
    originalWidth: 0,
    originalHeight: 0
  });
  
  // Reset the file input value to clear the filename
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

// Add button click effect to all buttons
const addClickEffects = () => {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.classList.add('btn-click-effect');
  });
};

// Add this to useEffect to initialize click effects
useEffect(() => {
  addClickEffects();
}, []);

// Use this when toggling remix/upscale modes
useEffect(() => {
  if (mode === 'remix') {
    toggleFeature('remix-options', true);
    toggleFeature('upscale-options', false);
  } else if (mode === 'upscale') {
    toggleFeature('upscale-options', true);
    toggleFeature('remix-options', false);
  }
}, [mode]);

// Replace your current autoResize effect with this improved version
useEffect(() => {
  const promptInput = document.getElementById('prompt');
  if (!promptInput) return;
  
  // Function to expand textarea on focus
  const expandTextarea = () => {
    // Save current scroll position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    promptInput.style.height = 'auto';
    
    // Check if content needs scrolling
    if (promptInput.scrollHeight > 120) {
      promptInput.style.height = '120px';
      promptInput.style.overflowY = 'auto';
    } else {
      promptInput.style.height = `${promptInput.scrollHeight}px`;
      promptInput.style.overflowY = 'hidden';
    }
    
    // Restore scroll position to prevent page jump
    window.scrollTo(0, scrollTop);
  };
  
  // Function to collapse textarea on blur if content fits
  const collapseTextarea = () => {
    // Only collapse if content is short enough to fit one line
    if (promptInput.value.length < 80) {
      promptInput.style.height = '42px';
      promptInput.style.overflowY = 'hidden';
    }
  };
  
  // Add "..." indicator when collapsed with content
  const updateEllipsis = () => {
    if (promptInput.scrollHeight > 42 && promptInput.offsetHeight === 42) {
      if (!promptInput.classList.contains('has-more')) {
        promptInput.classList.add('has-more');
      }
    } else {
      promptInput.classList.remove('has-more');
    }
  };
  
  // Event listeners
  promptInput.addEventListener('focus', expandTextarea);
  promptInput.addEventListener('blur', collapseTextarea);
  promptInput.addEventListener('input', () => {
    if (document.activeElement === promptInput) {
      expandTextarea();
    }
    updateEllipsis();
  });
  
  // Initialize
  updateEllipsis();
  
  return () => {
    promptInput.removeEventListener('focus', expandTextarea);
    promptInput.removeEventListener('blur', collapseTextarea);
    // Remove the input listener which is added in an anonymous function
    // (not a direct reference to a named function)
  };
}, []);

  return (
    <div className="image-generator">
        {!currentSubscription ? (
            <div className="tier-info-banner warning">
                <p>You need a subscription to generate images</p>
                <a href="/subscription" className="upgrade-link">
                    Subscribe Now →
                </a>
            </div>
        ) : currentSubscription?.tier_name === 'Free' && (
            <div className="tier-info-banner">
                <p>
                    Free Tier: {remainingGenerations !== null 
                        ? `${remainingGenerations} generations remaining today` 
                        : '10 images per day'}
                </p>
                <a href="/subscription" className="upgrade-link">
                    Upgrade for unlimited generations →
                </a>
            </div>
        )}
        
        <div className="image-generator-container">
            {/* Form Side */}
            <div className="image-generator-form-container">
                <div className="content-wrapper">
                    <h2 className="image-generator-heading">Generate Image</h2>
                    <form onSubmit={handleSubmit} className="image-generator-form">
                        <div className="image-generator-form-group">
                        </div>
                        <div className="image-generator-form-group">
                            <label className="image-generator-label" htmlFor="prompt">Prompt:</label>
                            <div className="expandable-prompt">
                                <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                required={mode === 'generate'}
                                disabled={mode === 'upscale'}
                                className={`image-generator-input ${mode === 'upscale' ? 'disabled' : ''}`}
                                placeholder="Describe what you want to create..."
                                rows="1"
                                />
                            </div>
                        </div>
                                                    
                        <div className="image-generator-form-group">
                        {/*}
                            <label className="image-generator-label" htmlFor="negativePrompt">Negative Prompt:</label>
                            <input
                                type="text"
                                id="negativePrompt"
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                placeholder="what to exclude"
                                className="image-generator-input"
                            />
                            */}
                        </div>
                        <button 
                            type="button"
                            className={`lora-settings-button ${Object.keys(selectedLoras).length > 0 ? 'active' : ''} ${mode === 'upscale' ? 'disabled' : ''}`}
                            onClick={() => setIsLoraOpen(true)}
                            disabled={mode === 'upscale'}
                        >
                            ✨ Click Here to Add Presets & Styles ✨
                            <span className="lora-settings-subtext">
                                Important: Choose your art style before generating!
                            </span>
                        </button>

                        {/* Add this right after the button */}
                        {Object.keys(selectedLoras).length > 0 && (
                            <SelectedLoras
                                selectedLoras={selectedLoras}
                                setSelectedLoras={setSelectedLoras}
                                artisticLoras={artisticLoras}
                                realisticLoras={realisticLoras}
                            />
                        )}
                        
                        <LoraSelector 
                            selectedLoras={selectedLoras}
                            setSelectedLoras={setSelectedLoras}
                            isOpen={isLoraOpen}
                            onClose={() => setIsLoraOpen(false)}
                            onWeightChange={handleWeightChange}  // This should now work correctly
                        />
                        <div className={`image-generator-creative-section ${mode === 'upscale' ? 'disabled' : ''}`}>
                            <label className="image-generator-label">Creative Control</label>
                            <div className="image-generator-creative-buttons">
                                <button
                                    type="button"
                                    className={`image-generator-creative-btn ${distilledCfgScale === 2 ? 'selected' : ''}`}
                                    onClick={() => setDistilledCfgScale(2)}
                                    disabled={mode === 'upscale'}
                                >
                                    Very Creative
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-creative-btn ${distilledCfgScale === 3.5 ? 'selected' : ''}`}
                                    onClick={() => setDistilledCfgScale(3.5)}
                                    disabled={mode === 'upscale'}
                                >
                                    Creative
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-creative-btn ${distilledCfgScale === 5 ? 'selected' : ''}`}
                                    onClick={() => setDistilledCfgScale(5)}
                                    disabled={mode === 'upscale'}
                                >
                                    Subtle
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-creative-btn ${distilledCfgScale === 7 ? 'selected' : ''}`}
                                    onClick={() => setDistilledCfgScale(7)}
                                    disabled={mode === 'upscale'}
                                >
                                    Strict
                                </button>
                            </div>
                        </div>
                        {/* Update the aspect ratio section to show disabled state during img2img */}
                        <div className={`image-generator-aspect-section ${mode === 'upscale' || isImageToImage ? 'disabled' : ''}`}>
                          <label className="image-generator-label">
                            Aspect Ratio {isImageToImage && <span className="aspect-ratio-note">(Using uploaded image dimensions)</span>}
                          </label>
                          <div className="image-generator-aspect-buttons">
                            <button
                              type="button"
                              className={`image-generator-aspect-btn ${aspectRatio === 'Portrait' ? 'selected' : ''}`}
                              onClick={() => !isImageToImage && setAspectRatio('Portrait')}
                              disabled={mode === 'upscale' || isImageToImage}
                            >
                              Portrait
                            </button>
                            <button
                              type="button"
                              className={`image-generator-aspect-btn ${aspectRatio === 'Classic Portrait' ? 'selected' : ''}`}
                              onClick={() => !isImageToImage && setAspectRatio('Classic Portrait')}
                              disabled={mode === 'upscale' || isImageToImage}
                            >
                              3:4
                            </button>
                            <button
                              type="button"
                              className={`image-generator-aspect-btn ${aspectRatio === 'Square' ? 'selected' : ''}`}
                              onClick={() => !isImageToImage && setAspectRatio('Square')}
                              disabled={mode === 'upscale' || isImageToImage}
                            >
                              Square
                            </button>
                            <button
                              type="button"
                              className={`image-generator-aspect-btn ${aspectRatio === 'Classic Landscape' ? 'selected' : ''}`}
                              onClick={() => !isImageToImage && setAspectRatio('Classic Landscape')}
                              disabled={mode === 'upscale' || isImageToImage}
                            >
                              4:3
                            </button>
                            <button
                              type="button"
                              className={`image-generator-aspect-btn ${aspectRatio === 'Landscape' ? 'selected' : ''}`}
                              onClick={() => !isImageToImage && setAspectRatio('Landscape')}
                              disabled={mode === 'upscale' || isImageToImage}
                            >
                              Landscape
                            </button>
                          </div>
                        </div>
                        <div className="image-generator-form-group">
                            <label className="image-generator-label">Image Input:</label>
                            <div className="mode-selector">
                                <button 
                                    type="button"
                                    className={`mode-btn ${mode === 'generate' ? 'selected' : ''}`}
                                    onClick={() => setMode('generate')}
                                >
                                    Remix Image
                                </button>
                                <button 
                                    type="button"
                                    className={`mode-btn ${mode === 'upscale' ? 'selected' : ''}`}
                                    onClick={() => setMode('upscale')}
                                >
                                    Upscale Only
                                </button>
                            </div>
                            <div className="image-upload-section">
                              <label className="image-upload-label">
                                <div className="image-upload-inner">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        setInitImage(file);
                                        if (mode === 'generate') {
                                          setIsImageToImage(true);
                                          
                                          // Get image dimensions when loaded
                                          const img = new Image();
                                          img.onload = () => {
                                            // Adjust dimensions to be multiples of 64
                                            const adjustedDimensions = adjustDimensionsToMultiplesOf64(img.width, img.height);
                                            
                                            setInitImageDimensions({
                                              width: adjustedDimensions.width,
                                              height: adjustedDimensions.height,
                                              originalWidth: img.width,
                                              originalHeight: img.height
                                            });
                                            
                                            // Automatically set aspect ratio based on image dimensions
                                            const detectedRatio = detectAspectRatio(img.width, img.height);
                                            setAspectRatio(detectedRatio);
                                            
                                            console.log(`Original dimensions: ${img.width}x${img.height}, Adjusted: ${adjustedDimensions.width}x${adjustedDimensions.height}, Aspect Ratio: ${detectedRatio}`);
                                          };
                                          img.src = URL.createObjectURL(file);
                                        }
                                      }
                                    }}
                                    className="image-uploader-input"
                                    id="image-upload"
                                    ref={fileInputRef} // Add a ref to access this input
                                  />
                                  <div className="upload-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                  <div className="upload-text">
                                    <span className="primary-text">Drop image here or click to upload</span>
                                    <span className="secondary-text">Supported formats: PNG, JPG, WEBP</span>
                                  </div>
                                </div>
                              </label>
                            </div>

                            {/* Add this immediately after the upload section */}
                            {initImage && (
                              <div className="uploaded-image-container">
                                <div className="uploaded-image-preview">
                                  <img 
                                    src={URL.createObjectURL(initImage)} 
                                    alt="Uploaded" 
                                    className="uploaded-image" 
                                  />
                                  <div className="image-info">
                                    <span className="image-name">{initImage.name}</span>
                                    <span className="image-dimensions">
                                      {initImageDimensions.originalWidth}×{initImageDimensions.originalHeight}px → {initImageDimensions.width}×{initImageDimensions.height}px
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="remove-image-btn"
                                >
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Remove
                                </button>
                              </div>
                            )}
                        </div>

                        {/* Show image-to-image controls only in generate mode */}
                        {mode === 'generate' && isImageToImage && (
                            <div className="image-generator-form-group">
                                <label className="image-generator-label">
                                    Denoising Strength: {denoisingStrength}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={denoisingStrength}
                                    onChange={(e) => setDenoisingStrength(parseFloat(e.target.value))}
                                    className="image-generator-range"
                                />
                            </div>
                        )}
                        <div className={`control-group ${mode === 'upscale' ? 'disabled' : ''}`}>
                            <label>Steps: {steps}</label>
                            <input 
                                type="range"
                                min="1"
                                max="50"
                                value={steps}
                                onChange={(e) => setSteps(parseInt(e.target.value))}
                                className="slider"
                                disabled={mode === 'upscale'}
                            />
                        </div>
                        {mode === 'generate' && (
                            <div className="image-generator-form-group">
                                <label className="image-generator-label">
                                    <input
                                        type="checkbox"
                                        checked={autoUpscale}
                                        onChange={(e) => setAutoUpscale(e.target.checked)}
                                        className="auto-upscale-checkbox"
                                    />
                                    Upscale after generation
                                </label>
                            </div>
                        )}
                        {isEnterprise && (
                            <div className="image-generator-form-group">
                                <label className="image-generator-label private-toggle">
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                        className="private-checkbox"
                                    />
                                    Generate as Private Image
                                    <span className="private-tooltip">
                                        Private images are only visible to you
                                    </span>
                                </label>
                            </div>
                        )}
                        {/* Update the submit button to show correct action */}
                        <button
                            type="submit"
                            disabled={loading || (mode === 'upscale' && !initImage)}
                            className="generate-button"
                        >
                            {loading ? (mode === 'upscale' ? 'Upscaling...' : 'Generating...') 
                            : (mode === 'upscale' ? 'Upscale Image' : 'Generate Image')}
                        </button>
                    </form>
                </div>
            </div>

            {/* Preview Side */}
            <div className={`image-generator-preview-container ${loading ? 'loading' : ''}`}>
                <div className="content-wrapper">
                    <h2 className="image-generator-heading">Generate Image</h2>
                    <div className="preview-content">
                        {loading ? (
                            <div className="loading-container">
                                {!isUpscalingPhase ? (
                                    <div className="generation-progress">
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                        <div className="progress-text">
                                            {generationStage}
                                            <span className="progress-percentage">
                                                {progressPercentage}%
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="generation-progress">
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill"
                                                style={{ width: `${upscaleProgress}%` }}
                                            />
                                        </div>
                                        <div className="progress-text">
                                            {upscaleStage}
                                            <span className="progress-percentage">
                                                {upscaleProgress}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : image ? (
                            <div className="generated-image-container">
                                <img src={image} alt="Generated" className="generated-image" />
                                <div className="image-actions">
                                  {/*}  <button
                                        onClick={handleUpscale}
                                        disabled={isUpscaling}
                                        className="upscale-button"
                                    >
                                        {isUpscaling ? 'Upscaling...' : 'Complete'}
                                    </button> */}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-preview">
                                <div className="empty-preview-depth"></div>
                                <div className="empty-preview-icon">✨</div>
                                <div className="empty-preview-text">Ready to Create Magic</div>
                                <div className="empty-preview-subtext">
                                    Fill in the form and click "Generate Image" to see your creation come to life
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
}

export default ImageGenerator;
