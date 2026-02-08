
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import {
  getVerificationQueue,
  approveVerificationDocument,
  rejectVerificationDocument,
} from '@/utils/adminApi';
import type { VerificationDocument } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';
import Button from '@/components/button';

export default function VerificationQueueScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [page, statusFilter]);

  const loadDocuments = async () => {
    console.log('Loading verification documents');
    try {
      const response = await getVerificationQueue({
        status: statusFilter,
        page,
        limit: 20,
      });
      setDocuments(response.data);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      showModal('Error', error.message || 'Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadDocuments();
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleViewImage = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalVisible(true);
  };

  const handleApprove = async (document: VerificationDocument) => {
    try {
      await approveVerificationDocument(document.id);
      showModal('Success', 'Document has been approved');
      loadDocuments();
    } catch (error: any) {
      console.error('Failed to approve document:', error);
      showModal('Error', error.message || 'Failed to approve document');
    }
  };

  const handleRejectPrompt = (document: VerificationDocument) => {
    setSelectedDocument(document);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!selectedDocument) return;
    
    if (!rejectionReason.trim()) {
      showModal('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await rejectVerificationDocument(selectedDocument.id, rejectionReason);
      setRejectModalVisible(false);
      showModal('Success', 'Document has been rejected');
      loadDocuments();
    } catch (error: any) {
      console.error('Failed to reject document:', error);
      showModal('Error', error.message || 'Failed to reject document');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      national_id_front: 'National ID (Front)',
      national_id_back: 'National ID (Back)',
      drivers_license: "Driver's License",
      vehicle_registration: 'Vehicle Registration',
      selfie: 'Selfie Verification',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Verification Queue', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Verification Queue', headerShown: true }} />
      
      {/* Status Filter */}
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
            style={[styles.filterButton, statusFilter === 'approved' && styles.filterButtonActive]}
            onPress={() => {
              setStatusFilter('approved');
              setPage(1);
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'approved' && styles.filterButtonTextActive,
              ]}
            >
              Approved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'rejected' && styles.filterButtonActive]}
            onPress={() => {
              setStatusFilter('rejected');
              setPage(1);
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'rejected' && styles.filterButtonTextActive,
              ]}
            >
              Rejected
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.documentsList}>
          {documents.map((doc) => {
            const userName = doc.user.fullName;
            const phoneNumber = doc.user.phoneNumber;
            const documentType = getDocumentTypeLabel(doc.documentType);
            const uploadedDate = formatDate(doc.uploadedAt);
            const status = doc.status;

            return (
              <View key={doc.id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentUser}>{userName}</Text>
                    <Text style={styles.documentPhone}>{phoneNumber}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      status === 'approved' && styles.statusBadgeApproved,
                      status === 'rejected' && styles.statusBadgeRejected,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.documentDetails}>
                  <Text style={styles.documentType}>{documentType}</Text>
                  <Text style={styles.documentDate}>Uploaded: {uploadedDate}</Text>
                </View>

                <TouchableOpacity
                  style={styles.imagePreview}
                  onPress={() => handleViewImage(doc.documentUrl)}
                >
                  <Image source={{ uri: doc.documentUrl }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <IconSymbol
                      ios_icon_name="eye"
                      android_material_icon_name="visibility"
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text style={styles.imageOverlayText}>View Full Image</Text>
                  </View>
                </TouchableOpacity>

                {status === 'pending' && (
                  <View style={styles.documentActions}>
                    <Button
                      title="Approve"
                      onPress={() => handleApprove(doc)}
                      style={styles.approveButton}
                    />
                    <Button
                      title="Reject"
                      onPress={() => handleRejectPrompt(doc)}
                      style={styles.rejectButton}
                    />
                  </View>
                )}

                {status === 'rejected' && doc.rejectionReason && (
                  <View style={styles.rejectionReasonBox}>
                    <Text style={styles.rejectionReasonLabel}>Rejection Reason:</Text>
                    <Text style={styles.rejectionReasonText}>{doc.rejectionReason}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {documents.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.shield"
                android_material_icon_name="verified-user"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No documents to review</Text>
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

      {/* Image Modal */}
      <Modal visible={imageModalVisible} transparent animationType="fade">
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="cancel"
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Image source={{ uri: selectedImageUrl }} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>

      {/* Reject Modal */}
      <CustomModal
        visible={rejectModalVisible}
        title="Reject Document"
        message=""
        onCancel={() => setRejectModalVisible(false)}
        onConfirm={handleReject}
        confirmText="Reject"
        cancelText="Cancel"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalLabel}>Reason for rejection:</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter reason..."
            placeholderTextColor={colors.textSecondary}
            value={rejectionReason}
            onChangeText={setRejectionReason}
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
  documentsList: {
    padding: 16,
  },
  documentCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentUser: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  documentPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: colors.warning,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeApproved: {
    backgroundColor: colors.success,
  },
  statusBadgeRejected: {
    backgroundColor: colors.danger,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  documentDetails: {
    marginBottom: 12,
  },
  documentType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  imagePreview: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.danger,
  },
  rejectionReasonBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  rejectionReasonText: {
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
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
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
