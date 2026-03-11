
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomModal } from '@/components/ui/CustomModal';
import Button from '@/components/button';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getSMSConfig, updateSMSConfig, sendTestSMS } from '@/utils/adminApi';

interface SMSConfig {
  apiUrl: string;
  senderId: string;
  enabled: boolean;
  testMode: boolean;
  configured: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  infoBox: {
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: colors.secondary + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  testButton: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusBadgeDisabled: {
    backgroundColor: colors.error + '20',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 6,
  },
  statusTextDisabled: {
    color: colors.error,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -8,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function SMSConfigScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SMSConfig>({
    apiUrl: 'https://sms.localhost.co.zw/api/v1/sms/send',
    senderId: 'ZimCommute',
    enabled: true,
    testMode: false,
    configured: false,
  });
  const [testPhone, setTestPhone] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSMSConfig();
      setConfig({
        apiUrl: data.apiUrl || 'https://sms.localhost.co.zw/api/v1/sms/send',
        senderId: data.senderId || 'ZimCommute',
        enabled: data.enabled !== undefined ? data.enabled : true,
        testMode: data.testMode !== undefined ? data.testMode : false,
        configured: data.configured ?? false,
      });
    } catch (error: any) {
      console.error('Failed to load SMS config:', error);
    } finally {
      setLoading(false);
    }
  }, [showModal]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config.senderId.trim()) {
      showModal('Validation Error', 'Sender ID is required');
      return;
    }

    try {
      setSaving(true);
      const result = await updateSMSConfig({
        apiUrl: config.apiUrl,
        senderId: config.senderId,
        enabled: config.enabled,
        testMode: config.testMode,
      });
      showModal('Configuration Saved', result.message || 'Settings noted. Remember: the SMS API key must be set via the SMS_API_KEY environment variable on the server.');
    } catch (error: any) {
      console.error('Failed to save SMS config:', error);
      showModal('Error', error.message || 'Failed to save SMS configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone.trim()) {
      showModal('Validation Error', 'Please enter a phone number to test');
      return;
    }

    try {
      setTesting(true);
      const result = await sendTestSMS(testPhone);
      showModal('Test SMS', result.message || `Test SMS sent to ${testPhone}`);
    } catch (error: any) {
      console.error('Failed to send test SMS:', error);
      showModal('Error', error.message || 'Failed to send test SMS. Ensure SMS_API_KEY is set on the backend server.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'SMS Configuration',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const statusEnabled = config.enabled;
  const statusText = statusEnabled ? 'Enabled' : 'Disabled';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'SMS Configuration',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMS Service Status</Text>

          <View style={[styles.statusBadge, !statusEnabled && styles.statusBadgeDisabled]}>
            <IconSymbol
              ios_icon_name={statusEnabled ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
              android_material_icon_name={statusEnabled ? 'check-circle' : 'cancel'}
              size={20}
              color={statusEnabled ? colors.success : colors.error}
            />
            <Text style={[styles.statusText, !statusEnabled && styles.statusTextDisabled]}>
              {statusText}
            </Text>
          </View>

          <View style={[styles.statusBadge, !config.configured && styles.statusBadgeDisabled]}>
            <IconSymbol
              ios_icon_name={config.configured ? 'key.fill' : 'key'}
              android_material_icon_name={config.configured ? 'vpn-key' : 'vpn-key'}
              size={20}
              color={config.configured ? colors.success : colors.error}
            />
            <Text style={[styles.statusText, !config.configured && styles.statusTextDisabled]}>
              {config.configured ? 'API Key Configured' : 'API Key Not Set'}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Configure your SMS provider to send OTP codes to users during phone verification.
            </Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 API Key Security</Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              The SMS API key is managed exclusively via a backend environment variable for security.
              It is never stored in the database or transmitted via this UI.{'\n\n'}
              To set or rotate the key, update the environment variable on your backend server and restart it:{'\n\n'}
              {'  SMS_API_KEY=your_api_key_here'}
            </Text>
          </View>
        </View>

        {/* API Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>

          <Text style={styles.label}>API URL</Text>
          <TextInput
            style={styles.input}
            value={config.apiUrl}
            onChangeText={(text) => setConfig({ ...config, apiUrl: text })}
            placeholder="https://sms.localhost.co.zw/api/v1/sms/send"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>
            Configurable via SMS_API_URL environment variable
          </Text>

          <Text style={styles.label}>Sender ID</Text>
          <TextInput
            style={styles.input}
            value={config.senderId}
            onChangeText={(text) => setConfig({ ...config, senderId: text })}
            placeholder="ZimCommute"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            maxLength={11}
          />
          <Text style={styles.helpText}>
            The name that appears as the sender (max 11 characters). Configurable via SMS_SENDER_ID.
          </Text>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable SMS Service</Text>
            <Switch
              value={config.enabled}
              onValueChange={(value) => setConfig({ ...config, enabled: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Test Mode (Log only, don&apos;t send)</Text>
            <Switch
              value={config.testMode}
              onValueChange={(value) => setConfig({ ...config, testMode: value })}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {/* Test SMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test SMS</Text>

          <Text style={styles.label}>Test Phone Number</Text>
          <TextInput
            style={styles.input}
            value={testPhone}
            onChangeText={setTestPhone}
            placeholder="+263712345678"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestSMS}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.testButtonText}>Send Test SMS</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <Button
          title={saving ? 'Saving...' : 'Save Configuration'}
          onPress={handleSave}
          disabled={saving}
        />
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

