import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Sliders, Play, Pause, RotateCcw, Image, Video, Sparkles, Film, Loader2 } from 'lucide-react';

export default function GreenScreenRemover() {
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [threshold, setThreshold] = useState(100);
    const [smoothness, setSmoothness] = useState(10);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const imageRef = useRef(null);
    const animationRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const removeGreenScreen = (sourceElement, ctx, canvas) => {
        if (!sourceElement) return;

        canvas.width = sourceElement.videoWidth || sourceElement.width;
        canvas.height = sourceElement.videoHeight || sourceElement.height;

        ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const thresholdValue = threshold;
        const smoothnessValue = smoothness;

        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];

            const greenDominance = green - Math.max(red, blue);

            if (greenDominance > thresholdValue) {
                const alpha = Math.max(0, 255 - (greenDominance - thresholdValue) * (255 / smoothnessValue));
                data[i + 3] = alpha;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    };

    const processImage = () => {
        if (!imageRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        removeGreenScreen(imageRef.current, ctx, canvasRef.current);
    };

    const processVideoFrame = () => {
        if (!videoRef.current || !canvasRef.current || !isPlaying) return;

        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        removeGreenScreen(videoRef.current, ctx, canvasRef.current);

        animationRef.current = requestAnimationFrame(processVideoFrame);
    };

    useEffect(() => {
        if (mediaType === 'image' && imageRef.current) {
            processImage();
        }
    }, [threshold, smoothness, mediaFile]);

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
    }, [isPlaying, threshold, smoothness]);

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const processFile = (file) => {
        const url = URL.createObjectURL(file);
        setMediaFile(url);

        if (file.type.startsWith('image/')) {
            setMediaType('image');
            setIsPlaying(false);
        } else if (file.type.startsWith('video/')) {
            setMediaType('video');
            setIsPlaying(false);
        }
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

    const downloadVideo = async () => {
        if (!videoRef.current || !canvasRef.current || isRecording) return;

        setIsRecording(true);
        setRecordingProgress(0);
        recordedChunksRef.current = [];

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Configure canvas stream
        const stream = canvas.captureStream(30);

        // Try WebM with VP9, fallback to VP8
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm;codecs=vp8';

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 5000000
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `stepup-video-${Date.now()}.webm`;
            link.click();
            URL.revokeObjectURL(url);
            setIsRecording(false);
            setRecordingProgress(0);
        };

        // Start recording
        mediaRecorder.start(100);

        // Reset video to beginning
        video.currentTime = 0;
        video.muted = true;

        // Process video frames
        const processFrame = () => {
            if (video.ended || video.paused) {
                mediaRecorder.stop();
                return;
            }

            removeGreenScreen(video, ctx, canvas);
            setRecordingProgress((video.currentTime / video.duration) * 100);
            requestAnimationFrame(processFrame);
        };

        video.onended = () => {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        };

        await video.play();
        processFrame();
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (videoRef.current) {
            videoRef.current.pause();
        }
        setIsRecording(false);
        setRecordingProgress(0);
    };

    const reset = () => {
        setMediaFile(null);
        setMediaType(null);
        setThreshold(100);
        setSmoothness(10);
        setIsPlaying(false);
        setIsRecording(false);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Outil de suppression</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        Supprimez votre <span className="gradient-text">fond vert</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto">
                        Chargez votre image ou vidéo et ajustez les paramètres pour un résultat parfait
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
                        <div className="space-y-8">
                            {/* Grid preview */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Original */}
                                <div>
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
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Sans fond vert
                                    </h3>
                                    <div className="border-2 border-green-500/50 rounded-2xl overflow-hidden transparency-bg aspect-video flex items-center justify-center glow-green">
                                        <canvas
                                            ref={canvasRef}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Recording progress */}
                            {isRecording && (
                                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-purple-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="font-medium">Export vidéo en cours...</span>
                                        </div>
                                        <span className="text-purple-400 font-mono">{Math.round(recordingProgress)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                            style={{ width: `${recordingProgress}%` }}
                                        />
                                    </div>
                                    <button
                                        onClick={cancelRecording}
                                        className="mt-3 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            )}

                            {/* Controls */}
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
                                        onChange={(e) => setThreshold(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-600 rounded-lg cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Augmentez pour capturer plus de nuances de vert
                                    </p>
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
                                        onChange={(e) => setSmoothness(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-600 rounded-lg cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Ajustez pour des transitions plus douces
                                    </p>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-4 justify-center">
                                {mediaType === 'video' && !isRecording && (
                                    <button
                                        onClick={togglePlayPause}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        {isPlaying ? 'Pause' : 'Lire'}
                                    </button>
                                )}

                                {!isRecording && (
                                    <button
                                        onClick={downloadResult}
                                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 btn-hover-lift"
                                    >
                                        <Download className="w-5 h-5" />
                                        Télécharger PNG
                                    </button>
                                )}

                                {mediaType === 'video' && !isRecording && (
                                    <button
                                        onClick={downloadVideo}
                                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 btn-hover-lift"
                                    >
                                        <Film className="w-5 h-5" />
                                        Télécharger Vidéo (WebM)
                                    </button>
                                )}

                                {!isRecording && (
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
                <div className="mt-8 grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-1">💡 Conseil</h4>
                        <p className="text-sm text-gray-400">Utilisez un fond vert uniforme pour de meilleurs résultats</p>
                    </div>
                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-1">🔒 Confidentialité</h4>
                        <p className="text-sm text-gray-400">Vos fichiers ne quittent jamais votre appareil</p>
                    </div>
                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-1">⚡ Performance</h4>
                        <p className="text-sm text-gray-400">Traitement en temps réel directement dans le navigateur</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
