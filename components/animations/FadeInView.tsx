
/**
 * Fade In Animation Component
 * 
 * Smooth entrance animation for UI elements.
 * Uses react-native-reanimated for better performance.
 */

import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface FadeInViewProps extends ViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: any;
}

export function FadeInView({
  children,
  duration = 300,
  delay = 0,
  style,
  ...props
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [duration, delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
