import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map } from '@/components/Map';
import { colors } from '@/styles/commonStyles';
import { useDarkMode } from '@/hooks/useDarkMode';
import { supabase } from '@/app/integrations/supabase/client';
import type { LocationUpdate } from '@/utils/locationApi';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Finding your driver...',
  driver_assigned: 'Driver has been assigned',
  driver_en_route: 'Driver is on the way',
  driver_arrived: 'Driver has arrived',
  in_progress: 'Ride in progress',
  completed: 'Ride completed',
  cancelled: 'Ride cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  driver_assigned: '#3B82F6',
  driver_en_route: '#3B82F6',
  driver_arrived: '#10B981',
  in_progress: '#009E49',
  completed: '#10B981',
  cancelled: '#EF4444',
};

// ─── Pulsing Live Dot ─────────────────────────────────────────────────────────

function LiveDot() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);

  return (
    <View style={liveDotStyles.wrapper}>
      <Animated.View style={[liveDotStyles.ring, { transform: [{ scale }] }]} />
      <View style={liveDotStyles.dot} />
    </View>
  );
}

const liveDotStyles = StyleSheet.create({
  wrapper: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.25)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
});

// ─── AnimatedPressable ────────────────────────────────────────────────────────

function AnimatedPressable({
  onPress,
  style,
  children,
  disabled,
}: {
  onPress: () => void;
  style?: object;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scale]);
  const animOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scale]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, disabled && { opacity: 0.5 }]}>
      <Pressable
        onPressIn={animIn}
        onPressOut={animOut}
        onPress={onPress}
        disabled={disabled}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrackingScreen() {
  const router = useRouter();
  const { rideId, roomId, status: initialStatus } = useLocalSearchParams<{
    rideId: string;
    roomId: string;
    status?: string;
  }>();
  const { isDarkMode } = useDarkMode();

  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ latitude: number; longitude: number }[]>([]);
  const [rideStatus, setRideStatus] = useState<string>(initialStatus || 'driver_en_route');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const applyLocationUpdate = useCallback((loc: LocationUpdate) => {
    const point = { latitude: loc.latitude, longitude: loc.longitude };
    setDriverLocation(point);
    setBreadcrumbs((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.latitude === loc.latitude && last.longitude === loc.longitude) return prev;
      return [...prev, point];
    });
  }, []);

  // ── Mount / unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!rideId) {
      setError('No ride ID provided');
      setLoading(false);
      return;
    }

    console.log('[Tracking] Mounting tracking screen for ride:', rideId);

    const init = async () => {
      try {
        // Load breadcrumb history from Supabase
        const { data: historyData, error: histErr } = await supabase
          .from('ride_locations')
          .select('*')
          .eq('ride_id', rideId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (histErr) {
          console.warn('[Tracking] History load error:', histErr.message);
        } else if (historyData && historyData.length > 0) {
          const trail = historyData.map((l: LocationUpdate) => ({
            latitude: l.latitude,
            longitude: l.longitude,
          }));
          setBreadcrumbs(trail);
          setDriverLocation(trail[trail.length - 1]);
          console.log('[Tracking] Loaded', trail.length, 'history points');
        }
      } catch (err: any) {
        console.warn('[Tracking] Init data error:', err.message);
      } finally {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      }
    };

    init();

    // Subscribe to live location updates via Supabase Realtime
    console.log('[Tracking] Setting up Supabase Realtime for ride_locations:', rideId);
    channelRef.current = supabase
      .channel(`ride-location-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_locations',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const loc = payload.new as LocationUpdate;
          console.log('[Tracking] Realtime location update:', loc.latitude, loc.longitude);
          applyLocationUpdate(loc);
        }
      )
      .subscribe((status) => {
        console.log('[Tracking] Channel status:', status);
        setWsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[Tracking] Unmounting — cleaning up');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [rideId]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleChat = () => {
    const targetRoom = roomId || rideId;
    console.log('[Tracking] User tapped Chat button, navigating to room:', targetRoom);
    router.push({ pathname: '/chat/[roomId]', params: { roomId: targetRoom } });
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const statusLabel = STATUS_LABELS[rideStatus] || rideStatus;
  const statusColor = STATUS_COLORS[rideStatus] || colors.textSecondary;

  const bg = isDarkMode ? '#0F1A14' : '#F4FAF6';
  const cardBg = isDarkMode ? '#1A2820' : '#FFFFFF';
  const textColor = isDarkMode ? '#E8F5EE' : '#1A2820';
  const textSecondary = isDarkMode ? '#7DB89A' : '#5A7A68';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const mapRegion = {
    latitude: driverLocation?.latitude ?? -17.8252,
    longitude: driverLocation?.longitude ?? 31.0335,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  const breadcrumbMarkers = breadcrumbs.map((pt, i) => ({
    id: `crumb-${i}`,
    latitude: pt.latitude,
    longitude: pt.longitude,
  }));

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.flex, { backgroundColor: bg }]}>
        <Stack.Screen options={{ title: 'Live Tracking', headerShown: true }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Loading ride tracking...</Text>
        </View>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <View style={[styles.flex, { backgroundColor: bg }]}>
        <Stack.Screen options={{ title: 'Live Tracking', headerShown: true }} />
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: textColor }]}>Couldn't load tracking</Text>
          <Text style={[styles.errorBody, { color: textSecondary }]}>{error}</Text>
        </View>
      </View>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.flex, { backgroundColor: bg }]}>
      <Stack.Screen options={{ title: 'Live Tracking', headerShown: true }} />

      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        {/* Full-screen map */}
        <View style={styles.mapFill}>
          <Map
            markers={breadcrumbMarkers}
            initialRegion={mapRegion}
            driverLocation={driverLocation ?? undefined}
            style={styles.mapFill}
          />
        </View>

        {/* Live badge */}
        {wsConnected && (
          <View style={[styles.liveBadge, { backgroundColor: cardBg, borderColor }]}>
            <LiveDot />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Bottom sheet overlay */}
        <SafeAreaView edges={['bottom']} style={styles.sheetWrapper} pointerEvents="box-none">
          <View style={[styles.sheet, { backgroundColor: cardBg, borderColor }]}>
            {/* Status row */}
            <View style={styles.statusRow}>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            {/* Driver info */}
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={styles.driverAvatarText}>🚗</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={[styles.driverName, { color: textColor }]}>Your Driver</Text>
                <Text style={[styles.driverEta, { color: textSecondary }]}>Arriving in ~5 min</Text>
              </View>
              {driverLocation && (
                <View style={[styles.coordBadge, { backgroundColor: isDarkMode ? '#1E3028' : '#EDF7F2' }]}>
                  <Text style={[styles.coordText, { color: colors.primary }]}>
                    {Number(driverLocation.latitude).toFixed(3)}
                  </Text>
                  <Text style={[styles.coordText, { color: colors.primary }]}>
                    {Number(driverLocation.longitude).toFixed(3)}
                  </Text>
                </View>
              )}
            </View>

            {/* Chat button */}
            <AnimatedPressable onPress={handleChat} style={[styles.chatButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.chatIcon}>💬</Text>
              <Text style={styles.chatButtonText}>Chat with driver</Text>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 15 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errorBody: { fontSize: 14, textAlign: 'center' },

  mapFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
  },

  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.8,
  },

  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 16,
    boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
  },

  statusRow: { alignItems: 'flex-start' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontWeight: '600' },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: { fontSize: 22 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700' },
  driverEta: { fontSize: 13, marginTop: 2 },
  coordBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  coordText: { fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'] },

  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  chatIcon: { fontSize: 18 },
  chatButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
