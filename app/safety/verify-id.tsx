
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/IconSymbol';
import Button from '@/components/button';
import { CustomModal } from '@/components/ui/CustomModal';
import { colors } from '@/styles/commonStyles';
import { uploadVerificationDocument, getVerificationDocuments } from '@/utils/safetyApi';
import type { VerificationDocument } from '@/types/safety';

type DocumentType = 'national_id_front' | 'national_id_back' | 'drivers_license' | 'vehicle_registration' | 'selfie';

interface DocumentUpload {
  type: DocumentType;
  label: string;
  description: string;
  icon: string;
  required: boolean;
}

const DOCUMENT_TYPES: DocumentUpload[] = [
  {
    type: 'national_id_front',
    label: 'National ID (Front)',
    description: 'Front side of your Zimbabwe National ID or Passport',
    icon: 'credit-card',
    required: true,
  },
  {
    type: 'national_id_back',
    label: 'National ID (Back)',
    description: 'Back side of your Zimbabwe National ID or Passport',
    icon: 'credit-card',
    required: true,
  },
  {
    type: 'drivers_license',
    label: "Driver's License",
    description: 'Required for drivers only',
    icon: 'drive-eta',
    required: false,
  },
  {
    type: 'vehicle_registration',
    label: 'Vehicle Registration',
    description: 'Vehicle license disc or registration document',
    icon: 'description',
    required: false,
  },
  {
    type: 'selfie',
    label: 'Selfie Verification',
    description: 'Clear photo of your face for identity verification',
    icon: 'person',
    required: true,
  },
];

export default function VerifyIDScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await getVerificationDocuments();
      setDocuments(docs);
      console.log('[VerifyID] Loaded documents:', docs.length);
    } catch (error: any) {
      console.error('[VerifyID] Error loading documents:', error);
      showModal('Error', error.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const pickImage = async (documentType: DocumentType) => {
    console.log('[VerifyID] User tapped upload for:', documentType);
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showModal('Permission Required', 'Please allow access to your photo library to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocument(documentType, result.assets[0].uri);
    }
  };

  const takePhoto = async (documentType: DocumentType) => {
    console.log('[VerifyID] User tapped camera for:', documentType);
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      showModal('Permission Required', 'Please allow access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocument(documentType, result.assets[0].uri);
    }
  };

  const uploadDocument = async (documentType: DocumentType, uri: string) => {
    setIsUploading(true);
    console.log('[VerifyID] Uploading document:', documentType);
    
    try {
      const fileName = `${documentType}_${Date.now()}.jpg`;
      const file = {
        uri,
        name: fileName,
        type: 'image/jpeg',
      };

      const response = await uploadVerificationDocument(file, documentType);
      
      setUploadedImages(prev => ({ ...prev, [documentType]: uri }));
      setDocuments(prev => [...prev.filter(d => d.documentType !== documentType), response]);
      
      showModal('Success', 'Document uploaded successfully! Our team will review it shortly.');
      console.log('[VerifyID] Document uploaded successfully');
    } catch (error: any) {
      console.error('[VerifyID] Upload error:', error);
      showModal('Upload Failed', error.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentStatus = (type: DocumentType) => {
    const doc = documents.find(d => d.documentType === type);
    return doc?.status || 'not_uploaded';
  };

  const getDocumentUrl = (type: DocumentType) => {
    const doc = documents.find(d => d.documentType === type);
    return uploadedImages[type] || doc?.documentUrl;
  };

  const renderDocumentCard = (docType: DocumentUpload) => {
    const status = getDocumentStatus(docType.type);
    const imageUrl = getDocumentUrl(docType.type);
    
    const statusColor = status === 'approved' ? colors.success : 
                       status === 'rejected' ? colors.error : 
                       status === 'pending' ? colors.warning : colors.textSecondary;
    
    const statusText = status === 'approved' ? 'Approved' : 
                      status === 'rejected' ? 'Rejected' : 
                      status === 'pending' ? 'Under Review' : 'Not Uploaded';

    return (
      <View key={docType.type} style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentTitleRow}>
            <IconSymbol
              ios_icon_name="doc.fill"
              android_material_icon_name={docType.icon}
              size={24}
              color={colors.primary}
            />
            <View style={styles.documentTitleContainer}>
              <Text style={styles.documentTitle}>{docType.label}</Text>
              {docType.required && (
                <Text style={styles.requiredBadge}>Required</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        
        <Text style={styles.documentDescription}>{docType.description}</Text>
        
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.documentPreview} />
        )}
        
        {status === 'rejected' && (
          <View style={styles.rejectionNotice}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={16}
              color={colors.error}
            />
            <Text style={styles.rejectionText}>
              Document rejected. Please upload a clearer image.
            </Text>
          </View>
        )}
        
        {(status === 'not_uploaded' || status === 'rejected') && (
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => takePhoto(docType.type)}
              disabled={isUploading}
            >
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage(docType.type)}
              disabled={isUploading}
            >
              <IconSymbol
                ios_icon_name="photo.fill"
                android_material_icon_name="photo"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.uploadButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const allRequiredUploaded = DOCUMENT_TYPES
    .filter(d => d.required)
    .every(d => getDocumentStatus(d.type) !== 'not_uploaded');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Verify Your Identity',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="checkmark.shield.fill"
            android_material_icon_name="verified-user"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <Text style={styles.headerSubtitle}>
            Upload your documents to get verified and build trust with the ZimCommute community.
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why verify?</Text>
          <View style={styles.benefitRow}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.benefitText}>Increase booking chances by 3x</Text>
          </View>
          <View style={styles.benefitRow}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.benefitText}>Build trust with other users</Text>
          </View>
          <View style={styles.benefitRow}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.benefitText}>Get priority support</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {DOCUMENT_TYPES.map(renderDocumentCard)}
            
            {allRequiredUploaded && (
              <View style={styles.successCard}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={32}
                  color={colors.success}
                />
                <Text style={styles.successTitle}>All Required Documents Uploaded!</Text>
                <Text style={styles.successText}>
                  Our team will review your documents within 24-48 hours. You'll receive a notification once verified.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.uploadingText}>Uploading document...</Text>
        </View>
      )}

      <CustomModal
        isVisible={modalVisible}
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
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  benefitsCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  documentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  requiredBadge: {
    fontSize: 12,
    color: colors.error,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  documentPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionText: {
    fontSize: 14,
    color: colors.error,
    marginLeft: 8,
    flex: 1,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  successCard: {
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
  },
});
