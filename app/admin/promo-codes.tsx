
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '@/utils/adminApi';
import type { PromoCode } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';
import Button from '@/components/button';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PromoCodesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formValidFrom, setFormValidFrom] = useState(new Date());
  const [formValidUntil, setFormValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [formIsActive, setFormIsActive] = useState(true);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const loadPromoCodes = useCallback(async () => {
    console.log('Loading promo codes');
    try {
      const data = await getPromoCodes();
      setPromoCodes(data);
    } catch (error: any) {
      console.error('Failed to load promo codes:', error);
      showModal('Error', error.message || 'Failed to load promo codes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showModal]);

  useEffect(() => {
    loadPromoCodes();
  }, [loadPromoCodes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPromoCodes();
  };

  const handleCreatePromo = () => {
    setIsCreating(true);
    setSelectedPromo(null);
    setFormCode('');
    setFormDiscountType('percentage');
    setFormDiscountValue('');
    setFormMaxUses('');
    setFormValidFrom(new Date());
    setFormValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setFormIsActive(true);
    setEditModalVisible(true);
  };

  const handleEditPromo = (promo: PromoCode) => {
    setIsCreating(false);
    setSelectedPromo(promo);
    setFormCode(promo.code);
    setFormDiscountType(promo.discountType);
    setFormDiscountValue(promo.discountValue.toString());
    setFormMaxUses(promo.maxUses?.toString() || '');
    setFormValidFrom(new Date(promo.validFrom));
    setFormValidUntil(new Date(promo.validUntil));
    setFormIsActive(promo.isActive);
    setEditModalVisible(true);
  };

  const handleSavePromo = async () => {
    const discountValue = parseFloat(formDiscountValue);
    const maxUses = formMaxUses ? parseInt(formMaxUses) : undefined;
    
    if (!formCode) {
      showModal('Error', 'Please enter a promo code');
      return;
    }
    
    if (isNaN(discountValue)) {
      showModal('Error', 'Please enter a valid discount value');
      return;
    }

    try {
      if (isCreating) {
        await createPromoCode({
          code: formCode.toUpperCase(),
          discountType: formDiscountType,
          discountValue,
          maxUses,
          validFrom: formValidFrom.toISOString(),
          validUntil: formValidUntil.toISOString(),
        });
        showModal('Success', 'Promo code created successfully');
      } else if (selectedPromo) {
        await updatePromoCode(selectedPromo.id, {
          code: formCode.toUpperCase(),
          discountType: formDiscountType,
          discountValue,
          maxUses,
          validFrom: formValidFrom.toISOString(),
          validUntil: formValidUntil.toISOString(),
          isActive: formIsActive,
        });
        showModal('Success', 'Promo code updated successfully');
      }
      setEditModalVisible(false);
      loadPromoCodes();
    } catch (error: any) {
      console.error('Failed to save promo code:', error);
      showModal('Error', error.message || 'Failed to save promo code');
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    try {
      await deletePromoCode(promoId);
      showModal('Success', 'Promo code deleted successfully');
      loadPromoCodes();
    } catch (error: any) {
      console.error('Failed to delete promo code:', error);
      showModal('Error', error.message || 'Failed to delete promo code');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Promo Codes', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading promo codes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Promo Codes', headerShown: true }} />
      
      <View style={styles.header}>
        <Button
          title="Create Promo Code"
          onPress={handleCreatePromo}
          style={styles.addButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.promoList}>
          {promoCodes.map((promo) => {
            const discountText = promo.discountType === 'percentage'
              ? `${promo.discountValue}% off`
              : `$${promo.discountValue.toFixed(2)} off`;
            const usageText = promo.maxUses
              ? `${promo.currentUses}/${promo.maxUses} uses`
              : `${promo.currentUses} uses`;
            const validFromText = formatDate(promo.validFrom);
            const validUntilText = formatDate(promo.validUntil);
            
            return (
              <View key={promo.id} style={styles.promoCard}>
                <View style={styles.promoHeader}>
                  <View style={styles.promoInfo}>
                    <Text style={styles.promoCode}>{promo.code}</Text>
                    {promo.isActive ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    ) : (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.promoDetails}>
                  <View style={styles.promoDetailRow}>
                    <Text style={styles.promoDetailLabel}>Discount:</Text>
                    <Text style={styles.promoDetailValue}>{discountText}</Text>
                  </View>
                  <View style={styles.promoDetailRow}>
                    <Text style={styles.promoDetailLabel}>Usage:</Text>
                    <Text style={styles.promoDetailValue}>{usageText}</Text>
                  </View>
                  <View style={styles.promoDetailRow}>
                    <Text style={styles.promoDetailLabel}>Valid From:</Text>
                    <Text style={styles.promoDetailValue}>{validFromText}</Text>
                  </View>
                  <View style={styles.promoDetailRow}>
                    <Text style={styles.promoDetailLabel}>Valid Until:</Text>
                    <Text style={styles.promoDetailValue}>{validUntilText}</Text>
                  </View>
                </View>

                <View style={styles.promoActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditPromo(promo)}
                  >
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePromo(promo.id)}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={16}
                      color={colors.danger}
                    />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {promoCodes.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="tag"
                android_material_icon_name="local-offer"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No promo codes</Text>
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
              {isCreating ? 'Create Promo Code' : 'Edit Promo Code'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.formLabel}>Promo Code</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., SUMMER2024"
                placeholderTextColor={colors.textSecondary}
                value={formCode}
                onChangeText={(text) => setFormCode(text.toUpperCase())}
                autoCapitalize="characters"
              />

              <Text style={styles.formLabel}>Discount Type</Text>
              <View style={styles.discountTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    formDiscountType === 'percentage' && styles.discountTypeButtonActive,
                  ]}
                  onPress={() => setFormDiscountType('percentage')}
                >
                  <Text
                    style={[
                      styles.discountTypeText,
                      formDiscountType === 'percentage' && styles.discountTypeTextActive,
                    ]}
                  >
                    Percentage
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    formDiscountType === 'fixed' && styles.discountTypeButtonActive,
                  ]}
                  onPress={() => setFormDiscountType('fixed')}
                >
                  <Text
                    style={[
                      styles.discountTypeText,
                      formDiscountType === 'fixed' && styles.discountTypeTextActive,
                    ]}
                  >
                    Fixed Amount
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>
                Discount Value {formDiscountType === 'percentage' ? '(%)' : '($)'}
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder={formDiscountType === 'percentage' ? 'e.g., 10' : 'e.g., 5.00'}
                placeholderTextColor={colors.textSecondary}
                value={formDiscountValue}
                onChangeText={setFormDiscountValue}
                keyboardType="decimal-pad"
              />

              <Text style={styles.formLabel}>Max Uses (optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Leave empty for unlimited"
                placeholderTextColor={colors.textSecondary}
                value={formMaxUses}
                onChangeText={setFormMaxUses}
                keyboardType="number-pad"
              />

              <Text style={styles.formLabel}>Valid From</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowFromPicker(true)}
              >
                <Text style={styles.dateButtonText}>{formValidFrom.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showFromPicker && (
                <DateTimePicker
                  value={formValidFrom}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowFromPicker(Platform.OS === 'ios');
                    if (date) setFormValidFrom(date);
                  }}
                />
              )}

              <Text style={styles.formLabel}>Valid Until</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowUntilPicker(true)}
              >
                <Text style={styles.dateButtonText}>{formValidUntil.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showUntilPicker && (
                <DateTimePicker
                  value={formValidUntil}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowUntilPicker(Platform.OS === 'ios');
                    if (date) setFormValidUntil(date);
                  }}
                />
              )}

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
                  <Text style={styles.checkboxLabel}>Active</Text>
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
                onPress={handleSavePromo}
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
  promoList: {
    padding: 16,
  },
  promoCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  promoHeader: {
    marginBottom: 12,
  },
  promoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  inactiveBadge: {
    backgroundColor: colors.textSecondary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  promoDetails: {
    gap: 8,
    marginBottom: 12,
  },
  promoDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  promoDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  promoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
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
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.danger + '20',
    borderRadius: 8,
    paddingVertical: 10,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
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
  discountTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  discountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  discountTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  discountTypeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  discountTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
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
