
import { colors } from '@/styles/commonStyles';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';
import { CustomModal } from '@/components/ui/CustomModal';
import { getRideDetails, createBooking } from '@/utils/ridesApi';
import { Ride } from '@/types/rides';
import { IconSymbol } from '@/components/IconSymbol';
import { SOSButton } from '@/components/safety/SOSButton';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function RideDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadRideDetails();
    }
  }, [id]);

  const loadRideDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getRideDetails(id);
      setRide(data);
      console.log('[RideDetails] Loaded ride:', data.id);
    } catch (error: any) {
      console.error('[RideDetails] Error loading ride:', error);
      showModal('Error', error.message || 'Failed to load ride details');
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleBookRide = async () => {
    if (!ride) return;

    if (selectedSeats > ride.availableSeats) {
      showModal('Error', 'Not enough seats available');
      return;
    }

    setIsBooking(true);
    console.log('[RideDetails] Booking', selectedSeats, 'seats for ride:', id);

    try {
      const booking = await createBooking({
        rideId: id,
        seatsBooked: selectedSeats,
      });

      showModal(
        'Booking Confirmed!',
        `Your booking code is: ${booking.bookingCode}\n\nPlease save this code for your records.`
      );
      console.log('[RideDetails] Booking successful:', booking.id);

      setTimeout(() => {
        router.push('/bookings/my-bookings');
      }, 2000);
    } catch (error: any) {
      console.error('[RideDetails] Booking error:', error);
      showModal('Booking Failed', error.message || 'Failed to book ride. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleShareRide = () => {
    console.log('[RideDetails] User tapped Share My Ride');
    router.push(`/safety/share-ride/${id}`);
  };

  const handleReportUser = () => {
    if (!ride?.driver) return;
    console.log('[RideDetails] User tapped Report Driver');
    router.push({
      pathname: '/safety/report-user',
      params: {
        userId: ride.driver.id,
        rideId: id,
      },
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPrice = ride ? ride.pricePerSeat * selectedSeats : 0;
  const formattedTotalPrice = `$${totalPrice.toFixed(2)}`;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Ride Details', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Ride Details', headerShown: true }} />
        <View style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorText}>Ride not found</Text>
          <Button title="Go Back" onPress={() => router.back()} style={styles.backButton} />
        </View>
      </SafeAreaView>
    );
  }

  const departureTimeText = formatTime(ride.departureTime);
  const departureDateText = formatDate(ride.departureTime);
  const arrivalTimeText = formatTime(ride.arrivalTime);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Ride Details', headerShown: true }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <View style={styles.originDot} />
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeCity}>{ride.origin}</Text>
              <Text style={styles.routeTime}>{departureTimeText}</Text>
              <Text style={styles.routeDate}>{departureDateText}</Text>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routePoint}>
              <View style={styles.destinationDot} />
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeCity}>{ride.destination}</Text>
              <Text style={styles.routeTime}>{arrivalTimeText}</Text>
            </View>
          </View>

          {ride.viaPoints && ride.viaPoints.length > 0 && (
            <View style={styles.viaPointsContainer}>
              <Text style={styles.viaPointsLabel}>Via:</Text>
              <Text style={styles.viaPointsText}>{ride.viaPoints.join(', ')}</Text>
            </View>
          )}
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account-circle"
                size={48}
                color={colors.primary}
              />
            </View>
            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{ride.driver?.fullName || 'Driver'}</Text>
                <VerificationBadge level={ride.driver?.verificationLevel || 'PhoneVerified'} />
              </View>
              <View style={styles.ratingRow}>
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="star"
                  size={16}
                  color="#FFD700"
                />
                <Text style={styles.ratingText}>4.8</Text>
                <Text style={styles.ratingCount}>(24 trips)</Text>
              </View>
            </View>
          </View>

          <View style={styles.vehicleInfo}>
            <IconSymbol
              ios_icon_name="car.fill"
              android_material_icon_name="drive-eta"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.vehicleText}>
              {ride.vehicle?.color} {ride.vehicle?.make} {ride.vehicle?.model}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <IconSymbol
              ios_icon_name="person.2.fill"
              android_material_icon_name="group"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.detailLabel}>Available Seats</Text>
            <Text style={styles.detailValue}>{ride.availableSeats}</Text>
          </View>

          <View style={styles.detailRow}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="payment"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.detailLabel}>Price per Seat</Text>
            <Text style={styles.detailValue}>${ride.pricePerSeat.toFixed(2)}</Text>
          </View>

          {ride.ladiesOnly && (
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.badgeText}>Ladies Only</Text>
              </View>
            </View>
          )}

          {ride.acceptsParcels && (
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <IconSymbol
                  ios_icon_name="shippingbox.fill"
                  android_material_icon_name="local-shipping"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.badgeText}>Accepts Parcels</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety Features</Text>
          
          <TouchableOpacity style={styles.safetyButton} onPress={handleShareRide}>
            <IconSymbol
              ios_icon_name="location.circle.fill"
              android_material_icon_name="location-on"
              size={24}
              color={colors.primary}
            />
            <View style={styles.safetyButtonText}>
              <Text style={styles.safetyButtonTitle}>Share My Ride</Text>
              <Text style={styles.safetyButtonSubtitle}>Let friends track your journey</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.sosContainer}>
            <SOSButton rideId={id} style={styles.sosButton} />
            <Text style={styles.sosText}>Emergency SOS</Text>
          </View>

          <TouchableOpacity style={styles.reportButton} onPress={handleReportUser}>
            <IconSymbol
              ios_icon_name="exclamationmark.shield.fill"
              android_material_icon_name="report"
              size={20}
              color={colors.error}
            />
            <Text style={styles.reportButtonText}>Report Driver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seatSelector}>
          <Text style={styles.seatSelectorLabel}>Select Seats</Text>
          <View style={styles.seatButtons}>
            {[1, 2, 3, 4].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.seatButton,
                  selectedSeats === num && styles.seatButtonSelected,
                  num > ride.availableSeats && styles.seatButtonDisabled,
                ]}
                onPress={() => setSelectedSeats(num)}
                disabled={num > ride.availableSeats}
              >
                <Text
                  style={[
                    styles.seatButtonText,
                    selectedSeats === num && styles.seatButtonTextSelected,
                    num > ride.availableSeats && styles.seatButtonTextDisabled,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.priceValue}>{formattedTotalPrice}</Text>
          </View>
          <Text style={styles.priceSubtext}>
            {selectedSeats} seat{selectedSeats > 1 ? 's' : ''} × ${ride.pricePerSeat.toFixed(2)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isBooking ? 'Booking...' : 'Book Now'}
          onPress={handleBookRide}
          disabled={isBooking || ride.availableSeats === 0}
          style={styles.bookButton}
        />
      </View>

      <CustomModal
        isVisible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onConfirm={() => setModalVisible(false)}
        confirmText="OK"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 32,
  },
  routeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routePoint: {
    flex: 1,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginBottom: 8,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    marginBottom: 8,
  },
  routeLine: {
    width: 2,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  routeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  routeCity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  routeTime: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  routeDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  viaPointsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viaPointsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  viaPointsText: {
    fontSize: 14,
    color: colors.text,
  },
  driverCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  driverHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  driverAvatar: {
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ratingCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  vehicleText: {
    fontSize: 14,
    color: colors.text,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  safetyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  safetyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  safetyButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  safetyButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  safetyButtonSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sosButton: {
    marginBottom: 8,
  },
  sosText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '10',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  seatSelector: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seatSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  seatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  seatButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  seatButtonSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  seatButtonDisabled: {
    opacity: 0.4,
  },
  seatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  seatButtonTextSelected: {
    color: colors.primary,
  },
  seatButtonTextDisabled: {
    color: colors.textSecondary,
  },
  priceCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bookButton: {
    width: '100%',
  },
});
