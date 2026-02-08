
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { ZIMBABWE_CITIES } from '@/constants/zimbabwe';
import { searchRides } from '@/utils/ridesApi';
import { Ride } from '@/types/rides';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import Button from '@/components/button';

export default function HomeScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [ladiesOnly, setLadiesOnly] = useState(false);
  const [verifiedDriversOnly, setVerifiedDriversOnly] = useState(false);
  
  const [rides, setRides] = useState<Ride[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!origin || !destination) {
      return;
    }

    try {
      setLoading(true);
      console.log('Searching rides:', origin, destination, date.toISOString().split('T')[0]);
      
      const results = await searchRides({
        origin,
        destination,
        date: date.toISOString().split('T')[0],
        minPrice,
        maxPrice,
        ladiesOnly: ladiesOnly || undefined,
        verifiedDriversOnly: verifiedDriversOnly || undefined,
      });

      setRides(results);
      setHasSearched(true);
    } catch (error: any) {
      console.error('Failed to search rides:', error);
      setRides([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRidePress = (rideId: string) => {
    console.log('User tapped ride:', rideId);
    router.push(`/rides/${rideId}`);
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
    return `${day} ${month}`;
  };

  const selectedDateText = date.toLocaleDateString();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Find a Ride</Text>
          <Text style={styles.subtitle}>Search for available rides in Zimbabwe</Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.label}>From</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowOriginDropdown(!showOriginDropdown)}
          >
            <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.dropdownText, !origin && styles.placeholderText]}>
              {origin || 'Select origin'}
            </Text>
            <IconSymbol ios_icon_name="chevron.down" android_material_icon_name="arrow-drop-down" size={24} color={colors.text} />
          </TouchableOpacity>
          {showOriginDropdown && (
            <View style={styles.dropdownList}>
              {ZIMBABWE_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setOrigin(city);
                    setShowOriginDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>To</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDestinationDropdown(!showDestinationDropdown)}
          >
            <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.dropdownText, !destination && styles.placeholderText]}>
              {destination || 'Select destination'}
            </Text>
            <IconSymbol ios_icon_name="chevron.down" android_material_icon_name="arrow-drop-down" size={24} color={colors.text} />
          </TouchableOpacity>
          {showDestinationDropdown && (
            <View style={styles.dropdownList}>
              {ZIMBABWE_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setDestination(city);
                    setShowDestinationDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDatePicker(true)}
          >
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={20} color={colors.primary} />
            <Text style={styles.dropdownText}>{selectedDateText}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <IconSymbol ios_icon_name="slider.horizontal.3" android_material_icon_name="tune" size={20} color={colors.primary} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setLadiesOnly(!ladiesOnly)}
              >
                <Text style={styles.filterOptionText}>Ladies Only</Text>
                <View style={[styles.checkbox, ladiesOnly && styles.checkboxActive]}>
                  {ladiesOnly && <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setVerifiedDriversOnly(!verifiedDriversOnly)}
              >
                <Text style={styles.filterOptionText}>Verified Drivers Only</Text>
                <View style={[styles.checkbox, verifiedDriversOnly && styles.checkboxActive]}>
                  {verifiedDriversOnly && <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            </View>
          )}

          <Button
            title={loading ? 'Searching...' : 'Search Rides'}
            onPress={handleSearch}
            disabled={loading || !origin || !destination}
          />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Searching for rides...</Text>
          </View>
        )}

        {!loading && hasSearched && rides.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol ios_icon_name="car.fill" android_material_icon_name="directions-car" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Rides Found</Text>
            <Text style={styles.emptyText}>Try adjusting your search criteria</Text>
          </View>
        )}

        {!loading && rides.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {rides.length}
            </Text>
            <Text style={styles.resultsSubtitle}>available rides</Text>
            
            {rides.map((ride) => {
              const departureTimeText = formatTime(ride.departureTime);
              const departureDateText = formatDate(ride.departureTime);
              const arrivalTimeText = formatTime(ride.arrivalTime);
              const priceText = `$${ride.pricePerSeat.toFixed(2)}`;
              const seatsText = `${ride.availableSeats} seats`;
              const vehicleText = `${ride.vehicle?.make} ${ride.vehicle?.model}`;
              const driverName = ride.driver?.fullName || 'Unknown';
              
              return (
                <TouchableOpacity
                  key={ride.id}
                  style={styles.rideCard}
                  onPress={() => handleRidePress(ride.id)}
                >
                  <View style={styles.rideHeader}>
                    <View style={styles.driverInfo}>
                      <View style={styles.driverAvatar}>
                        <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={24} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.driverName}>{driverName}</Text>
                        <VerificationBadge level={ride.driver?.verificationLevel || 'PhoneVerified'} size="small" />
                      </View>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{priceText}</Text>
                      <Text style={styles.priceLabel}>per seat</Text>
                    </View>
                  </View>

                  <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                      <IconSymbol ios_icon_name="circle.fill" android_material_icon_name="circle" size={12} color={colors.primary} />
                      <Text style={styles.routeCity}>{ride.origin}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                      <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={12} color={colors.error} />
                      <Text style={styles.routeCity}>{ride.destination}</Text>
                    </View>
                  </View>

                  <View style={styles.rideDetails}>
                    <View style={styles.detailItem}>
                      <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="access-time" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{departureTimeText}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{departureDateText}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <IconSymbol ios_icon_name="car.fill" android_material_icon_name="directions-car" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{vehicleText}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="event-seat" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{seatsText}</Text>
                    </View>
                  </View>

                  {(ride.instantBook || ride.ladiesOnly || ride.acceptsParcels) && (
                    <View style={styles.badges}>
                      {ride.instantBook && (
                        <View style={styles.badge}>
                          <IconSymbol ios_icon_name="bolt.fill" android_material_icon_name="flash-on" size={12} color={colors.primary} />
                          <Text style={styles.badgeText}>Instant</Text>
                        </View>
                      )}
                      {ride.ladiesOnly && (
                        <View style={styles.badge}>
                          <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="group" size={12} color={colors.primary} />
                          <Text style={styles.badgeText}>Ladies</Text>
                        </View>
                      )}
                      {ride.acceptsParcels && (
                        <View style={styles.badge}>
                          <IconSymbol ios_icon_name="shippingbox.fill" android_material_icon_name="local-shipping" size={12} color={colors.primary} />
                          <Text style={styles.badgeText}>Parcels</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  dropdownList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  filterButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
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
  resultsContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  rideCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
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
  rideDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
});
