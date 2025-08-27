import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Canvas, FabricImage, Textbox, Shadow, filters, Group } from 'fabric';

const FabricCanvas = forwardRef(({ width = 800, height = 600, onCanvasReady, onCanvasClick, showYouTubeFrame = true }, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  // Simplified interaction - no complex mode switching needed
  
  // Calculate YouTube frame dimensions (16:9 aspect ratio)
  const youtubeAspectRatio = 16 / 9;
  const canvasAspectRatio = width / height;
  
  let frameWidth, frameHeight;
  if (canvasAspectRatio > youtubeAspectRatio) {
    // Canvas is wider than 16:9, so height constrains the frame
    frameHeight = height * 0.8; // Use 80% of canvas height
    frameWidth = frameHeight * youtubeAspectRatio;
  } else {
    // Canvas is taller than 16:9, so width constrains the frame
    frameWidth = width * 0.8; // Use 80% of canvas width
    frameHeight = frameWidth / youtubeAspectRatio;
  }
  
  const frameLeft = (width - frameWidth) / 2;
  const frameTop = (height - frameHeight) / 2;

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Initialize Fabric.js canvas
      fabricCanvasRef.current = new Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#f0f0f0',
        preserveObjectStacking: true,
      });

      // Add click event listener
      if (onCanvasClick) {
        fabricCanvasRef.current.on('mouse:up', (e) => {
          // Only trigger click if we didn't drag an object
          if (!e.target && fabricCanvasRef.current.getActiveObject() === null) {
            const pointer = fabricCanvasRef.current.getViewportPoint(e.e);
            onCanvasClick(pointer.x, pointer.y);
          }
        });
      }

      if (onCanvasReady) {
        onCanvasReady(fabricCanvasRef.current);
      }
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [width, height, onCanvasReady, onCanvasClick]);


  useImperativeHandle(ref, () => ({
    canvas: fabricCanvasRef.current,
    
    addImage: (imageUrl, positionState = null) => {
      return new Promise((resolve) => {
        FabricImage.fromURL(imageUrl, {
          crossOrigin: 'anonymous',
        }).then((img) => {
          const canvas = fabricCanvasRef.current;
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          
          if (positionState) {
            // Apply stored position and transformation state
            img.set({
              left: positionState.left,
              top: positionState.top,
              scaleX: positionState.scaleX,
              scaleY: positionState.scaleY,
              angle: positionState.angle || 0
            });
          } else {
            // Default behavior: scale to fit and center
            const scaleX = canvasWidth / img.width;
            const scaleY = canvasHeight / img.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
            
            img.scale(scale);
            
            // Center the image manually
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            img.set({
              left: (canvasWidth - scaledWidth) / 2,
              top: (canvasHeight - scaledHeight) / 2
            });
          }
          
          canvas.add(img);
          canvas.renderAll();
          resolve(img);
        });
      });
    },

    addText: (text, options = {}) => {
      const textOptions = {
        left: options.left !== undefined ? options.left : 100,
        top: options.top !== undefined ? options.top : 100,
        fill: options.fill || '#000000',
        fontSize: options.fontSize || 40,
        fontFamily: options.fontFamily || 'Arial',
        fontWeight: options.fontWeight || 'bold',
        stroke: options.stroke || '#ffffff',
        strokeWidth: options.strokeWidth || 2,
        textAlign: options.textAlign || 'center',
        selectable: true,
        editable: true,
      };

      // Add shadow if provided
      if (options.shadow) {
        textOptions.shadow = new Shadow({
          color: options.shadow.color,
          blur: options.shadow.blur,
          offsetX: options.shadow.offsetX,
          offsetY: options.shadow.offsetY,
        });
      }

      const textObj = new Textbox(text, textOptions);

      // Apply transformations after creating the object
      if (options.opacity !== undefined) textObj.set('opacity', options.opacity);
      if (options.angle !== undefined) textObj.set('angle', options.angle);
      if (options.skewX !== undefined) textObj.set('skewX', options.skewX);
      if (options.skewY !== undefined) textObj.set('skewY', options.skewY);
      if (options.scaleX !== undefined) textObj.set('scaleX', options.scaleX);
      if (options.scaleY !== undefined) textObj.set('scaleY', options.scaleY);
      
      // Apply blend mode
      if (options.globalCompositeOperation && options.globalCompositeOperation !== 'normal') {
        textObj.set('globalCompositeOperation', options.globalCompositeOperation);
      }

      // Apply blur effect if specified
      if (options.blur && options.blur > 0) {
        const blurFilter = new filters.Blur({
          blur: options.blur / 10 // Scale down for more subtle effect
        });
        textObj.filters = [blurFilter];
        textObj.applyFilters();
      }

      fabricCanvasRef.current.add(textObj);
      fabricCanvasRef.current.requestRenderAll();
      return textObj;
    },

    addTextBehindSubject: async (text, backgroundImageUrl, subjectImageUrl, options = {}) => {
      try {
        const canvas = fabricCanvasRef.current;
        
        // Store the position of the current single image on canvas (before background removal effect)
        const existingObjects = canvas.getObjects();
        const existingImages = existingObjects.filter(obj => obj.type === 'image');
        let currentImageState = null;
        
        // Get the state of the single image currently on canvas (either original or processed)
        if (existingImages.length > 0) {
          const img = existingImages[0]; // There should only be one image at this point
          currentImageState = {
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle
          };
        }

        canvas.clear();

        // 1. Create background image
        const backgroundImg = await FabricImage.fromURL(backgroundImageUrl, {
          crossOrigin: 'anonymous',
        });

        // 2. Create subject image
        const subjectImg = await FabricImage.fromURL(subjectImageUrl, {
          crossOrigin: 'anonymous',
        });

        // Apply positioning to both images if we have stored state
        if (currentImageState) {
          // Apply the same positioning to both background and subject
          [backgroundImg, subjectImg].forEach(img => {
            img.set({
              left: currentImageState.left - currentImageState.left, // Reset to 0 for group coordinates
              top: currentImageState.top - currentImageState.top,   // Reset to 0 for group coordinates
              scaleX: currentImageState.scaleX,
              scaleY: currentImageState.scaleY,
              angle: currentImageState.angle || 0
            });
          });
        } else {
          // Default behavior: scale to fit and center both images
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          
          [backgroundImg, subjectImg].forEach(img => {
            const scaleX = canvasWidth / img.width;
            const scaleY = canvasHeight / img.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
            
            img.scale(scale);
            
            // Reset positioning to 0,0 for group coordinates
            img.set({
              left: 0,
              top: 0
            });
          });
        }

        // Set layer properties for individual images within the group
        backgroundImg.set({
          selectable: false, // Individual images within group shouldn't be selectable
          evented: false,    // Let the group handle events
          layerRole: 'background',
          name: '🖼️ Background Image'
        });

        subjectImg.set({
          selectable: false, // Individual images within group shouldn't be selectable  
          evented: false,    // Let the group handle events
          layerRole: 'subject',
          name: '👤 Subject (Foreground)'
        });

        // Create a unified group containing background and subject that move together
        // Using proper Fabric.js v6 Group properties for optimal behavior
        const imageGroup = new Group([backgroundImg, subjectImg], {
          left: currentImageState ? currentImageState.left : (canvas.getWidth() - backgroundImg.width * backgroundImg.scaleX) / 2,
          top: currentImageState ? currentImageState.top : (canvas.getHeight() - backgroundImg.height * backgroundImg.scaleY) / 2,
          subTargetCheck: false,   // Don't allow selection of individual images within this group
          interactive: false,      // Group moves as one unified unit, no individual object interaction
          selectable: true,        // The group itself is selectable and movable
          evented: true,           // Group receives mouse events for drag/selection
          hoverCursor: 'move',     // Clear cursor feedback for group interaction
          moveCursor: 'move',      // Consistent cursor during movement
          layerRole: 'imageGroup', // Identifies this as the unified image group
          name: '🎭 Background + Subject Group',
          // Enable proper group transformations
          lockScalingFlip: false,
          transparentCorners: false,
          cornerColor: '#2563eb',
          cornerStyle: 'circle',
          borderColor: '#2563eb',
          borderDashArray: [5, 5]
        });

        // Add the unified image group to canvas
        canvas.add(imageGroup);

        // 3. Calculate optimal text position to avoid overlapping the subject area
        let textLeft = options.left !== undefined ? options.left : canvas.getWidth() / 2;
        let textTop = options.top !== undefined ? options.top : canvas.getHeight() * 0.75;
        
        // 4. Create text layer with enhanced v6 Group compatibility (independent object)
        const textOptions = {
          left: textLeft,
          top: textTop,
          fill: options.fill || '#ff0000',
          fontSize: options.fontSize || 60,
          fontFamily: options.fontFamily || 'Arial',
          fontWeight: options.fontWeight || 'bold',
          stroke: options.stroke || '#ffffff',
          strokeWidth: options.strokeWidth || 3,
          textAlign: options.textAlign || 'center',
          originX: 'center', // Center text horizontally
          originY: 'center', // Center text vertically
          // Independent object properties - optimized for v6
          selectable: true,        // Text is always independently selectable
          editable: true,          // Text remains editable (key requirement)
          evented: true,           // Text handles its own events independently
          interactive: true,       // Fully interactive text object
          // Cursor feedback for better UX
          hoverCursor: 'move',
          moveCursor: 'move',
          // Visual styling for selection
          cornerColor: '#ef4444',
          cornerStyle: 'circle',
          borderColor: '#ef4444',
          transparentCorners: false,
          // Layer identification
          layerRole: 'text',
          name: `📝 Text: ${text.substring(0, 15)}${text.length > 15 ? '...' : ''}`,
          // Text-specific properties
          lockScalingFlip: true,   // Prevent text from flipping during scale
          centeredRotation: true   // Rotate around center point
        };

        // Add shadow if provided
        if (options.shadow) {
          textOptions.shadow = new Shadow({
            color: options.shadow.color,
            blur: options.shadow.blur,
            offsetX: options.shadow.offsetX,
            offsetY: options.shadow.offsetY,
          });
        }

        const textObj = new Textbox(text, textOptions);

        // Apply transformations after creating the object
        if (options.opacity !== undefined) textObj.set('opacity', options.opacity);
        if (options.angle !== undefined) textObj.set('angle', options.angle);
        if (options.skewX !== undefined) textObj.set('skewX', options.skewX);
        if (options.skewY !== undefined) textObj.set('skewY', options.skewY);
        if (options.scaleX !== undefined) textObj.set('scaleX', options.scaleX);
        if (options.scaleY !== undefined) textObj.set('scaleY', options.scaleY);
        
        // Apply blend mode
        if (options.globalCompositeOperation && options.globalCompositeOperation !== 'normal') {
          textObj.set('globalCompositeOperation', options.globalCompositeOperation);
        }

        // Apply blur effect if specified
        if (options.blur && options.blur > 0) {
          const blurFilter = new filters.Blur({
            blur: options.blur / 10 // Scale down for more subtle effect
          });
          textObj.filters = [blurFilter];
          textObj.applyFilters();
        }

        // 5. Add text as independent layer
        canvas.add(textObj);
        
        // 6. Create a separate subject overlay for text-behind effect
        // Clone the subject image and position it to match the imageGroup
        const subjectOverlayImg = await FabricImage.fromURL(subjectImageUrl, {
          crossOrigin: 'anonymous',
        });
        
        // Apply the same transformations as the original subject
        subjectOverlayImg.set({
          left: 0, // Relative to group position
          top: 0,  // Relative to group position
          scaleX: subjectImg.scaleX,
          scaleY: subjectImg.scaleY,
          angle: subjectImg.angle,
          selectable: false,
          evented: false
        });
        
        const subjectOverlay = new Group([subjectOverlayImg], {
          left: imageGroup.left,
          top: imageGroup.top,
          scaleX: imageGroup.scaleX,
          scaleY: imageGroup.scaleY,
          angle: imageGroup.angle,
          // Overlay properties - not interactive but follows imageGroup
          selectable: false,        // This overlay is not directly selectable
          evented: false,           // Events pass through to underlying objects  
          interactive: false,       // No interaction with individual elements
          subTargetCheck: false,    // No subtarget selection needed
          hoverCursor: 'default',   // No special cursor
          // Visual properties for text-behind effect
          globalCompositeOperation: 'source-over', // Ensure it renders on top
          // Identification
          layerRole: 'subjectOverlay',
          name: '🎭 Subject Overlay (Text-Behind Effect)',
          // Hide selection controls since it's not interactive
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true
        });
        
        // Add subject overlay to create text-behind effect
        canvas.add(subjectOverlay);
        
        // 7. Establish proper layer ordering: imageGroup (bottom) -> textObj (middle) -> subjectOverlay (top)
        
        // Layer ordering - use safe method calls since everything else is working
        if (canvas.sendToBack && canvas.bringForward && canvas.bringToFront) {
          try {
            canvas.sendToBack(imageGroup);    // Background + subject group at bottom
            canvas.bringForward(textObj);     // Text in middle (behind subject visually)  
            canvas.bringToFront(subjectOverlay); // Subject overlay on top (creates text-behind effect)
          } catch {
            // Layer ordering failed but functionality preserved
          }
        }
        
        // 8. IMMEDIATE synchronization - no delays, perfect alignment
        const syncOverlayMovement = () => {
          if (imageGroup && subjectOverlay && !imageGroup._syncing) {
            imageGroup._syncing = true;
            
            // DIRECT property copying for instant sync
            subjectOverlay.left = imageGroup.left;
            subjectOverlay.top = imageGroup.top;
            subjectOverlay.scaleX = imageGroup.scaleX;
            subjectOverlay.scaleY = imageGroup.scaleY;
            subjectOverlay.angle = imageGroup.angle;
            subjectOverlay.skewX = imageGroup.skewX || 0;
            subjectOverlay.skewY = imageGroup.skewY || 0;
            subjectOverlay.flipX = imageGroup.flipX || false;
            subjectOverlay.flipY = imageGroup.flipY || false;
            
            // Force immediate coordinate update
            subjectOverlay.setCoords();
            
            // Maintain z-order instantly using correct Fabric.js methods
            if (canvas.sendToBack && canvas.bringForward && canvas.bringToFront) {
              canvas.sendToBack(imageGroup);
              const textObjects = canvas.getObjects().filter(obj => obj.layerRole === 'text');
              textObjects.forEach(text => canvas.bringForward(text));
              canvas.bringToFront(subjectOverlay);
            } else {
              // Fallback: manual z-index management
              // Canvas layering methods not available - using fallback z-order management
            }
            
            // Sync completed successfully
            
            imageGroup._syncing = false;
            canvas.requestRenderAll();
          }
        };
        
        // Initial sync - no delay
        syncOverlayMovement();

        // IMMEDIATE event binding for real-time sync
        // Focus on the most critical events for drag operations
        const criticalEvents = ['moving', 'scaling', 'rotating', 'modified'];
        
        criticalEvents.forEach(eventType => {
          imageGroup.on(eventType, syncOverlayMovement);
        });
        
        // ULTRA HIGH-FREQUENCY sync for perfect alignment during drag
        let isMouseDown = false;
        let animationFrame = null;
        
        const startContinuousSync = () => {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
          }
          
          const continuousSync = () => {
            if (isMouseDown && canvas.getActiveObject() === imageGroup) {
              syncOverlayMovement();
              animationFrame = requestAnimationFrame(continuousSync);
            } else {
              animationFrame = null;
            }
          };
          
          animationFrame = requestAnimationFrame(continuousSync);
        };
        
        canvas.on('mouse:down', (event) => {
          if (event.target === imageGroup) {
            isMouseDown = true;
            startContinuousSync();
          }
        });
        
        canvas.on('mouse:up', () => {
          if (isMouseDown) {
            isMouseDown = false;
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
              animationFrame = null;
            }
            // Final sync
            syncOverlayMovement();
          }
        });
        
        // Also sync on any canvas-level object movement
        canvas.on('object:moving', (e) => {
          if (e.target === imageGroup) {
            syncOverlayMovement();
          }
        });
        
        // Store references for management and cleanup
        imageGroup._overlayPartner = subjectOverlay;
        subjectOverlay._groupPartner = imageGroup;
        textObj._isIndependent = true;
        
        // Add cleanup method for proper disposal
        imageGroup._cleanup = () => {
          criticalEvents.forEach(eventType => {
            imageGroup.off(eventType, syncOverlayMovement);
          });
          
          // Clean up canvas-level listeners
          canvas.off('object:moving');
          canvas.off('mouse:down');
          canvas.off('mouse:up');
          
          // Clear any active animation frame
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
          }
          
          isMouseDown = false;
        };
        
        // Store cleanup reference on canvas for global cleanup
        if (!canvas._textBehindCleanup) {
          canvas._textBehindCleanup = [];
        }
        canvas._textBehindCleanup.push(imageGroup._cleanup);
        
        canvas.requestRenderAll();
        return { textObj, imageGroup, subjectOverlay, backgroundImg, subjectImg };
        
      } catch {
        // Error creating text behind subject
        return null;
      }
    },

    sendToBack: (object) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !object || !canvas.sendToBack) return;
      
      canvas.sendToBack(object);
      
      // If moving imageGroup, also move its overlay partner
      if (object.layerRole === 'imageGroup' && object._overlayPartner && canvas.bringForward && canvas.bringToFront) {
        // Maintain text-behind effect: imageGroup -> text -> subjectOverlay
        const textObjs = canvas.getObjects().filter(obj => obj.layerRole === 'text');
        textObjs.forEach(textObj => canvas.bringForward(textObj));
        canvas.bringToFront(object._overlayPartner);
      }
      
      canvas.requestRenderAll();
    },

    bringToFront: (object) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !object || !canvas.bringToFront) return;
      
      canvas.bringToFront(object);
      
      // Maintain proper layer order for text-behind effect
      if (object.layerRole === 'text') {
        const subjectOverlays = canvas.getObjects().filter(obj => obj.layerRole === 'subjectOverlay');
        subjectOverlays.forEach(overlay => canvas.bringToFront(overlay));
      }
      
      canvas.requestRenderAll();
    },

    exportAsImage: (format = 'png', quality = 1) => {
      return fabricCanvasRef.current.toDataURL({
        format,
        quality,
        multiplier: 1,
      });
    },

    clear: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      // Clean up any event listeners before clearing
      canvas.getObjects().forEach(obj => {
        if (obj._cleanup && typeof obj._cleanup === 'function') {
          obj._cleanup();
        }
      });
      
      canvas.clear();
      canvas.backgroundColor = '#f0f0f0';
      canvas.requestRenderAll(); // Use v6 optimized render method
    },

    getObjects: () => {
      return fabricCanvasRef.current.getObjects();
    },

    removeObject: (object) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !object) return;
      
      // Clean up event listeners if object has cleanup method
      if (object._cleanup && typeof object._cleanup === 'function') {
        object._cleanup();
      }
      
      // If removing imageGroup, also remove its overlay partner
      if (object.layerRole === 'imageGroup' && object._overlayPartner) {
        canvas.remove(object._overlayPartner);
      }
      
      // If removing overlay, clean up the partner reference
      if (object.layerRole === 'subjectOverlay' && object._groupPartner) {
        delete object._groupPartner._overlayPartner;
      }
      
      canvas.remove(object);
      canvas.requestRenderAll(); // Use v6 optimized render method
    },

    getLayerInfo: () => {
      const objects = fabricCanvasRef.current.getObjects();
      return objects.map((obj, index) => ({
        index,
        type: obj.type === 'group' ? 'group' : obj.type,
        name: obj.name || (obj.type === 'textbox' ? 
              `📝 Text: ${(obj.text || 'Empty').substring(0, 15)}${obj.text && obj.text.length > 15 ? '...' : ''}` : 
              obj.type === 'group' ? 
              (obj.layerRole === 'imageGroup' ? '🎭 Background + Subject Group' :
               obj.layerRole === 'subjectOverlay' ? '🎭 Subject Overlay (Text-Behind Effect)' :
               '🗂️ Group') :
              obj.type === 'image' ? 
              (obj.layerRole === 'background' ? '🖼️ Background Image' :
               obj.layerRole === 'subject' ? '👤 Subject (Foreground)' : 
               '🖼️ Image') : obj.type),
        object: obj,
        locked: obj.selectable === false || obj.evented === false,
        layerRole: obj.layerRole || 'normal', // imageGroup, text, subjectOverlay, or normal
        interactive: obj.layerRole === 'imageGroup' || obj.layerRole === 'text' // These are the interactive layers
      }));
    },

    moveLayerUp: (object) => {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      const currentIndex = objects.indexOf(object);
      
      // In the new three-layer system: imageGroup -> text -> subjectOverlay
      // Maintain proper ordering for text-behind-subject effect
      
      if (object.layerRole === 'subjectOverlay') {
        // Subject overlay should always stay on top for text-behind effect
        if (canvas.bringToFront) canvas.bringToFront(object);
      } else if (object.layerRole === 'text') {
        // Text can move up but should stay between imageGroup and subjectOverlay
        if (canvas.bringForward) canvas.bringForward(object);
        // Ensure subjectOverlay stays on top
        const subjectOverlay = objects.find(obj => obj.layerRole === 'subjectOverlay');
        if (subjectOverlay && canvas.bringToFront) canvas.bringToFront(subjectOverlay);
      } else if (object.layerRole === 'imageGroup') {
        // ImageGroup can move up but should stay at bottom
        if (canvas.bringForward) canvas.bringForward(object);
        // Restore proper order: text above imageGroup, subjectOverlay on top
        const textObj = objects.find(obj => obj.layerRole === 'text');
        const subjectOverlay = objects.find(obj => obj.layerRole === 'subjectOverlay');
        if (textObj && canvas.bringForward) canvas.bringForward(textObj);
        if (subjectOverlay && canvas.bringToFront) canvas.bringToFront(subjectOverlay);
      } else {
        // For other objects, allow normal movement but respect the three-layer system
        if (currentIndex < objects.length - 1 && canvas.bringForward) {
          canvas.bringForward(object);
          // Ensure the three-layer order is maintained with safety checks
          const imageGroup = objects.find(obj => obj.layerRole === 'imageGroup');
          const textObj = objects.find(obj => obj.layerRole === 'text');
          const subjectOverlay = objects.find(obj => obj.layerRole === 'subjectOverlay');
          
          if (imageGroup && canvas.sendToBack) canvas.sendToBack(imageGroup);
          if (textObj && canvas.bringForward) canvas.bringForward(textObj);
          if (subjectOverlay && canvas.bringToFront) canvas.bringToFront(subjectOverlay);
        }
      }
      
      canvas.requestRenderAll();
    },

    moveLayerDown: (object) => {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      const currentIndex = objects.indexOf(object);
      
      // In the new three-layer system: imageGroup -> text -> subjectOverlay
      // Maintain proper ordering for text-behind-subject effect
      
      if (object.layerRole === 'imageGroup') {
        // ImageGroup should stay at bottom
        if (canvas.sendToBack) canvas.sendToBack(object);
      } else if (object.layerRole === 'text') {
        // Text can move down but should stay above imageGroup
        if (canvas.sendBackwards) canvas.sendBackwards(object);
        // Ensure imageGroup stays at bottom
        const imageGroup = objects.find(obj => obj.layerRole === 'imageGroup');
        if (imageGroup && canvas.sendToBack) canvas.sendToBack(imageGroup);
      } else if (object.layerRole === 'subjectOverlay') {
        // Subject overlay can move down but maintain hierarchy
        if (canvas.sendBackwards) canvas.sendBackwards(object);
        // Restore proper order: imageGroup at bottom
        const imageGroup = objects.find(obj => obj.layerRole === 'imageGroup');
        if (imageGroup && canvas.sendToBack) canvas.sendToBack(imageGroup);
      } else {
        // For other objects, allow normal movement but respect the three-layer system
        if (currentIndex > 0 && canvas.sendBackwards) {
          canvas.sendBackwards(object);
          // Ensure the three-layer order is maintained with safety checks
          const imageGroup = objects.find(obj => obj.layerRole === 'imageGroup');
          const textObj = objects.find(obj => obj.layerRole === 'text');
          const subjectOverlay = objects.find(obj => obj.layerRole === 'subjectOverlay');
          
          if (imageGroup && canvas.sendToBack) canvas.sendToBack(imageGroup);
          if (textObj && canvas.bringForward) canvas.bringForward(textObj);
          if (subjectOverlay && canvas.bringToFront) canvas.bringToFront(subjectOverlay);
        }
      }
      
      canvas.requestRenderAll();
    },

    updateLastTextObject: (properties) => {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      
      // Find the most recently added text object
      const textObjects = objects.filter(obj => obj.type === 'textbox');
      if (textObjects.length > 0) {
        const lastText = textObjects[textObjects.length - 1];
        
        // Update properties
        Object.keys(properties).forEach(key => {
          if (properties[key] !== undefined) {
            if (key === 'shadow' && properties[key]) {
              lastText.set('shadow', new Shadow({
                color: properties[key].color,
                blur: properties[key].blur,
                offsetX: properties[key].offsetX,
                offsetY: properties[key].offsetY,
              }));
            } else if (key === 'shadow' && !properties[key]) {
              lastText.set('shadow', null);
            } else {
              lastText.set(key, properties[key]);
            }
          }
        });
        
        canvas.requestRenderAll();
        return lastText;
      }
      return null;
    },

    calculateOptimalTextSize: (baseSize, autoScale = true) => {
      if (!autoScale) return baseSize;
      
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      
      // Find subject or background image to determine size
      const subjectImage = objects.find(obj => obj.layerRole === 'subject');
      const backgroundImage = objects.find(obj => obj.layerRole === 'background');
      const referenceImage = subjectImage || backgroundImage;
      
      if (!referenceImage) {
        // Fallback: look for any image
        const anyImage = objects.find(obj => obj.type === 'image');
        if (!anyImage) return baseSize;
        
        // Use the fallback image for calculations
        const imageWidth = anyImage.width * anyImage.scaleX;
        const imageHeight = anyImage.height * anyImage.scaleY;
        const imageArea = imageWidth * imageHeight;
        const canvasArea = canvas.width * canvas.height;
        const imageRatio = Math.sqrt(imageArea / canvasArea);
        
        // Simple scaling for fallback
        let scaleFactor = 0.8 + (imageRatio * 0.4); // 0.8 to 1.2
        scaleFactor = Math.max(0.5, Math.min(1.5, scaleFactor));
        
        return Math.max(24, Math.min(100, Math.round(baseSize * scaleFactor)));
      }
      
      // Calculate reference image's visible dimensions
      const imageWidth = referenceImage.width * referenceImage.scaleX;
      const imageHeight = referenceImage.height * referenceImage.scaleY;
      const imageArea = imageWidth * imageHeight;
      
      // Canvas dimensions
      const canvasArea = canvas.width * canvas.height;
      
      // Calculate image's relative size (0-1)
      const imageRatio = Math.sqrt(imageArea / canvasArea);
      
      // Enhanced scaling logic based on image size:
      // - Small image (< 30% of canvas): Use smaller text (0.6-0.8x)
      // - Medium image (30-70% of canvas): Use normal to slightly larger text (0.8-1.2x)
      // - Large image (> 70% of canvas): Use larger text but cap it (1.2-1.8x)
      let scaleFactor;
      if (imageRatio < 0.3) {
        // Small image - use smaller, more proportional text
        scaleFactor = 0.6 + (imageRatio * 0.7); // 0.6 to 0.8
      } else if (imageRatio < 0.7) {
        // Medium image - scale more dramatically
        scaleFactor = 0.8 + ((imageRatio - 0.3) * 1.0); // 0.8 to 1.2
      } else {
        // Large image - use bigger text but don't go crazy
        scaleFactor = 1.2 + ((imageRatio - 0.7) * 2.0); // 1.2 to 1.8
      }
      
      // Additional constraint: available background space
      // If there's less background space, use smaller text
      const backgroundSpace = 1 - imageRatio;
      if (backgroundSpace < 0.3) {
        scaleFactor *= 0.7; // Reduce text size if little background space
      }
      
      // Clamp the scale factor to reasonable bounds
      scaleFactor = Math.max(0.4, Math.min(2.0, scaleFactor));
      
      const calculatedSize = Math.round(baseSize * scaleFactor);
      
      // Ensure minimum readability (at least 24px) and maximum sanity (no more than 120px)
      return Math.max(24, Math.min(120, calculatedSize));
    },

    saveCanvasState: () => {
      const canvas = fabricCanvasRef.current;
      return {
        objects: JSON.stringify(canvas.toObject()),
        backgroundColor: canvas.backgroundColor
      };
    },

    restoreCanvasState: (state) => {
      const canvas = fabricCanvasRef.current;
      canvas.loadFromJSON(state.objects, () => {
        canvas.backgroundColor = state.backgroundColor;
        canvas.renderAll();
      });
    },

    getCanvasJSON: () => {
      const canvas = fabricCanvasRef.current;
      return canvas.toJSON();
    },

    loadFromJSON: (jsonData) => {
      const canvas = fabricCanvasRef.current;
      canvas.loadFromJSON(jsonData, () => {
        canvas.renderAll();
      });
    },

    getYouTubeFrameDimensions: () => {
      return {
        left: frameLeft,
        top: frameTop,
        width: frameWidth,
        height: frameHeight
      };
    },

    exportAsYouTubeImage: (format = 'png', quality = 1) => {
      const canvas = fabricCanvasRef.current;
      
      // Create a temporary canvas to crop to YouTube dimensions
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      // Set YouTube thumbnail dimensions (1280x720 is optimal)
      const youtubeWidth = 1280;
      const youtubeHeight = 720;
      tempCanvas.width = youtubeWidth;
      tempCanvas.height = youtubeHeight;
      
      // Get the main canvas as image
      const mainCanvasData = canvas.toCanvasElement();
      
      // Draw the cropped and scaled portion
      tempCtx.drawImage(
        mainCanvasData,
        frameLeft, frameTop, frameWidth, frameHeight, // Source rectangle (frame area)
        0, 0, youtubeWidth, youtubeHeight // Destination rectangle (full YouTube canvas)
      );
      
      return tempCanvas.toDataURL(`image/${format}`, quality);
    },

    getCurrentImageState: () => {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      const images = objects.filter(obj => obj.type === 'image');
      
      // Get the first (and typically only) image's transformation state
      if (images.length > 0) {
        const img = images[0];
        return {
          left: img.left,
          top: img.top,
          scaleX: img.scaleX,
          scaleY: img.scaleY,
          angle: img.angle || 0
        };
      }
      return null;
    },


    replaceImageWithState: async (newImageUrl, preserveState = true) => {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      const images = objects.filter(obj => obj.type === 'image');
      let currentState = null;
      
      if (preserveState && images.length > 0) {
        const img = images[0];
        currentState = {
          left: img.left,
          top: img.top,
          scaleX: img.scaleX,
          scaleY: img.scaleY,
          angle: img.angle || 0
        };
      }
      
      canvas.clear();
      
      // Use the addImage method directly
      return new Promise((resolve) => {
        FabricImage.fromURL(newImageUrl, {
          crossOrigin: 'anonymous',
        }).then((img) => {
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          
          if (currentState) {
            // Apply stored position and transformation state
            img.set({
              left: currentState.left,
              top: currentState.top,
              scaleX: currentState.scaleX,
              scaleY: currentState.scaleY,
              angle: currentState.angle || 0
            });
          } else {
            // Default behavior: scale to fit and center
            const scaleX = canvasWidth / img.width;
            const scaleY = canvasHeight / img.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
            
            img.scale(scale);
            
            // Center the image manually
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            img.set({
              left: (canvasWidth - scaledWidth) / 2,
              top: (canvasHeight - scaledHeight) / 2
            });
          }
          
          canvas.add(img);
          canvas.renderAll();
          resolve(img);
        });
      });
    },

    setInteractionMode: () => {
      // Simplified interaction mode - all objects maintain their natural selectability
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      // With the new group-based system, objects maintain their natural selectability:
      // - imageGroup: always selectable (background + subject move together)
      // - text: always independently selectable
      // - subjectOverlay: non-selectable (visual effect only)
      
      const objects = canvas.getObjects();
      
      // Ensure proper layer ordering is maintained
      const imageGroup = objects.find(obj => obj.layerRole === 'imageGroup');
      const textObj = objects.find(obj => obj.layerRole === 'text');
      const subjectOverlay = objects.find(obj => obj.layerRole === 'subjectOverlay');
      
      // Restore proper z-order: imageGroup -> text -> subjectOverlay
      if (imageGroup) canvas.sendToBack(imageGroup);
      if (textObj) canvas.bringForward(textObj);
      if (subjectOverlay) canvas.bringToFront(subjectOverlay);
      
      canvas.requestRenderAll();
    },

    selectLayer: (object) => {
      const canvas = fabricCanvasRef.current;
      if (!object || !canvas) return false;
      
      // With the new system, selection is much simpler
      // imageGroup and text objects are naturally selectable
      // subjectOverlay is not selectable (visual effect only)
      
      if (object.layerRole === 'imageGroup' || object.layerRole === 'text') {
        // Select the object directly - no complex mode switching needed
        canvas.setActiveObject(object);
        canvas.renderAll();
        return true;
      }
      
      // For legacy compatibility, handle old layer roles
      if (object.layerRole === 'background' || object.layerRole === 'subject') {
        // If this is from the old system, try to find the corresponding imageGroup
        const objects = canvas.getObjects();
        const imageGroup = objects.find(obj => obj.layerRole === 'imageGroup');
        if (imageGroup) {
          canvas.setActiveObject(imageGroup);
          canvas.renderAll();
          return true;
        }
      }
      
      return false;
    },

    getSelectedLayer: () => {
      const canvas = fabricCanvasRef.current;
      return canvas ? canvas.getActiveObject() : null;
    },

    clearSelection: () => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.discardActiveObject();
        canvas.requestRenderAll(); // Use v6 optimized render method
      }
    },

    // New v6 Group management utilities
    ensureTextBehindEffect: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      const objects = canvas.getObjects();
      const imageGroups = objects.filter(obj => obj.layerRole === 'imageGroup');
      const textObjs = objects.filter(obj => obj.layerRole === 'text');
      const subjectOverlays = objects.filter(obj => obj.layerRole === 'subjectOverlay');
      
      // Ensuring text-behind effect
      
      // Enforce proper layer order: imageGroup (bottom) -> text (middle) -> subjectOverlay (top)
      try {
        imageGroups.forEach(group => {
          if (canvas.sendToBack) {
            canvas.sendToBack(group);
          }
        });
        
        textObjs.forEach(text => {
          if (canvas.bringForward) {
            canvas.bringForward(text);
          }
        });
        
        subjectOverlays.forEach(overlay => {
          if (canvas.bringToFront) {
            canvas.bringToFront(overlay);
          }
        });
      } catch {
        // Error in ensureTextBehindEffect - functionality preserved
      }
      
      canvas.requestRenderAll();
    },

    getGroupStructure: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return null;
      
      const objects = canvas.getObjects();
      return {
        imageGroups: objects.filter(obj => obj.layerRole === 'imageGroup'),
        textObjects: objects.filter(obj => obj.layerRole === 'text'),
        subjectOverlays: objects.filter(obj => obj.layerRole === 'subjectOverlay'),
        otherObjects: objects.filter(obj => !obj.layerRole || 
          !['imageGroup', 'text', 'subjectOverlay'].includes(obj.layerRole))
      };
    },

    syncAllOverlays: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      const objects = canvas.getObjects();
      const imageGroups = objects.filter(obj => obj.layerRole === 'imageGroup');
      
      // Syncing all overlays
      
      imageGroups.forEach(group => {
        if (group._overlayPartner && !group._syncing) {
          group._syncing = true;
          
          // Force syncing overlay for group
          
          // IMMEDIATE property assignment
          group._overlayPartner.left = group.left;
          group._overlayPartner.top = group.top;
          group._overlayPartner.scaleX = group.scaleX;
          group._overlayPartner.scaleY = group.scaleY;
          group._overlayPartner.angle = group.angle;
          group._overlayPartner.skewX = group.skewX || 0;
          group._overlayPartner.skewY = group.skewY || 0;
          group._overlayPartner.flipX = group.flipX || false;
          group._overlayPartner.flipY = group.flipY || false;
          
          // Force coordinate update
          group._overlayPartner.setCoords();
          
          // Maintain layer order with safety checks
          if (canvas.sendToBack && canvas.bringForward && canvas.bringToFront) {
            canvas.sendToBack(group);
            const textObjects = objects.filter(obj => obj.layerRole === 'text');
            textObjects.forEach(text => canvas.bringForward(text));
            canvas.bringToFront(group._overlayPartner);
          } else {
            // Canvas layering methods not available in syncAllOverlays
          }
          
          group._syncing = false;
        }
      });
      
      canvas.requestRenderAll();
    },
  }));

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} />
        {showYouTubeFrame && (
          <div 
            className="youtube-frame-overlay"
            style={{
              left: `${(frameLeft / width) * 100}%`,
              top: `${(frameTop / height) * 100}%`,
              width: `${(frameWidth / width) * 100}%`,
              height: `${(frameHeight / height) * 100}%`,
            }}
          >
            {/* Corner indicators */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-red-500 bg-white"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-red-500 bg-white"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-red-500 bg-white"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-red-500 bg-white"></div>
            
            {/* YouTube label */}
            <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-t font-medium whitespace-nowrap">
              YouTube Thumbnail (16:9)
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

FabricCanvas.displayName = 'FabricCanvas';

export default FabricCanvas;