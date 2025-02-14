import React, { useState } from 'react';
import './LoraSelector.css';

const fluxLoras = [
    {
        id: 'gothic-lines',
        name: 'Gothic Lines',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1202162?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-lines', 
        name: 'Anime Lines',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1296986?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'dark-energetic-anime',
        name: 'Dark Energetic Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/988430?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'vibrant-energetic-anime',
        name: 'Vibrant Energetic Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/989004?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'vintage-pulp',
        name: 'Vintage Pulp',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1304212?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-detailed-eyes',
        name: 'Anime Detailed Eyes',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/726524?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'luminous-shadows-cape',
        name: 'Luminous Shadows Cape',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/791149?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'dark-fantasy',
        name: 'Dark Fantasy',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/759880?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'faetastic-details',
        name: 'Faetastic Details',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/720252?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'storybook-artstyle',
        name: 'Storybook Artstyle',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/723968?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'castlevania-art-style',
        name: 'Castlevania Art Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/731291?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'retro-anime',
        name: 'Retro Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/806265?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'arcane-intro-style',
        name: 'Arcane Intro Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1089413?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'fantasy-wizards-witches',
        name: 'Fantasy Wizards and Witches',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/880134?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'midjourney-style',
        name: 'Mid Journey Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1249246?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'animelike-digital-painting',
        name: 'Animelike Digital Painting',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/778925?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'gothicniji',
        name: 'Gothicniji',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1189748?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'midjourneyanime',
        name: 'Midjourney Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/837239?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'digital-abyss',
        name: 'Digital Abyss',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/945122?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'cyber-graphic',
        name: 'Cyber Graphic',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/843447?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'elden-ring-style',
        name: 'Elden Ring Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/746484?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'frazetta-style',
        name: 'Frazetta Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/792756?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'colored-pencil',
        name: 'Colored Pencil',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1086297?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'dramatic-lighting',
        name: 'Dramatic Lighting',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1278791?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'image-upgrader',
        name: 'Image Upgrader',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/984672?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'neon-lighting',
        name: 'Neon Lighting',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1091576?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
   /* {
        id: 'turbo-detailer',
        name: 'Turbo Detailer',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1041442?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'analog-grainy',
        name: '2000\'s Analog Grainy',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1276001?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'portrait-style',
        name: 'Portrait Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/728041?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'realistic-skin',
        name: 'Realistic Skin',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1081450?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'realistic-horror',
        name: 'Realistic Horror',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/875302?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'ultra-realistic',
        name: 'Ultra Realistic',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1026423?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    } */
];

const LoraSelector = ({ selectedLoras, setSelectedLoras, isOpen, onClose }) => {
    const [fluxExpanded, setFluxExpanded] = useState(true);
    
    if (!isOpen) return null;

    const toggleLora = (loraId) => {
        setSelectedLoras(prev => {
            const lora = fluxLoras.find(l => l.id === loraId);
            if (prev[lora.url]) {
                const { [lora.url]: removed, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [lora.url]: lora.defaultWeight
            };
        });
    };

    const updateWeight = (loraId, weight) => {
        const lora = fluxLoras.find(l => l.id === loraId);
        setSelectedLoras(prev => ({
            ...prev,
            [lora.url]: parseFloat(weight)
        }));
    };

    const handleRemoveAll = () => {
        setSelectedLoras({});
    };

    const handleRandom = () => {
        const shuffled = [...fluxLoras].sort(() => 0.5 - Math.random());
        const randomLoras = shuffled.slice(0, 4).reduce((acc, lora, index) => {
            let weight;
            switch (index) {
                case 0: weight = (Math.random() * 0.5) + 0.5; break; // 0.5 to 1
                case 1: weight = (Math.random() * 0.5) + 0.4; break; // 0.4 to 0.9
                case 2: weight = (Math.random() * 0.4) + 0.3; break; // 0.3 to 0.7
                case 3: weight = (Math.random() * 0.3) + 0.3; break; // 0.3 to 0.6
                default: weight = lora.defaultWeight;
            }
            acc[lora.url] = parseFloat(weight.toFixed(2));
            return acc;
        }, {});
        setSelectedLoras(randomLoras);
    };

    return (
        <div className="lora-overlay" onClick={onClose}>
            <div className="lora-popup" onClick={e => e.stopPropagation()}>
                <div className="lora-popup-header">
                    <h3>Lora Settings</h3>
                    <button type="button" className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="section-header" onClick={() => setFluxExpanded(!fluxExpanded)}>
                    <h3>Flux Loras {fluxExpanded ? '▼' : '▶'}</h3>
                </div>
                {fluxExpanded && (
                    <div className="lora-section lora-grid">
                        <button type="button" onClick={handleRemoveAll} className="lora-action-btn">Remove All</button>
                        <button type="button" onClick={handleRandom} className="lora-action-btn">Random</button>
                        {fluxLoras.map(lora => (
                            <div key={lora.id} className="lora-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!selectedLoras[lora.url]}
                                        onChange={() => toggleLora(lora.id)}
                                    />
                                    {lora.name}
                                </label>
                                {selectedLoras[lora.url] !== undefined && (
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={selectedLoras[lora.url]}
                                        onChange={(e) => updateWeight(lora.id, e.target.value)}
                                    />
                                )}
                                {selectedLoras[lora.url] !== undefined && (
                                    <span>{selectedLoras[lora.url].toFixed(2)}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoraSelector;