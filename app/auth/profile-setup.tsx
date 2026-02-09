
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ZIMBABWE_CITIES } from '@/constants/zimbabwe';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { CustomModal } from '@/components/ui/CustomModal';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import { colors } from '@/styles/commonStyles';
import React, { useState } from 'react';
import Button from '@/components/button';
import { User } from '@/types/auth';
import { updateProfile, uploadProfilePhoto } from '@/utils/api';
import { compressProfilePhoto } from '@/utils/imageCompression';
import { performanceMonitor } from '@/utils/performanceMonitor';
import * as ImagePicker from 'expo-image-picker';
import { OptimizedImage } from '@/components/optimized/OptimizedImage';
import { FadeInView } from '@/components/animations/FadeInView';

type ProfileStep = 'name' | 'type' | 'city' | 'photo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  typeContainer: {
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  typeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  cityGrid: {
    gap: 12,
    marginBottom: 24,
  },
  cityButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  cityText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  footer: {
    padding: 24,
    gap: 12,
  },
  compressionInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default function ProfileSetupScreen() {
  const [step, setStep] = useState<ProfileStep>('name');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'Passenger' | 'Driver' | null>(null);
  const [homeCity, setHomeCity] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressionSavings, setCompressionSavings] = useState<string | null>(null);

  const router = useRouter();
  const { refreshUser } = useAuth();

  const steps: ProfileStep[] = ['name', 'type', 'city', 'photo'];
  const currentStepIndex = steps.indexOf(step);

  const handleNext = async () => {
    console.log('[ProfileSetup] User tapped Next button');
    
    if (step === 'name') {
      setStep('type');
    } else if (step === 'type') {
      setStep('city');
    } else if (step === 'city') {
      setStep('photo');
    } else if (step === 'photo') {
      await handleComplete();
    }
  };

  const handleSkip = () => {
    console.log('[ProfileSetup] User tapped Skip button');
    
    if (step === 'photo') {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    console.log('[ProfileSetup] Completing profile setup');
    setLoading(true);

    const endTracking = performanceMonitor.trackDataProcessing('profile_setup_complete');

    try {
      // Update profile
      await updateProfile({
        fullName,
        userType: userType!,
        homeCity,
      });

      // Upload photo if provided
      if (photoUri) {
        const file = {
          uri: photoUri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        };
        await uploadProfilePhoto(file);
      }

      // Refresh user data
      await refreshUser();

      console.log('[ProfileSetup] Profile setup completed successfully');
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('[ProfileSetup] Error completing setup:', error);
      CustomModal.show({
        visible: true,
        title: 'Setup Failed',
        message: error.message || 'Failed to complete profile setup. Please try again.',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      setLoading(false);
      endTracking();
    }
  };

  const handlePickImage = async () => {
    console.log('[ProfileSetup] User tapped Pick Image');
    
    const endTracking = performanceMonitor.trackDataProcessing('image_pick_and_compress');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const originalUri = result.assets[0].uri;
        
        // Compress image
        const compressed = await compressProfilePhoto(originalUri);
        
        // Calculate savings
        const originalSize = result.assets[0].fileSize || 0;
        const savings = originalSize > 0 
          ? ((originalSize - compressed.size) / originalSize * 100).toFixed(0)
          : '0';
        
        setCompressionSavings(`${savings}% smaller`);
        setPhotoUri(compressed.uri);
        
        console.log('[ProfileSetup] Image compressed:', {
          original: originalSize,
          compressed: compressed.size,
          savings: `${savings}%`,
        });
      }
    } catch (error) {
      console.error('[ProfileSetup] Error picking image:', error);
      CustomModal.show({
        visible: true,
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      endTracking();
    }
  };

  const handleTakePhoto = async () => {
    console.log('[ProfileSetup] User tapped Take Photo');
    
    const endTracking = performanceMonitor.trackDataProcessing('photo_capture_and_compress');

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const originalUri = result.assets[0].uri;
        
        // Compress image
        const compressed = await compressProfilePhoto(originalUri);
        
        // Calculate savings
        const originalSize = result.assets[0].fileSize || 0;
        const savings = originalSize > 0 
          ? ((originalSize - compressed.size) / originalSize * 100).toFixed(0)
          : '0';
        
        setCompressionSavings(`${savings}% smaller`);
        setPhotoUri(compressed.uri);
        
        console.log('[ProfileSetup] Photo compressed:', {
          original: originalSize,
          compressed: compressed.size,
          savings: `${savings}%`,
        });
      }
    } catch (error) {
      console.error('[ProfileSetup] Error taking photo:', error);
      CustomModal.show({
        visible: true,
        title: 'Error',
        message: 'Failed to take photo. Please try again.',
        buttons: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      endTracking();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.title}>What's your name?</Text>
              <Text style={styles.subtitle}>This will be visible to other users</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
              value={fullName}
              onChangeText={setFullName}
              autoFocus
            />
          </FadeInView>
        );

      case 'type':
        return (
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.title}>How will you use ZimCommute?</Text>
              <Text style={styles.subtitle}>You can change this later</Text>
            </View>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, userType === 'Passenger' && styles.typeButtonActive]}
                onPress={() => setUserType('Passenger')}
              >
                <IconSymbol
                  ios_icon_name="person"
                  android_material_icon_name="person"
                  size={24}
                  color={userType === 'Passenger' ? colors.primary : colors.text}
                />
                <Text style={styles.typeText}>Passenger</Text>
                {userType === 'Passenger' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, userType === 'Driver' && styles.typeButtonActive]}
                onPress={() => setUserType('Driver')}
              >
                <IconSymbol
                  ios_icon_name="car"
                  android_material_icon_name="directions-car"
                  size={24}
                  color={userType === 'Driver' ? colors.primary : colors.text}
                />
                <Text style={styles.typeText}>Driver</Text>
                {userType === 'Driver' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </FadeInView>
        );

      case 'city':
        return (
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.title}>Where are you based?</Text>
              <Text style={styles.subtitle}>Your home city in Zimbabwe</Text>
            </View>
            <View style={styles.cityGrid}>
              {ZIMBABWE_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityButton, homeCity === city && styles.cityButtonActive]}
                  onPress={() => setHomeCity(city)}
                >
                  <Text style={styles.cityText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInView>
        );

      case 'photo':
        return (
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.title}>Add a profile photo</Text>
              <Text style={styles.subtitle}>Help others recognize you (optional)</Text>
            </View>
            <View style={styles.photoContainer}>
              {photoUri ? (
                <OptimizedImage
                  source={photoUri}
                  style={styles.photo}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <IconSymbol
                    ios_icon_name="person.circle"
                    android_material_icon_name="account-circle"
                    size={60}
                    color={colors.textSecondary}
                  />
                </View>
              )}
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                  <IconSymbol
                    ios_icon_name="camera"
                    android_material_icon_name="camera"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.photoButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                  <IconSymbol
                    ios_icon_name="photo"
                    android_material_icon_name="photo"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.photoButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              {compressionSavings && (
                <Text style={styles.compressionInfo}>
                  Image optimized: {compressionSavings}
                </Text>
              )}
            </View>
          </FadeInView>
        );
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'name':
        return fullName.trim().length > 0;
      case 'type':
        return userType !== null;
      case 'city':
        return homeCity.length > 0;
      case 'photo':
        return true; // Photo is optional
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepIndicator}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index <= currentStepIndex && styles.stepDotActive,
              ]}
            />
          ))}
        </View>

        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={handleNext}
          disabled={!canProceed() || loading}
          loading={loading}
        >
          {step === 'photo' ? 'Complete' : 'Next'}
        </Button>
        {step === 'photo' && (
          <Button variant="ghost" onPress={handleSkip} disabled={loading}>
            Skip for now
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
