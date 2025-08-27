import { useState, useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';

export function useBackgroundRemoval() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const removeImageBackground = useCallback(async (imageFile) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Remove background from the image
      const blob = await removeBackground(imageFile);
      
      // Create object URL for the processed image
      const processedImageUrl = URL.createObjectURL(blob);
      
      return processedImageUrl;
    } catch (err) {
      setError(err.message || 'Failed to remove background');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processImageFromUrl = useCallback(async (imageUrl) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Fetch the image and convert to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Remove background
      const processedBlob = await removeBackground(blob);
      const processedImageUrl = URL.createObjectURL(processedBlob);
      
      return processedImageUrl;
    } catch (err) {
      setError(err.message || 'Failed to process image');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    removeImageBackground,
    processImageFromUrl,
    isProcessing,
    error,
  };
}