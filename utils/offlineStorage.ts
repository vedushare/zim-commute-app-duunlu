
/**
 * Offline Storage Manager for ZimCommute
 * 
 * Provides a unified interface for storing and retrieving data locally
 * using AsyncStorage. Handles cache expiration and data versioning.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'offline_user_profile',
  ACTIVE_RIDES: 'offline_active_rides',
  ROUTE_DATA: 'offline_route_data',
  WALLET_BALANCE: 'offline_wallet_balance',
  MY_RIDES: 'offline_my_rides',
  MY_BOOKINGS: 'offline_my_bookings',
  VEHICLES: 'offline_vehicles',
  EMERGENCY_CONTACTS: 'offline_emergency_contacts',
  PENDING_OPERATIONS: 'offline_pending_operations',
  LAST_SYNC: 'offline_last_sync',
  CACHE_METADATA: 'offline_cache_metadata',
};

// Cache expiration times (in milliseconds)
export const CACHE_EXPIRATION = {
  USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
  ACTIVE_RIDES: 60 * 60 * 1000, // 1 hour
  ROUTE_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  WALLET_BALANCE: 0, // Real-time only (show cached with warning)
  MY_RIDES: 60 * 60 * 1000, // 1 hour
  MY_BOOKINGS: 60 * 60 * 1000, // 1 hour
  VEHICLES: 24 * 60 * 60 * 1000, // 24 hours
  EMERGENCY_CONTACTS: 24 * 60 * 60 * 1000, // 24 hours
};

interface CachedData<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface CacheMetadata {
  [key: string]: {
    timestamp: number;
    version: number;
    expiresAt: number;
  };
}

/**
 * Store data with timestamp and version
 */
export async function storeData<T>(
  key: string,
  data: T,
  expirationMs?: number
): Promise<void> {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      version: 1,
    };

    await AsyncStorage.setItem(key, JSON.stringify(cachedData));

    // Update metadata
    if (expirationMs !== undefined) {
      await updateCacheMetadata(key, cachedData.timestamp, cachedData.version, expirationMs);
    }

    console.log(`[OfflineStorage] Stored data for key: ${key}`);
  } catch (error) {
    console.error(`[OfflineStorage] Error storing data for key ${key}:`, error);
    throw error;
  }
}

/**
 * Retrieve data with cache validation
 */
export async function getData<T>(
  key: string,
  expirationMs?: number
): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    
    if (jsonValue === null) {
      console.log(`[OfflineStorage] No data found for key: ${key}`);
      return null;
    }

    const cachedData: CachedData<T> = JSON.parse(jsonValue);
    
    // Check if data has expired
    if (expirationMs !== undefined) {
      const age = Date.now() - cachedData.timestamp;
      if (age > expirationMs) {
        console.log(`[OfflineStorage] Data expired for key: ${key} (age: ${age}ms)`);
        await removeData(key);
        return null;
      }
    }

    console.log(`[OfflineStorage] Retrieved data for key: ${key}`);
    return cachedData.data;
  } catch (error) {
    console.error(`[OfflineStorage] Error retrieving data for key ${key}:`, error);
    return null;
  }
}

/**
 * Remove data from storage
 */
export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
    await removeCacheMetadata(key);
    console.log(`[OfflineStorage] Removed data for key: ${key}`);
  } catch (error) {
    console.error(`[OfflineStorage] Error removing data for key ${key}:`, error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('[OfflineStorage] Cleared all cached data');
  } catch (error) {
    console.error('[OfflineStorage] Error clearing cache:', error);
    throw error;
  }
}

/**
 * Update cache metadata
 */
async function updateCacheMetadata(
  key: string,
  timestamp: number,
  version: number,
  expirationMs: number
): Promise<void> {
  try {
    const metadataJson = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_METADATA);
    const metadata: CacheMetadata = metadataJson ? JSON.parse(metadataJson) : {};

    metadata[key] = {
      timestamp,
      version,
      expiresAt: timestamp + expirationMs,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CACHE_METADATA, JSON.stringify(metadata));
  } catch (error) {
    console.error('[OfflineStorage] Error updating cache metadata:', error);
  }
}

/**
 * Remove cache metadata
 */
async function removeCacheMetadata(key: string): Promise<void> {
  try {
    const metadataJson = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_METADATA);
    if (!metadataJson) return;

    const metadata: CacheMetadata = JSON.parse(metadataJson);
    delete metadata[key];

    await AsyncStorage.setItem(STORAGE_KEYS.CACHE_METADATA, JSON.stringify(metadata));
  } catch (error) {
    console.error('[OfflineStorage] Error removing cache metadata:', error);
  }
}

/**
 * Get cache metadata for all keys
 */
export async function getCacheMetadata(): Promise<CacheMetadata> {
  try {
    const metadataJson = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_METADATA);
    return metadataJson ? JSON.parse(metadataJson) : {};
  } catch (error) {
    console.error('[OfflineStorage] Error getting cache metadata:', error);
    return {};
  }
}

/**
 * Check if cache is valid
 */
export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const metadata = await getCacheMetadata();
    const cacheInfo = metadata[key];

    if (!cacheInfo) return false;

    return Date.now() < cacheInfo.expiresAt;
  } catch (error) {
    console.error('[OfflineStorage] Error checking cache validity:', error);
    return false;
  }
}

/**
 * Get cache age in milliseconds
 */
export async function getCacheAge(key: string): Promise<number | null> {
  try {
    const metadata = await getCacheMetadata();
    const cacheInfo = metadata[key];

    if (!cacheInfo) return null;

    return Date.now() - cacheInfo.timestamp;
  } catch (error) {
    console.error('[OfflineStorage] Error getting cache age:', error);
    return null;
  }
}

// Export storage keys for use in other modules
export { STORAGE_KEYS };
