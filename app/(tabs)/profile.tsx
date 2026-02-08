
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { colors } from "@/styles/commonStyles";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { VerificationBadge } from "@/components/auth/VerificationBadge";
import { useRouter } from "expo-router";
import { CustomModal } from "@/components/ui/CustomModal";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleEditProfile = () => {
    console.log('User tapped Edit Profile');
    // Navigate to profile edit screen (to be implemented)
  };

  const handlePostRide = () => {
    console.log('User tapped Post Ride');
    router.push('/rides/post-ride');
  };

  const handleMyBookings = () => {
    console.log('User tapped My Bookings');
    router.push('/bookings/my-bookings');
  };

  const handleMyVehicles = () => {
    console.log('User tapped My Vehicles');
    router.push('/vehicles/add-vehicle');
  };

  const handleWallet = () => {
    console.log('User tapped Wallet');
    // Navigate to wallet screen (to be implemented)
  };

  const handleSettings = () => {
    console.log('User tapped Settings');
    // Navigate to settings screen (to be implemented)
  };

  const handleVerifyID = () => {
    console.log('User tapped Verify ID');
    // Navigate to ID verification screen (to be implemented)
  };

  const handleLogout = async () => {
    console.log('[Profile] User confirmed logout');
    setIsLoggingOut(true);
    setShowLogoutModal(false);
    
    try {
      await logout();
      console.log('[Profile] Logout successful, redirecting to login');
      router.replace('/auth/phone-login');
    } catch (error) {
      console.error('[Profile] Error during logout:', error);
      router.replace('/auth/phone-login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const fullNameDisplay = user?.fullName || 'User';
  const phoneDisplay = user?.phoneNumber || '';
  const emailDisplay = user?.email || 'No email';
  const userTypeDisplay = user?.userType || 'Not set';
  const homeCityDisplay = user?.homeCity || 'Not set';
  const verificationLevel = user?.verificationLevel || 'PhoneVerified';
  const isDriver = user?.userType === 'Driver';

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account-circle"
                size={80}
                color={colors.primary}
              />
            </View>
            
            <Text style={styles.name}>{fullNameDisplay}</Text>
            <Text style={styles.phone}>{phoneDisplay}</Text>
            
            <View style={styles.badgeContainer}>
              <VerificationBadge level={verificationLevel} size="medium" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{emailDisplay}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User Type</Text>
                <Text style={styles.infoValue}>{userTypeDisplay}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Home City</Text>
                <Text style={styles.infoValue}>{homeCityDisplay}</Text>
              </View>
            </View>
          </View>

          {verificationLevel !== 'FullyVerified' && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.verifyCard}
                onPress={handleVerifyID}
              >
                <View style={styles.verifyContent}>
                  <IconSymbol
                    ios_icon_name="checkmark.shield.fill"
                    android_material_icon_name="verified-user"
                    size={32}
                    color={colors.secondary}
                  />
                  <View style={styles.verifyText}>
                    <Text style={styles.verifyTitle}>Complete Verification</Text>
                    <Text style={styles.verifySubtitle}>
                      Upload your ID to unlock all features
                    </Text>
                  </View>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            {isDriver && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handlePostRide}>
                  <View style={styles.menuItemLeft}>
                    <IconSymbol
                      ios_icon_name="plus.circle.fill"
                      android_material_icon_name="add-circle"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={styles.menuItemText}>Post a Ride</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleMyVehicles}>
                  <View style={styles.menuItemLeft}>
                    <IconSymbol
                      ios_icon_name="car.fill"
                      android_material_icon_name="directions-car"
                      size={24}
                      color={colors.text}
                    />
                    <Text style={styles.menuItemText}>My Vehicles</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.menuItem} onPress={handleMyBookings}>
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="ticket.fill"
                  android_material_icon_name="confirmation-number"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.menuItemText}>My Bookings</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="pencil"
                  android_material_icon_name="edit"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.menuItemText}>Edit Profile</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleWallet}>
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="wallet.pass.fill"
                  android_material_icon_name="account-balance-wallet"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.menuItemText}>Wallet</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="gear"
                  android_material_icon_name="settings"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.menuItemText}>Settings</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setShowLogoutModal(true)}
            >
              <IconSymbol
                ios_icon_name="arrow.right.square"
                android_material_icon_name="logout"
                size={24}
                color={colors.danger}
              />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <CustomModal
          visible={showLogoutModal}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          type="warning"
          buttons={[
            {
              text: 'Cancel',
              onPress: () => setShowLogoutModal(false),
              style: 'cancel',
            },
            {
              text: 'Sign Out',
              onPress: handleLogout,
              style: 'destructive',
            },
          ]}
          onClose={() => setShowLogoutModal(false)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.backgroundAlt,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  badgeContainer: {
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
  },
  verifyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  verifyText: {
    flex: 1,
  },
  verifyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  verifySubtitle: {
    fontSize: 14,
    color: colors.black,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.danger,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
});
