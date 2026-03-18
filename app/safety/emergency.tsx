import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function EmergencyScreen() {
  const handleSOS = () => {
    console.log('[Emergency] User tapped SOS button');
    Alert.alert(
      'SOS Activated',
      'Emergency services have been contacted. Your location has been shared with emergency contacts.',
      [{ text: 'OK' }]
    );
  };

  const handleCallPolice = () => {
    console.log('[Emergency] User tapped Call Police (995)');
    Linking.openURL('tel:995').catch(() => {
      Alert.alert('Error', 'Unable to make a call on this device.');
    });
  };

  const handleCallAmbulance = () => {
    console.log('[Emergency] User tapped Call Ambulance (994)');
    Linking.openURL('tel:994').catch(() => {
      Alert.alert('Error', 'Unable to make a call on this device.');
    });
  };

  const handleShareLocation = () => {
    console.log('[Emergency] User tapped Share Location');
    Alert.alert(
      'Location Shared',
      'Your current location has been shared with your emergency contacts.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Emergency', headerShown: true, headerStyle: { backgroundColor: '#1a0000' }, headerTintColor: '#fff' }} />

      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color={colors.error} />
          <Text style={styles.headerTitle}>Emergency</Text>
          <Text style={styles.headerSubtitle}>Use these options only in a genuine emergency</Text>
        </View>

        <TouchableOpacity style={styles.sosButton} onPress={handleSOS} activeOpacity={0.85}>
          <View style={styles.sosInner}>
            <Text style={styles.sosLabel}>SOS</Text>
            <Text style={styles.sosSubLabel}>Press & Hold</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.orText}>— or call directly —</Text>

        <View style={styles.callButtons}>
          <TouchableOpacity style={[styles.callButton, { backgroundColor: '#1a3a6b' }]} onPress={handleCallPolice}>
            <IconSymbol ios_icon_name="shield.fill" android_material_icon_name="security" size={28} color="#fff" />
            <Text style={styles.callButtonTitle}>Police</Text>
            <Text style={styles.callButtonNumber}>995</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.callButton, { backgroundColor: '#6b1a1a' }]} onPress={handleCallAmbulance}>
            <IconSymbol ios_icon_name="cross.fill" android_material_icon_name="local-hospital" size={28} color="#fff" />
            <Text style={styles.callButtonTitle}>Ambulance</Text>
            <Text style={styles.callButtonNumber}>994</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareLocationButton} onPress={handleShareLocation}>
          <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={22} color="#fff" />
          <Text style={styles.shareLocationText}>Share My Location</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={18} color={colors.warning} />
          <Text style={styles.infoText}>
            Tapping SOS will notify your emergency contacts and share your GPS location.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 12 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6, textAlign: 'center' },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 6,
    borderColor: colors.error + '50',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  sosInner: { alignItems: 'center' },
  sosLabel: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  sosSubLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  orText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 },
  callButtons: { flexDirection: 'row', gap: 16, marginBottom: 20, width: '100%' },
  callButton: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  callButtonTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  callButtonNumber: { fontSize: 24, fontWeight: '800', color: '#fff' },
  shareLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a4a1a',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  shareLocationText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
});
