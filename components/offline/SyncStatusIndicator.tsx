
/**
 * Sync Status Indicator Component
 * 
 * Shows sync progress and status
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { addSyncListener, getSyncStatus, forceSyncNow, SyncStatus } from '@/utils/syncManager';
import { useConnectivity } from '@/utils/connectivityManager';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const { isOnline } = useConnectivity();
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = addSyncListener(setSyncStatus);
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncStatus.isSyncing) return;

    setIsManualSyncing(true);
    try {
      await forceSyncNow();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getLastSyncText = () => {
    if (!syncStatus.lastSyncTime) return 'Never synced';
    
    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) {
      const minutesText = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      return `${minutesText} ago`;
    }
    const hoursText = `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hoursText} ago`;
  };

  if (!isOnline && syncStatus.pendingOperationsCount === 0) {
    return null;
  }

  const lastSyncText = getLastSyncText();

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        {syncStatus.isSyncing || isManualSyncing ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>Syncing...</Text>
          </>
        ) : (
          <>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={16}
              color={colors.success}
            />
            <Text style={styles.statusText}>
              Last sync: {lastSyncText}
            </Text>
          </>
        )}
      </View>

      {syncStatus.pendingOperationsCount > 0 && (
        <View style={styles.pendingRow}>
          <IconSymbol
            ios_icon_name="clock.fill"
            android_material_icon_name="schedule"
            size={14}
            color={colors.warning}
          />
          <Text style={styles.pendingText}>
            {syncStatus.pendingOperationsCount} pending operation{syncStatus.pendingOperationsCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {syncStatus.failedOperationsCount > 0 && (
        <View style={styles.failedRow}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="error"
            size={14}
            color={colors.error}
          />
          <Text style={styles.failedText}>
            {syncStatus.failedOperationsCount} failed operation{syncStatus.failedOperationsCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {isOnline && !syncStatus.isSyncing && (
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleManualSync}
          disabled={isManualSyncing}
        >
          <IconSymbol
            ios_icon_name="arrow.clockwise"
            android_material_icon_name="refresh"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingText: {
    fontSize: 12,
    color: colors.warning,
  },
  failedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  failedText: {
    fontSize: 12,
    color: colors.error,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    marginTop: 4,
  },
  syncButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
