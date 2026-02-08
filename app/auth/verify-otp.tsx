
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { OTPInput } from '@/components/auth/OTPInput';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/button';
import { verifyOTP, resendOTP } from '@/utils/api';
import { CustomModal } from '@/components/ui/CustomModal';
import { User } from '@/types/auth';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { login } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOTPChange = (text: string) => {
    setOtp(text);
    setError('');
    
    // Auto-submit when OTP is complete
    if (text.length === 6) {
      handleVerify(text);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp;
    
    if (codeToVerify.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!phoneNumber) {
      setError('Phone number is missing');
      return;
    }

    console.log('[VerifyOTP] User verifying OTP:', codeToVerify, 'for phone:', phoneNumber);
    setIsLoading(true);
    setError('');

    try {
      const response = await verifyOTP(phoneNumber, codeToVerify);
      
      console.log('[VerifyOTP] OTP verified successfully');
      console.log('[VerifyOTP] User data:', response.user);
      
      // Note: The backend doesn't return a token in the response
      // We'll use the user ID as a temporary token until proper JWT is implemented
      const tempToken = `user_${response.user.id}`;
      
      // Convert backend user to our User type
      const user: User = {
        id: response.user.id,
        phoneNumber: response.user.phoneNumber,
        fullName: response.user.fullName || undefined,
        email: response.user.email || undefined,
        profilePhotoUrl: response.user.profilePhotoUrl || undefined,
        userType: (response.user.userType as 'Passenger' | 'Driver') || undefined,
        homeCity: response.user.homeCity || undefined,
        verificationLevel: response.user.verificationLevel as 'PhoneVerified' | 'IDUploaded' | 'FullyVerified',
        role: (response.user.role as 'user' | 'admin' | 'super_admin') || 'user',
        walletBalance: response.user.walletBalance || 0,
        isBanned: response.user.isBanned || false,
        banReason: response.user.banReason || undefined,
        createdAt: response.user.createdAt,
      };
      
      console.log('[VerifyOTP] Logging in user');
      await login(tempToken, user);
      
      // Navigate to profile setup if profile is incomplete, otherwise go to home
      const isProfileComplete = user.fullName && user.userType && user.homeCity;
      
      if (isProfileComplete) {
        console.log('[VerifyOTP] Profile complete, navigating to home');
        router.replace('/(tabs)/(home)');
      } else {
        console.log('[VerifyOTP] Profile incomplete, navigating to profile setup');
        router.replace('/auth/profile-setup');
      }
    } catch (err: any) {
      console.error('[VerifyOTP] Error verifying OTP:', err);
      const message = err.message || 'Invalid code. Please try again.';
      setError(message);
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phoneNumber) {
      setError('Phone number is missing');
      return;
    }

    console.log('[VerifyOTP] User tapped Resend OTP for phone:', phoneNumber);
    setIsResending(true);
    setError('');

    try {
      const response = await resendOTP(phoneNumber);
      
      console.log('[VerifyOTP] OTP resent successfully:', response.message);
      setCountdown(60);
      setCanResend(false);
      setOtp('');
      
      // Show success message
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('[VerifyOTP] Error resending OTP:', err);
      const message = err.message || 'Failed to resend code. Please try again.';
      setError(message);
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsResending(false);
    }
  };

  const maskedPhone = phoneNumber ? phoneNumber.replace(/(\d{3})(\d{2})(\d{3})(\d{4})/, '$1 $2 *** ****') : '';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Verify Phone',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.icon}>📱</Text>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to
            </Text>
            <Text style={styles.phone}>{maskedPhone}</Text>
          </View>

          <View style={styles.form}>
            <OTPInput
              value={otp}
              onChangeText={handleOTPChange}
              error={!!error}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Button
              onPress={() => handleVerify()}
              disabled={isLoading || otp.length !== 6}
              loading={isLoading}
              variant="primary"
              size="large"
              style={styles.button}
            >
              Verify
            </Button>

            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={isResending}
                  style={styles.resendButton}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.resendText}>Resend Code</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>Resend code in</Text>
                  <Text style={styles.countdownNumber}>{countdown}s</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <CustomModal
          visible={showErrorModal}
          title="Error"
          message={errorMessage}
          type="error"
          onClose={() => setShowErrorModal(false)}
        />

        <CustomModal
          visible={showSuccessModal}
          title="Code Resent"
          message="A new verification code has been sent to your phone."
          type="success"
          onClose={() => setShowSuccessModal(false)}
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
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
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
  phone: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 24,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendButton: {
    padding: 8,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  countdownNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
