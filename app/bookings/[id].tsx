import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet, authenticatedDelete } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface BookingDetail {
  id: string;
  ride_id?: string;
  rideId?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  fare?: number;
  totalPrice?: number;
  total_price?: number;
  booking_code?: string;
  bookingCode?: string;
  promo_code?: string;
  promoCode?: string;
  discount?: number;
  created_at?: string;
  createdAt?: string;
  ride?: {
    origin: string;
    destination: string;
    departureTime?: string;
    departure_time?: string;
    driver?: {
      id?: string;
      fullName?: string;
      full_name?: string;
      phoneNumber?: string;
      phone_number?: string;
    };
    vehicle?: { make: string; model: string; licensePlate?: string; license_plate?: string };
  };
  driver_id?: string;
  driverId?: string;
}

const MOCK_BOOKING: BookingDetail = {
  id: 'mock-detail-1',
  rideId: 'ride-1',
  status: 'confirmed',
  totalPrice: 5.0,
  bookingCode: 'ZIM-001',
  createdAt: new Date(Date.now() + 86400000).toISOString(),
  ride: {
    origin: 'Harare CBD',
    destination: 'Borrowdale',
    departureTime: new Date(Date.now() + 86400000).toISOString(),
    driver: { id: 'driver-1', fullName: 'Tendai Moyo', phoneNumber: '+263771234567' },
    vehicle: { make: 'Toyota', model: 'Corolla', licensePlate: 'ABC 1234' },
  },
};

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!id) return;
    console.log('[BookingDetail] Fetching booking:', id);
    try {
      const data = await apiGet<BookingDetail | { booking: BookingDetail }>(`/api/bookings/${id}`);
      const b = (data as any).booking ?? data as BookingDetail;
      setBooking(b);
      console.log('[BookingDetail] Booking loaded:', b.id);
    } catch (err: any) {
      console.error('[BookingDetail] Error loading booking, using mock:', err.message);
      setBooking({ ...MOCK_BOOKING, id: id || MOCK_BOOKING.id });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleCancelBooking = () => {
    console.log('[BookingDetail] User tapped Cancel Booking:', id);
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await authenticatedDelete(`/api/bookings/${id}`);
              console.log('[BookingDetail] Booking cancelled:', id);
              Alert.alert('Cancelled', 'Your booking has been cancelled.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              console.error('[BookingDetail] Cancel error:', err.message);
              Alert.alert('Error', err.message || 'Failed to cancel booking.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleTrackRide = () => {
    const rideId = booking?.rideId || booking?.ride_id || '';
    const driverId = booking?.driverId || booking?.driver_id || booking?.ride?.driver?.id || '';
    console.log('[BookingDetail] User tapped Track Ride, ride:', rideId, 'driver:', driverId);
    router.push({ pathname: '/rides/tracking', params: { ride_id: rideId, driver_id: driverId } });
  };

  const handleMessageDriver = () => {
    const rideId = booking?.rideId || booking?.ride_id || '';
    console.log('[BookingDetail] User tapped Message Driver, ride:', rideId);
    router.push({
      pathname: '/rides/chat',
      params: { ride_id: rideId, sender_type: 'passenger' },
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      case 'completed': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Booking Details', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Booking Details', headerShown: true }} />
        <View style={styles.errorContainer}>
          <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color={colors.error} />
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const origin = booking.ride?.origin || 'Unknown';
  const destination = booking.ride?.destination || 'Unknown';
  const depTime = booking.ride?.departureTime || booking.ride?.departure_time;
  const dateText = formatDate(depTime);
  const timeText = formatTime(depTime);
  const driverName = booking.ride?.driver?.fullName || booking.ride?.driver?.full_name || 'Driver';
  const driverPhone = booking.ride?.driver?.phoneNumber || booking.ride?.driver?.phone_number || '';
  const vehicleMake = booking.ride?.vehicle?.make || '';
  const vehicleModel = booking.ride?.vehicle?.model || '';
  const vehiclePlate = booking.ride?.vehicle?.licensePlate || booking.ride?.vehicle?.license_plate || '';
  const fare = Number(booking.totalPrice || booking.total_price || booking.fare || 0);
  const discount = Number(booking.discount || 0);
  const finalFare = fare - discount;
  const fareText = `$${fare.toFixed(2)}`;
  const discountText = discount > 0 ? `-$${discount.toFixed(2)}` : null;
  const finalFareText = `$${finalFare.toFixed(2)}`;
  const promoCode = booking.promoCode || booking.promo_code;
  const code = booking.bookingCode || booking.booking_code || id?.slice(0, 8).toUpperCase();
  const statusColor = getStatusColor(booking.status);
  const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
  const isUpcoming = booking.status === 'confirmed' || booking.status === 'pending';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Booking Details', headerShown: true }} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          <Text style={styles.bookingCode}>{code}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeCity}>{origin}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.dot, { backgroundColor: colors.error }]} />
              <View>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeCity}>{destination}</Text>
              </View>
            </View>
          </View>
          <View style={styles.timeRow}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="access-time" size={14} color={colors.textSecondary} />
            <Text style={styles.timeText}>{timeText}</Text>
            <Text style={styles.dateText}>{dateText}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Driver</Text>
          <View style={styles.infoRow}>
            <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="account-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{driverName}</Text>
          </View>
          {driverPhone ? (
            <View style={styles.infoRow}>
              <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{driverPhone}</Text>
            </View>
          ) : null}
          {(vehicleMake || vehicleModel) ? (
            <View style={styles.infoRow}>
              <IconSymbol ios_icon_name="car.fill" android_material_icon_name="directions-car" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{vehicleMake} {vehicleModel}</Text>
              {vehiclePlate ? <Text style={styles.plateText}>{vehiclePlate}</Text> : null}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fare Breakdown</Text>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Base fare</Text>
            <Text style={styles.fareValue}>{fareText}</Text>
          </View>
          {promoCode ? (
            <View style={styles.fareRow}>
              <View style={styles.promoRow}>
                <IconSymbol ios_icon_name="tag.fill" android_material_icon_name="local-offer" size={14} color={colors.success} />
                <Text style={styles.promoText}>{promoCode}</Text>
              </View>
              <Text style={styles.discountText}>{discountText}</Text>
            </View>
          ) : null}
          <View style={[styles.fareRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{finalFareText}</Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          {isUpcoming && (
            <TouchableOpacity style={styles.actionButton} onPress={handleTrackRide}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Track Ride</Text>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={handleMessageDriver}>
            <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Message Driver</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isUpcoming && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelBooking}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={colors.error} />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { fontSize: 16, color: colors.error, marginTop: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 13, fontWeight: '600' },
  bookingCode: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'monospace' },
  card: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  routePoint: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  routeCity: { fontSize: 16, fontWeight: '600', color: colors.text },
  routeLine: { width: 2, height: 32, backgroundColor: colors.border, marginHorizontal: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  dateText: { fontSize: 14, color: colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { fontSize: 15, color: colors.text, flex: 1 },
  plateText: { fontSize: 13, color: colors.textSecondary, fontFamily: 'monospace' },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fareLabel: { fontSize: 14, color: colors.textSecondary },
  fareValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promoText: { fontSize: 13, color: colors.success, fontWeight: '600' },
  discountText: { fontSize: 14, color: colors.success, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  actionsCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButtonText: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '10',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
