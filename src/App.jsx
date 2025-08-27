import { useState, useRef, useCallback, useEffect } from 'react'
import FabricCanvas from './components/FabricCanvas'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Select } from './components/ui/select'
import { Upload, Type, Download, Trash2, Scissors, Loader2, Layers, ChevronUp, ChevronDown, X, Undo2, Redo2 } from 'lucide-react'
import { useBackgroundRemoval } from './hooks/useBackgroundRemoval'
import './App.css'

function App() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [textInput, setTextInput] = useState('Your Text Here');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(40);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState('bold');
  const [textX, setTextX] = useState(480); // X position for text (center of 960px)
  const [textY, setTextY] = useState(270); // Y position for text (center of 540px)
  const [clickToPlaceMode, setClickToPlaceMode] = useState(false); // Click-to-place text mode
  const [textOpacity, setTextOpacity] = useState(1); // Text opacity (0-1)
  const [autoScaleText, setAutoScaleText] = useState(true); // Auto-scale text based on subject size
  const [canvasHistory, setCanvasHistory] = useState([]); // Canvas state history for undo/redo
  const [historyIndex, setHistoryIndex] = useState(-1); // Current position in history
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null); // Currently selected layer
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState(1);
  const [showYouTubeFrame, setShowYouTubeFrame] = useState(true);
  
  const { removeImageBackground, isProcessing, error } = useBackgroundRemoval();

  const fontOptions = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Impact', 
    'Comic Sans MS', 'Trebuchet MS', 'Courier New', 'Verdana'
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setOriginalFile(file);
      setProcessedImage(null);
      
      if (canvasRef.current) {
        canvasRef.current.addImage(url);
        // Save initial state after image upload
        setTimeout(saveToHistory, 100);
      }
    }
  };

  const handleRemoveBackground = async () => {
    if (!originalFile) return;
    
    try {
      const processedUrl = await removeImageBackground(originalFile);
      setProcessedImage(processedUrl);
      
      // Replace the image on canvas with the processed version, preserving position
      if (canvasRef.current) {
        await canvasRef.current.replaceImageWithState(processedUrl, true);
        // Save state after background removal
        setTimeout(saveToHistory, 100);
      }
    } catch {
      // Failed to remove background
    }
  };

  const handleAddText = async () => {
    if (!canvasRef.current) return;

    // Calculate optimal text size if auto-scaling is enabled
    const optimalTextSize = processedImage && autoScaleText ? 
      canvasRef.current.calculateOptimalTextSize(textSize, autoScaleText) : textSize;

    // If we have a processed image (background removed), create text behind subject
    if (processedImage && uploadedImage) {
      await canvasRef.current.addTextBehindSubject(
        textInput,
        uploadedImage, // Original image as background
        processedImage, // Subject with transparent background
        {
          left: textX,
          top: textY,
          fill: textColor,
          fontSize: optimalTextSize,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          textAlign: 'center',
          opacity: textOpacity,
        }
      );
    } else {
      // Regular text addition without background removal
      canvasRef.current.addText(textInput, {
        left: textX,
        top: textY,
        fill: textColor,
        fontSize: textSize, // Use original size for regular text
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        fontFamily: fontFamily,
        fontWeight: fontWeight,
        textAlign: 'center',
        opacity: textOpacity,
      });
    }
    
    // Update layers and save to history after adding text
    setTimeout(() => {
      updateLayers();
      saveToHistory();
      // Ensure proper layer ordering and overlay sync is maintained
      if (canvasRef.current) {
        canvasRef.current.ensureTextBehindEffect();
        canvasRef.current.syncAllOverlays();
      }
    }, 100);
  };

  const handleExport = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.exportAsYouTubeImage(exportFormat, exportQuality);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `youtube-thumbnail-${timestamp}.${exportFormat}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportFull = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.exportAsImage(exportFormat, exportQuality);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `full-canvas-${timestamp}.${exportFormat}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const updateLayers = () => {
    if (canvasRef.current) {
      const layerInfo = canvasRef.current.getLayerInfo();
      setLayers(layerInfo);
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setUploadedImage(null);
    setOriginalFile(null);
    setProcessedImage(null);
    setLayers([]);
  };

  const handleMoveLayerUp = (object) => {
    if (canvasRef.current) {
      canvasRef.current.moveLayerUp(object);
      updateLayers();
    }
  };

  const handleMoveLayerDown = (object) => {
    if (canvasRef.current) {
      canvasRef.current.moveLayerDown(object);
      updateLayers();
    }
  };

  const handleRemoveLayer = (object) => {
    if (canvasRef.current) {
      canvasRef.current.removeObject(object);
      // Clear selection if removed object was selected
      if (selectedLayer === object) {
        setSelectedLayer(null);
      }
      updateLayers();
      setTimeout(saveToHistory, 100);
    }
  };

  const handleSelectLayer = (layer) => {
    if (canvasRef.current && layer.object) {
      // Simplified selection - no complex mode switching needed
      const success = canvasRef.current.selectLayer(layer.object);
      if (success) {
        setSelectedLayer(layer.object);
      }
    }
  };

  const handleClearSelection = () => {
    if (canvasRef.current) {
      canvasRef.current.clearSelection();
      setSelectedLayer(null);
    }
  };

  const handleCanvasClick = useCallback((x, y) => {
    if (clickToPlaceMode) {
      setTextX(Math.round(x));
      setTextY(Math.round(y));
      setClickToPlaceMode(false); // Exit click-to-place mode after placement
    }
  }, [clickToPlaceMode]);

  // Save current canvas state to history
  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    
    const currentState = canvasRef.current.saveCanvasState();
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // Limit history to last 20 actions to prevent memory issues
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setCanvasHistory(newHistory);
  }, [canvasHistory, historyIndex]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && canvasRef.current) {
      const newIndex = historyIndex - 1;
      const previousState = canvasHistory[newIndex];
      canvasRef.current.restoreCanvasState(previousState);
      setHistoryIndex(newIndex);
      setTimeout(updateLayers, 100);
    }
  }, [canvasHistory, historyIndex]);

  // Redo last undone action
  const handleRedo = useCallback(() => {
    if (historyIndex < canvasHistory.length - 1 && canvasRef.current) {
      const newIndex = historyIndex + 1;
      const nextState = canvasHistory[newIndex];
      canvasRef.current.restoreCanvasState(nextState);
      setHistoryIndex(newIndex);
      setTimeout(updateLayers, 100);
    }
  }, [canvasHistory, historyIndex]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          handleUndo();
        } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
          event.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Text Behind Image Creator</h1>
        
        {/* Canvas Section - Moved to top for better visibility */}
        <div className="mb-8">
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-center">Canvas</h2>
            <div className="flex justify-center">
              <FabricCanvas
                ref={canvasRef}
                width={960}
                height={540}
                onCanvasClick={handleCanvasClick}
                showYouTubeFrame={showYouTubeFrame}
              />
            </div>
            {!uploadedImage && (
              <p className="text-center text-muted-foreground mt-4">
                Upload an image to start creating your text-behind-image effect
              </p>
            )}
          </div>
        </div>

        {/* Layers Panel - Positioned directly under Canvas for easy access */}
        {layers.length > 0 && (
          <div className="mb-8">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Layers ({layers.length})
                </h2>
                {selectedLayer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearSelection}
                    className="text-xs"
                    title="Clear layer selection"
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Simplified Interaction Info */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Smart Layer Interaction</span>
                </div>
                <p className="text-xs text-green-700">
                  🎭 <strong>Background + Subject:</strong> Move together as one unit for easy positioning<br/>
                  📝 <strong>Text:</strong> Always independently selectable and movable behind subject
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Click layer names to select. Background+Subject move together, Text moves independently.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {layers.reverse().map((layer, index) => {
                  const isInteractive = layer.interactive || 
                                       (layer.layerRole === 'imageGroup' || layer.layerRole === 'text');
                  
                  return (
                  <div 
                    key={layer.index} 
                    className={`flex items-center justify-between p-2 rounded text-sm transition-colors ${
                      selectedLayer === layer.object 
                        ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                        : isInteractive 
                          ? 'bg-green-50 border border-green-200 hover:bg-green-100 cursor-pointer' 
                          : layer.locked 
                            ? 'bg-gray-100 border border-gray-300' 
                            : 'bg-gray-50 border border-gray-200 opacity-60'
                    } ${layer.layerRole === 'imageGroup' ? 'border-l-4 border-l-blue-500' : ''}
                      ${layer.layerRole === 'subjectOverlay' ? 'border-l-4 border-l-purple-500' : ''}
                      ${layer.layerRole === 'text' ? 'border-l-4 border-l-yellow-500' : ''}`}
                  >
                    <div 
                      className="flex-1 flex items-center gap-2 cursor-pointer select-none"
                      onClick={() => handleSelectLayer(layer)}
                      title={`Click to select ${layer.name}`}
                    >
                      {/* Enhanced layer type icons for new structure */}
                      {layer.layerRole === 'text' && (
                        <Type className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      )}
                      {layer.layerRole === 'imageGroup' && (
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      )}
                      {layer.layerRole === 'subjectOverlay' && (
                        <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      )}
                      {/* Legacy support for old layer types */}
                      {layer.layerRole === 'background' && (
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z"/>
                        </svg>
                      )}
                      {layer.layerRole === 'subject' && (
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      )}
                      
                      <span className={`truncate ${
                        selectedLayer === layer.object ? 'font-semibold text-blue-800' : ''
                      }`}>
                        {layer.name}
                      </span>
                      
                      {selectedLayer === layer.object && (
                        <span className="text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          SELECTED
                        </span>
                      )}
                      
                      {isInteractive && selectedLayer !== layer.object && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                          INTERACTIVE
                        </span>
                      )}
                      
                      {layer.layerRole === 'subjectOverlay' && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">
                          VISUAL EFFECT
                        </span>
                      )}
                      
                      {layer.locked && (
                        <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {layer.layerRole === 'imageGroup' && (
                        <span className="text-xs text-blue-600 font-medium">UNIFIED</span>
                      )}
                      {layer.layerRole === 'text' && (
                        <span className="text-xs text-yellow-600 font-medium">INDEPENDENT</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayerUp(layer.object);
                        }}
                        disabled={layer.locked || index === 0}
                        title={layer.locked ? "Layer is locked" : "Move layer up"}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayerDown(layer.object);
                        }}
                        disabled={layer.locked || index === layers.length - 1}
                        title={layer.locked ? "Layer is locked" : "Move layer down"}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLayer(layer.object);
                        }}
                        disabled={layer.locked}
                        title={layer.locked ? "Layer is locked" : "Remove layer"}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  )
                })}
              </div>
              {selectedLayer && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  <strong>💡 Selected:</strong> {layers.find(l => l.object === selectedLayer)?.name || 'Layer'}<br/>
                  <span className="text-blue-600">
                    {layers.find(l => l.object === selectedLayer)?.layerRole === 'imageGroup' 
                      ? 'Drag to move the entire background + subject as one unit'
                      : layers.find(l => l.object === selectedLayer)?.layerRole === 'text'
                      ? 'Drag to move text independently behind the subject'
                      : 'You can drag this layer on the canvas'}
                  </span>
                </div>
              )}
              
              {!selectedLayer && layers.length > 0 && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                  <strong>✨ How it works:</strong><br/>
                  • <span className="font-medium">Background + Subject Group:</span> Moves as one unit<br/>
                  • <span className="font-medium">Text:</span> Independent movement behind subject<br/>
                  • <span className="font-medium">Visual Effect:</span> Automatic text-behind layering
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Controls Panel */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Image Upload */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Image
              </h2>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Upload an image to get started. Supported formats: JPG, PNG, GIF
              </p>
              {uploadedImage && !processedImage && (
                <Button 
                  onClick={handleRemoveBackground} 
                  disabled={isProcessing}
                  className="w-full mt-4"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing Background...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Remove Background
                    </>
                  )}
                </Button>
              )}
              {processedImage && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-green-800 font-semibold">
                      Text-Behind-Subject Mode Ready!
                    </p>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Background removed successfully. The "Add Text to Canvas" button will now create a 3-layer effect:
                  </p>
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">1. Background</span>
                    <span>→</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">2. Text</span>
                    <span>→</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">3. Subject</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-green-700 mb-1 font-medium">Original (Background Layer)</p>
                      <img 
                        src={uploadedImage} 
                        alt="Original" 
                        className="w-full h-20 object-cover rounded border border-green-300"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-700 mb-1 font-medium">Subject (Top Layer)</p>
                      <img 
                        src={processedImage} 
                        alt="Background Removed" 
                        className="w-full h-20 object-cover rounded border border-blue-300 bg-checkerboard"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='10' height='10' fill='%23f0f0f0'/%3e%3crect x='10' y='10' width='10' height='10' fill='%23f0f0f0'/%3e%3c/svg%3e")`
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <strong>💡 Tip:</strong> Text will be automatically positioned to avoid overlapping with the subject. You can still drag it to any position you prefer.
                  </div>
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Text Controls */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Type className="w-5 h-5" />
                Text Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Text Content</label>
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter your text"
                  />
                </div>

                {/* Text Positioning Controls */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Position</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">X Position</label>
                      <Input
                        type="number"
                        value={textX}
                        onChange={(e) => setTextX(Number(e.target.value))}
                        min="0"
                        max="960"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Y Position</label>
                      <Input
                        type="number"
                        value={textY}
                        onChange={(e) => setTextY(Number(e.target.value))}
                        min="0"
                        max="540"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Tip: You can also drag text directly on the canvas
                    </p>
                    <Button
                      size="sm"
                      variant={clickToPlaceMode ? "default" : "outline"}
                      onClick={() => setClickToPlaceMode(!clickToPlaceMode)}
                      className="text-xs"
                    >
                      {clickToPlaceMode ? "Cancel Click-to-Place" : "Click to Place"}
                    </Button>
                  </div>
                  {clickToPlaceMode && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Click anywhere on the canvas to position your text
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Font Family</label>
                    <Select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                    >
                      {fontOptions.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Font Weight</label>
                    <Select
                      value={fontWeight}
                      onChange={(e) => setFontWeight(e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Light</option>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Text Color</label>
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Text Size</label>
                    <Input
                      type="range"
                      min="20"
                      max="100"
                      value={textSize}
                      onChange={(e) => setTextSize(Number(e.target.value))}
                    />
                    <span className="text-xs text-muted-foreground">{textSize}px</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-Scale Text</label>
                    <p className="text-xs text-muted-foreground">
                      Automatically adjust text size based on subject size
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={autoScaleText ? "default" : "outline"}
                    onClick={() => setAutoScaleText(!autoScaleText)}
                    className="text-xs"
                  >
                    {autoScaleText ? "On" : "Off"}
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium">Text Opacity</label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={textOpacity}
                    onChange={(e) => setTextOpacity(Number(e.target.value))}
                  />
                  <span className="text-xs text-muted-foreground">{Math.round(textOpacity * 100)}%</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Outline Color</label>
                    <Input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Outline Width</label>
                    <Input
                      type="range"
                      min="0"
                      max="10"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    />
                    <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
                  </div>
                </div>

                <Button onClick={handleAddText} className="w-full">
                  {processedImage ? 'Add Text Behind Subject' : 'Add Text to Canvas'}
                </Button>

                {/* Undo/Redo Controls */}
                <div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      variant="outline"
                      className="flex-1"
                      title="Ctrl+Z (Cmd+Z on Mac)"
                    >
                      <Undo2 className="w-4 h-4 mr-1" />
                      Undo
                    </Button>
                    <Button
                      onClick={handleRedo}
                      disabled={historyIndex >= canvasHistory.length - 1}
                      variant="outline"
                      className="flex-1"
                      title="Ctrl+Shift+Z or Ctrl+Y (Cmd+Shift+Z or Cmd+Y on Mac)"
                    >
                      <Redo2 className="w-4 h-4 mr-1" />
                      Redo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    History: {historyIndex + 1}/{canvasHistory.length} • Keyboard: Ctrl+Z / Ctrl+Y
                  </p>
                </div>
              </div>
            </div>



            {/* Actions */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Export & Actions</h2>
              <div className="space-y-4">
                {/* YouTube Frame Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Show YouTube Frame</label>
                    <p className="text-xs text-muted-foreground">
                      Display export area outline (16:9 ratio)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={showYouTubeFrame ? "default" : "outline"}
                    onClick={() => setShowYouTubeFrame(!showYouTubeFrame)}
                    className="text-xs"
                  >
                    {showYouTubeFrame ? "On" : "Off"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Format</label>
                    <Select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quality</label>
                    <Input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={exportQuality}
                      onChange={(e) => setExportQuality(Number(e.target.value))}
                    />
                    <span className="text-xs text-muted-foreground">{Math.round(exportQuality * 100)}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={handleExport} className="w-full" disabled={!uploadedImage}>
                    <Download className="w-4 h-4 mr-2" />
                    Export YouTube Thumbnail (1280×720)
                  </Button>
                  <Button onClick={handleExportFull} variant="outline" className="w-full" disabled={!uploadedImage}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Full Canvas ({960}×{540})
                  </Button>
                </div>
                
                <Button onClick={handleClear} variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Canvas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

export default App
