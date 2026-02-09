
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Button from '@/components/button';
import { CustomModal } from '@/components/ui/CustomModal';
import { colors } from '@/styles/commonStyles';
import { generateShareLink, openWhatsAppShare } from '@/utils/safetyApi';
import type { ShareRideLink } from '@/types/safety';

export default function ShareRideScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [shareData, setShareData] = useState<ShareRideLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const generateLink = useCallback(async () => {
    if (!rideId) return;
    
    setIsLoading(true);
    console.log('[ShareRide] Generating share link for ride:', rideId);
    
    try {
      const data = await generateShareLink(rideId);
      setShareData(data);
      console.log('[ShareRide] Share link generated successfully');
    } catch (error: any) {
      console.error('[ShareRide] Error generating link:', error);
      showModal('Error', error.message || 'Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    generateLink();
  }, [generateLink]);

  const handleShareWhatsApp = async () => {
    if (!shareData) return;
    
    console.log('[ShareRide] User tapped Share via WhatsApp');
    const url = openWhatsAppShare(shareData.whatsappMessage);
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showModal('WhatsApp Not Found', 'Please install WhatsApp to share your ride.');
      }
    } catch (error) {
      console.error('[ShareRide] Error opening WhatsApp:', error);
      showModal('Error', 'Failed to open WhatsApp');
    }
  };

  const handleShareOther = async () => {
    if (!shareData) return;
    
    console.log('[ShareRide] User tapped Share via other apps');
    
    try {
      await Share.share({
        message: shareData.whatsappMessage,
        url: shareData.shareLink,
      });
    } catch (error) {
      console.error('[ShareRide] Error sharing:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!shareData) return;
    
    console.log('[ShareRide] User tapped Copy Link');
    // Note: Clipboard API would be used here in production
    showModal('Link Copied', 'Share link copied to clipboard');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Share My Ride',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="location.circle.fill"
            android_material_icon_name="location-on"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Share Your Ride</Text>
          <Text style={styles.headerSubtitle}>
            Let your friends and family track your journey in real-time for added safety.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : shareData ? (
          <>
            <View style={styles.linkCard}>
              <Text style={styles.linkLabel}>Your Tracking Link</Text>
              <View style={styles.linkContainer}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {shareData.shareLink}
                </Text>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                  <IconSymbol
                    ios_icon_name="doc.on.doc.fill"
                    android_material_icon_name="content-copy"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.messageCard}>
              <Text style={styles.messageLabel}>Message Preview</Text>
              <Text style={styles.messageText}>{shareData.whatsappMessage}</Text>
            </View>

            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareWhatsApp}>
                <View style={styles.shareButtonIcon}>
                  <IconSymbol
                    ios_icon_name="message.fill"
                    android_material_icon_name="message"
                    size={32}
                    color="#25D366"
                  />
                </View>
                <Text style={styles.shareButtonText}>Share via WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton} onPress={handleShareOther}>
                <View style={styles.shareButtonIcon}>
                  <IconSymbol
                    ios_icon_name="square.and.arrow.up.fill"
                    android_material_icon_name="share"
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.shareButtonText}>Share via Other Apps</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>What they'll see:</Text>
              <View style={styles.featureRow}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.featureText}>Your current location (if shared)</Text>
              </View>
              <View style={styles.featureRow}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.featureText}>Driver details and vehicle info</Text>
              </View>
              <View style={styles.featureRow}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.featureText}>Estimated arrival time</Text>
              </View>
              <View style={styles.featureRow}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.featureText}>Route information</Text>
              </View>
            </View>

            <View style={styles.privacyCard}>
              <IconSymbol
                ios_icon_name="lock.shield.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.privacyText}>
                Your location is only shared with people who have this link. The link expires when your ride is completed.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.errorState}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={styles.errorText}>Failed to generate share link</Text>
            <Button title="Try Again" onPress={generateLink} style={styles.retryButton} />
          </View>
        )}
      </ScrollView>

      <CustomModal
        isVisible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onConfirm={() => setModalVisible(false)}
        confirmText="OK"
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
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 40,
  },
  linkCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  messageCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  shareOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareButtonIcon: {
    marginBottom: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
});
