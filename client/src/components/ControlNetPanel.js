import React, { useState } from 'react';
import { runwareService } from '../services/runwareService';

const ControlNetPanel = ({ onControlNetChange }) => {
    const [guideImage, setGuideImage] = useState(null);
    const [preprocessType, setPreprocessType] = useState('canny');
    const [weight, setWeight] = useState(1);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await runwareService.controlNetPreProcess({
                image: file,
                type: preprocessType
            });

            setGuideImage(result.guideImageUrl);
            onControlNetChange({
                guideImage: result.guideImageUUID,
                weight,
                type: preprocessType
            });
        } catch (error) {
            console.error('ControlNet preprocessing failed:', error);
        }
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg mb-4">ControlNet Settings</h3>
            <div className="mb-4">
                <select
                    value={preprocessType}
                    onChange={(e) => setPreprocessType(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded"
                >
                    <option value="canny">Canny Edge</option>
                    <option value="pose">Pose</option>
                    <option value="depth">Depth</option>
                </select>
            </div>
            <div className="mb-4">
                <input
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="w-full p-2 bg-gray-700 rounded"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-2">Control Strength</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => {
                        const newWeight = parseFloat(e.target.value);
                        setWeight(newWeight);
                        if (guideImage) {
                            onControlNetChange({
                                guideImage,
                                weight: newWeight,
                                type: preprocessType
                            });
                        }
                    }}
                    className="w-full"
                />
            </div>
            {guideImage && (
                <img
                    src={guideImage}
                    alt="Guide"
                    className="w-full rounded"
                />
            )}
        </div>
    );
};

export default ControlNetPanel;