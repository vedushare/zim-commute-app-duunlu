
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    setError('');
  };

  const handleContinue = async () => {
    console.log('[PhoneLogin] User tapped Continue button with phone:', phoneNumber);
    
    // Validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!validateZimbabwePhone(formattedPhone)) {
      setError('Please enter a valid Zimbabwe phone number');
      console.log('[PhoneLogin] Phone validation failed:', formattedPhone);
      return;
    }

    setIsLoading(true);
    setError('');
    console.log('[PhoneLogin] Sending OTP to:', formattedPhone);

    try {
      const response = await sendOTP(formattedPhone);
      
      console.log('[PhoneLogin] OTP sent successfully:', response.message);
      console.log('[PhoneLogin] OTP expires in:', response.expiresIn, 'seconds');
      
      // Navigate to OTP verification screen
      router.push({
        pathname: '/auth/verify-otp',
        params: { phoneNumber: formattedPhone },
      });
    } catch (err: any) {
      console.error('[PhoneLogin] Error sending OTP:', err);
      const message = err.message || 'Failed to send OTP. Please try again.';
      setError(message);
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
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

          {/* Zimbabwe Landmarks - Corrected labels */}
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
          visible={showErrorModal}
          title="Error"
          message={errorMessage}
          type="error"
          onClose={() => setShowErrorModal(false)}
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
