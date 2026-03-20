import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';

/**
 * Redirect shim: app/rides/chat.tsx → app/chat/[roomId].tsx
 *
 * All ride chat now goes through the canonical chat screen which uses
 * Supabase Realtime directly. The roomId equals the rideId (one room per ride).
 */
export default function RidesChatRedirect() {
  const router = useRouter();
  const { ride_id } = useLocalSearchParams<{ ride_id: string }>();

  useEffect(() => {
    if (ride_id) {
      // Replace so back-navigation skips this shim
      router.replace({ pathname: '/chat/[roomId]', params: { roomId: ride_id } });
    }
  }, [ride_id]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

