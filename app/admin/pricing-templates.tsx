
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getPricingTemplates, createPricingTemplate, updatePricingTemplate } from '@/utils/adminApi';
import type { PricingTemplate } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';
import Button from '@/components/button';

export default function PricingTemplatesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState<PricingTemplate[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PricingTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formName, setFormName] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formPricePerKm, setFormPricePerKm] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState('');
  const [formIsActive, setFormIsActive] = useState(false);

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const loadTemplates = useCallback(async () => {
    console.log('Loading pricing templates');
    try {
      const data = await getPricingTemplates();
      setTemplates(data);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      showModal('Error', error.message || 'Failed to load pricing templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showModal]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTemplates();
  };

  const handleCreateTemplate = () => {
    setIsCreating(true);
    setSelectedTemplate(null);
    setFormName('');
    setFormBasePrice('');
    setFormPricePerKm('');
    setFormCommissionRate('');
    setFormIsActive(false);
    setEditModalVisible(true);
  };

  const handleEditTemplate = (template: PricingTemplate) => {
    setIsCreating(false);
    setSelectedTemplate(template);
    setFormName(template.name);
    setFormBasePrice(template.basePrice.toString());
    setFormPricePerKm(template.pricePerKm.toString());
    setFormCommissionRate((template.commissionRate * 100).toString());
    setFormIsActive(template.isActive);
    setEditModalVisible(true);
  };

  const handleSaveTemplate = async () => {
    const basePrice = parseFloat(formBasePrice);
    const pricePerKm = parseFloat(formPricePerKm);
    const commissionRate = parseFloat(formCommissionRate) / 100;
    
    if (!formName) {
      showModal('Error', 'Please enter a template name');
      return;
    }
    
    if (isNaN(basePrice) || isNaN(pricePerKm) || isNaN(commissionRate)) {
      showModal('Error', 'Please enter valid numbers');
      return;
    }

    try {
      if (isCreating) {
        await createPricingTemplate({
          name: formName,
          basePrice,
          pricePerKm,
          commissionRate,
        });
        showModal('Success', 'Pricing template created successfully');
      } else if (selectedTemplate) {
        await updatePricingTemplate(selectedTemplate.id, {
          name: formName,
          basePrice,
          pricePerKm,
          commissionRate,
          isActive: formIsActive,
        });
        showModal('Success', 'Pricing template updated successfully');
      }
      setEditModalVisible(false);
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      showModal('Error', error.message || 'Failed to save pricing template');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Pricing Templates', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Pricing Templates', headerShown: true }} />
      
      <View style={styles.header}>
        <Button
          title="Create Template"
          onPress={handleCreateTemplate}
          style={styles.addButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.templatesList}>
          {templates.map((template) => {
            const basePriceText = `$${template.basePrice.toFixed(2)}`;
            const pricePerKmText = `$${template.pricePerKm.toFixed(2)}/km`;
            const commissionText = `${(template.commissionRate * 100).toFixed(1)}%`;
            
            return (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    {template.isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.templateDetails}>
                  <View style={styles.templateDetailRow}>
                    <Text style={styles.templateDetailLabel}>Base Price:</Text>
                    <Text style={styles.templateDetailValue}>{basePriceText}</Text>
                  </View>
                  <View style={styles.templateDetailRow}>
                    <Text style={styles.templateDetailLabel}>Price per km:</Text>
                    <Text style={styles.templateDetailValue}>{pricePerKmText}</Text>
                  </View>
                  <View style={styles.templateDetailRow}>
                    <Text style={styles.templateDetailLabel}>Commission:</Text>
                    <Text style={styles.templateDetailValue}>{commissionText}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditTemplate(template)}
                >
                  <IconSymbol
                    ios_icon_name="pencil"
                    android_material_icon_name="edit"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.editButtonText}>Edit Template</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {templates.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="dollarsign.circle"
                android_material_icon_name="attach-money"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No pricing templates</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit/Create Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isCreating ? 'Create Pricing Template' : 'Edit Pricing Template'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.formLabel}>Template Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Standard Pricing"
                placeholderTextColor={colors.textSecondary}
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.formLabel}>Base Price ($)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter base price"
                placeholderTextColor={colors.textSecondary}
                value={formBasePrice}
                onChangeText={setFormBasePrice}
                keyboardType="decimal-pad"
              />

              <Text style={styles.formLabel}>Price per Kilometer ($)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter price per km"
                placeholderTextColor={colors.textSecondary}
                value={formPricePerKm}
                onChangeText={setFormPricePerKm}
                keyboardType="decimal-pad"
              />

              <Text style={styles.formLabel}>Commission Rate (%)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter commission percentage"
                placeholderTextColor={colors.textSecondary}
                value={formCommissionRate}
                onChangeText={setFormCommissionRate}
                keyboardType="decimal-pad"
              />

              {!isCreating && (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setFormIsActive(!formIsActive)}
                >
                  <View style={[styles.checkbox, formIsActive && styles.checkboxChecked]}>
                    {formIsActive && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Set as active template</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setEditModalVisible(false)}
                style={styles.cancelButton}
              />
              <Button
                title="Save"
                onPress={handleSaveTemplate}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  templatesList: {
    padding: 16,
  },
  templateCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  templateHeader: {
    marginBottom: 12,
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  activeBadge: {
    backgroundColor: colors.success,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  templateDetails: {
    gap: 8,
    marginBottom: 12,
  },
  templateDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  templateDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    paddingVertical: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalForm: {
    maxHeight: 400,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
