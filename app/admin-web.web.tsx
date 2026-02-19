
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { getDashboardMetrics } from '@/utils/adminApi';
import type { DashboardMetrics } from '@/types/admin';

/**
 * Web-Based Admin Panel for ZimCommute
 * 
 * This is a dedicated web interface for admin operations.
 * Access this page through: https://your-app-url.com/admin-web
 * 
 * Features:
 * - Dashboard with metrics
 * - User management
 * - Ride management
 * - Verification queue
 * - Reports and SOS alerts
 * - Configuration
 */
export default function AdminWebPanel() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    console.log('[AdminWeb] Auth state:', { isAuthenticated, isAdmin, user });
    
    if (!authLoading && !isAuthenticated) {
      console.log('[AdminWeb] User not authenticated, redirecting to login');
      router.replace('/auth/phone-login');
      return;
    }

    if (!authLoading && isAuthenticated && !isAdmin) {
      console.log('[AdminWeb] User not admin, access denied');
      setError('Access Denied: Admin privileges required');
      setLoading(false);
      return;
    }

    if (isAuthenticated && isAdmin) {
      loadDashboard();
    }
  }, [isAuthenticated, isAdmin, authLoading]);

  const loadDashboard = async () => {
    console.log('[AdminWeb] Loading dashboard metrics');
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      console.error('[AdminWeb] Failed to load metrics:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'ZimCommute Admin Panel', headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Admin Panel...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'ZimCommute Admin Panel', headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ {error}</Text>
          <Text style={styles.errorMessage}>
            {!isAdmin 
              ? 'You need admin privileges to access this panel. Please contact a super admin.'
              : 'Unable to load admin panel. Please try again later.'}
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/(home)')}
          >
            <Text style={styles.backButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'ZimCommute Admin Panel', headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>ZimCommute Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Web Interface</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.userInfo}>{user?.fullName || user?.phoneNumber}</Text>
          <Text style={styles.userRole}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Sidebar Navigation */}
        <View style={styles.sidebar}>
          <TouchableOpacity
            style={[styles.navItem, activeSection === 'dashboard' && styles.navItemActive]}
            onPress={() => setActiveSection('dashboard')}
          >
            <Text style={[styles.navText, activeSection === 'dashboard' && styles.navTextActive]}>
              📊 Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'users' && styles.navItemActive]}
            onPress={() => {
              setActiveSection('users');
              router.push('/admin/users');
            }}
          >
            <Text style={[styles.navText, activeSection === 'users' && styles.navTextActive]}>
              👥 User Management
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'verification' && styles.navItemActive]}
            onPress={() => {
              setActiveSection('verification');
              router.push('/admin/verification');
            }}
          >
            <Text style={[styles.navText, activeSection === 'verification' && styles.navTextActive]}>
              ✅ Verification Queue
            </Text>
            {metrics && metrics.verificationQueueLength > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{metrics.verificationQueueLength}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'rides' && styles.navItemActive]}
            onPress={() => {
              setActiveSection('rides');
              router.push('/admin/rides');
            }}
          >
            <Text style={[styles.navText, activeSection === 'rides' && styles.navTextActive]}>
              🚗 Ride Management
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'sos' && styles.navItemActive]}
            onPress={() => {
              setActiveSection('sos');
              router.push('/admin/sos-alerts');
            }}
          >
            <Text style={[styles.navText, activeSection === 'sos' && styles.navTextActive]}>
              🚨 SOS Alerts
            </Text>
            {metrics && metrics.sosAlertsActive > 0 && (
              <View style={[styles.badge, styles.badgeDanger]}>
                <Text style={styles.badgeText}>{metrics.sosAlertsActive}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'reports' && styles.navItemActive]}
            onPress={() => {
              setActiveSection('reports');
              router.push('/admin/reports');
            }}
          >
            <Text style={[styles.navText, activeSection === 'reports' && styles.navTextActive]}>
              📋 Reports
            </Text>
            {metrics && metrics.reportsQueueLength > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{metrics.reportsQueueLength}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'config' && styles.navItemActive]}
            onPress={() => {
              setActiveSection('config');
              router.push('/admin/configuration');
            }}
          >
            <Text style={[styles.navText, activeSection === 'config' && styles.navTextActive]}>
              ⚙️ Configuration
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'analytics' && styles.navItemActive]}
            onPress={() => {
              setActiveSection('analytics');
              router.push('/admin/analytics');
            }}
          >
            <Text style={[styles.navText, activeSection === 'analytics' && styles.navTextActive]}>
              📈 Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.content}>
          {activeSection === 'dashboard' && metrics && (
            <View style={styles.dashboardContent}>
              <Text style={styles.contentTitle}>Dashboard Overview</Text>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>👥</Text>
                  <Text style={styles.metricValue}>{metrics.totalUsers}</Text>
                  <Text style={styles.metricLabel}>Total Users</Text>
                  <View style={styles.metricDetails}>
                    <Text style={styles.metricDetail}>{metrics.totalDrivers} drivers</Text>
                    <Text style={styles.metricDetail}>{metrics.totalPassengers} passengers</Text>
                  </View>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>🚗</Text>
                  <Text style={styles.metricValue}>{metrics.activeRidesToday}</Text>
                  <Text style={styles.metricLabel}>Active Rides Today</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>💰</Text>
                  <Text style={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</Text>
                  <Text style={styles.metricLabel}>Total Revenue</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>✅</Text>
                  <Text style={styles.metricValue}>{metrics.verificationQueueLength}</Text>
                  <Text style={styles.metricLabel}>Verification Queue</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>📋</Text>
                  <Text style={styles.metricValue}>{metrics.reportsQueueLength}</Text>
                  <Text style={styles.metricLabel}>Pending Reports</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>🚨</Text>
                  <Text style={[styles.metricValue, metrics.sosAlertsActive > 0 && styles.metricValueDanger]}>
                    {metrics.sosAlertsActive}
                  </Text>
                  <Text style={styles.metricLabel}>Active SOS Alerts</Text>
                </View>
              </View>

              <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/admin/users')}
                  >
                    <Text style={styles.actionButtonText}>Manage Users</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/admin/verification')}
                  >
                    <Text style={styles.actionButtonText}>Review Verifications</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/admin/sos-alerts')}
                  >
                    <Text style={styles.actionButtonText}>Check SOS Alerts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/admin/reports')}
                  >
                    <Text style={styles.actionButtonText}>Review Reports</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>📖 How to Use the Admin Panel</Text>
                <Text style={styles.instructionsText}>
                  • Use the sidebar navigation to access different admin sections{'\n'}
                  • Dashboard shows real-time metrics and alerts{'\n'}
                  • User Management: Search, view OTP, ban/unban users, adjust wallets{'\n'}
                  • Verification Queue: Approve or reject ID documents{'\n'}
                  • Ride Management: View, cancel, and adjust ride pricing{'\n'}
                  • SOS Alerts: Monitor and resolve emergency situations{'\n'}
                  • Reports: Review and take action on user reports{'\n'}
                  • Configuration: Manage routes, pricing, and promo codes{'\n'}
                  • Analytics: View detailed reports and export data
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ZimCommute Admin Panel • Web Interface • {new Date().getFullYear()}
        </Text>
      </View>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userInfo: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userRole: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: colors.backgroundAlt,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    padding: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  navItemActive: {
    backgroundColor: colors.primary,
  },
  navText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeDanger: {
    backgroundColor: colors.danger,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  dashboardContent: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 20,
    width: 'calc(33.333% - 11px)',
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  metricValueDanger: {
    color: colors.danger,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  metricDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    backgroundColor: colors.backgroundAlt,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
