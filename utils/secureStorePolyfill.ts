/**
 * Storage adapter for @better-auth/expo and any code that needs the old
 * expo-secure-store API names.
 *
 * expo-secure-store v14+ uses:
 *   setItemAsync(key, value)
 *   getItemAsync(key)
 *   deleteItemAsync(key)
 *
 * @better-auth/expo internally calls the old names:
 *   setValueWithKeyAsync(value, key)   ← note: value first, key second
 *   getValueWithKeyAsync(key)
 *   removeValueWithKeyAsync(key)
 *
 * We export a plain object (not a frozen module namespace) so the methods
 * can be assigned and called without hitting the "not a function" error that
 * occurs when trying to mutate a sealed ES module namespace object.
 *
 * On web, expo-secure-store is a no-op stub, so we fall back to localStorage.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

// ---------------------------------------------------------------------------
// Web fallback — localStorage-backed storage for browser preview
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Unified helpers that work on both native and web
// ---------------------------------------------------------------------------
const setItem = (key: string, value: string): Promise<void> =>
  isWeb ? webSetItem(key, value) : SecureStore.setItemAsync(key, value);

const getItem = (key: string): Promise<string | null> =>
  isWeb ? webGetItem(key) : SecureStore.getItemAsync(key);

const deleteItem = (key: string): Promise<void> =>
  isWeb ? webDeleteItem(key) : SecureStore.deleteItemAsync(key);

// ---------------------------------------------------------------------------
// Exported storage adapter
// Provides BOTH the current API names and the old @better-auth/expo names.
// Use this object wherever a storage adapter is needed.
// ---------------------------------------------------------------------------
export const secureStorage = {
  // Current expo-secure-store v14 API
  setItemAsync: setItem,
  getItemAsync: getItem,
  deleteItemAsync: deleteItem,

  // Old API names used internally by @better-auth/expo
  // NOTE: old API has (value, key) argument order — not (key, value)
  setValueWithKeyAsync: (value: string, key: string): Promise<void> =>
    setItem(key, value),
  getValueWithKeyAsync: (key: string): Promise<string | null> =>
    getItem(key),
  removeValueWithKeyAsync: (key: string): Promise<void> =>
    deleteItem(key),
};

console.log('[SecureStore] Storage adapter initialised, platform:', Platform.OS);
