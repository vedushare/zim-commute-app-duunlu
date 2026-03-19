import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Map } from '@/components/Map';
import { colors } from '@/styles/commonStyles';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

// Minimum distance (metres) between broadcasts to reduce battery usage.
const MIN_DISTANCE_METRES = 10;
// Maximum time (ms) between forced updates even if we haven't moved.
const MAX_UPDATE_INTERVAL_MS = 15_000;

// TODO: For true background location broadcasting while the driver's screen is off,
// integrate expo-task-manager + Location.startLocationUpdatesAsync with a background
// task. This screen currently only broadcasts while the app is in the foreground.
// Safe fallback: the passenger's tracking screen will show the last known position
// when no new updates are received.

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  cardBg,
  textColor,
  textSecondary,
  borderColor,
}: {
  label: string;
  value: string;
  unit: string;
  cardBg: string;
  textColor: string;
  textSecondary: string;
  borderColor: string;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: cardBg, borderColor }]}>
      <Text style={[statStyles.label, { color: textSecondary }]}>{label}</Text>
      <Text style={[statStyles.value, { color: textColor }]}>{value}</Text>
      <Text style={[statStyles.unit, { color: textSecondary }]}>{unit}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  unit: { fontSize: 12, fontWeight: '500' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BroadcastScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastBroadcastRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const statusScale = useRef(new Animated.Value(1)).current;

  // ── Colors ────────────────────────────────────────────────────────────────

  const bg = isDarkMode ? '#0F1A14' : '#F4FAF6';
  const cardBg = isDarkMode ? '#1A2820' : '#FFFFFF';
  const textColor = isDarkMode ? '#E8F5EE' : '#1A2820';
  const textSecondary = isDarkMode ? '#7DB89A' : '#5A7A68';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // ── Permission request ────────────────────────────────────────────────────

  useEffect(() => {
    const requestPermission = async () => {
      console.log('[Broadcast] Requesting foreground location permission');
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      setLoading(false);
      console.log('[Broadcast] Location permission:', status);

      if (granted) {
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        // Get initial position
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setCurrentLocation(pos);
          console.log('[Broadcast] Initial position:', pos.coords.latitude, pos.coords.longitude);
        } catch (err: any) {
          console.warn('[Broadcast] Could not get initial position:', err.message);
        }
      }
    };

    requestPermission();

    return () => {
      stopBroadcasting();
    };
  }, []);

  // ── Broadcast logic ───────────────────────────────────────────────────────

  /**
   * Returns true if the new position is far enough from the last broadcast
   * OR enough time has passed since the last broadcast.
   */
  const shouldBroadcast = useCallback(
    (lat: number, lng: number): boolean => {
      const last = lastBroadcastRef.current;
      if (!last) return true;

      const elapsed = Date.now() - last.time;
      if (elapsed >= MAX_UPDATE_INTERVAL_MS) return true;

      // Rough distance in metres using Haversine approximation
      const R = 6_371_000;
      const dLat = ((lat - last.lat) * Math.PI) / 180;
      const dLng = ((lng - last.lng) * Math.PI) / 180;
      const cosLastLat = Math.cos((last.lat * Math.PI) / 180);
      const cosLat = Math.cos((lat * Math.PI) / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        cosLastLat * cosLat * Math.sin(dLng / 2) ** 2;
      const distMetres = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return distMetres >= MIN_DISTANCE_METRES;
    },
    []
  );

  const startBroadcasting = useCallback(async () => {
    if (!rideId) {
      setLastError('No ride ID — cannot broadcast');
      return;
    }
    if (!user?.id) {
      setLastError('Not authenticated — cannot broadcast');
      return;
    }
    console.log('[Broadcast] Starting location broadcast for ride:', rideId);
    setLastError(null);
    setIsBroadcasting(true);

    // Pulse animation on status indicator
    Animated.sequence([
      Animated.timing(statusScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(statusScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    // Watch GPS position and broadcast on significant movement or time elapsed
    try {
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,       // poll GPS every 5 s
          distanceInterval: 0,      // let shouldBroadcast() decide threshold
        },
        async (loc) => {
          setCurrentLocation(loc);
          const { latitude: lat, longitude: lng } = loc.coords;
          console.log('[Broadcast] GPS update:', lat, lng);

          if (!shouldBroadcast(lat, lng)) return;

          lastBroadcastRef.current = { lat, lng, time: Date.now() };

          try {
            const { error } = await supabase.from('ride_locations').insert({
              ride_id: rideId,
              driver_id: user.id,
              latitude: lat,
              longitude: lng,
              heading: loc.coords.heading ?? null,
              speed: loc.coords.speed ?? null,
            });
            if (error) throw error;
            setUpdateCount((c) => c + 1);
            setLastError(null);
            console.log('[Broadcast] Location inserted into ride_locations');
          } catch (err: any) {
            console.error('[Broadcast] Failed to insert location:', err.message);
            setLastError('Upload failed: ' + err.message);
          }
        }
      );
    } catch (err: any) {
      console.error('[Broadcast] watchPositionAsync error:', err.message);
      setLastError('Failed to start GPS watch: ' + err.message);
      setIsBroadcasting(false);
    }
  }, [rideId, user?.id, statusScale, shouldBroadcast]);

  const stopBroadcasting = useCallback(() => {
    console.log('[Broadcast] Stopping broadcast');
    setIsBroadcasting(false);

    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }, []);

  const handleToggle = () => {
    if (isBroadcasting) {
      console.log('[Broadcast] User tapped Stop Broadcasting');
      stopBroadcasting();
    } else {
      console.log('[Broadcast] User tapped Start Broadcasting');
      startBroadcasting();
    }
  };

  const handleBack = () => {
    console.log('[Broadcast] User tapped back/exit');
    stopBroadcasting();
    router.back();
  };

  // ── Derived display values ────────────────────────────────────────────────

  const speedKmh = currentLocation?.coords.speed != null
    ? Math.max(0, Math.round(Number(currentLocation.coords.speed) * 3.6))
    : null;
  const speedDisplay = speedKmh != null ? String(speedKmh) : '--';

  const headingDeg = currentLocation?.coords.heading != null
    ? Math.round(Number(currentLocation.coords.heading))
    : null;
  const headingDisplay = headingDeg != null ? String(headingDeg) : '--';

  const latDisplay = currentLocation
    ? Number(currentLocation.coords.latitude).toFixed(5)
    : '--';
  const lngDisplay = currentLocation
    ? Number(currentLocation.coords.longitude).toFixed(5)
    : '--';

  const statusText = isBroadcasting ? 'Broadcasting' : 'Paused';
  const statusBg = isBroadcasting ? '#10B981' : (isDarkMode ? '#2A3830' : '#E5E7EB');
  const statusTextColor = isBroadcasting ? '#FFFFFF' : textSecondary;

  const mapDriverLocation = currentLocation
    ? { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude }
    : undefined;

  const mapRegion = {
    latitude: currentLocation?.coords.latitude ?? -17.8252,
    longitude: currentLocation?.coords.longitude ?? 31.0335,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.flex, { backgroundColor: bg }]}>
        <Stack.Screen options={{ title: 'Broadcast Location', headerShown: true }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Requesting GPS permission...</Text>
        </View>
      </View>
    );
  }

  // ── Permission denied ─────────────────────────────────────────────────────

  if (permissionGranted === false) {
    return (
      <View style={[styles.flex, { backgroundColor: bg }]}>
        <Stack.Screen options={{ title: 'Broadcast Location', headerShown: true }} />
        <View style={styles.centered}>
          <Text style={styles.permIcon}>📍</Text>
          <Text style={[styles.permTitle, { color: textColor }]}>Location access required</Text>
          <Text style={[styles.permBody, { color: textSecondary }]}>
            Enable location permission in your device settings to broadcast your position to passengers.
          </Text>
          <AnimatedPressable onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.backBtnText}>Go back</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.flex, { backgroundColor: bg }]}>
      <Stack.Screen options={{ title: 'Broadcast Location', headerShown: true }} />

      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Status indicator */}
          <View style={styles.statusSection}>
            <Animated.View
              style={[
                styles.statusBadge,
                { backgroundColor: statusBg, transform: [{ scale: statusScale }] },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: isBroadcasting ? '#FFFFFF' : textSecondary }]} />
              <Text style={[styles.statusText, { color: statusTextColor }]}>{statusText}</Text>
            </Animated.View>
            {isBroadcasting && (
              <Text style={[styles.updateCount, { color: textSecondary }]}>
                {updateCount} update{updateCount !== 1 ? 's' : ''} sent
              </Text>
            )}
          </View>

          {/* Map */}
          <View style={[styles.mapCard, { borderColor }]}>
            <Map
              initialRegion={mapRegion}
              driverLocation={mapDriverLocation}
              style={styles.map}
            />
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatCard
              label="Speed"
              value={speedDisplay}
              unit="km/h"
              cardBg={cardBg}
              textColor={textColor}
              textSecondary={textSecondary}
              borderColor={borderColor}
            />
            <StatCard
              label="Heading"
              value={headingDisplay}
              unit="degrees"
              cardBg={cardBg}
              textColor={textColor}
              textSecondary={textSecondary}
              borderColor={borderColor}
            />
          </View>

          {/* Coordinates card */}
          <View style={[styles.coordCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.coordRow}>
              <Text style={[styles.coordLabel, { color: textSecondary }]}>Latitude</Text>
              <Text style={[styles.coordValue, { color: textColor }]}>{latDisplay}</Text>
            </View>
            <View style={[styles.coordDivider, { backgroundColor: borderColor }]} />
            <View style={styles.coordRow}>
              <Text style={[styles.coordLabel, { color: textSecondary }]}>Longitude</Text>
              <Text style={[styles.coordValue, { color: textColor }]}>{lngDisplay}</Text>
            </View>
          </View>

          {/* Error message */}
          {lastError && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Text style={styles.errorBannerText}>{lastError}</Text>
            </View>
          )}

          {/* Toggle button */}
          <AnimatedPressable
            onPress={handleToggle}
            style={[
              styles.toggleButton,
              { backgroundColor: isBroadcasting ? '#DC2626' : colors.primary },
            ]}
          >
            <Text style={styles.toggleIcon}>{isBroadcasting ? '⏹' : '▶'}</Text>
            <Text style={styles.toggleText}>
              {isBroadcasting ? 'Stop broadcasting' : 'Start broadcasting'}
            </Text>
          </AnimatedPressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 15 },

  permIcon: { fontSize: 52, marginBottom: 16 },
  permTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  permBody: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  backBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  backBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  scroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },

  statusSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  updateCount: {
    fontSize: 13,
  },

  mapCard: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    flex: 1,
    borderRadius: 0,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  coordCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  coordDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  coordLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  errorBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },

  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  toggleIcon: { fontSize: 18 },
  toggleText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
