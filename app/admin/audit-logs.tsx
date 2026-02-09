
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getAuditLogs } from '@/utils/adminApi';
import type { AuditLog } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';

export default function AuditLogsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const loadLogs = useCallback(async () => {
    console.log('Loading audit logs');
    try {
      const response = await getAuditLogs({
        page,
        limit: 50,
      });
      setLogs(response.data);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      showModal('Error', error.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, showModal]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadLogs();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) {
      return { ios: 'plus.circle.fill', android: 'add-circle', color: colors.success };
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return { ios: 'pencil.circle.fill', android: 'edit', color: colors.info };
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return { ios: 'trash.circle.fill', android: 'delete', color: colors.danger };
    }
    if (actionLower.includes('ban') || actionLower.includes('suspend')) {
      return { ios: 'xmark.shield.fill', android: 'block', color: colors.error };
    }
    if (actionLower.includes('approve') || actionLower.includes('verify')) {
      return { ios: 'checkmark.shield.fill', android: 'verified-user', color: colors.success };
    }
    return { ios: 'info.circle.fill', android: 'info', color: colors.textSecondary };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Audit Logs', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading audit logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Audit Logs', headerShown: true }} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.logsList}>
          {logs.map((log) => {
            const adminName = log.admin.fullName;
            const action = log.action;
            const targetType = log.targetType;
            const createdDate = formatDate(log.createdAt);
            const iconConfig = getActionIcon(action);
            
            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <IconSymbol
                    ios_icon_name={iconConfig.ios}
                    android_material_icon_name={iconConfig.android}
                    size={24}
                    color={iconConfig.color}
                  />
                  <View style={styles.logInfo}>
                    <Text style={styles.logAction}>{action}</Text>
                    <Text style={styles.logAdmin}>by {adminName}</Text>
                  </View>
                </View>

                <View style={styles.logDetails}>
                  <View style={styles.logDetailRow}>
                    <Text style={styles.logDetailLabel}>Target Type:</Text>
                    <Text style={styles.logDetailValue}>{targetType}</Text>
                  </View>
                  <View style={styles.logDetailRow}>
                    <Text style={styles.logDetailLabel}>Target ID:</Text>
                    <Text style={styles.logDetailValue}>{log.targetId}</Text>
                  </View>
                  <View style={styles.logDetailRow}>
                    <Text style={styles.logDetailLabel}>Timestamp:</Text>
                    <Text style={styles.logDetailValue}>{createdDate}</Text>
                  </View>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <View style={styles.logDetailRow}>
                      <Text style={styles.logDetailLabel}>Details:</Text>
                      <Text style={styles.logDetailValue}>
                        {JSON.stringify(log.details, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {logs.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No audit logs</Text>
            </View>
          )}
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
  logsList: {
    padding: 16,
  },
  logCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  logAdmin: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logDetails: {
    gap: 8,
  },
  logDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  logDetailValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
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
