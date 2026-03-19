/**
 * Polyfill for old expo-secure-store API used by @better-auth/expo internals.
 * expo-secure-store v14+ renamed these methods:
 *   setValueWithKeyAsync    → setItemAsync
 *   getValueWithKeyAsync    → getItemAsync
 *   removeValueWithKeyAsync → deleteItemAsync
 *
 * On web, expo-secure-store is a no-op stub and setItemAsync may not exist.
 * We provide a localStorage-backed fallback for web so auth works in the browser.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ss = SecureStore as any;

// Web fallback using localStorage (SecureStore is a no-op on web)
const webSetItem = (key: string, value: string): Promise<void> => {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    // ignore storage errors
  }
  return Promise.resolve();
};

const webGetItem = (key: string): Promise<string | null> => {
  try {
    return Promise.resolve(localStorage.getItem(key));
  } catch (_) {
    return Promise.resolve(null);
  }
};

const webDeleteItem = (key: string): Promise<void> => {
  try {
    localStorage.removeItem(key);
  } catch (_) {
    // ignore
  }
  return Promise.resolve();
};

const isWeb = Platform.OS === 'web';

// Patch setItemAsync / getItemAsync / deleteItemAsync for web
if (isWeb) {
  ss.setItemAsync = webSetItem;
  ss.getItemAsync = webGetItem;
  ss.deleteItemAsync = webDeleteItem;
}

// Always patch the old API names unconditionally so @better-auth/expo internals work
ss.setValueWithKeyAsync = (value: string, key: string) =>
  isWeb ? webSetItem(key, value) : SecureStore.setItemAsync(key, value);

ss.getValueWithKeyAsync = (key: string) =>
  isWeb ? webGetItem(key) : SecureStore.getItemAsync(key);

ss.removeValueWithKeyAsync = (key: string) =>
  isWeb ? webDeleteItem(key) : SecureStore.deleteItemAsync(key);
