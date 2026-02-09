
/**
 * Crash Reporting Utility for ZimCommute
 * 
 * Integrates with Sentry for crash reporting and error tracking.
 * Provides context-aware error logging for better debugging.
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Initialize Sentry only in production
export function initializeCrashReporting() {
  // Only initialize in production builds
  if (__DEV__) {
    console.log('[CrashReporting] Skipping Sentry initialization in development');
    return;
  }

  try {
    Sentry.init({
      dsn: Constants.expoConfig?.extra?.sentryDsn || '',
      enableInExpoDevelopment: false,
      debug: false,
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
      beforeSend(event) {
        // Filter out non-critical errors
        if (event.level === 'warning') {
          return null;
        }
        return event;
      },
    });

    // Set user context
    Sentry.setContext('device', {
      platform: Platform.OS,
      version: Platform.Version,
    });

    console.log('[CrashReporting] Sentry initialized successfully');
  } catch (error) {
    console.error('[CrashReporting] Failed to initialize Sentry:', error);
  }
}

/**
 * Log an error to Sentry
 */
export function logError(error: Error, context?: Record<string, any>) {
  if (__DEV__) {
    console.error('[CrashReporting] Error:', error, context);
    return;
  }

  try {
    if (context) {
      Sentry.setContext('error_context', context);
    }
    Sentry.captureException(error);
  } catch (e) {
    console.error('[CrashReporting] Failed to log error:', e);
  }
}

/**
 * Log a message to Sentry
 */
export function logMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (__DEV__) {
    console.log(`[CrashReporting] ${level.toUpperCase()}:`, message);
    return;
  }

  try {
    Sentry.captureMessage(message, level);
  } catch (error) {
    console.error('[CrashReporting] Failed to log message:', error);
  }
}

/**
 * Set user context for crash reports
 */
export function setUserContext(userId: string, userData?: Record<string, any>) {
  if (__DEV__) {
    console.log('[CrashReporting] Setting user context:', userId, userData);
    return;
  }

  try {
    Sentry.setUser({
      id: userId,
      ...userData,
    });
  } catch (error) {
    console.error('[CrashReporting] Failed to set user context:', error);
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (__DEV__) {
    console.log('[CrashReporting] Clearing user context');
    return;
  }

  try {
    Sentry.setUser(null);
  } catch (error) {
    console.error('[CrashReporting] Failed to clear user context:', error);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (__DEV__) {
    console.log(`[CrashReporting] Breadcrumb [${category}]:`, message, data);
    return;
  }

  try {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  } catch (error) {
    console.error('[CrashReporting] Failed to add breadcrumb:', error);
  }
}
