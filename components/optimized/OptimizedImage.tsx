
/**
 * Optimized Image Component for ZimCommute
 * 
 * Uses expo-image for better performance and caching.
 * Includes loading states and error handling.
 */

import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { colors } from '@/styles/commonStyles';

interface OptimizedImageProps {
  source: string | number;
  style?: any;
  contentFit?: ImageContentFit;
  placeholder?: string;
  alt?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  alt,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageSource = typeof source === 'string' ? { uri: source } : source;

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  if (error) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>Failed to load image</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={200}
        onLoad={handleLoad}
        onError={handleError}
        cachePolicy="memory-disk"
        priority="normal"
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
