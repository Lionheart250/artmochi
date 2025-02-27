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
import { artisticLoras, realisticLoras } from '../components/LoraSelector';

// Add this mapping near your other constants
const aspectRatioMapping = {
    'Portrait': '9:16',
    'Landscape': '16:9',
    'Square': '1:1'
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
                        height: aspectRatio === 'Portrait' ? 1280 : aspectRatio === 'Landscape' ? 768 : 1024,
                        width: aspectRatio === 'Portrait' ? 768 : aspectRatio === 'Landscape' ? 1280 : 1024,
                        num_inference_steps: steps,
                        guidance_scale: distilledCfgScale,
                        ...(isImageToImage && imageData && {
                            seedImage: imageData,
                            strength: denoisingStrength
                        }),
                        ...(Object.keys(selectedLoras).length > 0 && {
                            lora: Object.entries(selectedLoras).map(([url, weight]) => ({
                                model: url.startsWith('civitai:') ? url : `civitai:${url.match(/models\/(\d+)/)?.[1]}`,
                                weight: parseFloat(weight)
                            }))
                        }),
                        private: isPrivate,
                        generateTitle: autoGenerateTitle,
                        title: imageTitle || undefined,
                        lorasUsed: Object.entries(selectedLoras).map(([url, weight]) => ({
                            name: getLoraName(url),
                            url: url,
                            weight: parseFloat(weight)
                        }))
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
                            <input
                                type="text"
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                required={mode === 'generate'}
                                disabled={mode === 'upscale'}
                                className={`image-generator-input ${mode === 'upscale' ? 'disabled' : ''}`}
                            />
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
                        <div className={`image-generator-aspect-section ${mode === 'upscale' ? 'disabled' : ''}`}>
                            <label className="image-generator-label">Aspect Ratio</label>
                            <div className="image-generator-aspect-buttons">
                                <button
                                    type="button"
                                    className={`image-generator-aspect-btn ${aspectRatio === 'Portrait' ? 'selected' : ''}`}
                                    onClick={() => setAspectRatio('Portrait')}
                                    disabled={mode === 'upscale'}
                                >
                                    Portrait
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-aspect-btn ${aspectRatio === 'Landscape' ? 'selected' : ''}`}
                                    onClick={() => setAspectRatio('Landscape')}
                                    disabled={mode === 'upscale'}
                                >
                                    Landscape
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-aspect-btn ${aspectRatio === 'Square' ? 'selected' : ''}`}
                                    onClick={() => setAspectRatio('Square')}
                                    disabled={mode === 'upscale'}
                                >
                                    Square
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
                            <div className="image-upload-container">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setInitImage(file);
                                            if (mode === 'generate') {
                                                setIsImageToImage(true);
                                            }
                                        }
                                    }}
                                    className="image-generator-input"
                                />
                                {initImage && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInitImage(null);
                                            setIsImageToImage(false);
                                        }}
                                        className="clear-image-btn"
                                    >
                                        Clear Image
                                    </button>
                                )}
                            </div>
                            {initImage && (
                                <div className="initial-image-preview">
                                    <img 
                                        src={URL.createObjectURL(initImage)} 
                                        alt="Initial" 
                                        className="initial-image-thumbnail"
                                    />
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
                    <h2 className="image-generator-heading"></h2>
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
                                    <button
                                        onClick={handleUpscale}
                                        disabled={isUpscaling}
                                        className="upscale-button"
                                    >
                                        {isUpscaling ? 'Upscaling...' : '🔍 Upscale Complete'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-preview">Your image will appear here</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
}

export default ImageGenerator;
