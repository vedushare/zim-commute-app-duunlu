
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getSOSAlerts, resolveSOSAlert } from '@/utils/adminApi';
import type { SOSAlert } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';
import Button from '@/components/button';

export default function AdminSOSAlertsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<'active' | 'resolved'>('active');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadAlerts();
  }, [statusFilter]);

  const loadAlerts = async () => {
    console.log('Loading SOS alerts');
    try {
      const response = await getSOSAlerts(statusFilter);
      setAlerts(response.alerts);
    } catch (error: any) {
      console.error('Failed to load alerts:', error);
      showModal('Error', error.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleResolvePrompt = (alert: SOSAlert) => {
    setSelectedAlert(alert);
    setResolutionNotes('');
    setResolveModalVisible(true);
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    
    if (!resolutionNotes.trim()) {
      showModal('Error', 'Please provide resolution notes');
      return;
    }

    try {
      await resolveSOSAlert(selectedAlert.id, resolutionNotes);
      setResolveModalVisible(false);
      showModal('Success', 'SOS alert has been resolved');
      loadAlerts();
    } catch (error: any) {
      console.error('Failed to resolve alert:', error);
      showModal('Error', error.message || 'Failed to resolve alert');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'SOS Alerts', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'SOS Alerts', headerShown: true }} />
      
      {/* Status Filter */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'active' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('active')}
        >
          <Text
            style={[
              styles.filterButtonText,
              statusFilter === 'active' && styles.filterButtonTextActive,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'resolved' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('resolved')}
        >
          <Text
            style={[
              styles.filterButtonText,
              statusFilter === 'resolved' && styles.filterButtonTextActive,
            ]}
          >
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.alertsList}>
          {alerts.map((alert) => {
            const userName = alert.user.fullName;
            const phoneNumber = alert.user.phoneNumber;
            const createdDate = formatDate(alert.createdAt);
            const resolvedDate = alert.resolvedAt ? formatDate(alert.resolvedAt) : null;
            const hasLocation = alert.locationLat !== null && alert.locationLng !== null;
            const status = alert.status;

            return (
              <View key={alert.id} style={[styles.alertCard, status === 'active' && styles.alertCardActive]}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertUser}>{userName}</Text>
                    <Text style={styles.alertPhone}>{phoneNumber}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      status === 'active' && styles.statusBadgeActive,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.alertDetails}>
                  <View style={styles.alertDetailRow}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="schedule"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.alertDetailText}>Created: {createdDate}</Text>
                  </View>
                  {resolvedDate && (
                    <View style={styles.alertDetailRow}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle"
                        android_material_icon_name="check-circle"
                        size={16}
                        color={colors.success}
                      />
                      <Text style={styles.alertDetailText}>Resolved: {resolvedDate}</Text>
                    </View>
                  )}
                  {hasLocation && (
                    <View style={styles.alertDetailRow}>
                      <IconSymbol
                        ios_icon_name="location"
                        android_material_icon_name="location-on"
                        size={16}
                        color={colors.danger}
                      />
                      <Text style={styles.alertDetailText}>
                        Location: {alert.locationLat?.toFixed(6)}, {alert.locationLng?.toFixed(6)}
                      </Text>
                    </View>
                  )}
                </View>

                {status === 'active' && (
                  <View style={styles.alertActions}>
                    <Button
                      title="Resolve Alert"
                      onPress={() => handleResolvePrompt(alert)}
                      style={styles.resolveButton}
                    />
                  </View>
                )}
              </View>
            );
          })}

          {alerts.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.shield"
                android_material_icon_name="verified-user"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                {statusFilter === 'active' ? 'No active SOS alerts' : 'No resolved alerts'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Resolve Modal */}
      <CustomModal
        visible={resolveModalVisible}
        title="Resolve SOS Alert"
        message=""
        onCancel={() => setResolveModalVisible(false)}
        onConfirm={handleResolve}
        confirmText="Resolve"
        cancelText="Cancel"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalLabel}>Resolution Notes:</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter resolution details..."
            placeholderTextColor={colors.textSecondary}
            value={resolutionNotes}
            onChangeText={setResolutionNotes}
            multiline
            numberOfLines={4}
          />
        </View>
      </CustomModal>

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
    flexDirection: 'row',
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
  alertsList: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertCardActive: {
    borderWidth: 2,
    borderColor: colors.danger,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertUser: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  alertPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: colors.success,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeActive: {
    backgroundColor: colors.danger,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDetails: {
    gap: 8,
    marginBottom: 12,
  },
  alertDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDetailText: {
    fontSize: 14,
    color: colors.text,
  },
  alertActions: {
    marginTop: 12,
  },
  resolveButton: {
    backgroundColor: colors.success,
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
  modalContent: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
