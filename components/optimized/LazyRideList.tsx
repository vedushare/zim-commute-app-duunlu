
/**
 * Lazy Loading Ride List Component
 * 
 * Implements virtualization and pagination for better performance
 * with large ride lists.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { Ride } from '@/types/rides';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import { IconSymbol } from '@/components/IconSymbol';

interface LazyRideListProps {
  rides: Ride[];
  loading: boolean;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  emptyMessage?: string;
}

export function LazyRideList({
  rides,
  loading,
  onRefresh,
  onLoadMore,
  hasMore = false,
  emptyMessage = 'No rides found',
}: LazyRideListProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  }, [onLoadMore, loadingMore, hasMore]);

  const handleRidePress = useCallback((rideId: string) => {
    console.log('[LazyRideList] User tapped ride:', rideId);
    router.push(`/rides/${rideId}`);
  }, [router]);

  const renderRideItem = useCallback(({ item }: { item: Ride }) => {
    const departureTime = new Date(item.departureTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const departureDate = new Date(item.departureTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const priceText = `$${item.pricePerSeat}`;
    const seatsText = `${item.availableSeats} seats`;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.rideCard}
        onPress={() => handleRidePress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.rideHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.cityText}>{item.origin}</Text>
            <IconSymbol
              ios_icon_name="arrow.right"
              android_material_icon_name="arrow-forward"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.cityText}>{item.destination}</Text>
          </View>
          <Text style={styles.priceText}>{priceText}</Text>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.detailRow}>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="schedule"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.detailText}>{departureTime}</Text>
            <Text style={styles.detailText}>•</Text>
            <Text style={styles.detailText}>{departureDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <IconSymbol
              ios_icon_name="person.2"
              android_material_icon_name="person"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.detailText}>{seatsText}</Text>
          </View>
        </View>

        {item.instantBook && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Instant Book</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handleRidePress]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loadingMore]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <IconSymbol
          ios_icon_name="car"
          android_material_icon_name="directions-car"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }, [loading, emptyMessage]);

  return (
    <FlatList
      data={rides}
      renderItem={renderRideItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  rideCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  rideDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
