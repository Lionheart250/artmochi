import React, { useState } from 'react';
import './LoraSelector.css';

const artisticLoras = [
    {
        id: 'gothic-lines',
        name: '🗡️ Shadow Weaver',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1202162?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-lines',
        name: '✨ Kawaii Master',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1296986?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'dark-energetic-anime',
        name: '⚡ Dark Pulse',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/988430?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'vibrant-energetic-anime',
        name: '🌈 Color Blast',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/989004?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'vintage-pulp',
        name: '📚 Retro Master',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1304212?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-detailed-eyes',
        name: '👁️ Soul Gaze',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/726524?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'luminous-shadows-cape',
        name: '🌙 Luminous Shadows',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/791149?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'faetastic-details',
        name: '🧚 Fae Magic',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/720252?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'storybook-artstyle',
        name: '📖 Page Master',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/723968?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'castlevania-art-style',
        name: '🦇 Gothic Symphony',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/731291?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'retro-anime',
        name: '📺 Nostalgia Wave',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/806265?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'arcane-intro-style',
        name: '⚔️ Arcane Forge',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1089413?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'midjourney-style',
        name: '🎨 Dream Vision',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1249246?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'animelike-digital-painting',
        name: '🖌️ Digital paint',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/778925?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'gothicniji',
        name: '🖤 Gothic Oil Paint',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1189748?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'midjourneyanime',
        name: '✨ Dream Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/837239?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'digital-abyss',
        name: '🌌 Void Explorer',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/945122?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'cyber-graphic',
        name: '🤖 Cyber Matrix',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/843447?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'elden-ring-style',
        name: '⚔️ Dark Souls',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/746484?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'frazetta-style',
        name: '🗡️ Fantasy Legend',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/792756?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'colored-pencil',
        name: '✏️ Master Sketch',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1086297?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    }
];

const realisticLoras = [
    {
        id: 'dramatic-lighting',
        name: '💫 Light Sorcerer',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1278791?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'image-upgrader',
        name: '🔮 Reality Enhancer',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/984672?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'neon-lighting',
        name: '🌟 Neon Dreams',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1091576?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'turbo-detailer',
        name: '🔍 Detail Master',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1041442?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'analog-grainy',
        name: '📷 Retro Time Capsule',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1276001?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'portrait-style',
        name: '👤 Portrait Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/728041?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'realistic-skin',
        name: '✨ Skin Perfectionist',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1081450?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'realistic-horror',
        name: '👻 Nightmare Forge',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/875302?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'ultra-realistic',
        name: '🎭 Hyper Reality',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1026423?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'dark-fantasy',
        name: '🏰 Dark Fantasy',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/759880?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'fantasy-wizards-witches',
        name: '🧙‍♂️ Spellcraft Supreme',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/880134?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    }
];

const LoraSelector = ({ selectedLoras, setSelectedLoras, isOpen, onClose }) => {
    const [artisticExpanded, setArtisticExpanded] = useState(true);
    const [realisticExpanded, setRealisticExpanded] = useState(true);
    
    if (!isOpen) return null;

    const toggleLora = (loraId, loraArray) => {
        setSelectedLoras(prev => {
            const lora = loraArray.find(l => l.id === loraId);
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

    const updateWeight = (loraId, weight, loraArray) => {
        const lora = loraArray.find(l => l.id === loraId);
        setSelectedLoras(prev => ({
            ...prev,
            [lora.url]: parseFloat(weight)
        }));
    };

    const handleRemoveAll = () => {
        setSelectedLoras({});
    };

    const handleRandom = () => {
        const allLoras = [...artisticLoras, ...realisticLoras];
        const shuffled = [...allLoras].sort(() => 0.5 - Math.random());
        const randomLoras = shuffled.slice(0, 4).reduce((acc, lora, index) => {
            let weight;
            switch (index) {
                case 0: weight = (Math.random() * 0.5) + 0.5; break;
                case 1: weight = (Math.random() * 0.5) + 0.4; break;
                case 2: weight = (Math.random() * 0.4) + 0.3; break;
                case 3: weight = (Math.random() * 0.3) + 0.3; break;
                default: weight = lora.defaultWeight;
            }
            acc[lora.url] = parseFloat(weight.toFixed(2));
            return acc;
        }, {});
        setSelectedLoras(randomLoras);
    };

    const renderLoraSection = (loras, expanded, setExpanded, title, emoji) => (
        <>
            <div className="section-header" onClick={() => setExpanded(!expanded)}>
                <h3>{emoji} {title} {expanded ? '▼' : '▶'}</h3>
            </div>
            {expanded && (
                <div className="lora-section lora-grid">
                    {loras.map(lora => (
                        <div key={lora.id} className="lora-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!selectedLoras[lora.url]}
                                    onChange={() => toggleLora(lora.id, loras)}
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
                                    onChange={(e) => updateWeight(lora.id, e.target.value, loras)}
                                />
                            )}
                            {selectedLoras[lora.url] !== undefined && (
                                <span>{selectedLoras[lora.url].toFixed(2)}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    return (
        <div className="lora-overlay" onClick={onClose}>
            <div className="lora-popup" onClick={e => e.stopPropagation()}>
                <div className="lora-popup-header">
                    <h3>✨ Style Presets ✨</h3>
                    <div className="lora-actions">
                        <button type="button" onClick={handleRandom} className="lora-action-btn primary">
                            🎲 Random Mix
                        </button>
                        <button type="button" onClick={handleRemoveAll} className="lora-action-btn">
                            Clear All
                        </button>
                        <button type="button" className="close-button" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="lora-content">
                    <div className="lora-column">
                        {renderLoraSection(artisticLoras, artisticExpanded, setArtisticExpanded, "Artistic & Anime", "🎨")}
                    </div>
                    <div className="lora-column">
                        {renderLoraSection(realisticLoras, realisticExpanded, setRealisticExpanded, "Realistic & Photo", "📷")}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoraSelector;