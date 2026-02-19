
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

/**
 * Web Admin Panel Entry Point
 * 
 * This screen serves as the entry point for the web-based admin panel.
 * It redirects to the admin dashboard when accessed via web browser.
 * 
 * Access URL: https://your-app-url.com/admin-web
 */
export default function AdminWebScreen() {
  useEffect(() => {
    console.log('[AdminWeb] Platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      console.log('[AdminWeb] Web platform detected - admin panel available');
    } else {
      console.log('[AdminWeb] Non-web platform - use mobile admin screens');
    }
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Admin Panel', headerShown: true }} />
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Web Admin Panel</Text>
          <Text style={styles.message}>
            The web admin panel is only accessible through a web browser.
          </Text>
          <Text style={styles.instruction}>
            Please open this URL in your web browser to access the admin panel.
          </Text>
          <Text style={styles.note}>
            For mobile admin access, use the Admin Dashboard in the Profile tab.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'ZimCommute Admin Panel', headerShown: true }} />
      <View style={styles.webContainer}>
        <Text style={styles.title}>Loading Admin Panel...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
