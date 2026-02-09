
/**
 * Pulse Animation Component
 * 
 * Attention-grabbing pulse effect for important UI elements.
 */

import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface PulseAnimationProps extends ViewProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  style?: any;
}

export function PulseAnimation({
  children,
  scale = 1.05,
  duration = 1000,
  style,
  ...props
}: PulseAnimationProps) {
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(scale, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 })
      ),
      -1,
      false
    );
  }, [scale, duration, scaleValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
