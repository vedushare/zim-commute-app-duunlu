
/**
 * API Client for ZimCommute Backend
 * 
 * This module provides a centralized API layer for all backend communication.
 * It handles authentication tokens, error handling, and request/response formatting.
 * 
 * IMPORTANT: Never use fetch() directly in components. Always use these helpers.
 */

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get backend URL from app.json configuration
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

console.log('[API] Backend URL configured:', BACKEND_URL);

const TOKEN_KEY = 'zimcommute_auth_token';

/**
 * Get the stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[API] Error getting auth token:', error);
    return null;
  }
}

/**
 * Store authentication token
 */
export async function setAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    console.log('[API] Auth token stored successfully');
  } catch (error) {
    console.error('[API] Error storing auth token:', error);
    throw error;
  }
}

/**
 * Clear authentication token
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    console.log('[API] Auth token cleared');
  } catch (error) {
    console.error('[API] Error clearing auth token:', error);
  }
}

/**
 * Base API call function with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = false
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  
  console.log(`[API] ${options.method || 'GET'} ${endpoint}`);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authentication token if required
  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('[API] Auth required but no token found');
      throw new Error('Authentication required');
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[API] Response status: ${response.status}`);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[API] Non-JSON response:', text);
      throw new Error('Invalid response format from server');
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('[API] Error response:', data);
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    console.log('[API] Request successful');
    return data as T;
  } catch (error: any) {
    console.error('[API] Request failed:', error.message);
    
    // Provide user-friendly error messages
    if (error.message === 'Network request failed' || error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    
    throw error;
  }
}

/**
 * Public API calls (no authentication required)
 */

export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' }, false);
}

export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(
    endpoint,
    {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    },
    false
  );
}

/**
 * Authenticated API calls (requires auth token)
 */

export async function authenticatedGet<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' }, true);
}

export async function authenticatedPost<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(
    endpoint,
    {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    },
    true
  );
}

export async function authenticatedPut<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(
    endpoint,
    {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    },
    true
  );
}

export async function authenticatedDelete<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' }, true);
}

/**
 * Upload file with authentication
 */
export async function authenticatedUpload<T>(
  endpoint: string,
  file: {
    uri: string;
    name: string;
    type: string;
  },
  fieldName: string = 'file'
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  
  console.log(`[API] POST ${endpoint} (file upload)`);
  
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  
  // Handle file upload differently for web vs native
  if (Platform.OS === 'web') {
    // For web, we need to fetch the blob first
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, file.name);
  } else {
    // For native, use the file object directly
    formData.append(fieldName, {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser/native will set it with boundary
      },
      body: formData,
    });

    console.log(`[API] Response status: ${response.status}`);

    const data = await response.json();

    if (!response.ok) {
      console.error('[API] Error response:', data);
      throw new Error(data.message || data.error || `Upload failed with status ${response.status}`);
    }

    console.log('[API] Upload successful');
    return data as T;
  } catch (error: any) {
    console.error('[API] Upload failed:', error.message);
    throw error;
  }
}

/**
 * OTP Authentication API calls
 */

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface VerifyOTPResponse {
  success: boolean;
  user: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
    email: string | null;
    profilePhotoUrl: string | null;
    userType: string | null;
    homeCity: string | null;
    verificationLevel: string;
    role?: string;
    walletBalance?: number;
    isBanned?: boolean;
    banReason?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  email: string | null;
  profilePhotoUrl: string | null;
  userType: string | null;
  homeCity: string | null;
  verificationLevel: string;
  role?: string;
  walletBalance?: number;
  isBanned?: boolean;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  fullName?: string;
  email?: string;
  userType?: 'Passenger' | 'Driver';
  homeCity?: string;
}

export interface UploadPhotoResponse {
  success: boolean;
  profilePhotoUrl: string;
}

export interface UploadIDResponse {
  success: boolean;
  verificationLevel: string;
}

// OTP API
export const sendOTP = (phoneNumber: string) =>
  apiPost<SendOTPResponse>('/api/otp/send', { phoneNumber });

export const verifyOTP = (phoneNumber: string, otp: string) =>
  apiPost<VerifyOTPResponse>('/api/otp/verify', { phoneNumber, otp });

export const resendOTP = (phoneNumber: string) =>
  apiPost<SendOTPResponse>('/api/otp/resend', { phoneNumber });

// User API
export const getCurrentUser = () =>
  authenticatedGet<UserProfile>('/api/users/me');

export const updateProfile = (data: UpdateProfileData) =>
  authenticatedPut<UserProfile>('/api/users/profile', data);

export const uploadProfilePhoto = (file: { uri: string; name: string; type: string }) =>
  authenticatedUpload<UploadPhotoResponse>('/api/users/upload-profile-photo', file, 'photo');

export const uploadIDDocument = (file: { uri: string; name: string; type: string }) =>
  authenticatedUpload<UploadIDResponse>('/api/users/upload-id-document', file, 'document');
