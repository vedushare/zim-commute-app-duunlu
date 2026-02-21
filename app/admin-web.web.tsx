
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { getDashboardMetrics } from '@/utils/adminApi';
import type { DashboardMetrics } from '@/types/admin';

/**
 * 🌐 WEB ADMIN PANEL - ZimCommute
 * 
 * Production-ready web interface for admin operations.
 * 
 * 🔗 ACCESS URL: https://your-domain.com/admin-web
 * 
 * Features:
 * ✅ Dashboard with real-time metrics
 * ✅ User management (search, ban, wallet adjustments)
 * ✅ Verification queue (approve/reject IDs)
 * ✅ Ride management (view, cancel, adjust pricing)
 * ✅ SOS alerts monitoring
 * ✅ Reports & moderation
 * ✅ Configuration (routes, pricing, promo codes)
 * ✅ Analytics & data export
 */
export default function AdminWebPanel() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');

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
    const formatted = `$${amount.toFixed(2)}`;
    return formatted;
  };

  const navigateToSection = (section: string, route: string) => {
    setActiveSection(section);
    router.push(route);
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
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>{error}</Text>
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
          <Text style={styles.headerTitle}>🚗 ZimCommute Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Web Management Interface</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.userBadge}>
            <Text style={styles.userInfo}>{user?.fullName || user?.phoneNumber}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.userRole}>{user?.role}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Sidebar Navigation */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Navigation</Text>
          
          <TouchableOpacity
            style={[styles.navItem, activeSection === 'dashboard' && styles.navItemActive]}
            onPress={() => setActiveSection('dashboard')}
          >
            <Text style={styles.navIcon}>📊</Text>
            <Text style={[styles.navText, activeSection === 'dashboard' && styles.navTextActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <View style={styles.navDivider} />
          <Text style={styles.navCategory}>MANAGEMENT</Text>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'users' && styles.navItemActive]}
            onPress={() => navigateToSection('users', '/admin/users')}
          >
            <Text style={styles.navIcon}>👥</Text>
            <Text style={[styles.navText, activeSection === 'users' && styles.navTextActive]}>
              Users
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'verification' && styles.navItemActive]}
            onPress={() => navigateToSection('verification', '/admin/verification')}
          >
            <Text style={styles.navIcon}>✅</Text>
            <Text style={[styles.navText, activeSection === 'verification' && styles.navTextActive]}>
              Verification
            </Text>
            {metrics && metrics.verificationQueueLength > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{metrics.verificationQueueLength}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'rides' && styles.navItemActive]}
            onPress={() => navigateToSection('rides', '/admin/rides')}
          >
            <Text style={styles.navIcon}>🚗</Text>
            <Text style={[styles.navText, activeSection === 'rides' && styles.navTextActive]}>
              Rides
            </Text>
          </TouchableOpacity>

          <View style={styles.navDivider} />
          <Text style={styles.navCategory}>SAFETY</Text>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'sos' && styles.navItemActive]}
            onPress={() => navigateToSection('sos', '/admin/sos-alerts')}
          >
            <Text style={styles.navIcon}>🚨</Text>
            <Text style={[styles.navText, activeSection === 'sos' && styles.navTextActive]}>
              SOS Alerts
            </Text>
            {metrics && metrics.sosAlertsActive > 0 && (
              <View style={[styles.badge, styles.badgeDanger]}>
                <Text style={styles.badgeText}>{metrics.sosAlertsActive}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'reports' && styles.navItemActive]}
            onPress={() => navigateToSection('reports', '/admin/reports')}
          >
            <Text style={styles.navIcon}>📋</Text>
            <Text style={[styles.navText, activeSection === 'reports' && styles.navTextActive]}>
              Reports
            </Text>
            {metrics && metrics.reportsQueueLength > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{metrics.reportsQueueLength}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.navDivider} />
          <Text style={styles.navCategory}>CONFIGURATION</Text>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'routes' && styles.navItemActive]}
            onPress={() => navigateToSection('routes', '/admin/routes-config')}
          >
            <Text style={styles.navIcon}>🗺️</Text>
            <Text style={[styles.navText, activeSection === 'routes' && styles.navTextActive]}>
              Routes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'pricing' && styles.navItemActive]}
            onPress={() => navigateToSection('pricing', '/admin/pricing-templates')}
          >
            <Text style={styles.navIcon}>💰</Text>
            <Text style={[styles.navText, activeSection === 'pricing' && styles.navTextActive]}>
              Pricing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'promo' && styles.navItemActive]}
            onPress={() => navigateToSection('promo', '/admin/promo-codes')}
          >
            <Text style={styles.navIcon}>🎟️</Text>
            <Text style={[styles.navText, activeSection === 'promo' && styles.navTextActive]}>
              Promo Codes
            </Text>
          </TouchableOpacity>

          <View style={styles.navDivider} />
          <Text style={styles.navCategory}>ANALYTICS</Text>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'analytics' && styles.navItemActive]}
            onPress={() => navigateToSection('analytics', '/admin/analytics')}
          >
            <Text style={styles.navIcon}>📈</Text>
            <Text style={[styles.navText, activeSection === 'analytics' && styles.navTextActive]}>
              Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeSection === 'audit' && styles.navItemActive]}
            onPress={() => navigateToSection('audit', '/admin/audit-logs')}
          >
            <Text style={styles.navIcon}>📜</Text>
            <Text style={[styles.navText, activeSection === 'audit' && styles.navTextActive]}>
              Audit Logs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.content}>
          {activeSection === 'dashboard' && metrics && (
            <View style={styles.dashboardContent}>
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Welcome back, {user?.fullName || 'Admin'}!</Text>
                <Text style={styles.welcomeSubtitle}>
                  Here's what's happening with ZimCommute today
                </Text>
              </View>
              
              <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, styles.metricCardPrimary]}>
                  <Text style={styles.metricIcon}>👥</Text>
                  <Text style={styles.metricValue}>{metrics.totalUsers}</Text>
                  <Text style={styles.metricLabel}>Total Users</Text>
                  <View style={styles.metricDetails}>
                    <Text style={styles.metricDetail}>{metrics.totalDrivers} drivers</Text>
                    <Text style={styles.metricDetail}>•</Text>
                    <Text style={styles.metricDetail}>{metrics.totalPassengers} passengers</Text>
                  </View>
                </View>

                <View style={[styles.metricCard, styles.metricCardInfo]}>
                  <Text style={styles.metricIcon}>🚗</Text>
                  <Text style={styles.metricValue}>{metrics.activeRidesToday}</Text>
                  <Text style={styles.metricLabel}>Active Rides Today</Text>
                </View>

                <View style={[styles.metricCard, styles.metricCardSuccess]}>
                  <Text style={styles.metricIcon}>💰</Text>
                  <Text style={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</Text>
                  <Text style={styles.metricLabel}>Total Revenue</Text>
                </View>

                <View style={[styles.metricCard, styles.metricCardWarning]}>
                  <Text style={styles.metricIcon}>✅</Text>
                  <Text style={styles.metricValue}>{metrics.verificationQueueLength}</Text>
                  <Text style={styles.metricLabel}>Verification Queue</Text>
                </View>

                <View style={[styles.metricCard, styles.metricCardDefault]}>
                  <Text style={styles.metricIcon}>📋</Text>
                  <Text style={styles.metricValue}>{metrics.reportsQueueLength}</Text>
                  <Text style={styles.metricLabel}>Pending Reports</Text>
                </View>

                <View style={[styles.metricCard, metrics.sosAlertsActive > 0 ? styles.metricCardDanger : styles.metricCardDefault]}>
                  <Text style={styles.metricIcon}>🚨</Text>
                  <Text style={[styles.metricValue, metrics.sosAlertsActive > 0 && styles.metricValueDanger]}>
                    {metrics.sosAlertsActive}
                  </Text>
                  <Text style={styles.metricLabel}>Active SOS Alerts</Text>
                </View>
              </View>

              <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigateToSection('users', '/admin/users')}
                  >
                    <Text style={styles.actionIcon}>👥</Text>
                    <Text style={styles.actionTitle}>Manage Users</Text>
                    <Text style={styles.actionDescription}>Search, ban, adjust wallets</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigateToSection('verification', '/admin/verification')}
                  >
                    <Text style={styles.actionIcon}>✅</Text>
                    <Text style={styles.actionTitle}>Review Verifications</Text>
                    <Text style={styles.actionDescription}>Approve or reject IDs</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigateToSection('sos', '/admin/sos-alerts')}
                  >
                    <Text style={styles.actionIcon}>🚨</Text>
                    <Text style={styles.actionTitle}>Check SOS Alerts</Text>
                    <Text style={styles.actionDescription}>Monitor emergencies</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigateToSection('reports', '/admin/reports')}
                  >
                    <Text style={styles.actionIcon}>📋</Text>
                    <Text style={styles.actionTitle}>Review Reports</Text>
                    <Text style={styles.actionDescription}>Handle user reports</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigateToSection('routes', '/admin/routes-config')}
                  >
                    <Text style={styles.actionIcon}>🗺️</Text>
                    <Text style={styles.actionTitle}>Configure Routes</Text>
                    <Text style={styles.actionDescription}>Manage city routes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigateToSection('analytics', '/admin/analytics')}
                  >
                    <Text style={styles.actionIcon}>📈</Text>
                    <Text style={styles.actionTitle}>View Analytics</Text>
                    <Text style={styles.actionDescription}>Reports & insights</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.guideSection}>
                <Text style={styles.guideTitle}>📖 Admin Panel Guide</Text>
                <View style={styles.guideGrid}>
                  <View style={styles.guideCard}>
                    <Text style={styles.guideCardTitle}>👥 User Management</Text>
                    <Text style={styles.guideCardText}>
                      • Search users by name or phone{'\n'}
                      • View and send OTP codes{'\n'}
                      • Ban/unban users{'\n'}
                      • Adjust wallet balances{'\n'}
                      • Create new users manually
                    </Text>
                  </View>

                  <View style={styles.guideCard}>
                    <Text style={styles.guideCardTitle}>✅ Verification</Text>
                    <Text style={styles.guideCardText}>
                      • Review ID documents{'\n'}
                      • Approve verified users{'\n'}
                      • Reject with reasons{'\n'}
                      • View document images{'\n'}
                      • Track verification status
                    </Text>
                  </View>

                  <View style={styles.guideCard}>
                    <Text style={styles.guideCardTitle}>🚗 Ride Management</Text>
                    <Text style={styles.guideCardText}>
                      • View all rides{'\n'}
                      • Cancel problematic rides{'\n'}
                      • Adjust pricing{'\n'}
                      • Monitor active rides{'\n'}
                      • Export ride data
                    </Text>
                  </View>

                  <View style={styles.guideCard}>
                    <Text style={styles.guideCardTitle}>🚨 Safety & Moderation</Text>
                    <Text style={styles.guideCardText}>
                      • Monitor SOS alerts{'\n'}
                      • Review user reports{'\n'}
                      • Take moderation actions{'\n'}
                      • Resolve incidents{'\n'}
                      • Track safety metrics
                    </Text>
                  </View>

                  <View style={styles.guideCard}>
                    <Text style={styles.guideCardTitle}>⚙️ Configuration</Text>
                    <Text style={styles.guideCardText}>
                      • Manage city routes{'\n'}
                      • Set pricing templates{'\n'}
                      • Create promo codes{'\n'}
                      • Configure app settings{'\n'}
                      • View audit logs
                    </Text>
                  </View>

                  <View style={styles.guideCard}>
                    <Text style={styles.guideCardTitle}>📈 Analytics</Text>
                    <Text style={styles.guideCardText}>
                      • View revenue reports{'\n'}
                      • Track user growth{'\n'}
                      • Monitor ride trends{'\n'}
                      • Export data (CSV){'\n'}
                      • Generate insights
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ZimCommute Admin Panel • Web Interface • {new Date().getFullYear()} • Made with ❤️ in Zimbabwe
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userRole: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sidebarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  navCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  navDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: colors.primary,
  },
  navIcon: {
    fontSize: 18,
  },
  navText: {
    flex: 1,
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dashboardContent: {
    padding: 32,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 40,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: 'calc(33.333% - 14px)',
    minWidth: 220,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  metricCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  metricCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  metricCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  metricCardDanger: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  metricCardDefault: {
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  metricIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 36,
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
    fontWeight: '500',
  },
  metricDetails: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metricDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickActions: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: 'calc(33.333% - 11px)',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  guideSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  guideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  guideCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    width: 'calc(50% - 10px)',
    minWidth: 300,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  guideCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  guideCardText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
