import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Sliders, Play, Pause, RotateCcw } from 'lucide-react';

export default function GreenScreenRemover() {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [threshold, setThreshold] = useState(100);
  const [smoothness, setSmoothness] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const animationRef = useRef(null);

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

      // Détection du vert : le vert doit être dominant
      const greenDominance = green - Math.max(red, blue);
      
      if (greenDominance > thresholdValue) {
        // Calcul de l'alpha basé sur l'intensité du vert
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
    const file = event.target.files[0];
    if (!file) return;

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
    link.download = `sans-fond-vert-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const reset = () => {
    setMediaFile(null);
    setMediaType(null);
    setThreshold(100);
    setSmoothness(10);
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Suppresseur de Fond Vert
          </h1>
          <p className="text-gray-600">
            Chargez une image ou vidéo avec fond vert et supprimez-le automatiquement
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors bg-gray-50 hover:bg-gray-100">
              <div className="text-center">
                <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                <span className="text-gray-600">
                  Cliquez pour charger une image ou vidéo
                </span>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG, MP4, WEBM</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {mediaFile && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Original</h3>
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100 relative" style={{minHeight: '300px'}}>
                    {mediaType === 'image' && (
                      <img
                        ref={imageRef}
                        src={mediaFile}
                        alt="Original"
                        onLoad={handleImageLoad}
                        className="w-full h-auto"
                      />
                    )}
                    {mediaType === 'video' && (
                      <video
                        ref={videoRef}
                        src={mediaFile}
                        onLoadedMetadata={handleVideoLoad}
                        className="w-full h-auto"
                        muted
                        loop
                      />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Sans Fond Vert</h3>
                  <div className="border-2 border-green-500 rounded-lg overflow-hidden relative" style={{
                    minHeight: '300px',
                    backgroundImage: 'repeating-conic-gradient(#ddd 0% 25%, white 0% 50%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px'
                  }}>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Sliders size={16} />
                      Seuil de détection: {threshold}
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Augmentez pour détecter plus de nuances de vert
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Sliders size={16} />
                      Lissage des bords: {smoothness}
                    </label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={smoothness}
                    onChange={(e) => setSmoothness(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ajustez pour des bords plus doux
                  </p>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                {mediaType === 'video' && (
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    {isPlaying ? 'Pause' : 'Lire'}
                  </button>
                )}
                
                <button
                  onClick={downloadResult}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  <Download size={20} />
                  Télécharger
                </button>

                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  <RotateCcw size={20} />
                  Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Comment utiliser :</h2>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Chargez une image ou vidéo avec un fond vert</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Ajustez le seuil de détection pour capturer toutes les nuances de vert</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Réglez le lissage des bords pour un résultat plus naturel</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>Téléchargez votre image sans fond (PNG avec transparence)</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}