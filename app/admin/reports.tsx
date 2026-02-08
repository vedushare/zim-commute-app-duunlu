
import React, { useState, useEffect, useCallback } from 'react';
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
import { getAdminReports, reviewReport } from '@/utils/adminApi';
import type { AdminReport } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';
import Button from '@/components/button';

export default function AdminReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'resolved'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Safety' | 'Vehicle' | 'Behavior' | 'Payment'>('all');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'resolved'>('reviewed');
  const [reviewAction, setReviewAction] = useState<'ban_user' | 'warn_user' | 'none'>('none');

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const loadReports = useCallback(async () => {
    console.log('Loading admin reports');
    try {
      const response = await getAdminReports({
        status: statusFilter,
        category: categoryFilter,
        page,
        limit: 20,
      });
      setReports(response.data);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to load reports:', error);
      showModal('Error', error.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, categoryFilter, showModal]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadReports();
  };

  const handleReviewPrompt = (report: AdminReport) => {
    setSelectedReport(report);
    setAdminNotes('');
    setReviewStatus('reviewed');
    setReviewAction('none');
    setReviewModalVisible(true);
  };

  const handleReview = async () => {
    if (!selectedReport) return;
    
    if (!adminNotes.trim()) {
      showModal('Error', 'Please provide admin notes');
      return;
    }

    try {
      await reviewReport(selectedReport.id, reviewStatus, adminNotes, reviewAction);
      setReviewModalVisible(false);
      showModal('Success', 'Report has been reviewed');
      loadReports();
    } catch (error: any) {
      console.error('Failed to review report:', error);
      showModal('Error', error.message || 'Failed to review report');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Safety Reports', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Safety Reports', headerShown: true }} />
      
      {/* Filters */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => {
              setStatusFilter('pending');
              setPage(1);
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'pending' && styles.filterButtonTextActive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'reviewed' && styles.filterButtonActive]}
            onPress={() => {
              setStatusFilter('reviewed');
              setPage(1);
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'reviewed' && styles.filterButtonTextActive,
              ]}
            >
              Reviewed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'resolved' && styles.filterButtonActive]}
            onPress={() => {
              setStatusFilter('resolved');
              setPage(1);
            }}
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
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
          {['all', 'Safety', 'Vehicle', 'Behavior', 'Payment'].map((cat) => {
            const category = cat as typeof categoryFilter;
            const isActive = categoryFilter === category;
            
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
                onPress={() => {
                  setCategoryFilter(category);
                  setPage(1);
                }}
              >
                <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.reportsList}>
          {reports.map((report) => {
            const reporterName = report.reporter.fullName;
            const reportedUserName = report.reportedUser?.fullName || 'N/A';
            const category = report.category;
            const description = report.description;
            const createdDate = formatDate(report.createdAt);
            const status = report.status;

            return (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportCategory}>{category}</Text>
                    <Text style={styles.reportDate}>{createdDate}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      status === 'reviewed' && styles.statusBadgeReviewed,
                      status === 'resolved' && styles.statusBadgeResolved,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.reportDetails}>
                  <View style={styles.reportDetailRow}>
                    <Text style={styles.reportDetailLabel}>Reporter:</Text>
                    <Text style={styles.reportDetailValue}>{reporterName}</Text>
                  </View>
                  <View style={styles.reportDetailRow}>
                    <Text style={styles.reportDetailLabel}>Reported User:</Text>
                    <Text style={styles.reportDetailValue}>{reportedUserName}</Text>
                  </View>
                  <View style={styles.reportDetailRow}>
                    <Text style={styles.reportDetailLabel}>Description:</Text>
                  </View>
                  <Text style={styles.reportDescription}>{description}</Text>
                </View>

                {status === 'pending' && (
                  <View style={styles.reportActions}>
                    <Button
                      title="Review Report"
                      onPress={() => handleReviewPrompt(report)}
                      style={styles.reviewButton}
                    />
                  </View>
                )}

                {report.adminNotes && (
                  <View style={styles.adminNotesBox}>
                    <Text style={styles.adminNotesLabel}>Admin Notes:</Text>
                    <Text style={styles.adminNotesText}>{report.adminNotes}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {reports.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No reports to review</Text>
            </View>
          )}
        </View>

        {/* Pagination */}
        {total > 20 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Page {page} of {Math.ceil(total / 20)}
            </Text>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                page >= Math.ceil(total / 20) && styles.paginationButtonDisabled,
              ]}
              onPress={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / 20)}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Review Modal */}
      <CustomModal
        visible={reviewModalVisible}
        title="Review Report"
        message=""
        onCancel={() => setReviewModalVisible(false)}
        onConfirm={handleReview}
        confirmText="Submit Review"
        cancelText="Cancel"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalLabel}>Status:</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setReviewStatus('reviewed')}
            >
              <View style={[styles.radio, reviewStatus === 'reviewed' && styles.radioActive]} />
              <Text style={styles.radioLabel}>Reviewed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setReviewStatus('resolved')}
            >
              <View style={[styles.radio, reviewStatus === 'resolved' && styles.radioActive]} />
              <Text style={styles.radioLabel}>Resolved</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Action:</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setReviewAction('none')}
            >
              <View style={[styles.radio, reviewAction === 'none' && styles.radioActive]} />
              <Text style={styles.radioLabel}>No Action</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setReviewAction('warn_user')}
            >
              <View style={[styles.radio, reviewAction === 'warn_user' && styles.radioActive]} />
              <Text style={styles.radioLabel}>Warn User</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setReviewAction('ban_user')}
            >
              <View style={[styles.radio, reviewAction === 'ban_user' && styles.radioActive]} />
              <Text style={styles.radioLabel}>Ban User</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Admin Notes:</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter your notes..."
            placeholderTextColor={colors.textSecondary}
            value={adminNotes}
            onChangeText={setAdminNotes}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryFilters: {
    marginTop: 8,
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
  reportsList: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: colors.warning,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeReviewed: {
    backgroundColor: colors.info,
  },
  statusBadgeResolved: {
    backgroundColor: colors.success,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportDetails: {
    marginBottom: 12,
  },
  reportDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reportDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 8,
  },
  reportDetailValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  reportDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginTop: 4,
  },
  reportActions: {
    marginTop: 12,
  },
  reviewButton: {
    backgroundColor: colors.primary,
  },
  adminNotesBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  adminNotesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  adminNotesText: {
    fontSize: 14,
    color: colors.text,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  paginationButtonDisabled: {
    backgroundColor: colors.backgroundAlt,
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    marginTop: 12,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 8,
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.text,
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
