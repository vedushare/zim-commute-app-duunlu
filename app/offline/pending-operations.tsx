
/**
 * Pending Operations Screen
 * 
 * Shows all queued operations waiting to sync
 */

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
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPendingOperations, PendingOperation, clearPendingOperations } from '@/utils/pendingOperations';
import { forceSyncNow } from '@/utils/syncManager';
import { useConnectivity } from '@/utils/connectivityManager';
import { CustomModal } from '@/components/ui/CustomModal';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import Button from '@/components/button';

export default function PendingOperationsScreen() {
  const [operations, setOperations] = useState<PendingOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { isOnline } = useConnectivity();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    try {
      const ops = await getPendingOperations();
      setOperations(ops);
    } catch (error) {
      console.error('Error loading operations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOperations();
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      showModal('Offline', 'Cannot sync while offline. Please connect to the internet.');
      return;
    }

    setSyncing(true);
    try {
      await forceSyncNow();
      await loadOperations();
      showModal('Success', 'All pending operations have been synced successfully.');
    } catch (error: any) {
      showModal('Sync Failed', error.message || 'Failed to sync operations. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearPendingOperations();
      await loadOperations();
      showModal('Cleared', 'All pending operations have been cleared.');
    } catch (error: any) {
      showModal('Error', error.message || 'Failed to clear operations.');
    }
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'CREATE_RIDE':
      case 'UPDATE_RIDE':
      case 'DELETE_RIDE':
        return 'directions-car';
      case 'CREATE_BOOKING':
      case 'CANCEL_BOOKING':
        return 'event-seat';
      case 'UPDATE_PROFILE':
        return 'person';
      case 'CREATE_VEHICLE':
      case 'DELETE_VEHICLE':
        return 'directions-car';
      case 'CREATE_EMERGENCY_CONTACT':
      case 'DELETE_EMERGENCY_CONTACT':
        return 'contacts';
      case 'CREATE_RATING':
        return 'star';
      case 'CREATE_REPORT':
        return 'report';
      default:
        return 'sync';
    }
  };

  const getOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      CREATE_RIDE: 'Create Ride',
      UPDATE_RIDE: 'Update Ride',
      DELETE_RIDE: 'Delete Ride',
      CREATE_BOOKING: 'Create Booking',
      CANCEL_BOOKING: 'Cancel Booking',
      UPDATE_PROFILE: 'Update Profile',
      CREATE_VEHICLE: 'Add Vehicle',
      DELETE_VEHICLE: 'Delete Vehicle',
      CREATE_EMERGENCY_CONTACT: 'Add Emergency Contact',
      DELETE_EMERGENCY_CONTACT: 'Delete Emergency Contact',
      CREATE_RATING: 'Submit Rating',
      CREATE_REPORT: 'Submit Report',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.info;
      case 'failed':
        return colors.error;
      case 'completed':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) {
      const minutesText = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      return `${minutesText} ago`;
    }
    if (hours < 24) {
      const hoursText = `${hours} hour${hours !== 1 ? 's' : ''}`;
      return `${hoursText} ago`;
    }
    const daysText = `${days} day${days !== 1 ? 's' : ''}`;
    return `${daysText} ago`;
  };

  const pendingCount = operations.filter(op => op.status === 'pending' || op.status === 'processing').length;
  const failedCount = operations.filter(op => op.status === 'failed').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Pending Operations' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Pending Operations' }} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <IconSymbol
              ios_icon_name="wifi.slash"
              android_material_icon_name="wifi-off"
              size={16}
              color="#fff"
            />
            <Text style={styles.offlineText}>
              You are offline. Operations will sync when online.
            </Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending:</Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {pendingCount}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Failed:</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {failedCount}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>{operations.length}</Text>
          </View>
        </View>

        {operations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={64}
              color={colors.success}
            />
            <Text style={styles.emptyTitle}>All Synced!</Text>
            <Text style={styles.emptyText}>
              No pending operations. All your changes are synced.
            </Text>
          </View>
        ) : (
          <View style={styles.operationsList}>
            {operations.map((operation) => {
              const operationLabel = getOperationLabel(operation.type);
              const statusColor = getStatusColor(operation.status);
              const timestampText = formatTimestamp(operation.timestamp);
              const iconName = getOperationIcon(operation.type);

              return (
                <View key={operation.id} style={styles.operationCard}>
                  <View style={styles.operationHeader}>
                    <View style={styles.operationTitleRow}>
                      <IconSymbol
                        ios_icon_name="arrow.clockwise"
                        android_material_icon_name={iconName}
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.operationTitle}>{operationLabel}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusText}>{operation.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.operationTime}>{timestampText}</Text>

                  {operation.retryCount > 0 && (
                    <Text style={styles.retryText}>
                      Retry attempt: {operation.retryCount}/{operation.maxRetries}
                    </Text>
                  )}

                  {operation.error && (
                    <View style={styles.errorContainer}>
                      <IconSymbol
                        ios_icon_name="exclamationmark.triangle"
                        android_material_icon_name="error"
                        size={14}
                        color={colors.error}
                      />
                      <Text style={styles.errorText}>{operation.error}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {operations.length > 0 && (
          <View style={styles.actionsContainer}>
            <Button
              title={syncing ? 'Syncing...' : 'Sync Now'}
              onPress={handleSyncNow}
              variant="filled"
              disabled={!isOnline || syncing}
            />
            <Button
              title="Clear All"
              onPress={handleClearAll}
              variant="outline"
            />
          </View>
        )}
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
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
  scrollView: {
    flex: 1,
  },
  offlineBanner: {
    backgroundColor: colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  operationsList: {
    padding: 16,
    gap: 12,
  },
  operationCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  operationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  operationTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  retryText: {
    fontSize: 12,
    color: colors.warning,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.errorLight,
    padding: 8,
    borderRadius: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    flex: 1,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
});
