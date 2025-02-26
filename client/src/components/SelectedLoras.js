import React, { useState, useRef, useEffect } from 'react';
import './SelectedLoras.css';

const SelectedLoras = ({ selectedLoras, setSelectedLoras, artisticLoras, realisticLoras }) => {
    const [editingLora, setEditingLora] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef(null);
    const weightEditorRef = useRef(null);

    // Add click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (editingLora && 
                weightEditorRef.current && 
                !weightEditorRef.current.contains(event.target)) {
                setEditingLora(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingLora]);

    // Find lora name from the arrays using URL
    const getLoraName = (url) => {
        const allLoras = [...artisticLoras, ...realisticLoras];
        const lora = allLoras.find(l => l.url === url);
        return lora ? lora.name : url;
    };

    const handleRemoveLora = (url) => {
        const newLoras = { ...selectedLoras };
        delete newLoras[url];
        setSelectedLoras(newLoras);
    };

    const handleSliderChange = (url, value) => {
        setSelectedLoras(prev => ({
            ...prev,
            [url]: parseFloat(value)
        }));
    };

    const handleMouseDown = (e, url) => {
        e.preventDefault();
        setIsDragging(true);
        const slider = e.currentTarget;
        const startRect = slider.getBoundingClientRect();
        
        const updateValue = (clientX) => {
            const x = Math.max(0, Math.min(clientX - startRect.left, startRect.width));
            const percentage = x / startRect.width;
            const value = (0.05 + percentage * 0.95).toFixed(2);
            handleSliderChange(url, value);
        };
        
        updateValue(e.clientX);

        const handleMouseMove = (moveEvent) => {
            if (isDragging) {
                const x = Math.max(0, Math.min(moveEvent.clientX - startRect.left, startRect.width));
                const percentage = x / startRect.width;
                const value = (0.05 + percentage * 0.95).toFixed(2);
                handleSliderChange(url, value);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Add click handler for the check button
    const handleDoneClick = (e) => {
        e.stopPropagation(); // Prevent click from bubbling
        setEditingLora(null);
    };

    const handleWeightChange = (e) => {
        const newWeight = parseFloat(e.target.value);
        setSelectedLoras(prev => ({
            ...prev,
            [editingLora]: newWeight
        }));
    };

    return (
        <div className="selected-loras">
            {Object.entries(selectedLoras).map(([url, weight]) => (
                <div key={url} className="lora-pill" data-url={url}>
                    {editingLora === url ? (
                        <div 
                            ref={weightEditorRef}
                            className="weight-editor" 
                            onClick={e => e.stopPropagation()}
                        >
                            <input
                                type="range"
                                min="0.05"
                                max="1"
                                step="0.05"
                                value={weight}
                                onChange={handleWeightChange}
                            />
                            <span>{weight.toFixed(2)}</span>
                            <button onClick={() => setEditingLora(null)}>✓</button>
                        </div>
                    ) : (
                        <>
                            <span onClick={() => setEditingLora(url)} className="lora-name">
                                {getLoraName(url)} ({weight.toFixed(2)})
                            </span>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveLora(url);
                                }}
                                className="remove-lora"
                            >
                                ×
                            </button>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SelectedLoras;