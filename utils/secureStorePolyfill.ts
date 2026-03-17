/**
 * Polyfill for old expo-secure-store API used by @better-auth/expo internals.
 * expo-secure-store v14+ renamed these methods:
 *   setValueWithKeyAsync    → setItemAsync
 *   getValueWithKeyAsync    → getItemAsync
 *   removeValueWithKeyAsync → deleteItemAsync
 */
import * as SecureStore from 'expo-secure-store';

const ss = SecureStore as any;

if (typeof ss.setValueWithKeyAsync !== 'function') {
  ss.setValueWithKeyAsync = (value: string, key: string) =>
    SecureStore.setItemAsync(key, value);
}

if (typeof ss.getValueWithKeyAsync !== 'function') {
  ss.getValueWithKeyAsync = (key: string) => SecureStore.getItemAsync(key);
}

if (typeof ss.removeValueWithKeyAsync !== 'function') {
  ss.removeValueWithKeyAsync = (key: string) =>
    SecureStore.deleteItemAsync(key);
}
