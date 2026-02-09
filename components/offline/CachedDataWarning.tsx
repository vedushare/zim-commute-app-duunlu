
/**
 * Cached Data Warning Component
 * 
 * Shows a warning when displaying cached data
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface CachedDataWarningProps {
  message?: string;
  type?: 'info' | 'warning';
}

export function CachedDataWarning({ 
  message = 'Showing cached data',
  type = 'info'
}: CachedDataWarningProps) {
  const iconName = type === 'warning' ? 'warning' : 'info';
  const bgColor = type === 'warning' ? colors.warningLight : colors.infoLight;
  const textColor = type === 'warning' ? colors.warning : colors.info;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <IconSymbol
        ios_icon_name={type === 'warning' ? 'exclamationmark.triangle' : 'info.circle'}
        android_material_icon_name={iconName}
        size={16}
        color={textColor}
      />
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  text: {
    fontSize: 13,
    flex: 1,
  },
});
