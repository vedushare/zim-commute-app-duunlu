
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { VerificationBadge } from "@/components/auth/VerificationBadge";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { IconSymbol } from "@/components/IconSymbol";
import { CustomModal } from "@/components/ui/CustomModal";
import React, { useState } from "react";
import { colors } from "@/styles/commonStyles";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleEditProfile = () => {
    console.log('[Profile] User tapped Edit Profile');
    router.push('/auth/profile-setup');
  };

  const handlePostRide = () => {
    console.log('[Profile] User tapped Post a Ride');
    router.push('/rides/post-ride');
  };

  const handleMyBookings = () => {
    console.log('[Profile] User tapped My Bookings');
    router.push('/bookings/my-bookings');
  };

  const handleMyVehicles = () => {
    console.log('[Profile] User tapped My Vehicles');
    router.push('/vehicles/add-vehicle');
  };

  const handleWallet = () => {
    console.log('[Profile] User tapped Wallet');
    // TODO: Implement wallet screen
  };

  const handleSettings = () => {
    console.log('[Profile] User tapped Settings');
    // TODO: Implement settings screen
  };

  const handleVerifyID = () => {
    console.log('[Profile] User tapped Verify ID');
    router.push('/safety/verify-id');
  };

  const handleEmergencyContacts = () => {
    console.log('[Profile] User tapped Emergency Contacts');
    router.push('/safety/emergency-contacts');
  };

  const handleMyRatings = () => {
    console.log('[Profile] User tapped My Ratings');
    // TODO: Implement my ratings screen
  };

  const handleMyReports = () => {
    console.log('[Profile] User tapped My Reports');
    // TODO: Implement my reports screen
  };

  const handleAdminDashboard = () => {
    console.log('[Profile] User tapped Admin Dashboard');
    router.push('/admin/dashboard');
  };

  const handleLogout = async () => {
    console.log('[Profile] User confirmed logout');
    setShowLogoutModal(false);
    try {
      await logout();
      console.log('[Profile] Logout successful');
    } catch (error) {
      console.error('[Profile] Logout error:', error);
    }
  };

  const verificationLevelText = user?.verificationLevel === 'FullyVerified' ? 'Verified' :
                                user?.verificationLevel === 'IDUploaded' ? 'Pending' : 'Phone Verified';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {user?.profilePhotoUrl ? (
              <View style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <IconSymbol
                  ios_icon_name="person.circle.fill"
                  android_material_icon_name="account-circle"
                  size={80}
                  color={colors.primary}
                />
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.profilePhone}>{user?.phoneNumber}</Text>
            <View style={styles.verificationContainer}>
              <VerificationBadge level={user?.verificationLevel || 'PhoneVerified'} />
              <Text style={styles.verificationText}>{verificationLevelText}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <IconSymbol
              ios_icon_name="pencil.circle.fill"
              android_material_icon_name="edit"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
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
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMyBookings}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="list.bullet.circle.fill"
                android_material_icon_name="list"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.menuItemText}>My Bookings</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMyVehicles}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="car.circle.fill"
                android_material_icon_name="drive-eta"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.menuItemText}>My Vehicles</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trust & Safety</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleVerifyID}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="checkmark.shield.fill"
                android_material_icon_name="verified-user"
                size={24}
                color={colors.success}
              />
              <View>
                <Text style={styles.menuItemText}>Verify Your Identity</Text>
                {user?.verificationLevel !== 'FullyVerified' && (
                  <Text style={styles.menuItemSubtext}>Get verified to build trust</Text>
                )}
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleEmergencyContacts}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="phone.circle.fill"
                android_material_icon_name="phone"
                size={24}
                color={colors.error}
              />
              <Text style={styles.menuItemText}>Emergency Contacts</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMyRatings}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="star.circle.fill"
                android_material_icon_name="star"
                size={24}
                color={colors.warning}
              />
              <Text style={styles.menuItemText}>My Ratings & Reviews</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMyReports}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="exclamationmark.shield.fill"
                android_material_icon_name="report"
                size={24}
                color={colors.error}
              />
              <Text style={styles.menuItemText}>My Reports</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Admin Section - Only show for admin users */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <TouchableOpacity style={styles.menuItem} onPress={handleAdminDashboard}>
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="shield.lefthalf.filled"
                  android_material_icon_name="admin-panel-settings"
                  size={24}
                  color={colors.primary}
                />
                <View>
                  <Text style={styles.menuItemText}>Admin Dashboard</Text>
                  <Text style={styles.menuItemSubtext}>Manage users, rides, and system settings</Text>
                </View>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleWallet}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="creditcard.circle.fill"
                android_material_icon_name="payment"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.menuItemText}>Wallet</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="gearshape.circle.fill"
                android_material_icon_name="settings"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={() => setShowLogoutModal(true)}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="arrow.right.circle.fill"
                android_material_icon_name="logout"
                size={24}
                color={colors.error}
              />
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomModal
        isVisible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        confirmText="Logout"
        cancelText="Cancel"
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
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verificationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  menuItemSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: colors.error,
  },
});
