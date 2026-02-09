
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomModal } from '@/components/ui/CustomModal';
import { ZIMBABWE_CITIES } from '@/constants/zimbabwe';
import { useAuth } from '@/contexts/AuthContext';
import { getVehicles, createRide, calculatePrice } from '@/utils/ridesApi';
import { Vehicle } from '@/types/rides';
import Button from '@/components/button';

export default function PostRideScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [viaPoints, setViaPoints] = useState<string[]>([]);
  const [departureDate, setDepartureDate] = useState(new Date());
  const [arrivalDate, setArrivalDate] = useState(new Date(Date.now() + 3600000));
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [totalSeats, setTotalSeats] = useState('1');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [instantBook, setInstantBook] = useState(false);
  const [ladiesOnly, setLadiesOnly] = useState(false);
  const [acceptsParcels, setAcceptsParcels] = useState(false);
  
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [showViaPointDropdown, setShowViaPointDropdown] = useState(false);
  const [viaPointIndex, setViaPointIndex] = useState(0);
  
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });

  const loadVehicles = useCallback(async () => {
    try {
      setLoadingVehicles(true);
      const data = await getVehicles();
      setVehicles(data);
      if (data.length > 0) {
        setSelectedVehicle(data[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load vehicles:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to load vehicles' });
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  const autoCalculatePrice = useCallback(async () => {
    if (!origin || !destination || origin === destination) return;
    
    try {
      setCalculatingPrice(true);
      const result = await calculatePrice(origin, destination);
      const distanceText = result.distance.toFixed(0);
      const priceText = result.suggestedPrice.toFixed(2);
      setPricePerSeat(priceText);
      console.log(`Price calculated: ${distanceText}km = $${priceText}`);
    } catch (error: any) {
      console.error('Failed to calculate price:', error);
    } finally {
      setCalculatingPrice(false);
    }
  }, [origin, destination]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    autoCalculatePrice();
  }, [autoCalculatePrice]);

  const handleAddViaPoint = () => {
    if (viaPoints.length < 3) {
      setViaPoints([...viaPoints, '']);
      setViaPointIndex(viaPoints.length);
      setShowViaPointDropdown(true);
    }
  };

  const handleRemoveViaPoint = (index: number) => {
    const newViaPoints = viaPoints.filter((_, i) => i !== index);
    setViaPoints(newViaPoints);
  };

  const handleViaPointSelect = (city: string) => {
    const newViaPoints = [...viaPoints];
    newViaPoints[viaPointIndex] = city;
    setViaPoints(newViaPoints);
    setShowViaPointDropdown(false);
  };

  const handlePostRide = async () => {
    if (!selectedVehicle) {
      setErrorModal({ visible: true, message: 'Please select a vehicle' });
      return;
    }
    if (!origin) {
      setErrorModal({ visible: true, message: 'Please select origin city' });
      return;
    }
    if (!destination) {
      setErrorModal({ visible: true, message: 'Please select destination city' });
      return;
    }
    if (origin === destination) {
      setErrorModal({ visible: true, message: 'Origin and destination must be different' });
      return;
    }
    if (!totalSeats || parseInt(totalSeats) < 1 || parseInt(totalSeats) > 7) {
      setErrorModal({ visible: true, message: 'Seats must be between 1 and 7' });
      return;
    }
    if (!pricePerSeat || parseFloat(pricePerSeat) <= 0) {
      setErrorModal({ visible: true, message: 'Please enter a valid price' });
      return;
    }
    if (departureDate <= new Date()) {
      setErrorModal({ visible: true, message: 'Departure time must be in the future' });
      return;
    }
    if (arrivalDate <= departureDate) {
      setErrorModal({ visible: true, message: 'Arrival time must be after departure time' });
      return;
    }

    try {
      setLoading(true);
      console.log('User posting ride:', user?.fullName);
      
      const filteredViaPoints = viaPoints.filter(point => point.trim() !== '');
      
      await createRide({
        vehicleId: selectedVehicle,
        origin,
        destination,
        viaPoints: filteredViaPoints,
        departureTime: departureDate.toISOString(),
        arrivalTime: arrivalDate.toISOString(),
        totalSeats: parseInt(totalSeats),
        pricePerSeat: parseFloat(pricePerSeat),
        instantBook,
        ladiesOnly,
        acceptsParcels,
      });

      setSuccessModal({ visible: true, message: 'Ride posted successfully!' });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Failed to post ride:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to post ride' });
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  const selectedVehicleText = selectedVehicleData 
    ? `${selectedVehicleData.make} ${selectedVehicleData.model} (${selectedVehicleData.year})`
    : 'Select Vehicle';

  if (loadingVehicles) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Post Ride', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Post Ride', headerShown: true }} />
        <View style={styles.emptyContainer}>
          <IconSymbol ios_icon_name="car.fill" android_material_icon_name="directions-car" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Vehicles</Text>
          <Text style={styles.emptyText}>Add a vehicle first to post rides</Text>
          <Button title="Add Vehicle" onPress={() => router.push('/vehicles/add-vehicle')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Post Ride', headerShown: true }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowVehicleDropdown(!showVehicleDropdown)}
          >
            <Text style={styles.dropdownText}>{selectedVehicleText}</Text>
            <IconSymbol ios_icon_name="chevron.down" android_material_icon_name="arrow-drop-down" size={24} color={colors.text} />
          </TouchableOpacity>
          {showVehicleDropdown && (
            <View style={styles.dropdownList}>
              {vehicles.map((vehicle) => {
                const vehicleText = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
                return (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedVehicle(vehicle.id);
                      setShowVehicleDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{vehicleText}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          
          <Text style={styles.label}>Origin</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowOriginDropdown(!showOriginDropdown)}
          >
            <Text style={[styles.dropdownText, !origin && styles.placeholderText]}>
              {origin || 'Select origin city'}
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

          <Text style={styles.label}>Destination</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDestinationDropdown(!showDestinationDropdown)}
          >
            <Text style={[styles.dropdownText, !destination && styles.placeholderText]}>
              {destination || 'Select destination city'}
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

          <View style={styles.viaPointsHeader}>
            <Text style={styles.label}>Via Points (Optional)</Text>
            {viaPoints.length < 3 && (
              <TouchableOpacity onPress={handleAddViaPoint} style={styles.addButton}>
                <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {viaPoints.map((point, index) => (
            <View key={index} style={styles.viaPointRow}>
              <TouchableOpacity
                style={[styles.dropdown, styles.viaPointDropdown]}
                onPress={() => {
                  setViaPointIndex(index);
                  setShowViaPointDropdown(true);
                }}
              >
                <Text style={[styles.dropdownText, !point && styles.placeholderText]}>
                  {point || `Via point ${index + 1}`}
                </Text>
                <IconSymbol ios_icon_name="chevron.down" android_material_icon_name="arrow-drop-down" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemoveViaPoint(index)} style={styles.removeButton}>
                <IconSymbol ios_icon_name="minus.circle.fill" android_material_icon_name="remove-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {showViaPointDropdown && (
            <View style={styles.dropdownList}>
              {ZIMBABWE_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.dropdownItem}
                  onPress={() => handleViaPointSelect(city)}
                >
                  <Text style={styles.dropdownItemText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <Text style={styles.label}>Departure Time</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDeparturePicker(true)}
          >
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={20} color={colors.primary} />
            <Text style={styles.dateText}>{departureDate.toLocaleString()}</Text>
          </TouchableOpacity>
          {showDeparturePicker && (
            <DateTimePicker
              value={departureDate}
              mode="datetime"
              display="default"
              onChange={(event, date) => {
                setShowDeparturePicker(Platform.OS === 'ios');
                if (date) setDepartureDate(date);
              }}
            />
          )}

          <Text style={styles.label}>Arrival Time</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowArrivalPicker(true)}
          >
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={20} color={colors.primary} />
            <Text style={styles.dateText}>{arrivalDate.toLocaleString()}</Text>
          </TouchableOpacity>
          {showArrivalPicker && (
            <DateTimePicker
              value={arrivalDate}
              mode="datetime"
              display="default"
              onChange={(event, date) => {
                setShowArrivalPicker(Platform.OS === 'ios');
                if (date) setArrivalDate(date);
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Seats</Text>
          
          <Text style={styles.label}>Available Seats</Text>
          <TextInput
            style={styles.input}
            value={totalSeats}
            onChangeText={setTotalSeats}
            keyboardType="number-pad"
            placeholder="1-7 seats"
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.priceRow}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.label}>Price per Seat (USD)</Text>
              <TextInput
                style={styles.input}
                value={pricePerSeat}
                onChangeText={setPricePerSeat}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            {calculatingPrice && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.priceLoader} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setInstantBook(!instantBook)}
          >
            <View style={styles.optionLeft}>
              <IconSymbol ios_icon_name="bolt.fill" android_material_icon_name="flash-on" size={24} color={colors.primary} />
              <Text style={styles.optionText}>Instant Book</Text>
            </View>
            <View style={[styles.checkbox, instantBook && styles.checkboxActive]}>
              {instantBook && <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setLadiesOnly(!ladiesOnly)}
          >
            <View style={styles.optionLeft}>
              <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="group" size={24} color={colors.primary} />
              <Text style={styles.optionText}>Ladies Only</Text>
            </View>
            <View style={[styles.checkbox, ladiesOnly && styles.checkboxActive]}>
              {ladiesOnly && <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setAcceptsParcels(!acceptsParcels)}
          >
            <View style={styles.optionLeft}>
              <IconSymbol ios_icon_name="shippingbox.fill" android_material_icon_name="local-shipping" size={24} color={colors.primary} />
              <Text style={styles.optionText}>Accepts Parcels</Text>
            </View>
            <View style={[styles.checkbox, acceptsParcels && styles.checkboxActive]}>
              {acceptsParcels && <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Posting...' : 'Post Ride'}
            onPress={handlePostRide}
            disabled={loading}
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
        title="Success"
        message={successModal.message}
        type="success"
        buttons={[{ text: 'OK', onPress: () => setSuccessModal({ visible: false, message: '' }) }]}
        onClose={() => setSuccessModal({ visible: false, message: '' })}
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
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
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
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
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
  viaPointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    padding: 4,
  },
  viaPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  viaPointDropdown: {
    flex: 1,
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLoader: {
    marginLeft: 12,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
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
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
});
