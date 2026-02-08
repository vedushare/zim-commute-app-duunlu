
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
import { getDashboardAnalytics } from '@/utils/adminApi';
import type { AnalyticsData } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';

export default function AdminAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const loadAnalytics = useCallback(async () => {
    console.log('Loading analytics data');
    try {
      const data = await getDashboardAnalytics(period);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      showModal('Error', error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, showModal]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Analytics & Reports', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Analytics & Reports', headerShown: true }} />
      
      {/* Period Selector */}
      <View style={styles.periodSection}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'daily' && styles.periodButtonActive]}
          onPress={() => setPeriod('daily')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'daily' && styles.periodButtonTextActive,
            ]}
          >
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'weekly' && styles.periodButtonActive]}
          onPress={() => setPeriod('weekly')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'weekly' && styles.periodButtonTextActive,
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'monthly' && styles.periodButtonActive]}
          onPress={() => setPeriod('monthly')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'monthly' && styles.periodButtonTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {analytics && (
          <>
            {/* Ride Completion Rate */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ride Completion Rate</Text>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {(analytics.rideCompletionRate * 100).toFixed(1)}%
                </Text>
                <Text style={styles.metricLabel}>of rides completed successfully</Text>
              </View>
            </View>

            {/* Popular Routes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Routes</Text>
              {analytics.popularRoutes.map((route, index) => {
                const routeText = `${route.origin} → ${route.destination}`;
                const rideCount = `${route.count} rides`;
                
                return (
                  <View key={index} style={styles.routeCard}>
                    <View style={styles.routeRank}>
                      <Text style={styles.routeRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeText}>{routeText}</Text>
                      <Text style={styles.routeCount}>{rideCount}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* User Growth */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User Growth</Text>
              <View style={styles.chartContainer}>
                {analytics.userGrowth.map((item, index) => {
                  const date = new Date(item.date).toLocaleDateString();
                  const count = item.count;
                  const maxCount = Math.max(...analytics.userGrowth.map(i => i.count));
                  const heightPercentage = (count / maxCount) * 100;
                  
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.chartBarContainer}>
                        <View style={[styles.chartBarFill, { height: `${heightPercentage}%` }]} />
                      </View>
                      <Text style={styles.chartLabel}>{date}</Text>
                      <Text style={styles.chartValue}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Revenue Trends */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue Trends</Text>
              <View style={styles.chartContainer}>
                {analytics.revenueTrends.map((item, index) => {
                  const date = new Date(item.date).toLocaleDateString();
                  const amount = `$${item.amount.toFixed(2)}`;
                  const maxAmount = Math.max(...analytics.revenueTrends.map(i => i.amount));
                  const heightPercentage = (item.amount / maxAmount) * 100;
                  
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.chartBarContainer}>
                        <View style={[styles.chartBarFill, { height: `${heightPercentage}%`, backgroundColor: colors.success }]} />
                      </View>
                      <Text style={styles.chartLabel}>{date}</Text>
                      <Text style={styles.chartValue}>{amount}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Export Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Export Data</Text>
              <TouchableOpacity style={styles.exportButton}>
                <IconSymbol
                  ios_icon_name="arrow.down.doc"
                  android_material_icon_name="download"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.exportButtonText}>Export Users (CSV)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton}>
                <IconSymbol
                  ios_icon_name="arrow.down.doc"
                  android_material_icon_name="download"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.exportButtonText}>Export Rides (CSV)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton}>
                <IconSymbol
                  ios_icon_name="arrow.down.doc"
                  android_material_icon_name="download"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.exportButtonText}>Export Revenue (CSV)</Text>
              </TouchableOpacity>
            </View>
          </>
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
  periodSection: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routeRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routeRankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  routeCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingVertical: 16,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  chartBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBarFill: {
    width: '80%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  chartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exportButtonText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '600',
  },
});
