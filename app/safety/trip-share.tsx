import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Clipboard,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function TripShareScreen() {
  const { ride_id } = useLocalSearchParams<{ ride_id?: string }>();
  const [copied, setCopied] = useState(false);

  const tripId = ride_id || 'ZIM-TRIP-001';
  const shareLink = `https://zimcommute.app/track/${tripId}`;

  const tripDetails = {
    origin: 'Harare CBD',
    destination: 'Borrowdale',
    driverName: 'Tendai Moyo',
    plate: 'ABC 1234',
    departureTime: 'Today at 2:30 PM',
  };

  const shareMessage = `I'm taking a ZimCommute ride from ${tripDetails.origin} to ${tripDetails.destination} with driver ${tripDetails.driverName} (${tripDetails.plate}). Track my trip: ${shareLink}`;

  const handleCopyLink = () => {
    console.log('[TripShare] User tapped Copy Link');
    Clipboard.setString(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    console.log('[TripShare] User tapped Share via WhatsApp');
    const encoded = encodeURIComponent(shareMessage);
    Linking.openURL(`whatsapp://send?text=${encoded}`).catch(() => {
      Alert.alert('WhatsApp not found', 'Please install WhatsApp to use this feature.');
    });
  };

  const handleSMS = () => {
    console.log('[TripShare] User tapped Share via SMS');
    const encoded = encodeURIComponent(shareMessage);
    Linking.openURL(`sms:?body=${encoded}`).catch(() => {
      Alert.alert('Error', 'Unable to open SMS on this device.');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Share Trip', headerShown: true }} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <IconSymbol ios_icon_name="location.circle.fill" android_material_icon_name="location-on" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Share Your Trip</Text>
          <Text style={styles.heroSubtitle}>Let trusted contacts track your journey in real-time</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <View style={styles.detailRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>From</Text>
              <Text style={styles.detailValue}>{tripDetails.origin}</Text>
            </View>
          </View>

          <View style={styles.verticalLine} />

          <View style={styles.detailRow}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>{tripDetails.destination}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{tripDetails.driverName}</Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol ios_icon_name="car.fill" android_material_icon_name="directions-car" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{tripDetails.plate}</Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="access-time" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{tripDetails.departureTime}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shareable Link</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{shareLink}</Text>
          </View>
          <TouchableOpacity
            style={[styles.copyButton, copied && styles.copyButtonSuccess]}
            onPress={handleCopyLink}
          >
            <IconSymbol
              ios_icon_name={copied ? 'checkmark.circle.fill' : 'doc.on.doc.fill'}
              android_material_icon_name={copied ? 'check-circle' : 'content-copy'}
              size={18}
              color="#fff"
            />
            <Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Share Via</Text>

          <TouchableOpacity style={styles.shareOption} onPress={handleWhatsApp}>
            <View style={[styles.shareIcon, { backgroundColor: '#25D366' }]}>
              <Text style={styles.shareIconEmoji}>💬</Text>
            </View>
            <View style={styles.shareOptionContent}>
              <Text style={styles.shareOptionTitle}>WhatsApp</Text>
              <Text style={styles.shareOptionSubtitle}>Send to a contact or group</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={handleSMS}>
            <View style={[styles.shareIcon, { backgroundColor: colors.info }]}>
              <Text style={styles.shareIconEmoji}>📱</Text>
            </View>
            <View style={styles.shareOptionContent}>
              <Text style={styles.shareOptionTitle}>SMS</Text>
              <Text style={styles.shareOptionSubtitle}>Send as a text message</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={18} color={colors.primary} />
          <Text style={styles.infoCardText}>
            Anyone with this link can view your live trip location until the ride is completed.
          </Text>
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
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  verticalLine: { width: 2, height: 20, backgroundColor: colors.border, marginLeft: 4, marginVertical: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 14, color: colors.textSecondary },
  linkBox: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: { fontSize: 13, color: colors.textSecondary, fontFamily: 'monospace' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  copyButtonSuccess: { backgroundColor: colors.success },
  copyButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shareIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIconEmoji: { fontSize: 22 },
  shareOptionContent: { flex: 1 },
  shareOptionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  shareOptionSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  infoCardText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
});
