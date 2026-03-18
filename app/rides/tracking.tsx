import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map } from '@/components/Map';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';
import { supabase } from '@/app/integrations/supabase/client';

interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface RideStatusUpdate {
  ride_id: string;
  status: string;
  message?: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Finding your driver...',
  driver_assigned: 'Driver assigned',
  driver_en_route: 'Driver en route',
  driver_arrived: 'Driver has arrived',
  in_progress: 'Ride in progress',
  completed: 'Ride completed',
  cancelled: 'Ride cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  driver_assigned: colors.info,
  driver_en_route: colors.info,
  driver_arrived: colors.success,
  in_progress: colors.primary,
  completed: colors.success,
  cancelled: colors.error,
};

export default function TrackingScreen() {
  const router = useRouter();
  const { ride_id, driver_id } = useLocalSearchParams<{ ride_id: string; driver_id: string }>();

  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [rideStatus, setRideStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locationChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const statusChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!ride_id || !driver_id) {
      setError('Missing ride or driver information');
      setLoading(false);
      return;
    }

    console.log('[Tracking] Mounting tracking screen for ride:', ride_id, 'driver:', driver_id);
    loadInitialData();
    setupRealtimeSubscriptions();

    return () => {
      console.log('[Tracking] Cleaning up realtime subscriptions');
      if (locationChannelRef.current) {
        supabase.removeChannel(locationChannelRef.current);
      }
      if (statusChannelRef.current) {
        supabase.removeChannel(statusChannelRef.current);
      }
    };
  }, [ride_id, driver_id]);

  const loadInitialData = async () => {
    console.log('[Tracking] Fetching initial driver location and ride status');
    try {
      const [locationData, statusData] = await Promise.all([
        apiGet<{ data: DriverLocation }>(`/api/realtime/driver-location/${driver_id}`).catch(() => null),
        apiGet<{ data: RideStatusUpdate }>(`/api/realtime/ride-status/${ride_id}`).catch(() => null),
      ]);

      if (locationData?.data) {
        setDriverLocation({
          latitude: locationData.data.latitude,
          longitude: locationData.data.longitude,
        });
        console.log('[Tracking] Initial driver location loaded:', locationData.data.latitude, locationData.data.longitude);
      }

      if (statusData?.data?.status) {
        setRideStatus(statusData.data.status);
        console.log('[Tracking] Initial ride status loaded:', statusData.data.status);
      }
    } catch (err: any) {
      console.error('[Tracking] Error loading initial data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    console.log('[Tracking] Setting up realtime subscriptions');

    locationChannelRef.current = supabase
      .channel(`driver-location-${driver_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driver_id}`,
        },
        (payload) => {
          const record = payload.new as DriverLocation;
          if (record?.latitude && record?.longitude) {
            console.log('[Tracking] Driver location updated:', record.latitude, record.longitude);
            setDriverLocation({ latitude: record.latitude, longitude: record.longitude });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Tracking] Driver location channel status:', status);
      });

    statusChannelRef.current = supabase
      .channel(`ride-status-${ride_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_status_updates',
          filter: `ride_id=eq.${ride_id}`,
        },
        (payload) => {
          const record = payload.new as RideStatusUpdate;
          if (record?.status) {
            console.log('[Tracking] Ride status updated:', record.status);
            setRideStatus(record.status);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Tracking] Ride status channel status:', status);
      });
  };

  const handleMessageDriver = () => {
    console.log('[Tracking] User tapped Message Driver for ride:', ride_id);
    router.push({
      pathname: '/rides/chat',
      params: { ride_id, sender_type: 'passenger' },
    });
  };

  const statusLabel = STATUS_LABELS[rideStatus] || rideStatus;
  const statusColor = STATUS_COLORS[rideStatus] || colors.textSecondary;

  const defaultRegion = {
    latitude: driverLocation?.latitude ?? -17.8252,
    longitude: driverLocation?.longitude ?? 31.0335,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const mapMarkers = driverLocation
    ? [{ id: 'driver', latitude: driverLocation.latitude, longitude: driverLocation.longitude, title: 'Driver', description: 'Current driver location' }]
    : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Track Ride', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading ride tracking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Track Ride', headerShown: true }} />
        <View style={styles.errorContainer}>
          <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Track Ride', headerShown: true }} />

      <View style={[styles.statusBanner, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      <View style={styles.mapContainer}>
        <Map
          markers={mapMarkers}
          initialRegion={defaultRegion}
          style={styles.map}
        />
        {!driverLocation && (
          <View style={styles.mapOverlay}>
            <IconSymbol ios_icon_name="location.slash.fill" android_material_icon_name="location-off" size={32} color={colors.textSecondary} />
            <Text style={styles.mapOverlayText}>Waiting for driver location...</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {driverLocation && (
          <View style={styles.locationCard}>
            <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={18} color={colors.primary} />
            <Text style={styles.locationText}>
              Driver at {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.messageButton} onPress={handleMessageDriver}>
          <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={20} color="#fff" />
          <Text style={styles.messageButtonText}>Message Driver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: 16,
    textAlign: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  mapOverlayText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    padding: 16,
    gap: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
