
import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: string;
  driver: string;
  seats: number;
}

export default function HomeScreen() {
  console.log('HomeScreen: Rendering ZimCommute home screen');
  
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  // Mock data for available rides
  const mockRides: Ride[] = [
    {
      id: '1',
      from: 'Harare',
      to: 'Bulawayo',
      date: '2024-01-20',
      time: '08:00',
      price: 'USD $25',
      driver: 'Tendai M.',
      seats: 3,
    },
    {
      id: '2',
      from: 'Harare',
      to: 'Mutare',
      date: '2024-01-20',
      time: '09:30',
      price: 'USD $15',
      driver: 'Chipo K.',
      seats: 2,
    },
    {
      id: '3',
      from: 'Bulawayo',
      to: 'Victoria Falls',
      date: '2024-01-21',
      time: '07:00',
      price: 'USD $20',
      driver: 'Tafadzwa N.',
      seats: 4,
    },
  ];

  const handleSearch = () => {
    console.log('User tapped Search button', { from: searchFrom, to: searchTo });
    // TODO: Backend Integration - GET /api/rides with query params { from, to, date }
  };

  const handleBookRide = (rideId: string) => {
    console.log('User tapped Book button for ride:', rideId);
    // TODO: Backend Integration - POST /api/bookings with { rideId, userId }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ZimCommute</Text>
          <Text style={styles.tagline}>Share rides, save money</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Find a ride</Text>
          
          <View style={styles.inputContainer}>
            <IconSymbol 
              ios_icon_name="location.circle.fill" 
              android_material_icon_name="location-on" 
              size={24} 
              color={colors.primary} 
            />
            <TextInput
              style={styles.input}
              placeholder="From (e.g., Harare)"
              placeholderTextColor={colors.textSecondary}
              value={searchFrom}
              onChangeText={setSearchFrom}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol 
              ios_icon_name="location.circle" 
              android_material_icon_name="place" 
              size={24} 
              color={colors.accent} 
            />
            <TextInput
              style={styles.input}
              placeholder="To (e.g., Bulawayo)"
              placeholderTextColor={colors.textSecondary}
              value={searchTo}
              onChangeText={setSearchTo}
            />
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <IconSymbol 
              ios_icon_name="magnifyingglass" 
              android_material_icon_name="search" 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.searchButtonText}>Search Rides</Text>
          </TouchableOpacity>
        </View>

        {/* Available Rides */}
        <View style={styles.ridesSection}>
          <Text style={styles.sectionTitle}>Available Rides</Text>
          
          {mockRides.map((ride) => {
            const fromCity = ride.from;
            const toCity = ride.to;
            const dateDisplay = ride.date;
            const timeDisplay = ride.time;
            const priceDisplay = ride.price;
            const driverName = ride.driver;
            const seatsAvailable = ride.seats;
            
            return (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View style={styles.routeContainer}>
                    <Text style={styles.cityText}>{fromCity}</Text>
                    <IconSymbol 
                      ios_icon_name="arrow.right" 
                      android_material_icon_name="arrow-forward" 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.cityText}>{toCity}</Text>
                  </View>
                  <Text style={styles.priceText}>{priceDisplay}</Text>
                </View>

                <View style={styles.rideDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol 
                      ios_icon_name="calendar" 
                      android_material_icon_name="calendar-today" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.detailText}>{dateDisplay}</Text>
                    <Text style={styles.detailText}> at </Text>
                    <Text style={styles.detailText}>{timeDisplay}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol 
                      ios_icon_name="person.circle" 
                      android_material_icon_name="person" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.detailText}>{driverName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol 
                      ios_icon_name="person.2" 
                      android_material_icon_name="group" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.detailText}>{seatsAvailable}</Text>
                    <Text style={styles.detailText}> seats available</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => handleBookRide(ride.id)}
                >
                  <Text style={styles.bookButtonText}>Book Ride</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ridesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  rideCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  rideDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  bookButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
