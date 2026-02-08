
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function AdminConfigurationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Configuration', headerShown: true }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Configuration</Text>
          
          <TouchableOpacity
            style={styles.configButton}
            onPress={() => router.push('/admin/routes-config')}
          >
            <IconSymbol
              ios_icon_name="map"
              android_material_icon_name="map"
              size={24}
              color={colors.primary}
            />
            <View style={styles.configButtonContent}>
              <Text style={styles.configButtonTitle}>Route Management</Text>
              <Text style={styles.configButtonDescription}>
                Add, edit, or remove routes and set suggested prices
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.configButton}
            onPress={() => router.push('/admin/pricing-templates')}
          >
            <IconSymbol
              ios_icon_name="dollarsign.circle"
              android_material_icon_name="attach-money"
              size={24}
              color={colors.success}
            />
            <View style={styles.configButtonContent}>
              <Text style={styles.configButtonTitle}>Pricing Templates</Text>
              <Text style={styles.configButtonDescription}>
                Manage base prices, per-km rates, and commission rates
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.configButton}
            onPress={() => router.push('/admin/promo-codes')}
          >
            <IconSymbol
              ios_icon_name="tag"
              android_material_icon_name="local-offer"
              size={24}
              color={colors.warning}
            />
            <View style={styles.configButtonContent}>
              <Text style={styles.configButtonTitle}>Promo Codes</Text>
              <Text style={styles.configButtonDescription}>
                Create and manage promotional discount codes
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.configButton}
            onPress={() => router.push('/admin/audit-logs')}
          >
            <IconSymbol
              ios_icon_name="doc.text"
              android_material_icon_name="description"
              size={24}
              color={colors.info}
            />
            <View style={styles.configButtonContent}>
              <Text style={styles.configButtonTitle}>Audit Logs</Text>
              <Text style={styles.configButtonDescription}>
                View all admin actions and system changes
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  configButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  configButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  configButtonDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
