
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Button from '@/components/button';
import { CustomModal } from '@/components/ui/CustomModal';
import { colors } from '@/styles/commonStyles';
import {
  getEmergencyContacts,
  createEmergencyContact,
  deleteEmergencyContact,
} from '@/utils/safetyApi';
import type { EmergencyContact } from '@/types/safety';

const RELATIONSHIPS = [
  'Parent',
  'Spouse',
  'Sibling',
  'Child',
  'Friend',
  'Colleague',
  'Other',
];

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('');
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEmergencyContacts();
      setContacts(data);
      console.log('[EmergencyContacts] Loaded contacts:', data.length);
    } catch (error: any) {
      console.error('[EmergencyContacts] Error loading contacts:', error);
      showModal('Error', error.message || 'Failed to load emergency contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleAddContact = () => {
    console.log('[EmergencyContacts] User tapped Add Contact');
    setName('');
    setPhoneNumber('');
    setRelationship('');
    setShowAddModal(true);
  };

  const handleSaveContact = async () => {
    if (!name.trim()) {
      showModal('Validation Error', 'Please enter a name');
      return;
    }
    
    if (!phoneNumber.trim()) {
      showModal('Validation Error', 'Please enter a phone number');
      return;
    }
    
    if (!relationship) {
      showModal('Validation Error', 'Please select a relationship');
      return;
    }

    setIsSaving(true);
    console.log('[EmergencyContacts] Saving contact:', name);
    
    try {
      const newContact = await createEmergencyContact({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        relationship,
      });
      
      setContacts(prev => [...prev, newContact]);
      setShowAddModal(false);
      showModal('Success', 'Emergency contact added successfully');
      console.log('[EmergencyContacts] Contact saved successfully');
    } catch (error: any) {
      console.error('[EmergencyContacts] Save error:', error);
      showModal('Error', error.message || 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    console.log('[EmergencyContacts] Deleting contact:', contactId);
    setIsLoading(true);
    
    try {
      await deleteEmergencyContact(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setDeleteContactId(null);
      showModal('Success', 'Emergency contact deleted');
      console.log('[EmergencyContacts] Contact deleted successfully');
    } catch (error: any) {
      console.error('[EmergencyContacts] Delete error:', error);
      showModal('Error', error.message || 'Failed to delete contact');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('263')) {
      return `+${cleaned}`;
    }
    return `+263${cleaned}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Emergency Contacts',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="phone.circle.fill"
            android_material_icon_name="phone"
            size={48}
            color={colors.error}
          />
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <Text style={styles.headerSubtitle}>
            Add trusted contacts who will be notified in case of an emergency during your ride.
          </Text>
        </View>

        {isLoading && contacts.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="person.crop.circle.badge.plus"
              android_material_icon_name="person-add"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyText}>
              Add at least one emergency contact for your safety
            </Text>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactIcon}>
                  <IconSymbol
                    ios_icon_name="person.circle.fill"
                    android_material_icon_name="account-circle"
                    size={40}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{formatPhoneNumber(contact.phoneNumber)}</Text>
                  <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setDeleteContactId(contact.id)}
                >
                  <IconSymbol
                    ios_icon_name="trash.fill"
                    android_material_icon_name="delete"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Your emergency contacts will receive an SMS with your location if you trigger an SOS alert.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Add Emergency Contact"
          onPress={handleAddContact}
          style={styles.addButton}
        />
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+263</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="77 123 4567"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Relationship</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowRelationshipPicker(!showRelationshipPicker)}
              >
                <Text style={relationship ? styles.pickerButtonText : styles.pickerPlaceholder}>
                  {relationship || 'Select relationship'}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.down"
                  android_material_icon_name="arrow-drop-down"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              
              {showRelationshipPicker && (
                <View style={styles.pickerOptions}>
                  {RELATIONSHIPS.map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={styles.pickerOption}
                      onPress={() => {
                        setRelationship(rel);
                        setShowRelationshipPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{rel}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Button
                title={isSaving ? 'Saving...' : 'Save Contact'}
                onPress={handleSaveContact}
                disabled={isSaving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <CustomModal
        isVisible={deleteContactId !== null}
        title="Delete Contact"
        message="Are you sure you want to remove this emergency contact?"
        onConfirm={() => deleteContactId && handleDeleteContact(deleteContactId)}
        onCancel={() => setDeleteContactId(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />

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
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  contactsList: {
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: colors.primary,
  },
  deleteButton: {
    padding: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
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
  addButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingLeft: 12,
    paddingRight: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  pickerOptions: {
    backgroundColor: colors.card,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
  },
});
