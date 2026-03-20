
/**
 * API Client for ZimCommute Backend
 * 
 * This module provides a centralized API layer for all backend communication.
 * It handles authentication tokens, error handling, and request/response formatting.
 * 
 * IMPORTANT: Never use fetch() directly in components. Always use these helpers.
 */

import Constants from 'expo-constants';
import { secureStorage } from '@/utils/secureStorePolyfill';
import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/supabase';

// Get backend URL from app.json configuration
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

// Supabase Edge Function URL for OTP — credentials sourced from centralized client
const SUPABASE_OTP_URL = `${SUPABASE_URL}/functions/v1/otp`;

console.log('[API] Backend URL configured:', BACKEND_URL);

const TOKEN_KEY = 'zimcommute_auth_token';

/**
 * Get the stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await secureStorage.getItemAsync(TOKEN_KEY);
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
    await secureStorage.setItemAsync(TOKEN_KEY, token);
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
    await secureStorage.deleteItemAsync(TOKEN_KEY);
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
      
      if (response.status === 404) {
        throw new Error('The requested resource does not exist.');
      }
      
      throw new Error('Invalid response format from server');
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('[API] Error response:', data);
      
      if (response.status === 404) {
        throw new Error(data.message || 'The requested resource does not exist');
      } else if (response.status === 429) {
        throw new Error(data.message || 'Too many requests. Please try again later.');
      } else if (response.status === 500) {
        throw new Error(data.message || 'Server error. Please try again later.');
      }
      
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    console.log('[API] Request successful');
    return data as T;
  } catch (error: any) {
    console.error('[API] Request failed:', error.message);
    
    if (error.message === 'Network request failed' || error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your internet connection and ensure the backend is running.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

/**
 * Direct call to Supabase Edge Function for OTP operations.
 *
 * For /send and /resend: the edge function always stores the OTP first, then
 * attempts SMS delivery. If SMS fails it returns { success: false, smsStatus, smsError }
 * with HTTP 200. We must NOT throw in that case — the OTP is still valid and the
 * user should proceed to the verify screen. We return the response body as-is so
 * the caller can inspect smsStatus and show the appropriate message.
 *
 * For /verify: a success:false response is a real failure (wrong code, expired, etc.)
 * and should throw so the caller can surface the error.
 */
async function otpEdgeCall<T>(
  path: string,
  data: Record<string, string>,
  throwOnFailure = false
): Promise<T> {
  const url = `${SUPABASE_OTP_URL}${path}`;
  console.log(`[OTP] POST ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data),
    });

    console.log(`[OTP] Response status: ${response.status}`);

    const responseData = await response.json();

    // Hard HTTP errors (4xx/5xx) always throw
    if (!response.ok) {
      console.error('[OTP] HTTP error response:', responseData);
      if (response.status === 429) {
        throw new Error(responseData.message || 'Too many OTP requests. Please wait before trying again.');
      }
      throw new Error(responseData.message || responseData.error || `OTP request failed with status ${response.status}`);
    }

    // For verify endpoint, a success:false in the body is a real error
    if (throwOnFailure && responseData.success === false) {
      throw new Error(responseData.message || 'OTP verification failed');
    }

    console.log('[OTP] Request completed, smsStatus:', responseData.smsStatus);
    return responseData as T;
  } catch (error: any) {
    console.error('[OTP] Request failed:', error.message);
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
      body: data ? JSON.stringify(data) : JSON.stringify({}),
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
      body: data ? JSON.stringify(data) : JSON.stringify({}),
    },
    true
  );
}

export async function authenticatedPut<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(
    endpoint,
    {
      method: 'PUT',
      body: data ? JSON.stringify(data) : JSON.stringify({}),
    },
    true
  );
}

export async function authenticatedDelete<T>(endpoint: string): Promise<T> {
  return apiCall<T>(
    endpoint, 
    { 
      method: 'DELETE',
      headers: {}
    }, 
    true
  );
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
  
  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, file.name);
  } else {
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
  expiresIn?: number;
  smsStatus?: string;
  smsError?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  token?: string;
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

// OTP API — routed through Supabase Edge Function
// send/resend: do NOT throw on SMS failure (OTP is still stored, user can proceed)
// verify: throw on failure (wrong code / expired)
export const sendOTP = (phoneNumber: string) =>
  otpEdgeCall<SendOTPResponse>('/send', { phoneNumber }, false);

export const verifyOTP = (phoneNumber: string, otp: string) =>
  otpEdgeCall<VerifyOTPResponse>('/verify', { phoneNumber, otp }, true);

export const resendOTP = (phoneNumber: string) =>
  otpEdgeCall<SendOTPResponse>('/resend', { phoneNumber }, false);

// User API
export const getCurrentUser = () =>
  authenticatedGet<UserProfile>('/api/users/me');

export const updateProfile = (data: UpdateProfileData) =>
  authenticatedPut<UserProfile>('/api/users/profile', data);

export const uploadProfilePhoto = (file: { uri: string; name: string; type: string }) =>
  authenticatedUpload<UploadPhotoResponse>('/api/users/upload-profile-photo', file, 'photo');

export const uploadIDDocument = (file: { uri: string; name: string; type: string }) =>
  authenticatedUpload<UploadIDResponse>('/api/users/upload-id-document', file, 'document');
