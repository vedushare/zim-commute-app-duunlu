
/**
 * Offline-First API Layer for ZimCommute
 * 
 * Wraps the existing API calls with offline-first capabilities:
 * - Returns cached data when offline
 * - Queues operations for later sync
 * - Implements optimistic UI updates
 */

import { isOnline } from './connectivityManager';
import { storeData, getData, STORAGE_KEYS, CACHE_EXPIRATION } from './offlineStorage';
import { addPendingOperation } from './pendingOperations';
import * as api from './api';
import * as ridesApi from './ridesApi';
import * as safetyApi from './safetyApi';
import type { User } from '@/types/auth';
import type { Vehicle, Ride, Booking, RideSearchParams } from '@/types/rides';
import type { EmergencyContact } from '@/types/safety';

/**
 * Get user profile (offline-first)
 */
export async function getUserProfile(): Promise<{ data: User; fromCache: boolean }> {
  console.log('[OfflineAPI] Getting user profile');
  
  if (isOnline()) {
    try {
      const data = await api.getCurrentUser();
      await storeData(STORAGE_KEYS.USER_PROFILE, data, CACHE_EXPIRATION.USER_PROFILE);
      return { data: data as User, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to fetch profile, falling back to cache');
    }
  }

  // Return cached data
  const cached = await getData<User>(STORAGE_KEYS.USER_PROFILE, CACHE_EXPIRATION.USER_PROFILE);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  throw new Error('No profile data available offline');
}

/**
 * Update user profile (offline-first)
 */
export async function updateUserProfile(updates: any): Promise<{ data: User; fromCache: boolean }> {
  console.log('[OfflineAPI] Updating user profile');

  if (isOnline()) {
    try {
      const data = await api.updateProfile(updates);
      await storeData(STORAGE_KEYS.USER_PROFILE, data, CACHE_EXPIRATION.USER_PROFILE);
      return { data: data as User, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to update profile online, queuing for sync');
    }
  }

  // Queue for sync
  await addPendingOperation('UPDATE_PROFILE', '/api/users/profile', 'PUT', updates);

  // Optimistically update cache
  const cached = await getData<User>(STORAGE_KEYS.USER_PROFILE);
  if (cached) {
    const updated = { ...cached, ...updates };
    await storeData(STORAGE_KEYS.USER_PROFILE, updated, CACHE_EXPIRATION.USER_PROFILE);
    return { data: updated, fromCache: true };
  }

  throw new Error('Cannot update profile offline without cached data');
}

/**
 * Get vehicles (offline-first)
 */
export async function getVehicles(): Promise<{ data: Vehicle[]; fromCache: boolean }> {
  console.log('[OfflineAPI] Getting vehicles');

  if (isOnline()) {
    try {
      const data = await ridesApi.getVehicles();
      await storeData(STORAGE_KEYS.VEHICLES, data, CACHE_EXPIRATION.VEHICLES);
      return { data, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to fetch vehicles, falling back to cache');
    }
  }

  const cached = await getData<Vehicle[]>(STORAGE_KEYS.VEHICLES, CACHE_EXPIRATION.VEHICLES);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  return { data: [], fromCache: true };
}

/**
 * Create vehicle (offline-first)
 */
export async function createVehicle(vehicleData: any): Promise<{ data: Vehicle; fromCache: boolean }> {
  console.log('[OfflineAPI] Creating vehicle');

  const localId = `local_${Date.now()}`;

  if (isOnline()) {
    try {
      const data = await ridesApi.createVehicle(vehicleData);
      
      // Update cache
      const cached = await getData<Vehicle[]>(STORAGE_KEYS.VEHICLES) || [];
      cached.push(data);
      await storeData(STORAGE_KEYS.VEHICLES, cached, CACHE_EXPIRATION.VEHICLES);
      
      return { data, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to create vehicle online, queuing for sync');
    }
  }

  // Queue for sync
  await addPendingOperation('CREATE_VEHICLE', '/api/vehicles', 'POST', vehicleData, localId);

  // Optimistically add to cache
  const optimisticVehicle: Vehicle = {
    id: localId,
    ...vehicleData,
    userId: 'pending',
    createdAt: new Date().toISOString(),
  };

  const cached = await getData<Vehicle[]>(STORAGE_KEYS.VEHICLES) || [];
  cached.push(optimisticVehicle);
  await storeData(STORAGE_KEYS.VEHICLES, cached, CACHE_EXPIRATION.VEHICLES);

  return { data: optimisticVehicle, fromCache: true };
}

/**
 * Search rides (offline-first)
 */
export async function searchRides(params: RideSearchParams): Promise<{ data: Ride[]; fromCache: boolean }> {
  console.log('[OfflineAPI] Searching rides');

  if (isOnline()) {
    try {
      const data = await ridesApi.searchRides(params);
      
      // Cache search results
      const cacheKey = `${STORAGE_KEYS.ACTIVE_RIDES}_${params.origin}_${params.destination}_${params.date}`;
      await storeData(cacheKey, data, CACHE_EXPIRATION.ACTIVE_RIDES);
      
      return { data, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to search rides online, falling back to cache');
    }
  }

  // Try to get cached results
  const cacheKey = `${STORAGE_KEYS.ACTIVE_RIDES}_${params.origin}_${params.destination}_${params.date}`;
  const cached = await getData<Ride[]>(cacheKey, CACHE_EXPIRATION.ACTIVE_RIDES);
  
  if (cached) {
    return { data: cached, fromCache: true };
  }

  return { data: [], fromCache: true };
}

/**
 * Get my rides (offline-first)
 */
export async function getMyRides(): Promise<{ data: Ride[]; fromCache: boolean }> {
  console.log('[OfflineAPI] Getting my rides');

  if (isOnline()) {
    try {
      const data = await ridesApi.getMyRides();
      await storeData(STORAGE_KEYS.MY_RIDES, data, CACHE_EXPIRATION.MY_RIDES);
      return { data, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to fetch my rides, falling back to cache');
    }
  }

  const cached = await getData<Ride[]>(STORAGE_KEYS.MY_RIDES, CACHE_EXPIRATION.MY_RIDES);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  return { data: [], fromCache: true };
}

/**
 * Create ride (offline-first)
 */
export async function createRide(rideData: any): Promise<{ data: Ride; fromCache: boolean }> {
  console.log('[OfflineAPI] Creating ride');

  const localId = `local_${Date.now()}`;

  if (isOnline()) {
    try {
      const data = await ridesApi.createRide(rideData);
      
      // Update cache
      const cached = await getData<Ride[]>(STORAGE_KEYS.MY_RIDES) || [];
      cached.push(data);
      await storeData(STORAGE_KEYS.MY_RIDES, cached, CACHE_EXPIRATION.MY_RIDES);
      
      return { data, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to create ride online, saving as draft');
    }
  }

  // Queue for sync
  await addPendingOperation('CREATE_RIDE', '/api/rides', 'POST', rideData, localId);

  // Save as draft
  const draftRide: Ride = {
    id: localId,
    ...rideData,
    driverId: 'pending',
    availableSeats: rideData.totalSeats,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const cached = await getData<Ride[]>(STORAGE_KEYS.MY_RIDES) || [];
  cached.push(draftRide);
  await storeData(STORAGE_KEYS.MY_RIDES, cached, CACHE_EXPIRATION.MY_RIDES);

  return { data: draftRide, fromCache: true };
}

/**
 * Get my bookings (offline-first)
 */
export async function getMyBookings(): Promise<{ data: Booking[]; fromCache: boolean }> {
  console.log('[OfflineAPI] Getting my bookings');

  if (isOnline()) {
    try {
      const data = await ridesApi.getMyBookings();
      await storeData(STORAGE_KEYS.MY_BOOKINGS, data, CACHE_EXPIRATION.MY_BOOKINGS);
      return { data, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to fetch bookings, falling back to cache');
    }
  }

  const cached = await getData<Booking[]>(STORAGE_KEYS.MY_BOOKINGS, CACHE_EXPIRATION.MY_BOOKINGS);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  return { data: [], fromCache: true };
}

/**
 * Get emergency contacts (offline-first)
 */
export async function getEmergencyContacts(): Promise<{ data: EmergencyContact[]; fromCache: boolean }> {
  console.log('[OfflineAPI] Getting emergency contacts');

  if (isOnline()) {
    try {
      const data = await safetyApi.getEmergencyContacts();
      await storeData(STORAGE_KEYS.EMERGENCY_CONTACTS, data, CACHE_EXPIRATION.EMERGENCY_CONTACTS);
      return { data, fromCache: false };
    } catch (error) {
      console.warn('[OfflineAPI] Failed to fetch contacts, falling back to cache');
    }
  }

  const cached = await getData<EmergencyContact[]>(STORAGE_KEYS.EMERGENCY_CONTACTS, CACHE_EXPIRATION.EMERGENCY_CONTACTS);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  return { data: [], fromCache: true };
}
