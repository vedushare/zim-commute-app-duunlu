import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

const MOCK_CONTACTS = [
  { id: '1', name: 'Tendai Moyo', phone: '+263771234567', relation: 'Sister' },
  { id: '2', name: 'Chipo Ndlovu', phone: '+263772345678', relation: 'Friend' },
  { id: '3', name: 'Rudo Chirwa', phone: '+263773456789', relation: 'Parent' },
];

const SAFETY_TIPS = [
  { id: '1', icon: 'car.fill', tip: 'Always verify the driver\'s plate number before boarding.' },
  { id: '2', icon: 'location.fill', tip: 'Share your trip with a trusted contact before you travel.' },
  { id: '3', icon: 'eye.fill', tip: 'Trust your instincts — if something feels wrong, don\'t board.' },
  { id: '4', icon: 'phone.fill', tip: 'Keep your phone charged and accessible during the ride.' },
];

export default function SafetyHubScreen() {
  const router = useRouter();

  const handleSOS = () => {
    console.log('[Safety] User tapped Emergency SOS button');
    Alert.alert(
      'Emergency SOS',
      'Emergency services contacted. Your location has been shared.',
      [{ text: 'OK' }]
    );
  };

  const handleCallContact = (name: string, phone: string) => {
    console.log('[Safety] User tapped Call contact:', name, phone);
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call on this device.');
    });
  };

  const handleShareTrip = () => {
    console.log('[Safety] User tapped Share Trip');
    router.push('/safety/trip-share');
  };

  const handleEmergency = () => {
    console.log('[Safety] User tapped Emergency screen');
    router.push('/safety/emergency');
  };

  const mockShareLink = 'https://zimcommute.app/track/ZIM-TRIP-001';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Safety Hub', headerShown: true }} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <IconSymbol ios_icon_name="shield.fill" android_material_icon_name="security" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Your Safety Matters</Text>
          <Text style={styles.heroSubtitle}>ZimCommute keeps you safe every step of the journey</Text>
        </View>

        <TouchableOpacity style={styles.sosButton} onPress={handleSOS} activeOpacity={0.85}>
          <IconSymbol ios_icon_name="sos" android_material_icon_name="sos" size={28} color="#fff" />
          <View>
            <Text style={styles.sosTitle}>Emergency SOS</Text>
            <Text style={styles.sosSubtitle}>Tap to alert emergency services</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleShareTrip}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.info + '15' }]}>
              <IconSymbol ios_icon_name="location.circle.fill" android_material_icon_name="location-on" size={24} color={colors.info} />
            </View>
            <Text style={styles.quickActionText}>Share Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={handleEmergency}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.error + '15' }]}>
              <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={24} color={colors.error} />
            </View>
            <Text style={styles.quickActionText}>Emergency</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              console.log('[Safety] User tapped Emergency Contacts');
              router.push('/safety/emergency-contacts');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="group" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Contacts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol ios_icon_name="location.circle.fill" android_material_icon_name="location-on" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Share Trip</Text>
          </View>
          <Text style={styles.shareLink}>{mockShareLink}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleShareTrip}>
            <IconSymbol ios_icon_name="doc.on.doc.fill" android_material_icon_name="content-copy" size={16} color={colors.primary} />
            <Text style={styles.copyButtonText}>Share Trip Link</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="group" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Emergency Contacts</Text>
          </View>
          {MOCK_CONTACTS.map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactMeta}>{contact.relation} · {contact.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallContact(contact.name, contact.phone)}
              >
                <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={16} color="#fff" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol ios_icon_name="lightbulb.fill" android_material_icon_name="lightbulb" size={20} color={colors.warning} />
            <Text style={styles.cardTitle}>Safety Tips</Text>
          </View>
          {SAFETY_TIPS.map((tip) => (
            <View key={tip.id} style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <IconSymbol ios_icon_name={tip.icon as any} android_material_icon_name="info" size={16} color={colors.primary} />
              </View>
              <Text style={styles.tipText}>{tip.tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  sosTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sosSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: { fontSize: 12, fontWeight: '600', color: colors.text },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  shareLink: {
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  copyButtonText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitial: { fontSize: 16, fontWeight: '700', color: colors.primary },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: colors.text },
  contactMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  callButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
});
