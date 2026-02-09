
/**
 * Sync Manager for ZimCommute
 * 
 * Handles synchronization between local cache and remote server.
 * Implements incremental updates and conflict resolution.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, addConnectivityListener } from './connectivityManager';
import {
  getPendingOperations,
  updateOperationStatus,
  removeOperation,
  shouldRetryOperation,
  getRetryDelay,
  PendingOperation,
} from './pendingOperations';
import { STORAGE_KEYS, storeData, getData, CACHE_EXPIRATION } from './offlineStorage';
import * as api from './api';
import * as ridesApi from './ridesApi';
import * as safetyApi from './safetyApi';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingOperationsCount: number;
  failedOperationsCount: number;
  error: string | null;
}

let syncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncTime: null,
  pendingOperationsCount: 0,
  failedOperationsCount: 0,
  error: null,
};

let syncListeners: Array<(status: SyncStatus) => void> = [];
let autoSyncEnabled = true;

/**
 * Initialize sync manager
 */
export async function initializeSyncManager(): Promise<void> {
  console.log('[SyncManager] Initializing sync manager');
  
  // Load last sync time
  const lastSyncJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  if (lastSyncJson) {
    syncStatus.lastSyncTime = parseInt(lastSyncJson, 10);
  }

  // Set up connectivity listener for auto-sync
  addConnectivityListener((state) => {
    if (state.isConnected && state.isInternetReachable && autoSyncEnabled) {
      console.log('[SyncManager] Device came online, triggering sync');
      syncAll().catch(error => {
        console.error('[SyncManager] Auto-sync failed:', error);
      });
    }
  });

  // Trigger initial sync if online
  if (isOnline()) {
    syncAll().catch(error => {
      console.error('[SyncManager] Initial sync failed:', error);
    });
  }
}

/**
 * Sync all data
 */
export async function syncAll(): Promise<void> {
  if (syncStatus.isSyncing) {
    console.log('[SyncManager] Sync already in progress');
    return;
  }

  if (!isOnline()) {
    console.log('[SyncManager] Device is offline, skipping sync');
    return;
  }

  console.log('[SyncManager] Starting full sync');
  updateSyncStatus({ isSyncing: true, error: null });

  try {
    // 1. Process pending operations first
    await processPendingOperations();

    // 2. Sync data from server
    await syncFromServer();

    // 3. Update last sync time
    const now = Date.now();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toString());
    
    updateSyncStatus({
      isSyncing: false,
      lastSyncTime: now,
      error: null,
    });

    console.log('[SyncManager] Full sync completed successfully');
  } catch (error: any) {
    console.error('[SyncManager] Sync failed:', error);
    updateSyncStatus({
      isSyncing: false,
      error: error.message || 'Sync failed',
    });
    throw error;
  }
}

/**
 * Process pending operations
 */
async function processPendingOperations(): Promise<void> {
  console.log('[SyncManager] Processing pending operations');
  
  const operations = await getPendingOperations();
  const pendingOps = operations.filter(op => shouldRetryOperation(op));

  updateSyncStatus({ pendingOperationsCount: pendingOps.length });

  for (const operation of pendingOps) {
    try {
      await processOperation(operation);
      await removeOperation(operation.id);
    } catch (error: any) {
      console.error(`[SyncManager] Operation ${operation.id} failed:`, error);
      await updateOperationStatus(operation.id, 'failed', error.message);
    }
  }

  // Update failed count
  const allOps = await getPendingOperations();
  const failedCount = allOps.filter(op => op.status === 'failed').length;
  updateSyncStatus({ failedOperationsCount: failedCount });
}

/**
 * Process a single operation
 */
async function processOperation(operation: PendingOperation): Promise<void> {
  console.log(`[SyncManager] Processing operation: ${operation.type}`);
  
  await updateOperationStatus(operation.id, 'processing');

  // Add delay for retry with exponential backoff
  if (operation.retryCount > 0) {
    const delay = getRetryDelay(operation.retryCount);
    console.log(`[SyncManager] Waiting ${delay}ms before retry ${operation.retryCount}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Execute the operation based on type
  switch (operation.type) {
    case 'CREATE_RIDE':
      await ridesApi.createRide(operation.data);
      break;
    case 'UPDATE_RIDE':
      await ridesApi.updateRide(operation.data.rideId, operation.data.updates);
      break;
    case 'DELETE_RIDE':
      await ridesApi.cancelRide(operation.data.rideId);
      break;
    case 'CREATE_BOOKING':
      await ridesApi.createBooking(operation.data);
      break;
    case 'CANCEL_BOOKING':
      await ridesApi.cancelBooking(operation.data.bookingId);
      break;
    case 'UPDATE_PROFILE':
      await api.updateProfile(operation.data);
      break;
    case 'CREATE_VEHICLE':
      await ridesApi.createVehicle(operation.data);
      break;
    case 'DELETE_VEHICLE':
      await ridesApi.deleteVehicle(operation.data.vehicleId);
      break;
    case 'CREATE_EMERGENCY_CONTACT':
      await safetyApi.createEmergencyContact(operation.data);
      break;
    case 'DELETE_EMERGENCY_CONTACT':
      await safetyApi.deleteEmergencyContact(operation.data.contactId);
      break;
    case 'CREATE_RATING':
      await safetyApi.createRating(operation.data);
      break;
    case 'CREATE_REPORT':
      await safetyApi.createReport(operation.data);
      break;
    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }

  await updateOperationStatus(operation.id, 'completed');
}

/**
 * Sync data from server
 */
async function syncFromServer(): Promise<void> {
  console.log('[SyncManager] Syncing data from server');

  try {
    // Sync user profile
    const userProfile = await api.getCurrentUser();
    await storeData(STORAGE_KEYS.USER_PROFILE, userProfile, CACHE_EXPIRATION.USER_PROFILE);

    // Sync vehicles
    const vehicles = await ridesApi.getVehicles();
    await storeData(STORAGE_KEYS.VEHICLES, vehicles, CACHE_EXPIRATION.VEHICLES);

    // Sync my rides
    const myRides = await ridesApi.getMyRides();
    await storeData(STORAGE_KEYS.MY_RIDES, myRides, CACHE_EXPIRATION.MY_RIDES);

    // Sync my bookings
    const myBookings = await ridesApi.getMyBookings();
    await storeData(STORAGE_KEYS.MY_BOOKINGS, myBookings, CACHE_EXPIRATION.MY_BOOKINGS);

    // Sync emergency contacts
    const emergencyContacts = await safetyApi.getEmergencyContacts();
    await storeData(STORAGE_KEYS.EMERGENCY_CONTACTS, emergencyContacts, CACHE_EXPIRATION.EMERGENCY_CONTACTS);

    console.log('[SyncManager] Server sync completed');
  } catch (error) {
    console.error('[SyncManager] Error syncing from server:', error);
    throw error;
  }
}

/**
 * Update sync status and notify listeners
 */
function updateSyncStatus(updates: Partial<SyncStatus>): void {
  syncStatus = { ...syncStatus, ...updates };
  notifySyncListeners();
}

/**
 * Notify all sync listeners
 */
function notifySyncListeners(): void {
  syncListeners.forEach(listener => {
    try {
      listener(syncStatus);
    } catch (error) {
      console.error('[SyncManager] Error in sync listener:', error);
    }
  });
}

/**
 * Add sync status listener
 */
export function addSyncListener(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener);
  
  // Immediately call with current status
  listener(syncStatus);
  
  // Return unsubscribe function
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

/**
 * Enable/disable auto-sync
 */
export function setAutoSyncEnabled(enabled: boolean): void {
  autoSyncEnabled = enabled;
  console.log(`[SyncManager] Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Force sync now
 */
export async function forceSyncNow(): Promise<void> {
  console.log('[SyncManager] Force sync triggered');
  await syncAll();
}
