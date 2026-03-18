import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiPost } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface PromoValidateResponse {
  valid: boolean;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount?: number;
  final_fare?: number;
  message?: string;
  promo_code_id?: string;
}

export default function PromoScreen() {
  const router = useRouter();
  const { fare_amount, booking_id } = useLocalSearchParams<{ fare_amount?: string; booking_id?: string }>();
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<PromoValidateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fareAmount = Number(fare_amount || 10);

  const handleValidate = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter a promo code');
      return;
    }

    console.log('[Promo] User tapped Apply promo code:', trimmedCode);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiPost<PromoValidateResponse>('/api/promo/validate', {
        code: trimmedCode,
        user_id: user?.id,
        fare_amount: fareAmount,
      });
      console.log('[Promo] Validation result:', data);
      if (data.valid) {
        setResult(data);
      } else {
        setError(data.message || 'Invalid or expired promo code');
      }
    } catch (err: any) {
      console.error('[Promo] Validation error:', err.message);
      setError(err.message || 'Failed to validate promo code');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result) return;
    const trimmedCode = code.trim().toUpperCase();
    console.log('[Promo] User tapped Confirm & Apply promo code:', trimmedCode);
    setApplying(true);

    try {
      await apiPost('/api/promo/apply', {
        code: trimmedCode,
        user_id: user?.id,
        booking_id: booking_id,
        fare_amount: fareAmount,
      });
      console.log('[Promo] Promo code applied successfully');
      Alert.alert('Success', 'Promo code applied successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('[Promo] Apply error:', err.message);
      Alert.alert('Error', err.message || 'Failed to apply promo code');
    } finally {
      setApplying(false);
    }
  };

  const discountAmount = result?.discount_amount ?? 0;
  const finalFare = result?.final_fare ?? (fareAmount - discountAmount);
  const discountText = discountAmount > 0 ? `-$${Number(discountAmount).toFixed(2)}` : '';
  const finalFareText = `$${Number(finalFare).toFixed(2)}`;
  const baseFareText = `$${Number(fareAmount).toFixed(2)}`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Promo Code', headerShown: true }} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <IconSymbol ios_icon_name="tag.fill" android_material_icon_name="local-offer" size={40} color={colors.primary} />
          <Text style={styles.heroTitle}>Have a promo code?</Text>
          <Text style={styles.heroSubtitle}>Enter your code below to get a discount on your ride</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Promo Code</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(t) => {
                setCode(t.toUpperCase());
                setError(null);
                setResult(null);
              }}
              placeholder="e.g. WELCOME10"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleValidate}
            />
            <TouchableOpacity
              style={[styles.applyButton, (!code.trim() || loading) && styles.applyButtonDisabled]}
              onPress={handleValidate}
              disabled={!code.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {result && result.valid ? (
          <View style={styles.successCard}>
            <View style={styles.successHeader}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
              <Text style={styles.successTitle}>Code Applied!</Text>
            </View>

            <View style={styles.fareBreakdown}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Original fare</Text>
                <Text style={styles.fareValue}>{baseFareText}</Text>
              </View>
              <View style={styles.fareRow}>
                <View style={styles.discountRow}>
                  <IconSymbol ios_icon_name="tag.fill" android_material_icon_name="local-offer" size={14} color={colors.success} />
                  <Text style={styles.discountLabel}>{code.trim().toUpperCase()}</Text>
                </View>
                <Text style={styles.discountValue}>{discountText}</Text>
              </View>
              <View style={[styles.fareRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Final fare</Text>
                <Text style={styles.totalValue}>{finalFareText}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, applying && styles.confirmButtonDisabled]}
              onPress={handleApply}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm & Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Available Codes</Text>
          {[
            { code: 'WELCOME10', desc: '10% off your first ride' },
            { code: 'FLAT5', desc: '$5 off any ride' },
            { code: 'ZIMRIDE20', desc: '20% off — limited time' },
          ].map((tip) => (
            <TouchableOpacity
              key={tip.code}
              style={styles.tipRow}
              onPress={() => {
                console.log('[Promo] User tapped suggested code:', tip.code);
                setCode(tip.code);
                setError(null);
                setResult(null);
              }}
            >
              <View style={styles.tipCodeBadge}>
                <Text style={styles.tipCode}>{tip.code}</Text>
              </View>
              <Text style={styles.tipDesc}>{tip.desc}</Text>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
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
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 6 },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  inputCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    letterSpacing: 1,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: { opacity: 0.5 },
  applyButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  errorText: { fontSize: 13, color: colors.error, flex: 1 },
  successCard: {
    backgroundColor: colors.success + '08',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  successHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  successTitle: { fontSize: 16, fontWeight: '700', color: colors.success },
  fareBreakdown: { marginBottom: 16 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fareLabel: { fontSize: 14, color: colors.textSecondary },
  fareValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  discountLabel: { fontSize: 13, color: colors.success, fontWeight: '600' },
  discountValue: { fontSize: 14, color: colors.success, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  tipsCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  tipCodeBadge: { backgroundColor: colors.primary + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tipCode: { fontSize: 12, fontWeight: '700', color: colors.primary, fontFamily: 'monospace' },
  tipDesc: { flex: 1, fontSize: 13, color: colors.textSecondary },
});
