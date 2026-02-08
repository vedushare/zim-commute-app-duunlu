
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomModal } from '@/components/ui/CustomModal';
import { getMyBookings, cancelBooking } from '@/utils/ridesApi';
import { Booking } from '@/types/rides';

export default function MyBookingsScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [cancelModal, setCancelModal] = useState({ visible: false, bookingId: '' });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      console.log('Loading passenger bookings');
      const data = await getMyBookings();
      setBookings(data);
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to load bookings' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      console.log('Cancelling booking:', bookingId);
      await cancelBooking(bookingId);
      await loadBookings();
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to cancel booking' });
    } finally {
      setCancellingId(null);
      setCancelModal({ visible: false, bookingId: '' });
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      case 'completed':
        return colors.textSecondary;
      default:
        return colors.text;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'My Bookings', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'My Bookings', headerShown: true }} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol ios_icon_name="ticket.fill" android_material_icon_name="confirmation-number" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Bookings</Text>
            <Text style={styles.emptyText}>You haven&apos;t booked any rides yet</Text>
          </View>
        ) : (
          <>
            <Text style={styles.header}>
              {bookings.length}
            </Text>
            <Text style={styles.subheader}>bookings</Text>
            
            {bookings.map((booking) => {
              const departureTimeText = formatTime(booking.ride?.departureTime || '');
              const departureDateText = formatDate(booking.ride?.departureTime || '');
              const priceText = `$${booking.totalPrice.toFixed(2)}`;
              const seatsText = `${booking.seatsBooked} seat${booking.seatsBooked > 1 ? 's' : ''}`;
              const vehicleText = `${booking.ride?.vehicle.make} ${booking.ride?.vehicle.model}`;
              const driverName = booking.ride?.driver.fullName || 'Unknown';
              const statusText = getStatusText(booking.status);
              const statusColor = getStatusColor(booking.status);
              const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
              const isCancelling = cancellingId === booking.id;
              
              return (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusText}>{statusText}</Text>
                    </View>
                    <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
                  </View>

                  <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                      <IconSymbol ios_icon_name="circle.fill" android_material_icon_name="circle" size={12} color={colors.primary} />
                      <Text style={styles.routeCity}>{booking.ride?.origin}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                      <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={12} color={colors.error} />
                      <Text style={styles.routeCity}>{booking.ride?.destination}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="access-time" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{departureTimeText}</Text>
                      <Text style={styles.detailSeparator}>•</Text>
                      <Text style={styles.detailText}>{departureDateText}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{driverName}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="car.fill" android_material_icon_name="directions-car" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{vehicleText}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingFooter}>
                    <View>
                      <Text style={styles.seatsText}>{seatsText}</Text>
                      <Text style={styles.priceText}>{priceText}</Text>
                    </View>
                    
                    {canCancel && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setCancelModal({ visible: true, bookingId: booking.id })}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <>
                            <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={colors.error} />
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <CustomModal
        visible={errorModal.visible}
        title="Error"
        message={errorModal.message}
        type="error"
        buttons={[{ text: 'OK', onPress: () => setErrorModal({ visible: false, message: '' }) }]}
        onClose={() => setErrorModal({ visible: false, message: '' })}
      />

      <CustomModal
        visible={cancelModal.visible}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        type="warning"
        buttons={[
          { text: 'No', onPress: () => setCancelModal({ visible: false, bookingId: '' }) },
          { text: 'Yes, Cancel', onPress: () => handleCancelBooking(cancelModal.bookingId), style: 'destructive' },
        ]}
        onClose={() => setCancelModal({ visible: false, bookingId: '' })}
      />
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
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  subheader: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  bookingCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCity: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: 5,
    marginVertical: 4,
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  detailSeparator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  seatsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 6,
  },
});
