
/**
 * Offline Mode Indicator Component
 * 
 * Displays a banner when the device is offline
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConnectivity } from '@/utils/connectivityManager';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export function OfflineIndicator() {
  const { isOnline } = useConnectivity();

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <IconSymbol
        ios_icon_name="wifi.slash"
        android_material_icon_name="wifi-off"
        size={16}
        color="#fff"
      />
      <Text style={styles.text}>Offline Mode</Text>
      <Text style={styles.subtext}>Changes will sync when online</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
});
