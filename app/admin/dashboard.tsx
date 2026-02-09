
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
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getDashboardMetrics } from '@/utils/adminApi';
import type { DashboardMetrics } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const loadMetrics = useCallback(async () => {
    console.log('Loading admin dashboard metrics');
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (error: any) {
      console.error('Failed to load metrics:', error);
      showModal('Error', error.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showModal]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  const formatCurrency = (amount: number) => {
    const formatted = `$${amount.toFixed(2)}`;
    return formatted;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Admin Dashboard', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Admin Dashboard', headerShown: true }} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Overview Metrics */}
        {metrics && (
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <IconSymbol
                  ios_icon_name="person.2.fill"
                  android_material_icon_name="people"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.metricValue}>{metrics.totalUsers}</Text>
                <Text style={styles.metricLabel}>Total Users</Text>
                <View style={styles.metricSubRow}>
                  <Text style={styles.metricSub}>{metrics.totalDrivers} drivers</Text>
                  <Text style={styles.metricSub}>{metrics.totalPassengers} passengers</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <IconSymbol
                  ios_icon_name="car.fill"
                  android_material_icon_name="directions-car"
                  size={32}
                  color={colors.info}
                />
                <Text style={styles.metricValue}>{metrics.activeRidesToday}</Text>
                <Text style={styles.metricLabel}>Active Rides Today</Text>
              </View>

              <View style={styles.metricCard}>
                <IconSymbol
                  ios_icon_name="dollarsign.circle.fill"
                  android_material_icon_name="attach-money"
                  size={32}
                  color={colors.success}
                />
                <Text style={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
              </View>

              <View style={styles.metricCard}>
                <IconSymbol
                  ios_icon_name="checkmark.shield.fill"
                  android_material_icon_name="verified-user"
                  size={32}
                  color={colors.warning}
                />
                <Text style={styles.metricValue}>{metrics.verificationQueueLength}</Text>
                <Text style={styles.metricLabel}>Verification Queue</Text>
              </View>

              <View style={styles.metricCard}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="report"
                  size={32}
                  color={colors.error}
                />
                <Text style={styles.metricValue}>{metrics.reportsQueueLength}</Text>
                <Text style={styles.metricLabel}>Pending Reports</Text>
              </View>

              <View style={styles.metricCard}>
                <IconSymbol
                  ios_icon_name="bell.badge.fill"
                  android_material_icon_name="notifications"
                  size={32}
                  color={colors.danger}
                />
                <Text style={styles.metricValue}>{metrics.sosAlertsActive}</Text>
                <Text style={styles.metricLabel}>Active SOS Alerts</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/users')}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="people"
                size={24}
                color={colors.primary}
              />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>User Management</Text>
                <Text style={styles.actionCardDescription}>
                  Search, verify, ban users and adjust wallets
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/verification')}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="checkmark.shield.fill"
                android_material_icon_name="verified-user"
                size={24}
                color={colors.warning}
              />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Verification Queue</Text>
                <Text style={styles.actionCardDescription}>
                  Review and approve ID documents
                </Text>
                {metrics && metrics.verificationQueueLength > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{metrics.verificationQueueLength} pending</Text>
                  </View>
                )}
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/rides')}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="car.fill"
                android_material_icon_name="directions-car"
                size={24}
                color={colors.info}
              />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Ride Management</Text>
                <Text style={styles.actionCardDescription}>
                  View, cancel, and adjust ride pricing
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Safety & Moderation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety & Moderation</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/sos-alerts')}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="bell.badge.fill"
                android_material_icon_name="notifications"
                size={24}
                color={colors.danger}
              />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>SOS Alerts</Text>
                <Text style={styles.actionCardDescription}>
                  Monitor and respond to emergency alerts
                </Text>
                {metrics && metrics.sosAlertsActive > 0 && (
                  <View style={[styles.badge, styles.badgeDanger]}>
                    <Text style={styles.badgeText}>{metrics.sosAlertsActive} active</Text>
                  </View>
                )}
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/reports')}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="report"
                size={24}
                color={colors.error}
              />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Reported Incidents</Text>
                <Text style={styles.actionCardDescription}>
                  Review safety, behavior, and payment reports
                </Text>
                {metrics && metrics.reportsQueueLength > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{metrics.reportsQueueLength} pending</Text>
                  </View>
                )}
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Analytics & Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics & Configuration</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/analytics')}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={24}
                color={colors.success}
              />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Analytics & Reports</Text>
                <Text style={styles.actionCardDescription}>
                  View metrics, trends, and export data
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/configuration')}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="gearshape.fill"
                android_material_icon_name="settings"
                size={24}
                color={colors.textSecondary}
              />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Configuration</Text>
                <Text style={styles.actionCardDescription}>
                  Manage routes, pricing, promo codes, and audit logs
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
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
  metricsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricSubRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metricSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionCardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  badgeDanger: {
    backgroundColor: colors.danger,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
