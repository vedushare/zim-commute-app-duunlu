
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";

export default function ProfileScreen() {
  console.log('ProfileScreen: Rendering profile screen');

  const handleEditProfile = () => {
    console.log('User tapped Edit Profile button');
    // TODO: Backend Integration - Navigate to edit profile screen
  };

  const handleMyRides = () => {
    console.log('User tapped My Rides button');
    // TODO: Backend Integration - GET /api/user/rides to fetch user rides
  };

  const handleWallet = () => {
    console.log('User tapped Wallet button');
    // TODO: Backend Integration - GET /api/user/wallet to fetch wallet balance
  };

  const handleSettings = () => {
    console.log('User tapped Settings button');
    // TODO: Backend Integration - Navigate to settings screen
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol 
              ios_icon_name="person.circle.fill" 
              android_material_icon_name="account-circle" 
              size={80} 
              color={colors.primary} 
            />
          </View>
          <Text style={styles.name}>Guest User</Text>
          <Text style={styles.email}>guest@zimcommute.co.zw</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <IconSymbol 
              ios_icon_name="pencil" 
              android_material_icon_name="edit" 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleMyRides}>
            <View style={styles.menuItemLeft}>
              <IconSymbol 
                ios_icon_name="car.fill" 
                android_material_icon_name="directions-car" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.menuItemText}>My Rides</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="arrow-forward" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleWallet}>
            <View style={styles.menuItemLeft}>
              <IconSymbol 
                ios_icon_name="creditcard.fill" 
                android_material_icon_name="account-balance-wallet" 
                size={24} 
                color={colors.secondary} 
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
                ios_icon_name="gearshape.fill" 
                android_material_icon_name="settings" 
                size={24} 
                color={colors.textSecondary} 
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
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Rides Taken</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Rides Offered</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  menuSection: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 16,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
