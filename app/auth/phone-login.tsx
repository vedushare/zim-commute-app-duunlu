
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { validateZimbabwePhone, formatPhoneNumber } from '@/constants/zimbabwe';
import Button from '@/components/button';
import { sendOTP } from '@/utils/api';
import { CustomModal } from '@/components/ui/CustomModal';
import { Image } from 'expo-image';

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PhoneLoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    setError('');
  };

  const handleContinue = async () => {
    console.log('[PhoneLogin] User tapped Continue button with phone:', phoneNumber);
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!validateZimbabwePhone(formattedPhone)) {
      setError('Please enter a valid Zimbabwe phone number (e.g., 0712345678)');
      console.log('[PhoneLogin] Phone validation failed:', formattedPhone);
      return;
    }

    setIsLoading(true);
    setError('');
    console.log('[PhoneLogin] Sending OTP to:', formattedPhone);

    try {
      const response = await sendOTP(formattedPhone);
      
      console.log('[PhoneLogin] OTP request successful');
      console.log('[PhoneLogin] SMS Status:', response.smsStatus);
      console.log('[PhoneLogin] OTP expires in:', response.expiresIn, 'seconds');
      
      // Check SMS status
      const smsStatus = response.smsStatus || '';
      
      if (smsStatus === 'sent') {
        // SMS sent successfully
        setModalTitle('✅ Code Sent');
        setModalType('success');
        setModalMessage(
          `A 6-digit verification code has been sent to ${formattedPhone} via SMS.\n\n` +
          'Please check your messages and enter the code on the next screen.\n\n' +
          'The code will expire in 5 minutes.'
        );
      } else if (smsStatus === 'test_mode') {
        // Test mode - OTP logged to console
        setModalTitle('🧪 Test Mode');
        setModalType('info');
        setModalMessage(
          `SMS service is in TEST MODE.\n\n` +
          `Your verification code has been generated and logged to the backend console.\n\n` +
          'Check the backend logs for your OTP code, then proceed to enter it on the next screen.\n\n' +
          'To enable real SMS delivery, go to Admin Panel → Configuration → SMS Configuration and disable Test Mode.'
        );
      } else if (smsStatus === 'disabled') {
        // SMS service disabled
        setModalTitle('⚠️ SMS Service Disabled');
        setModalType('info');
        setModalMessage(
          `The SMS service is currently disabled.\n\n` +
          `Your verification code has been generated and logged to the backend console.\n\n` +
          'To enable SMS delivery:\n' +
          '1. Go to Admin Panel → Configuration → SMS Configuration\n' +
          '2. Enable the SMS service\n' +
          '3. Verify the API configuration\n\n' +
          'For now, check the backend logs for your OTP code.'
        );
      } else if (smsStatus === 'provider_error') {
        // SMS provider error
        setModalTitle('⚠️ SMS Delivery Issue');
        setModalType('error');
        setModalMessage(
          `There was an error sending the SMS.\n\n` +
          `Error: ${response.message}\n\n` +
          'Your verification code has been generated and logged to the backend console.\n\n' +
          'Please check:\n' +
          '1. The SMS provider API is accessible\n' +
          '2. The API key is valid\n' +
          '3. The phone number format is correct\n\n' +
          'Check the backend logs for your OTP code.'
        );
      } else if (smsStatus === 'connection_error') {
        // Connection error
        setModalTitle('❌ Connection Error');
        setModalType('error');
        setModalMessage(
          `Unable to connect to the SMS provider.\n\n` +
          `Error: ${response.message}\n\n` +
          'Your verification code has been generated and logged to the backend console.\n\n' +
          'Please check:\n' +
          '1. The SMS provider URL is correct\n' +
          '2. The SMS provider service is online\n' +
          '3. Network connectivity\n\n' +
          'Check the backend logs for your OTP code.'
        );
      } else {
        // Unknown status
        setModalTitle('ℹ️ OTP Generated');
        setModalType('info');
        setModalMessage(
          `Your verification code has been generated.\n\n` +
          `Status: ${smsStatus || 'Unknown'}\n\n` +
          'If you don\'t receive the SMS, check the backend logs for your OTP code.\n\n' +
          'You can proceed to enter the code on the next screen.'
        );
      }
      
      setShowModal(true);
    } catch (err: any) {
      console.error('[PhoneLogin] Error sending OTP:', err);
      const errorMsg = err.message || 'Failed to send OTP. Please try again.';
      
      // Check if it's a network error
      if (errorMsg.includes('connect') || errorMsg.includes('network') || errorMsg.includes('fetch')) {
        setModalTitle('❌ Connection Error');
        setModalType('error');
        setModalMessage(
          'Unable to connect to the server. Please check:\n\n' +
          '1. Your internet connection is active\n' +
          '2. The backend server is running\n' +
          '3. The backend URL is correct\n\n' +
          'Please try again once the connection is restored.'
        );
      } else if (errorMsg.includes('429') || errorMsg.includes('Too many')) {
        setModalTitle('⏱️ Rate Limit Exceeded');
        setModalType('error');
        setModalMessage(
          'You have requested too many OTP codes.\n\n' +
          'Please wait 1 hour before trying again.\n\n' +
          'This limit helps protect against abuse.'
        );
      } else {
        setModalTitle('❌ Error');
        setModalType('error');
        setModalMessage(errorMsg);
      }
      
      setShowModal(true);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    
    // Only navigate if it's not a connection error or rate limit error
    if (modalType !== 'error' || modalTitle.includes('SMS')) {
      router.push({
        pathname: '/auth/verify-otp',
        params: { phoneNumber: formatPhoneNumber(phoneNumber) },
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sign In',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.flag}>🇿🇼</Text>
            <Text style={styles.title}>Welcome to ZimCommute</Text>
            <Text style={styles.subtitle}>
              Connecting Zimbabwe, One Ride at a Time
            </Text>
          </View>

          <View style={styles.landmarksContainer}>
            <View style={styles.landmarkCard}>
              <Image
                source={resolveImageSource(require('../../assets/images/24fc7581-94ce-40c8-a246-888a90c315dc.jpeg'))}
                style={styles.landmarkImage}
                contentFit="cover"
              />
              <Text style={styles.landmarkLabel}>Great Zimbabwe</Text>
            </View>
            <View style={styles.landmarkCard}>
              <Image
                source={resolveImageSource(require('../../assets/images/04117f2d-2294-41f3-9dc3-4ea3fcc78f1e.jpeg'))}
                style={styles.landmarkImage}
                contentFit="cover"
              />
              <Text style={styles.landmarkLabel}>Victoria Falls</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Enter your phone number to get started</Text>
            
            <PhoneInput
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              error={error}
            />

            <Button
              onPress={handleContinue}
              disabled={isLoading || !phoneNumber}
              loading={isLoading}
              variant="primary"
              size="large"
              style={styles.button}
            >
              Continue
            </Button>

            <Text style={styles.disclaimer}>
              By continuing, you agree to our terms and conditions of use, and to receive an SMS verification code. Standard message rates may apply.
            </Text>
          </View>
        </ScrollView>

        <CustomModal
          visible={showModal}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
          onClose={handleModalClose}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  flag: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  landmarksContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  landmarkCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  landmarkImage: {
    width: '100%',
    height: 120,
  },
  landmarkLabel: {
    padding: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
