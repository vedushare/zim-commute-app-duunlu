import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface BookingItem {
  id: string;
  ride_id?: string;
  rideId?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  fare?: number;
  totalPrice?: number;
  total_price?: number;
  booking_code?: string;
  bookingCode?: string;
  created_at?: string;
  createdAt?: string;
  departure_time?: string;
  origin?: string;
  destination?: string;
  driver_name?: string;
  ride?: {
    origin: string;
    destination: string;
    departureTime?: string;
    departure_time?: string;
    driver?: { fullName?: string; full_name?: string };
    vehicle?: { make: string; model: string };
  };
}

const MOCK_BOOKINGS: BookingItem[] = [
  {
    id: 'mock-1',
    rideId: 'ride-1',
    status: 'confirmed',
    totalPrice: 5.0,
    bookingCode: 'ZIM-001',
    createdAt: new Date(Date.now() + 86400000).toISOString(),
    ride: {
      origin: 'Harare CBD',
      destination: 'Borrowdale',
      departureTime: new Date(Date.now() + 86400000).toISOString(),
      driver: { fullName: 'Tendai Moyo' },
      vehicle: { make: 'Toyota', model: 'Corolla' },
    },
  },
  {
    id: 'mock-2',
    rideId: 'ride-2',
    status: 'completed',
    totalPrice: 12.0,
    bookingCode: 'ZIM-002',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    ride: {
      origin: 'Bulawayo',
      destination: 'Victoria Falls',
      departureTime: new Date(Date.now() - 86400000 * 3).toISOString(),
      driver: { fullName: 'Chipo Ndlovu' },
      vehicle: { make: 'Honda', model: 'Fit' },
    },
  },
  {
    id: 'mock-3',
    rideId: 'ride-3',
    status: 'pending',
    totalPrice: 3.5,
    bookingCode: 'ZIM-003',
    createdAt: new Date(Date.now() + 172800000).toISOString(),
    ride: {
      origin: 'Mutare',
      destination: 'Nyanga',
      departureTime: new Date(Date.now() + 172800000).toISOString(),
      driver: { fullName: 'Rudo Chirwa' },
      vehicle: { make: 'Nissan', model: 'Note' },
    },
  },
];

type TabType = 'upcoming' | 'past';

export default function BookingsIndexScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const loadBookings = useCallback(async () => {
    console.log('[Bookings] Fetching bookings for user:', user?.id);
    try {
      const userId = user?.id || '';
      const data = await apiGet<BookingItem[] | { bookings: BookingItem[] }>(
        `/api/bookings?user_id=${userId}`
      );
      const list = Array.isArray(data) ? data : (data as any).bookings ?? [];
      setBookings(list.length > 0 ? list : MOCK_BOOKINGS);
      console.log('[Bookings] Loaded', list.length, 'bookings');
    } catch (err: any) {
      console.error('[Bookings] Error loading bookings, using mock data:', err.message);
      setBookings(MOCK_BOOKINGS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleRefresh = () => {
    console.log('[Bookings] User pulled to refresh');
    setRefreshing(true);
    loadBookings();
  };

  const isUpcoming = (b: BookingItem) => {
    const depTime = b.ride?.departureTime || b.ride?.departure_time || b.departure_time || b.createdAt || b.created_at || '';
    const isPast = b.status === 'completed' || b.status === 'cancelled';
    if (isPast) return false;
    if (!depTime) return b.status === 'confirmed' || b.status === 'pending';
    return new Date(depTime) >= new Date();
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter((b) => !isUpcoming(b));
  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      case 'completed': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderBooking = ({ item }: { item: BookingItem }) => {
    const origin = item.ride?.origin || item.origin || 'Unknown';
    const destination = item.ride?.destination || item.destination || 'Unknown';
    const depTime = item.ride?.departureTime || item.ride?.departure_time || item.departure_time || '';
    const dateText = formatDate(depTime);
    const timeText = formatTime(depTime);
    const driverName = item.ride?.driver?.fullName || item.ride?.driver?.full_name || item.driver_name || 'Driver';
    const fare = Number(item.totalPrice || item.total_price || item.fare || 0);
    const fareText = `$${fare.toFixed(2)}`;
    const code = item.bookingCode || item.booking_code || item.id.slice(0, 8).toUpperCase();
    const statusColor = getStatusColor(item.status);
    const statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log('[Bookings] User tapped booking:', item.id);
          router.push({ pathname: '/bookings/[id]', params: { id: item.id } });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          <Text style={styles.bookingCode}>{code}</Text>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.cityText} numberOfLines={1}>{origin}</Text>
          </View>
          <View style={styles.routeArrow}>
            <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={14} color={colors.textSecondary} />
          </View>
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <Text style={styles.cityText} numberOfLines={1}>{destination}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="access-time" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{timeText}</Text>
            {dateText ? <Text style={styles.metaText}>{dateText}</Text> : null}
          </View>
          <View style={styles.metaRow}>
            <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{driverName}</Text>
          </View>
          <Text style={styles.fareText}>{fareText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'My Bookings', headerShown: true }} />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => {
            console.log('[Bookings] User switched to Upcoming tab');
            setActiveTab('upcoming');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
          {upcomingBookings.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'upcoming' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'upcoming' && styles.tabBadgeTextActive]}>
                {upcomingBookings.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => {
            console.log('[Bookings] User switched to Past tab');
            setActiveTab('past');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
          {pastBookings.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'past' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'past' && styles.tabBadgeTextActive]}>
                {pastBookings.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="ticket.fill" android_material_icon_name="confirmation-number" size={56} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>Find a ride to get started.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeActive: {
    backgroundColor: colors.primary + '20',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: colors.primary,
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingCode: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cityText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  routeArrow: {
    paddingHorizontal: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  fareText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
