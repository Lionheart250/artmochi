import React, { useState, useEffect, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path to your AuthContext
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useProfile } from '../context/ProfileContext';
import './ImageGenerator.css';
import LoraSelector from '../components/LoraSelector';
import LoadingSpirals from '../components/LoadingSpirals';
// Add useSubscription to your imports
import { useSubscription } from '../features/subscriptions/store/SubscriptionContext';

// Add constants at top
const dimensions = {
    Portrait: { width: 768, height: 1280 },
    Landscape: { width: 1280, height: 768 },
    Square: { width: 1024, height: 1024 }
};

const SAMPLERS = [
    "Euler",
    "Euler a",
    "DPM++ 2M",
    "DPM++ SDE",
    "DPM++ 2M SDE",
    "DPM fast",
    "DPM adaptive",
    "LMS",
    "Heun",
    "DPM2",
    "DPM2 a"
];

const SCHEDULERS = [
    "Simple",
    "Karras"
];

const FORGE_URL = 'http://127.0.0.1:7860';

// Add this mapping near your other constants
const aspectRatioMapping = {
    'Portrait': '9:16',
    'Landscape': '16:9',
    'Square': '1:1'
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
  const [selectedLoras, setSelectedLoras] = useState({});
  const [isLoraOpen, setIsLoraOpen] = useState(false);
  const [categories, setCategories] = useState([]); // State for categories
  const [sampler, setSampler] = useState("DPM++ 2M SDE");
  const [upscaler, setUpscaler] = useState("R-ESRGAN 4x+");
  const [initImage, setInitImage] = useState(null);
  const [isImageToImage, setIsImageToImage] = useState(false);
  const [denoisingStrength, setDenoisingStrength] = useState(0.75);
  const [steps, setSteps] = useState(20); // Add state for steps
  const [scheduler, setScheduler] = useState("Karras");
  const [showAdvanced, setShowAdvanced] = useState(false); // Add state for advanced section toggle
  const [distilledCfgScale, setDistilledCfgScale] = useState(3.5);
  // Add remaining generations state
  const [remainingGenerations, setRemainingGenerations] = useState(null);

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

// First, modify the handleSubmit function to handle image-to-image:
const handleSubmit = async (e) => {
    e.preventDefault();
    
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

    setError(null);
    setLoading(true);

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        // Base parameters
        const params = {
            version: "2389224e115448d9a77c07d7d45672b3f0aa45acacf1c5bcf51857ac295e3aec",
            input: {
                prompt: prompt,
                negative_prompt: negativePrompt,
                hf_loras: Object.keys(selectedLoras),
                lora_scales: Object.values(selectedLoras),
                num_outputs: 1,
                aspect_ratio: aspectRatioMapping[aspectRatio],
                output_format: "png",
                guidance_scale: distilledCfgScale,
                output_quality: 80,
                prompt_strength: 0.8,
                num_inference_steps: steps,
                disable_safety_checker: true  // Add this line
            }
        };

        // Add image-to-image parameters if initImage exists
        if (isImageToImage && initImage) {
            // Convert image file to base64
            const base64Image = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(initImage);
            });

            params.input.image = base64Image;
            params.input.strength = denoisingStrength;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/replicate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        
        if (data.error === 'Daily limit reached') {
            // Revert the local count if the server rejected
            if (currentSubscription?.tier_name === 'Free') {
                setRemainingGenerations(prev => prev + 1);
            }
            throw new Error('You have reached your daily free tier limit. Upgrade for unlimited generations!');
        }

        // Update with server's count to stay in sync
        if (currentSubscription?.tier_name === 'Free' && data.remainingGenerations !== undefined) {
            setRemainingGenerations(data.remainingGenerations);
        }

        if (data.image) {  // Changed from data.output
            setImage(data.image);  // Use data.image instead of data.output[0]
            console.log('Image generated successfully:', data);
        } else if (data.error) {
            throw new Error(data.error);
        } else {
            console.error('Unexpected response:', data);
            throw new Error('No image in response');
        }

    } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Failed to generate image');
    } finally {
        setLoading(false);
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

const validUpscalers = [
    "Latent",
    "Latent (antialiased)",
    "Latent (bicubic)",
    "Latent (bicubic antialiased)",
    "Latent (nearest)",
    "Latent (nearest-exact)",
    "None",
    "Lanczos",
    "Nearest",
    "ESRGAN_4x",
    "R-ESRGAN 4x+",
    "4x_foolhardy_Remacri",  // Custom ESRGAN model
    "LDSR",
    "SwinIR 4x"
];

const LoadingText = LoadingSpirals;

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
                            <label className="image-generator-label" htmlFor="prompt">Prompt:</label>
                            <input
                                type="text"
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                required 
                                className="image-generator-input"
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
                            className={`lora-settings-button ${Object.keys(selectedLoras).length > 0 ? 'active' : ''}`}
                            onClick={() => setIsLoraOpen(true)}
                        >
                           ✨ Magic Potion ✨
                        </button>
                        
                        <LoraSelector 
                            selectedLoras={selectedLoras}
                            setSelectedLoras={setSelectedLoras}
                            isOpen={isLoraOpen}
                            onClose={() => setIsLoraOpen(false)}
                        />
                        <div className="image-generator-creative-section">
                            <label className="image-generator-label">Creative Control</label>
                            <div className="image-generator-creative-buttons">
                                <button
                                    type="button"
                                    className={`image-generator-creative-btn ${distilledCfgScale === 2 ? 'selected' : ''}`}
                                    onClick={() => setDistilledCfgScale(2)}
                                >
                                    Very Creative
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-creative-btn ${distilledCfgScale === 3.5 ? 'selected' : ''}`}
                                    onClick={() => setDistilledCfgScale(3.5)}
                                >
                                    Creative
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-creative-btn ${distilledCfgScale === 5 ? 'selected' : ''}`}
                                    onClick={() => setDistilledCfgScale(5)}
                                >
                                    Subtle
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-creative-btn ${distilledCfgScale === 7 ? 'selected' : ''}`}
                                    onClick={() => setDistilledCfgScale(7)}
                                >
                                    Strict
                                </button>
                            </div>
                        </div>
                        <div className="image-generator-aspect-section">
                            <label className="image-generator-label">Aspect Ratio</label>
                            <div className="image-generator-aspect-buttons">
                                <button
                                    type="button"
                                    className={`image-generator-aspect-btn ${aspectRatio === 'Portrait' ? 'selected' : ''}`}
                                    onClick={() => setAspectRatio('Portrait')}
                                >
                                    Portrait
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-aspect-btn ${aspectRatio === 'Landscape' ? 'selected' : ''}`}
                                    onClick={() => setAspectRatio('Landscape')}
                                >
                                    Landscape
                                </button>
                                <button
                                    type="button"
                                    className={`image-generator-aspect-btn ${aspectRatio === 'Square' ? 'selected' : ''}`}
                                    onClick={() => setAspectRatio('Square')}
                                >
                                    Square
                                </button>
                            </div>
                        </div>
                        <div className="image-generator-form-group">
                            <label className="image-generator-label">Initial Image:</label>
                            <div className="image-upload-container">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setInitImage(file);
                                            setIsImageToImage(true);
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

                        {isImageToImage && (
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
                        <div className="control-group">
                            <label>Steps: {steps}</label>
                            <input 
                                type="range"
                                min="1"
                                max="50"
                                value={steps}
                                onChange={(e) => setSteps(parseInt(e.target.value))}
                                className="slider"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="generate-button"
                        >
                                {loading ? 'Generating...' : 'Generate Image'}
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
                                <LoadingText />
                            </div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : image ? (
                            <img src={image} alt="Generated" className="generated-image" />
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
