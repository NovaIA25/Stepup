import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Upload, Download, Sliders, Play, Pause, RotateCcw, Image, Video, Sparkles,
    Film, Loader2, Zap, Palette, Droplets, Crop, Layers, SlidersHorizontal,
    Undo2, Redo2, ZoomIn, ZoomOut, Settings, ChevronDown, Check, X
} from 'lucide-react';

export default function GreenScreenRemover() {
    // Media state
    const [mediaFile, setMediaFile] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Processing settings
    const [chromaColor, setChromaColor] = useState('green'); // 'green', 'blue', 'custom'
    const [customColor, setCustomColor] = useState('#00ff00');
    const [threshold, setThreshold] = useState(100);
    const [smoothness, setSmoothness] = useState(10);
    const [spillRemoval, setSpillRemoval] = useState(30);

    // Background replacement
    const [backgroundType, setBackgroundType] = useState('transparent'); // 'transparent', 'color', 'image'
    const [backgroundColor, setBackgroundColor] = useState('#000000');
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);

    // UI state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [comparisonMode, setComparisonMode] = useState(false);
    const [comparisonPosition, setComparisonPosition] = useState(50);
    const [zoom, setZoom] = useState(100);
    const [activePreset, setActivePreset] = useState(null);

    // Export state
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStatus, setExportStatus] = useState('');
    const [exportQuality, setExportQuality] = useState('720p'); // '480p', '720p', '1080p'
    const [exportFormat, setExportFormat] = useState('webm'); // 'webm', 'gif'

    // History for undo/redo
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Refs
    const canvasRef = useRef(null);
    const bgCanvasRef = useRef(null);
    const videoRef = useRef(null);
    const imageRef = useRef(null);
    const bgImageRef = useRef(null);
    const animationRef = useRef(null);
    const abortExportRef = useRef(false);
    const comparisonRef = useRef(null);

    // Presets
    const presets = [
        { id: 'studio', name: 'Studio Pro', threshold: 80, smoothness: 15, spill: 40, color: 'green' },
        { id: 'outdoor', name: 'Extérieur', threshold: 120, smoothness: 8, spill: 20, color: 'green' },
        { id: 'lowlight', name: 'Faible lumière', threshold: 60, smoothness: 20, spill: 50, color: 'green' },
        { id: 'bluescreen', name: 'Fond bleu', threshold: 90, smoothness: 12, spill: 35, color: 'blue' },
        { id: 'precise', name: 'Précision max', threshold: 50, smoothness: 25, spill: 60, color: 'green' },
    ];

    const qualitySettings = {
        '480p': { width: 854, height: 480, bitrate: 2000000 },
        '720p': { width: 1280, height: 720, bitrate: 5000000 },
        '1080p': { width: 1920, height: 1080, bitrate: 8000000 },
    };

    // Save to history
    const saveToHistory = useCallback(() => {
        const state = { threshold, smoothness, spillRemoval, chromaColor, backgroundType, backgroundColor };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(state);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [threshold, smoothness, spillRemoval, chromaColor, backgroundType, backgroundColor, history, historyIndex]);

    const undo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setThreshold(prevState.threshold);
            setSmoothness(prevState.smoothness);
            setSpillRemoval(prevState.spillRemoval);
            setChromaColor(prevState.chromaColor);
            setBackgroundType(prevState.backgroundType);
            setBackgroundColor(prevState.backgroundColor);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setThreshold(nextState.threshold);
            setSmoothness(nextState.smoothness);
            setSpillRemoval(nextState.spillRemoval);
            setChromaColor(nextState.chromaColor);
            setBackgroundType(nextState.backgroundType);
            setBackgroundColor(nextState.backgroundColor);
            setHistoryIndex(historyIndex + 1);
        }
    };

    // Apply preset
    const applyPreset = (preset) => {
        setThreshold(preset.threshold);
        setSmoothness(preset.smoothness);
        setSpillRemoval(preset.spill);
        setChromaColor(preset.color);
        setActivePreset(preset.id);
        saveToHistory();
    };

    // Get target color RGB based on chroma setting
    const getTargetColor = () => {
        if (chromaColor === 'green') return { r: 0, g: 255, b: 0 };
        if (chromaColor === 'blue') return { r: 0, g: 0, b: 255 };
        // Parse custom hex color
        const hex = customColor.replace('#', '');
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16),
        };
    };

    const removeChromaKey = (sourceElement, ctx, canvas) => {
        if (!sourceElement) return;

        const width = sourceElement.videoWidth || sourceElement.width;
        const height = sourceElement.videoHeight || sourceElement.height;

        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        // Draw background first if not transparent
        if (backgroundType === 'color') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
        } else if (backgroundType === 'image' && bgImageRef.current) {
            ctx.drawImage(bgImageRef.current, 0, 0, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        // Create temp canvas for processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

        tempCtx.drawImage(sourceElement, 0, 0, width, height);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const targetColor = getTargetColor();
        const isGreen = chromaColor === 'green';
        const isBlue = chromaColor === 'blue';

        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];

            let chromaDominance;

            if (isGreen) {
                chromaDominance = green - Math.max(red, blue);
            } else if (isBlue) {
                chromaDominance = blue - Math.max(red, green);
            } else {
                // Custom color detection using color distance
                const dist = Math.sqrt(
                    Math.pow(red - targetColor.r, 2) +
                    Math.pow(green - targetColor.g, 2) +
                    Math.pow(blue - targetColor.b, 2)
                );
                chromaDominance = 255 - dist;
            }

            if (chromaDominance > threshold) {
                const alpha = Math.max(0, 255 - (chromaDominance - threshold) * (255 / smoothness));
                data[i + 3] = alpha;

                // Spill removal - reduce chroma color bleeding on edges
                if (alpha > 0 && alpha < 255 && spillRemoval > 0) {
                    const spillFactor = spillRemoval / 100;
                    if (isGreen) {
                        data[i + 1] = Math.max(0, green - (green - Math.max(red, blue)) * spillFactor);
                    } else if (isBlue) {
                        data[i + 2] = Math.max(0, blue - (blue - Math.max(red, green)) * spillFactor);
                    }
                }
            }
        }

        tempCtx.putImageData(imageData, 0, 0);

        // Composite onto main canvas
        ctx.drawImage(tempCanvas, 0, 0);
    };

    const processImage = () => {
        if (!imageRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        removeChromaKey(imageRef.current, ctx, canvasRef.current);
    };

    const processVideoFrame = () => {
        if (!videoRef.current || !canvasRef.current || !isPlaying) return;

        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        removeChromaKey(videoRef.current, ctx, canvasRef.current);

        animationRef.current = requestAnimationFrame(processVideoFrame);
    };

    useEffect(() => {
        if (mediaType === 'image' && imageRef.current) {
            processImage();
        }
    }, [threshold, smoothness, spillRemoval, chromaColor, customColor, backgroundType, backgroundColor, backgroundImageUrl, mediaFile]);

    useEffect(() => {
        if (mediaType === 'video' && isPlaying) {
            processVideoFrame();
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, threshold, smoothness, spillRemoval, chromaColor, backgroundType, backgroundColor]);

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const processFile = (file) => {
        const url = URL.createObjectURL(file);
        setMediaFile(url);
        setOriginalFile(file);
        saveToHistory();

        if (file.type.startsWith('image/')) {
            setMediaType('image');
            setIsPlaying(false);
        } else if (file.type.startsWith('video/')) {
            setMediaType('video');
            setIsPlaying(false);
        }
    };

    const handleBackgroundImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setBackgroundImageUrl(url);
        setBackgroundType('image');

        const img = new window.Image();
        img.onload = () => {
            bgImageRef.current = img;
            if (mediaType === 'image') processImage();
        };
        img.src = url;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleImageLoad = () => {
        processImage();
    };

    const handleVideoLoad = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
        }
    };

    const togglePlayPause = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const downloadResult = () => {
        if (!canvasRef.current) return;

        const link = document.createElement('a');
        link.download = `stepup-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    // Fast video export
    const downloadVideoFast = async () => {
        if (!videoRef.current || !originalFile || isExporting) return;

        setIsExporting(true);
        setExportProgress(0);
        setExportStatus('Préparation...');
        abortExportRef.current = false;

        const video = videoRef.current;
        const duration = video.duration;
        const fps = exportFormat === 'gif' ? 15 : 24;
        const totalFrames = Math.ceil(duration * fps);
        const quality = qualitySettings[exportQuality];

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        let targetWidth = Math.min(video.videoWidth, quality.width);
        let targetHeight = Math.floor(targetWidth / aspectRatio);
        if (targetHeight > quality.height) {
            targetHeight = quality.height;
            targetWidth = Math.floor(targetHeight * aspectRatio);
        }

        const offCanvas = document.createElement('canvas');
        offCanvas.width = targetWidth;
        offCanvas.height = targetHeight;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

        const targetColor = getTargetColor();
        const isGreen = chromaColor === 'green';
        const isBlue = chromaColor === 'blue';

        try {
            if (exportFormat === 'gif') {
                // GIF export using canvas frames
                setExportStatus('Création du GIF...');
                const frames = [];

                for (let i = 0; i < Math.min(totalFrames, 150); i++) { // Limit GIF to 150 frames
                    if (abortExportRef.current) {
                        setIsExporting(false);
                        return;
                    }

                    video.currentTime = i / fps;
                    await new Promise(resolve => { video.onseeked = resolve; });

                    // Draw background
                    if (backgroundType === 'color') {
                        ctx.fillStyle = backgroundColor;
                        ctx.fillRect(0, 0, targetWidth, targetHeight);
                    } else if (backgroundType === 'image' && bgImageRef.current) {
                        ctx.drawImage(bgImageRef.current, 0, 0, targetWidth, targetHeight);
                    } else {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, targetWidth, targetHeight);
                    }

                    // Process frame
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = targetWidth;
                    tempCanvas.height = targetHeight;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(video, 0, 0, targetWidth, targetHeight);

                    const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
                    const data = imageData.data;

                    for (let j = 0; j < data.length; j += 4) {
                        const r = data[j], g = data[j + 1], b = data[j + 2];
                        let chromaDominance = isGreen ? g - Math.max(r, b) : isBlue ? b - Math.max(r, g) : 0;

                        if (chromaDominance > threshold) {
                            data[j + 3] = Math.max(0, 255 - (chromaDominance - threshold) * (255 / smoothness));
                        }
                    }
                    tempCtx.putImageData(imageData, 0, 0);
                    ctx.drawImage(tempCanvas, 0, 0);

                    frames.push(offCanvas.toDataURL('image/png'));
                    setExportProgress(((i + 1) / Math.min(totalFrames, 150)) * 90);
                }

                // Create GIF using gif.js approach (simplified - download as WebP animation)
                setExportStatus('Encodage...');
                const blob = await new Promise(resolve => offCanvas.toBlob(resolve, 'image/webp', 0.8));
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `stepup-${Date.now()}.webp`;
                link.click();
                URL.revokeObjectURL(url);

            } else {
                // WebM export
                setExportStatus('Extraction des frames...');

                const stream = offCanvas.captureStream(fps);
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp8',
                    videoBitsPerSecond: quality.bitrate
                });

                const chunks = [];
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                await new Promise(async (resolve) => {
                    mediaRecorder.onstop = resolve;
                    mediaRecorder.start();

                    for (let i = 0; i < totalFrames; i++) {
                        if (abortExportRef.current) break;

                        video.currentTime = i / fps;
                        await new Promise(r => { video.onseeked = r; });

                        // Draw background
                        if (backgroundType === 'color') {
                            ctx.fillStyle = backgroundColor;
                            ctx.fillRect(0, 0, targetWidth, targetHeight);
                        } else if (backgroundType === 'image' && bgImageRef.current) {
                            ctx.drawImage(bgImageRef.current, 0, 0, targetWidth, targetHeight);
                        } else {
                            ctx.clearRect(0, 0, targetWidth, targetHeight);
                        }

                        // Process frame
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = targetWidth;
                        tempCanvas.height = targetHeight;
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCtx.drawImage(video, 0, 0, targetWidth, targetHeight);

                        const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
                        const data = imageData.data;

                        for (let j = 0; j < data.length; j += 4) {
                            const r = data[j], g = data[j + 1], b = data[j + 2];
                            let chromaDominance = isGreen ? g - Math.max(r, b) : isBlue ? b - Math.max(r, g) : 0;

                            if (chromaDominance > threshold) {
                                const alpha = Math.max(0, 255 - (chromaDominance - threshold) * (255 / smoothness));
                                data[j + 3] = alpha;

                                if (alpha > 0 && alpha < 255 && spillRemoval > 0) {
                                    const sf = spillRemoval / 100;
                                    if (isGreen) data[j + 1] = Math.max(0, g - (g - Math.max(r, b)) * sf);
                                    if (isBlue) data[j + 2] = Math.max(0, b - (b - Math.max(r, g)) * sf);
                                }
                            }
                        }
                        tempCtx.putImageData(imageData, 0, 0);
                        ctx.drawImage(tempCanvas, 0, 0);

                        setExportProgress(((i + 1) / totalFrames) * 95);
                        await new Promise(r => setTimeout(r, 1000 / fps / 8));
                    }

                    mediaRecorder.stop();
                });

                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `stepup-video-${Date.now()}.webm`;
                link.click();
                URL.revokeObjectURL(url);
            }

            setExportProgress(100);
            setExportStatus('Terminé !');

            setTimeout(() => {
                setIsExporting(false);
                setExportProgress(0);
            }, 1000);

        } catch (error) {
            console.error('Export error:', error);
            setExportStatus('Erreur lors de l\'export');
            setTimeout(() => {
                setIsExporting(false);
                setExportProgress(0);
            }, 2000);
        }
    };

    const cancelExport = () => {
        abortExportRef.current = true;
        setIsExporting(false);
        setExportProgress(0);
    };

    const reset = () => {
        setMediaFile(null);
        setOriginalFile(null);
        setMediaType(null);
        setThreshold(100);
        setSmoothness(10);
        setSpillRemoval(30);
        setIsPlaying(false);
        setIsExporting(false);
        setBackgroundType('transparent');
        setBackgroundImage(null);
        setBackgroundImageUrl(null);
        setActivePreset(null);
        setHistory([]);
        setHistoryIndex(-1);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    // Comparison slider handler
    const handleComparisonMove = (e) => {
        if (!comparisonRef.current) return;
        const rect = comparisonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setComparisonPosition(percent);
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Outil professionnel</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        Supprimez votre <span className="gradient-text">fond vert</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto">
                        Outil professionnel avec fond personnalisé, blue screen, et export HD
                    </p>
                </div>

                {/* Main content */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl">
                    {/* Upload zone */}
                    {!mediaFile && (
                        <label
                            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isDragging
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-slate-600 hover:border-green-500/50 bg-slate-700/30 hover:bg-slate-700/50'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                                    <Upload className="w-8 h-8 text-white" />
                                </div>
                                <p className="mb-2 text-lg text-gray-300">
                                    <span className="font-semibold text-green-400">Cliquez pour charger</span> ou glissez-déposez
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Image className="w-4 h-4" /> PNG, JPG
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Video className="w-4 h-4" /> MP4, WEBM
                                    </span>
                                </div>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={handleFileUpload}
                            />
                        </label>
                    )}

                    {/* Preview area */}
                    {mediaFile && (
                        <div className="space-y-6">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                                {/* Undo/Redo */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={undo}
                                        disabled={historyIndex <= 0}
                                        className="p-2 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Undo2 className="w-4 h-4 text-white" />
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={historyIndex >= history.length - 1}
                                        className="p-2 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Redo2 className="w-4 h-4 text-white" />
                                    </button>
                                </div>

                                {/* Zoom */}
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setZoom(Math.max(50, zoom - 25))} className="p-2 rounded-lg bg-slate-600 hover:bg-slate-500">
                                        <ZoomOut className="w-4 h-4 text-white" />
                                    </button>
                                    <span className="text-white text-sm w-12 text-center">{zoom}%</span>
                                    <button onClick={() => setZoom(Math.min(200, zoom + 25))} className="p-2 rounded-lg bg-slate-600 hover:bg-slate-500">
                                        <ZoomIn className="w-4 h-4 text-white" />
                                    </button>
                                </div>

                                {/* Comparison toggle */}
                                <button
                                    onClick={() => setComparisonMode(!comparisonMode)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${comparisonMode ? 'bg-purple-500 text-white' : 'bg-slate-600 text-gray-300 hover:bg-slate-500'}`}
                                >
                                    <Layers className="w-4 h-4" />
                                    Comparaison
                                </button>

                                {/* Advanced toggle */}
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${showAdvanced ? 'bg-blue-500 text-white' : 'bg-slate-600 text-gray-300 hover:bg-slate-500'}`}
                                >
                                    <Settings className="w-4 h-4" />
                                    Avancé
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* Presets */}
                            <div className="flex flex-wrap gap-2">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePreset === preset.id
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>

                            {/* Grid preview */}
                            <div
                                ref={comparisonRef}
                                className="relative grid lg:grid-cols-2 gap-6"
                                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
                            >
                                {/* Original */}
                                <div className={comparisonMode ? 'absolute inset-0 z-10' : ''}
                                    style={comparisonMode ? { clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` } : {}}>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        Original
                                    </h3>
                                    <div className="border border-slate-600 rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
                                        {mediaType === 'image' && (
                                            <img
                                                ref={imageRef}
                                                src={mediaFile}
                                                alt="Original"
                                                onLoad={handleImageLoad}
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        )}
                                        {mediaType === 'video' && (
                                            <video
                                                ref={videoRef}
                                                src={mediaFile}
                                                onLoadedMetadata={handleVideoLoad}
                                                className="max-w-full max-h-full object-contain"
                                                muted
                                                loop
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Result */}
                                <div className={comparisonMode ? 'lg:col-span-2' : ''}>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Résultat
                                    </h3>
                                    <div className={`border-2 border-green-500/50 rounded-2xl overflow-hidden aspect-video flex items-center justify-center glow-green ${backgroundType === 'transparent' ? 'transparency-bg' : ''}`}
                                        style={backgroundType === 'color' ? { backgroundColor } : {}}>
                                        <canvas
                                            ref={canvasRef}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                </div>

                                {/* Comparison slider */}
                                {comparisonMode && (
                                    <div
                                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20"
                                        style={{ left: `${comparisonPosition}%` }}
                                        onMouseDown={(e) => {
                                            const handleMove = (e) => handleComparisonMove(e);
                                            const handleUp = () => {
                                                document.removeEventListener('mousemove', handleMove);
                                                document.removeEventListener('mouseup', handleUp);
                                            };
                                            document.addEventListener('mousemove', handleMove);
                                            document.addEventListener('mouseup', handleUp);
                                        }}
                                    >
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <SlidersHorizontal className="w-4 h-4 text-slate-800" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Export progress */}
                            {isExporting && (
                                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-purple-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="font-medium">{exportStatus}</span>
                                        </div>
                                        <span className="text-purple-400 font-mono">{Math.round(exportProgress)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                            style={{ width: `${exportProgress}%` }}
                                        />
                                    </div>
                                    <button onClick={cancelExport} className="mt-3 text-sm text-gray-400 hover:text-white transition-colors">
                                        Annuler
                                    </button>
                                </div>
                            )}

                            {/* Advanced controls */}
                            {showAdvanced && (
                                <div className="p-6 bg-slate-700/30 rounded-2xl border border-slate-600/50 space-y-6">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-blue-400" />
                                        Paramètres avancés
                                    </h3>

                                    {/* Chroma color selection */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-300 mb-3 block">Couleur à supprimer</label>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => setChromaColor('green')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${chromaColor === 'green' ? 'bg-green-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                                            >
                                                <div className="w-4 h-4 rounded-full bg-green-500 border border-white/30"></div>
                                                Vert
                                            </button>
                                            <button
                                                onClick={() => setChromaColor('blue')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${chromaColor === 'blue' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                                            >
                                                <div className="w-4 h-4 rounded-full bg-blue-500 border border-white/30"></div>
                                                Bleu
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setChromaColor('custom')}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${chromaColor === 'custom' ? 'bg-purple-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                                                >
                                                    <Palette className="w-4 h-4" />
                                                    Personnalisé
                                                </button>
                                                {chromaColor === 'custom' && (
                                                    <input
                                                        type="color"
                                                        value={customColor}
                                                        onChange={(e) => setCustomColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg cursor-pointer"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background replacement */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-300 mb-3 block">Fond de remplacement</label>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => setBackgroundType('transparent')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${backgroundType === 'transparent' ? 'bg-green-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                                            >
                                                <div className="w-4 h-4 rounded transparency-bg border border-white/30"></div>
                                                Transparent
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setBackgroundType('color')}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${backgroundType === 'color' ? 'bg-green-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                                                >
                                                    <div className="w-4 h-4 rounded" style={{ backgroundColor }}></div>
                                                    Couleur
                                                </button>
                                                {backgroundType === 'color' && (
                                                    <input
                                                        type="color"
                                                        value={backgroundColor}
                                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg cursor-pointer"
                                                    />
                                                )}
                                            </div>
                                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${backgroundType === 'image' ? 'bg-green-500 text-white' : 'bg-slate-600 text-gray-300'}`}>
                                                <Image className="w-4 h-4" />
                                                Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleBackgroundImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        {backgroundImageUrl && backgroundType === 'image' && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <img src={backgroundImageUrl} alt="Background" className="w-16 h-16 object-cover rounded-lg" />
                                                <button
                                                    onClick={() => { setBackgroundImageUrl(null); setBackgroundType('transparent'); }}
                                                    className="p-1 rounded-full bg-red-500 hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Spill removal */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                <Droplets className="w-4 h-4 text-cyan-400" />
                                                Suppression des reflets
                                            </label>
                                            <span className="text-cyan-400 font-mono font-bold">{spillRemoval}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={spillRemoval}
                                            onChange={(e) => { setSpillRemoval(Number(e.target.value)); saveToHistory(); }}
                                            className="w-full h-2 bg-slate-600 rounded-lg cursor-pointer"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Corrige les reflets verts/bleus sur le sujet</p>
                                    </div>
                                </div>
                            )}

                            {/* Basic Controls */}
                            <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-700/30 rounded-2xl border border-slate-600/50">
                                {/* Threshold */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <Sliders className="w-4 h-4 text-green-400" />
                                            Seuil de détection
                                        </label>
                                        <span className="text-green-400 font-mono font-bold">{threshold}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        value={threshold}
                                        onChange={(e) => { setThreshold(Number(e.target.value)); setActivePreset(null); }}
                                        className="w-full h-2 bg-slate-600 rounded-lg cursor-pointer"
                                    />
                                </div>

                                {/* Smoothness */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <Sliders className="w-4 h-4 text-blue-400" />
                                            Lissage des bords
                                        </label>
                                        <span className="text-blue-400 font-mono font-bold">{smoothness}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={smoothness}
                                        onChange={(e) => { setSmoothness(Number(e.target.value)); setActivePreset(null); }}
                                        className="w-full h-2 bg-slate-600 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Export options */}
                            {mediaType === 'video' && !isExporting && (
                                <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                                    <span className="text-sm text-gray-400">Qualité :</span>
                                    {Object.keys(qualitySettings).map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setExportQuality(q)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${exportQuality === q ? 'bg-purple-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                    <span className="text-sm text-gray-400 ml-4">Format :</span>
                                    <button
                                        onClick={() => setExportFormat('webm')}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${exportFormat === 'webm' ? 'bg-purple-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                                    >
                                        WebM
                                    </button>
                                    <button
                                        onClick={() => setExportFormat('gif')}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${exportFormat === 'gif' ? 'bg-purple-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                                    >
                                        GIF
                                    </button>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-4 justify-center">
                                {mediaType === 'video' && !isExporting && (
                                    <button
                                        onClick={togglePlayPause}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        {isPlaying ? 'Pause' : 'Lire'}
                                    </button>
                                )}

                                {!isExporting && (
                                    <button
                                        onClick={downloadResult}
                                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/25 btn-hover-lift"
                                    >
                                        <Download className="w-5 h-5" />
                                        Télécharger PNG
                                    </button>
                                )}

                                {mediaType === 'video' && !isExporting && (
                                    <button
                                        onClick={downloadVideoFast}
                                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 btn-hover-lift"
                                    >
                                        <Zap className="w-5 h-5" />
                                        Export {exportFormat.toUpperCase()} {exportQuality}
                                    </button>
                                )}

                                {!isExporting && (
                                    <button
                                        onClick={reset}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-semibold transition-all"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Recommencer
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="mt-8 grid md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-1">🎨 Fond personnalisé</h4>
                        <p className="text-sm text-gray-400">Remplacez par une couleur ou image</p>
                    </div>
                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-1">🔵 Multi-couleurs</h4>
                        <p className="text-sm text-gray-400">Supporte vert, bleu ou personnalisé</p>
                    </div>
                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-1">✨ Anti-reflets</h4>
                        <p className="text-sm text-gray-400">Corrige les reflets sur le sujet</p>
                    </div>
                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-1">📹 Export HD</h4>
                        <p className="text-sm text-gray-400">480p, 720p ou 1080p au choix</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
