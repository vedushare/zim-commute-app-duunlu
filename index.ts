// Initialize Natively console log capture before anything else
import './utils/errorLogger';
// Polyfill old expo-secure-store API (setValueWithKeyAsync etc.) used by @better-auth/expo
import './utils/secureStorePolyfill';

import 'expo-router/entry';
