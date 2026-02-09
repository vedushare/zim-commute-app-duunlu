
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getAdminRides } from '@/utils/adminApi';
import type { AdminRide } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';

export default function AdminRidesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const loadRides = useCallback(async () => {
    console.log('Loading admin rides');
    try {
      const response = await getAdminRides({
        status: statusFilter,
        page,
        limit: 20,
      });
      setRides(response.data);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to load rides:', error);
      showModal('Error', error.message || 'Failed to load rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadRides();
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Ride Management', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Ride Management', headerShown: true }} />
      
      {/* Status Filter */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'completed', 'cancelled'].map((status) => {
            const statusValue = status as typeof statusFilter;
            const isActive = statusFilter === statusValue;
            
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
                onPress={() => {
                  setStatusFilter(statusValue);
                  setPage(1);
                }}
              >
                <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.ridesList}>
          {rides.map((ride) => {
            const driverName = ride.driver.fullName;
            const origin = ride.origin;
            const destination = ride.destination;
            const departureTime = formatDate(ride.departureTime);
            const pricePerSeat = formatCurrency(ride.pricePerSeat);
            const availableSeats = ride.availableSeats;
            const totalSeats = ride.totalSeats;
            const status = ride.status;

            return (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View style={styles.rideInfo}>
                    <Text style={styles.rideRoute}>
                      {origin} → {destination}
                    </Text>
                    <Text style={styles.rideDriver}>Driver: {driverName}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      status === 'completed' && styles.statusBadgeCompleted,
                      status === 'cancelled' && styles.statusBadgeCancelled,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.rideDetails}>
                  <View style={styles.rideDetailRow}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="schedule"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.rideDetailText}>{departureTime}</Text>
                  </View>
                  <View style={styles.rideDetailRow}>
                    <IconSymbol
                      ios_icon_name="dollarsign.circle"
                      android_material_icon_name="attach-money"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.rideDetailText}>{pricePerSeat} per seat</Text>
                  </View>
                  <View style={styles.rideDetailRow}>
                    <IconSymbol
                      ios_icon_name="person.2"
                      android_material_icon_name="people"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.rideDetailText}>
                      {availableSeats}/{totalSeats} seats available
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {rides.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="car"
                android_material_icon_name="directions-car"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No rides found</Text>
            </View>
          )}
        </View>

        {/* Pagination */}
        {total > 20 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Page {page} of {Math.ceil(total / 20)}
            </Text>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                page >= Math.ceil(total / 20) && styles.paginationButtonDisabled,
              ]}
              onPress={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / 20)}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CustomModal
        visible={modalVisible}
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
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ridesList: {
    padding: 16,
  },
  rideCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rideInfo: {
    flex: 1,
  },
  rideRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  rideDriver: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: colors.success,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeCompleted: {
    backgroundColor: colors.info,
  },
  statusBadgeCancelled: {
    backgroundColor: colors.danger,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rideDetails: {
    gap: 8,
  },
  rideDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideDetailText: {
    fontSize: 14,
    color: colors.text,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  paginationButtonDisabled: {
    backgroundColor: colors.backgroundAlt,
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
