
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { ZIMBABWE_CITIES } from '@/constants/zimbabwe';
import { IconSymbol } from '@/components/IconSymbol';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import Button from '@/components/button';
import { updateProfile, uploadProfilePhoto } from '@/utils/api';
import { CustomModal } from '@/components/ui/CustomModal';
import { User } from '@/types/auth';

type ProfileStep = 1 | 2 | 3 | 4;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<ProfileStep>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [userType, setUserType] = useState<'Passenger' | 'Driver' | null>(null);
  const [homeCity, setHomeCity] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = async () => {
    console.log('User tapped Next on step:', currentStep);
    
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as ProfileStep);
    } else {
      await handleComplete();
    }
  };

  const handleSkip = () => {
    console.log('User tapped Skip on step:', currentStep);
    
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as ProfileStep);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    console.log('[ProfileSetup] User completing profile setup');
    setIsLoading(true);

    try {
      // Prepare profile data (only include fields that have values)
      const profileData: any = {};
      if (fullName) profileData.fullName = fullName;
      if (email) profileData.email = email;
      if (userType) profileData.userType = userType;
      if (homeCity) profileData.homeCity = homeCity;

      console.log('[ProfileSetup] Updating profile with data:', profileData);
      
      // Update profile on backend
      const updatedUser = await updateProfile(profileData);
      
      console.log('[ProfileSetup] Profile updated successfully:', updatedUser);
      
      // Convert backend user to our User type
      const user: User = {
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        fullName: updatedUser.fullName || undefined,
        email: updatedUser.email || undefined,
        profilePhotoUrl: updatedUser.profilePhotoUrl || undefined,
        userType: (updatedUser.userType as 'Passenger' | 'Driver') || undefined,
        homeCity: updatedUser.homeCity || undefined,
        verificationLevel: updatedUser.verificationLevel as 'PhoneVerified' | 'IDUploaded' | 'FullyVerified',
        createdAt: updatedUser.createdAt,
      };
      
      // Update local user state
      updateUser(user);
      
      console.log('[ProfileSetup] Profile setup complete, navigating to home');
      router.replace('/(tabs)/(home)');
    } catch (err: any) {
      console.error('[ProfileSetup] Error completing profile setup:', err);
      const message = err.message || 'Failed to update profile. Please try again.';
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    console.log('[ProfileSetup] User tapped to pick profile photo');
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      console.log('[ProfileSetup] Media library permission denied');
      setErrorMessage('Permission to access photos was denied');
      setShowErrorModal(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('[ProfileSetup] Image selected:', asset.uri);
      setProfilePhoto(asset.uri);
      
      // Upload photo to backend
      await uploadPhoto(asset.uri);
    }
  };

  const handleTakePhoto = async () => {
    console.log('[ProfileSetup] User tapped to take photo');
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      console.log('[ProfileSetup] Camera permission denied');
      setErrorMessage('Permission to access camera was denied');
      setShowErrorModal(true);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('[ProfileSetup] Photo taken:', asset.uri);
      setProfilePhoto(asset.uri);
      
      // Upload photo to backend
      await uploadPhoto(asset.uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setIsUploadingPhoto(true);
    console.log('[ProfileSetup] Uploading photo to backend');

    try {
      // Extract filename from URI
      const filename = uri.split('/').pop() || 'profile-photo.jpg';
      
      // Determine MIME type
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const response = await uploadProfilePhoto({
        uri,
        name: filename,
        type,
      });

      console.log('[ProfileSetup] Photo uploaded successfully:', response.profilePhotoUrl);
      setProfilePhotoUrl(response.profilePhotoUrl);
      
      // Update user with new photo URL
      if (user) {
        updateUser({
          ...user,
          profilePhotoUrl: response.profilePhotoUrl,
        });
      }
    } catch (err: any) {
      console.error('[ProfileSetup] Error uploading photo:', err);
      const message = err.message || 'Failed to upload photo. Please try again.';
      setErrorMessage(message);
      setShowErrorModal(true);
      // Clear the local photo on error
      setProfilePhoto(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What&apos;s your name?</Text>
            <Text style={styles.stepSubtitle}>
              Help others recognize you on ZimCommute
            </Text>
            
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              autoFocus
            />
            
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email (optional)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add a profile photo</Text>
            <Text style={styles.stepSubtitle}>
              A photo helps build trust with other users
            </Text>
            
            <View style={styles.photoContainer}>
              {isUploadingPhoto ? (
                <View style={styles.photoPreview}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.photoText}>Uploading...</Text>
                </View>
              ) : profilePhoto ? (
                <View style={styles.photoPreview}>
                  <Text style={styles.photoPlaceholder}>📷</Text>
                  <Text style={styles.photoText}>Photo uploaded</Text>
                </View>
              ) : (
                <View style={styles.photoPlaceholderContainer}>
                  <IconSymbol
                    ios_icon_name="person.circle"
                    android_material_icon_name="account-circle"
                    size={80}
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleTakePhoto}
                disabled={isUploadingPhoto}
              >
                <IconSymbol
                  ios_icon_name="camera"
                  android_material_icon_name="camera"
                  size={24}
                  color={isUploadingPhoto ? colors.textSecondary : colors.primary}
                />
                <Text style={[styles.photoButtonText, isUploadingPhoto && { color: colors.textSecondary }]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePickImage}
                disabled={isUploadingPhoto}
              >
                <IconSymbol
                  ios_icon_name="photo"
                  android_material_icon_name="photo"
                  size={24}
                  color={isUploadingPhoto ? colors.textSecondary : colors.primary}
                />
                <Text style={[styles.photoButtonText, isUploadingPhoto && { color: colors.textSecondary }]}>
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How will you use ZimCommute?</Text>
            <Text style={styles.stepSubtitle}>
              You can change this later in settings
            </Text>
            
            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeCard,
                  userType === 'Passenger' && styles.userTypeCardSelected,
                ]}
                onPress={() => setUserType('Passenger')}
              >
                <Text style={styles.userTypeIcon}>🚗</Text>
                <Text style={styles.userTypeTitle}>Passenger</Text>
                <Text style={styles.userTypeDescription}>
                  Find rides to your destination
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeCard,
                  userType === 'Driver' && styles.userTypeCardSelected,
                ]}
                onPress={() => setUserType('Driver')}
              >
                <Text style={styles.userTypeIcon}>🚙</Text>
                <Text style={styles.userTypeTitle}>Driver</Text>
                <Text style={styles.userTypeDescription}>
                  Offer rides and earn money
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Where are you based?</Text>
            <Text style={styles.stepSubtitle}>
              We&apos;ll show you relevant rides in your area
            </Text>
            
            <TouchableOpacity
              style={styles.citySelector}
              onPress={() => setShowCityPicker(true)}
            >
              <Text style={[styles.citySelectorText, !homeCity && styles.citySelectorPlaceholder]}>
                {homeCity || 'Select your city'}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            
            <View style={styles.verificationInfo}>
              <Text style={styles.verificationTitle}>Your Verification Status</Text>
              {user && (
                <VerificationBadge level={user.verificationLevel} size="large" />
              )}
              <Text style={styles.verificationText}>
                Complete ID verification to unlock all features
              </Text>
            </View>
          </View>
        );
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return fullName.length > 0;
      case 2:
        return true; // Photo is optional
      case 3:
        return userType !== null;
      case 4:
        return homeCity.length > 0;
      default:
        return false;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Complete Your Profile',
          headerBackVisible: false,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map(step => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            
            return (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  isActive && styles.progressDotActive,
                  isCompleted && styles.progressDotCompleted,
                ]}
              />
            );
          })}
        </View>
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>
        
        <View style={styles.footer}>
          <Button
            onPress={handleNext}
            disabled={!canProceed() || isLoading}
            loading={isLoading}
            variant="primary"
            size="large"
            style={styles.nextButton}
          >
            {currentStep === 4 ? 'Complete' : 'Next'}
          </Button>
          
          <TouchableOpacity
            onPress={handleSkip}
            disabled={isLoading}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>
              {currentStep === 4 ? 'Complete Later' : 'Skip'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Modal
          visible={showCityPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCityPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Your City</Text>
                <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.cityList}>
                {ZIMBABWE_CITIES.map(city => {
                  const isSelected = city === homeCity;
                  
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                      onPress={() => {
                        setHomeCity(city);
                        setShowCityPicker(false);
                      }}
                    >
                      <Text style={[styles.cityItemText, isSelected && styles.cityItemTextSelected]}>
                        {city}
                      </Text>
                      {isSelected && (
                        <IconSymbol
                          ios_icon_name="checkmark"
                          android_material_icon_name="check"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: colors.success,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    flex: 1,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoPlaceholderContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    fontSize: 48,
  },
  photoText: {
    fontSize: 12,
    color: colors.card,
    marginTop: 4,
  },
  photoButtons: {
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  userTypeContainer: {
    gap: 16,
  },
  userTypeCard: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  userTypeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundAlt,
  },
  userTypeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  userTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  userTypeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 32,
  },
  citySelectorText: {
    fontSize: 16,
    color: colors.text,
  },
  citySelectorPlaceholder: {
    color: colors.textSecondary,
  },
  verificationInfo: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    marginBottom: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cityList: {
    maxHeight: 400,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityItemSelected: {
    backgroundColor: colors.backgroundAlt,
  },
  cityItemText: {
    fontSize: 16,
    color: colors.text,
  },
  cityItemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
});
