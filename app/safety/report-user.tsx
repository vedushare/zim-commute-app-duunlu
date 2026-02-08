
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/IconSymbol';
import Button from '@/components/button';
import { CustomModal } from '@/components/ui/CustomModal';
import { colors } from '@/styles/commonStyles';
import { createReport, uploadReportEvidence } from '@/utils/safetyApi';

const REPORT_CATEGORIES = [
  { value: 'safety', label: 'Safety Concern', icon: 'warning', description: 'Unsafe driving, harassment, or threats' },
  { value: 'vehicle', label: 'Vehicle Issue', icon: 'drive-eta', description: 'Poor vehicle condition or cleanliness' },
  { value: 'behavior', label: 'Inappropriate Behavior', icon: 'person', description: 'Rude, unprofessional, or offensive conduct' },
  { value: 'payment', label: 'Payment Dispute', icon: 'payment', description: 'Overcharging or payment issues' },
];

export default function ReportUserScreen() {
  const router = useRouter();
  const { userId, rideId, bookingId } = useLocalSearchParams<{
    userId: string;
    rideId?: string;
    bookingId?: string;
  }>();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleAddEvidence = async () => {
    console.log('[ReportUser] User tapped Add Evidence');
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showModal('Permission Required', 'Please allow access to your photo library to upload evidence.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      await uploadEvidence(result.assets[0].uri);
    }
  };

  const uploadEvidence = async (uri: string) => {
    setIsUploadingEvidence(true);
    console.log('[ReportUser] Uploading evidence');
    
    try {
      const fileName = `evidence_${Date.now()}.jpg`;
      const file = {
        uri,
        name: fileName,
        type: 'image/jpeg',
      };

      const response = await uploadReportEvidence(file);
      setEvidenceImages(prev => [...prev, response.evidenceUrl]);
      console.log('[ReportUser] Evidence uploaded successfully');
    } catch (error: any) {
      console.error('[ReportUser] Upload error:', error);
      showModal('Upload Failed', error.message || 'Failed to upload evidence. Please try again.');
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const handleRemoveEvidence = (index: number) => {
    console.log('[ReportUser] Removing evidence at index:', index);
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async () => {
    if (!selectedCategory) {
      showModal('Category Required', 'Please select a report category.');
      return;
    }

    if (!description.trim()) {
      showModal('Description Required', 'Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);
    console.log('[ReportUser] Submitting report for user:', userId);
    
    try {
      await createReport({
        reportedUserId: userId,
        rideId,
        bookingId,
        category: selectedCategory as any,
        description: description.trim(),
        evidenceUrls: evidenceImages.length > 0 ? evidenceImages : undefined,
      });
      
      showModal(
        'Report Submitted',
        'Thank you for your report. Our team will review it and take appropriate action.'
      );
      console.log('[ReportUser] Report submitted successfully');
      
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      console.error('[ReportUser] Error submitting report:', error);
      showModal('Error', error.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Report User',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="exclamationmark.shield.fill"
            android_material_icon_name="report"
            size={64}
            color={colors.error}
          />
          <Text style={styles.headerTitle}>Report a User</Text>
          <Text style={styles.headerSubtitle}>
            Help us maintain a safe community by reporting inappropriate behavior or safety concerns.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          {REPORT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryCard,
                selectedCategory === category.value && styles.categoryCardSelected,
              ]}
              onPress={() => {
                console.log('[ReportUser] Selected category:', category.value);
                setSelectedCategory(category.value);
              }}
            >
              <View style={styles.categoryHeader}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name={category.icon}
                  size={24}
                  color={selectedCategory === category.value ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.value && styles.categoryLabelSelected,
                  ]}
                >
                  {category.label}
                </Text>
                {selectedCategory === category.value && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </View>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe the Issue</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Please provide details about what happened..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Upload photos or screenshots to support your report
          </Text>
          
          {evidenceImages.length > 0 && (
            <View style={styles.evidenceGrid}>
              {evidenceImages.map((uri, index) => (
                <View key={index} style={styles.evidenceItem}>
                  <Image source={{ uri }} style={styles.evidenceImage} />
                  <TouchableOpacity
                    style={styles.removeEvidenceButton}
                    onPress={() => handleRemoveEvidence(index)}
                  >
                    <IconSymbol
                      ios_icon_name="xmark.circle.fill"
                      android_material_icon_name="cancel"
                      size={24}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity
            style={styles.addEvidenceButton}
            onPress={handleAddEvidence}
            disabled={isUploadingEvidence}
          >
            {isUploadingEvidence ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="photo.badge.plus.fill"
                  android_material_icon_name="add-photo-alternate"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.addEvidenceText}>Add Photo Evidence</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            All reports are confidential. Our team will review your report within 24 hours and take appropriate action.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Submitting...' : 'Submit Report'}
          onPress={handleSubmitReport}
          disabled={isSubmitting || !selectedCategory || !description.trim()}
          style={styles.submitButton}
        />
      </View>

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
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  categoryLabelSelected: {
    color: colors.primary,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 36,
  },
  descriptionInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  evidenceItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  removeEvidenceButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addEvidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  addEvidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    width: '100%',
  },
});
