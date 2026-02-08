
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomModal } from '@/components/ui/CustomModal';
import { colors } from '@/styles/commonStyles';
import { createSOSAlert } from '@/utils/safetyApi';

interface SOSButtonProps {
  rideId?: string;
  style?: any;
}

export function SOSButton({ rideId, style }: SOSButtonProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleSOSPress = () => {
    console.log('[SOSButton] User tapped SOS button');
    setShowConfirm(true);
  };

  const handleConfirmSOS = async () => {
    setShowConfirm(false);
    setIsTriggering(true);
    console.log('🚨🚨🚨 SOS ALERT TRIGGERED 🚨🚨🚨');
    console.log('[SOSButton] Creating SOS alert for ride:', rideId);
    
    try {
      // In production, this would get the user's current location
      const alert = await createSOSAlert({
        rideId,
        locationLat: undefined,
        locationLng: undefined,
      });
      
      console.log('🚨 SOS Alert created:', alert.id);
      console.log('🚨 Emergency contacts will be notified');
      console.log('🚨 Admin team has been alerted');
      
      showModal(
        'SOS Alert Sent',
        'Your emergency contacts and our support team have been notified. Help is on the way. Stay safe!'
      );
    } catch (error: any) {
      console.error('[SOSButton] Error creating SOS alert:', error);
      showModal('Error', error.message || 'Failed to send SOS alert. Please call emergency services directly.');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.sosButton, style]}
        onPress={handleSOSPress}
        disabled={isTriggering}
      >
        {isTriggering ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={24}
              color="#fff"
            />
            <Text style={styles.sosButtonText}>SOS</Text>
          </>
        )}
      </TouchableOpacity>

      <CustomModal
        isVisible={showConfirm}
        title="Emergency SOS"
        message="This will alert your emergency contacts and our support team. Only use in genuine emergencies. Continue?"
        onConfirm={handleConfirmSOS}
        onCancel={() => setShowConfirm(false)}
        confirmText="Send SOS Alert"
        cancelText="Cancel"
      />

      <CustomModal
        isVisible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onConfirm={() => setModalVisible(false)}
        confirmText="OK"
      />
    </>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sosButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
