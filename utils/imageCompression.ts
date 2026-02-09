
/**
 * Image Compression Utility for ZimCommute
 * 
 * Compresses images before upload to reduce bandwidth and storage costs.
 * Critical for Zimbabwe's data-conscious users.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.7,
  format: 'jpeg',
};

/**
 * Compress an image before upload
 * 
 * @param uri - Image URI from ImagePicker
 * @param options - Compression options
 * @returns Compressed image URI and size info
 */
export async function compressImage(
  uri: string,
  options: CompressionOptions = {}
): Promise<{ uri: string; width: number; height: number; size: number }> {
  console.log('[ImageCompression] Starting compression for:', uri);
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Get original image dimensions
    const originalSize = await getImageSize(uri);
    console.log('[ImageCompression] Original size:', originalSize);

    // Calculate resize dimensions while maintaining aspect ratio
    const { width, height } = calculateResizeDimensions(
      originalSize.width,
      originalSize.height,
      opts.maxWidth!,
      opts.maxHeight!
    );

    // Compress and resize
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      {
        compress: opts.quality,
        format: opts.format === 'png' 
          ? ImageManipulator.SaveFormat.PNG 
          : ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Get compressed file size
    const compressedSize = await getFileSize(manipResult.uri);
    
    const compressionRatio = ((originalSize.size - compressedSize) / originalSize.size * 100).toFixed(1);
    console.log(`[ImageCompression] Compressed: ${originalSize.size}B → ${compressedSize}B (${compressionRatio}% reduction)`);

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
      size: compressedSize,
    };
  } catch (error) {
    console.error('[ImageCompression] Compression failed:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Get image dimensions and file size
 */
async function getImageSize(uri: string): Promise<{ width: number; height: number; size: number }> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        fetch(uri)
          .then(res => res.blob())
          .then(blob => {
            resolve({
              width: img.width,
              height: img.height,
              size: blob.size,
            });
          })
          .catch(reject);
      };
      img.onerror = reject;
      img.src = uri;
    });
  } else {
    // For native, we'll estimate size based on dimensions
    // In production, you'd use expo-file-system to get actual size
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: img.width * img.height * 4, // Rough estimate
        });
      };
      img.onerror = reject;
      img.src = uri;
    });
  }
}

/**
 * Get file size from URI
 */
async function getFileSize(uri: string): Promise<number> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } else {
    // For native, estimate based on URI
    // In production, use expo-file-system
    return 0; // Placeholder
  }
}

/**
 * Calculate resize dimensions while maintaining aspect ratio
 */
function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Check if resizing is needed
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Resize based on which dimension exceeds the max more
  if (width / maxWidth > height / maxHeight) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  } else {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

/**
 * Compress profile photo (smaller size for avatars)
 */
export async function compressProfilePhoto(uri: string): Promise<{ uri: string; size: number }> {
  const result = await compressImage(uri, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.8,
    format: 'jpeg',
  });

  return {
    uri: result.uri,
    size: result.size,
  };
}

/**
 * Compress ID document (higher quality for verification)
 */
export async function compressIDDocument(uri: string): Promise<{ uri: string; size: number }> {
  const result = await compressImage(uri, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    format: 'jpeg',
  });

  return {
    uri: result.uri,
    size: result.size,
  };
}

/**
 * Compress vehicle photo
 */
export async function compressVehiclePhoto(uri: string): Promise<{ uri: string; size: number }> {
  const result = await compressImage(uri, {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.75,
    format: 'jpeg',
  });

  return {
    uri: result.uri,
    size: result.size,
  };
}
