
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomModal } from '@/components/ui/CustomModal';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import { getRideDetails, createBooking } from '@/utils/ridesApi';
import { Ride } from '@/types/rides';
import Button from '@/components/button';

export default function RideDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [ride, setRide] = useState<Ride | null>(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '', bookingCode: '' });

  useEffect(() => {
    loadRideDetails();
  }, [id]); // loadRideDetails is stable, no need to include

  const loadRideDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading ride details:', id);
      const data = await getRideDetails(id as string);
      setRide(data);
    } catch (error: any) {
      console.error('Failed to load ride details:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to load ride details' });
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async () => {
    if (!ride) return;

    if (seatsToBook > ride.availableSeats) {
      setErrorModal({ visible: true, message: `Only ${ride.availableSeats} seats available` });
      return;
    }

    try {
      setBooking(true);
      console.log('Booking ride:', id, seatsToBook, 'seats');
      
      const result = await createBooking({
        rideId: ride.id,
        seatsBooked: seatsToBook,
      });

      const totalPriceText = `$${result.totalPrice.toFixed(2)}`;
      const statusText = result.status === 'confirmed' ? 'confirmed' : 'pending confirmation';
      const messageText = `Booking ${statusText}! Total: ${totalPriceText}`;
      
      setSuccessModal({ 
        visible: true, 
        message: messageText,
        bookingCode: result.bookingCode,
      });
      
      setTimeout(() => {
        router.push('/bookings/my-bookings');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to book ride:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to book ride' });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Ride Details', headerShown: true }} />
        <View style={styles.emptyContainer}>
          <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="error" size={64} color={colors.error} />
          <Text style={styles.emptyTitle}>Ride Not Found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  const departureTimeText = formatTime(ride.departureTime);
  const departureDateText = formatDate(ride.departureTime);
  const arrivalTimeText = formatTime(ride.arrivalTime);
  const priceText = `$${ride.pricePerSeat.toFixed(2)}`;
  const totalPriceText = `$${(ride.pricePerSeat * seatsToBook).toFixed(2)}`;
  const vehicleText = `${ride.vehicle?.make} ${ride.vehicle?.model} (${ride.vehicle?.year})`;
  const colorText = ride.vehicle?.color || 'Unknown';
  const plateText = ride.vehicle?.licensePlate || 'N/A';
  const driverName = ride.driver?.fullName || 'Unknown';
  const driverCity = ride.driver?.homeCity || 'Unknown';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Ride Details', headerShown: true }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <IconSymbol ios_icon_name="circle.fill" android_material_icon_name="circle" size={16} color={colors.primary} />
              <Text style={styles.routeCity}>{ride.origin}</Text>
            </View>
            <View style={styles.routeLine} />
            {ride.viaPoints && ride.viaPoints.length > 0 && ride.viaPoints.map((point, index) => (
              <React.Fragment key={index}>
                <View style={styles.routePoint}>
                  <IconSymbol ios_icon_name="circle" android_material_icon_name="circle" size={12} color={colors.textSecondary} />
                  <Text style={styles.viaPoint}>{point}</Text>
                </View>
                <View style={styles.routeLine} />
              </React.Fragment>
            ))}
            <View style={styles.routePoint}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={16} color={colors.error} />
              <Text style={styles.routeCity}>{ride.destination}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Departure</Text>
              <Text style={styles.scheduleTime}>{departureTimeText}</Text>
              <Text style={styles.scheduleDate}>{departureDateText}</Text>
            </View>
            <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={24} color={colors.textSecondary} />
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Arrival</Text>
              <Text style={styles.scheduleTime}>{arrivalTimeText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Driver</Text>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={32} color={colors.primary} />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driverName}</Text>
              <Text style={styles.driverCity}>{driverCity}</Text>
              <VerificationBadge level={ride.driver?.verificationLevel || 'PhoneVerified'} size="small" />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <View style={styles.vehicleInfo}>
            <IconSymbol ios_icon_name="car.fill" android_material_icon_name="directions-car" size={24} color={colors.primary} />
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleText}>{vehicleText}</Text>
              <Text style={styles.vehicleSubtext}>{colorText}</Text>
              <Text style={styles.vehicleSubtext}>{plateText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing & Seats</Text>
          <View style={styles.pricingRow}>
            <View>
              <Text style={styles.priceLabel}>Price per seat</Text>
              <Text style={styles.price}>{priceText}</Text>
            </View>
            <View>
              <Text style={styles.seatsLabel}>Available</Text>
              <Text style={styles.seatsText}>
                {ride.availableSeats}
              </Text>
              <Text style={styles.seatsSubtext}>seats</Text>
            </View>
          </View>

          <Text style={styles.selectSeatsLabel}>Select seats to book</Text>
          <View style={styles.seatsSelector}>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const isDisabled = num > ride.availableSeats;
              const isSelected = num === seatsToBook;
              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.seatButton,
                    isSelected && styles.seatButtonSelected,
                    isDisabled && styles.seatButtonDisabled,
                  ]}
                  onPress={() => !isDisabled && setSeatsToBook(num)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.seatButtonText,
                    isSelected && styles.seatButtonTextSelected,
                    isDisabled && styles.seatButtonTextDisabled,
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalPrice}>{totalPriceText}</Text>
          </View>
        </View>

        {(ride.instantBook || ride.ladiesOnly || ride.acceptsParcels) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.features}>
              {ride.instantBook && (
                <View style={styles.feature}>
                  <IconSymbol ios_icon_name="bolt.fill" android_material_icon_name="flash-on" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Instant Booking</Text>
                </View>
              )}
              {ride.ladiesOnly && (
                <View style={styles.feature}>
                  <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="group" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Ladies Only</Text>
                </View>
              )}
              {ride.acceptsParcels && (
                <View style={styles.feature}>
                  <IconSymbol ios_icon_name="shippingbox.fill" android_material_icon_name="local-shipping" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Accepts Parcels</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={booking ? 'Booking...' : 'Book Ride'}
            onPress={handleBookRide}
            disabled={booking || ride.availableSeats === 0}
          />
        </View>
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
        visible={successModal.visible}
        title="Booking Successful!"
        message={`${successModal.message}\n\nBooking Code: ${successModal.bookingCode}`}
        type="success"
        buttons={[{ text: 'View Bookings', onPress: () => router.push('/bookings/my-bookings') }]}
        onClose={() => setSuccessModal({ visible: false, message: '', bookingCode: '' })}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  routeContainer: {
    paddingVertical: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCity: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  viaPoint: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  routeLine: {
    width: 2,
    height: 32,
    backgroundColor: colors.border,
    marginLeft: 7,
    marginVertical: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleItem: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  scheduleDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  driverCity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginLeft: 16,
    flex: 1,
  },
  vehicleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  vehicleSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  seatsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  seatsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
  },
  seatsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  selectSeatsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  seatsSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  seatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seatButtonDisabled: {
    opacity: 0.3,
  },
  seatButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  seatButtonTextSelected: {
    color: '#fff',
  },
  seatButtonTextDisabled: {
    color: colors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  features: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
});
