
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

interface VerificationBadgeProps {
  level: 'PhoneVerified' | 'IDUploaded' | 'FullyVerified';
  size?: 'small' | 'medium' | 'large';
}

export function VerificationBadge({ level, size = 'medium' }: VerificationBadgeProps) {
  const config = getVerificationConfig(level);
  const sizeConfig = getSizeConfig(size);

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <IconSymbol
        ios_icon_name={config.iosIcon}
        android_material_icon_name={config.androidIcon}
        size={sizeConfig.iconSize}
        color={config.color}
      />
      <Text style={[styles.text, { fontSize: sizeConfig.fontSize, color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

function getVerificationConfig(level: string) {
  switch (level) {
    case 'PhoneVerified':
      return {
        label: 'Phone Verified',
        color: colors.success,
        backgroundColor: '#E8F5E9',
        iosIcon: 'checkmark.circle.fill',
        androidIcon: 'check-circle' as const,
      };
    case 'IDUploaded':
      return {
        label: 'ID Pending',
        color: colors.secondary,
        backgroundColor: '#FFF9E6',
        iosIcon: 'clock.fill',
        androidIcon: 'schedule' as const,
      };
    case 'FullyVerified':
      return {
        label: 'Fully Verified',
        color: '#FFD700',
        backgroundColor: '#FFFBEA',
        iosIcon: 'star.fill',
        androidIcon: 'star' as const,
      };
    default:
      return {
        label: 'Unverified',
        color: colors.textSecondary,
        backgroundColor: colors.backgroundAlt,
        iosIcon: 'questionmark.circle',
        androidIcon: 'help' as const,
      };
  }
}

function getSizeConfig(size: string) {
  switch (size) {
    case 'small':
      return { iconSize: 16, fontSize: 12 };
    case 'large':
      return { iconSize: 28, fontSize: 18 };
    default:
      return { iconSize: 20, fontSize: 14 };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  text: {
    fontWeight: '600',
  },
});
