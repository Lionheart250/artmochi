import React, { useState, useEffect } from 'react';
import { runwareService } from '../services/runwareService';

const ModelSelector = ({ onModelSelect, currentModel }) => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [architecture, setArchitecture] = useState('flux1d');

    useEffect(() => {
        loadModels();
    }, [search, architecture]);

    const loadModels = async () => {
        try {
            setLoading(true);
            const results = await runwareService.searchModels({
                search,
                architecture,
                category: 'checkpoint'
            });
            setModels(results);
        } catch (error) {
            console.error('Failed to load models:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search models..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded"
                />
            </div>
            <div className="mb-4">
                <select
                    value={architecture}
                    onChange={(e) => setArchitecture(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded"
                >
                    <option value="flux1d">FLUX.1 Dev</option>
                    <option value="sdxl">SDXL</option>
                    <option value="sd1x">SD 1.5</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {models.map((model) => (
                    <div
                        key={model.air}
                        onClick={() => onModelSelect(model)}
                        className={`p-2 rounded cursor-pointer ${
                            currentModel?.air === model.air ? 'bg-purple-600' : 'bg-gray-700'
                        }`}
                    >
                        {model.heroImage && (
                            <img
                                src={model.heroImage}
                                alt={model.name}
                                className="w-full h-32 object-cover rounded mb-2"
                            />
                        )}
                        <div className="text-sm">{model.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModelSelector;