
/**
 * Safety & Trust API Client for ZimCommute
 * 
 * Handles all trust and safety related API calls including:
 * - Document verification
 * - Emergency contacts
 * - Ratings and reviews
 * - Reporting system
 * - SOS alerts
 * - Share my ride
 */

import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, authenticatedUpload, apiGet } from './api';
import type {
  VerificationDocument,
  VerificationStatus,
  EmergencyContact,
  Rating,
  UserRatings,
  Report,
  SOSAlert,
  ShareRideLink,
  SharedRideDetails,
} from '@/types/safety';

// ============================================
// VERIFICATION SYSTEM
// ============================================

export const uploadVerificationDocument = async (
  file: { uri: string; name: string; type: string },
  documentType: string
) => {
  console.log('[SafetyAPI] Uploading verification document:', documentType);
  
  // Need to upload with documentType as a form field
  const formData = new FormData();
  formData.append('document', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);
  formData.append('documentType', documentType);
  
  const { BACKEND_URL, getAuthToken } = await import('./api');
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${BACKEND_URL}/api/verification/upload-document`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Upload failed');
  }
  
  return data as VerificationDocument;
};

export const getVerificationDocuments = () => {
  console.log('[SafetyAPI] Fetching verification documents');
  return authenticatedGet<VerificationDocument[]>('/api/verification/documents');
};

export const getVerificationStatus = () => {
  console.log('[SafetyAPI] Fetching verification status');
  return authenticatedGet<VerificationStatus>('/api/verification/status');
};

// ============================================
// EMERGENCY CONTACTS
// ============================================

export const createEmergencyContact = (data: {
  name: string;
  phoneNumber: string;
  relationship: string;
}) => {
  console.log('[SafetyAPI] Creating emergency contact:', data.name);
  return authenticatedPost<EmergencyContact>('/api/emergency-contacts', data);
};

export const getEmergencyContacts = () => {
  console.log('[SafetyAPI] Fetching emergency contacts');
  return authenticatedGet<EmergencyContact[]>('/api/emergency-contacts');
};

export const deleteEmergencyContact = (contactId: string) => {
  console.log('[SafetyAPI] Deleting emergency contact:', contactId);
  return authenticatedDelete<{ success: boolean }>(`/api/emergency-contacts/${contactId}`);
};

// ============================================
// SHARE MY RIDE
// ============================================

export const generateShareLink = (rideId: string) => {
  console.log('[SafetyAPI] Generating share link for ride:', rideId);
  return authenticatedPost<ShareRideLink>(`/api/rides/${rideId}/share-link`, {});
};

export const getSharedRideDetails = (shareToken: string) => {
  console.log('[SafetyAPI] Fetching shared ride details:', shareToken);
  return apiGet<SharedRideDetails>(`/api/rides/shared/${shareToken}`);
};

// ============================================
// SOS ALERTS
// ============================================

export const createSOSAlert = (data: {
  rideId?: string;
  locationLat?: number;
  locationLng?: number;
}) => {
  console.log('[SafetyAPI] Creating SOS alert');
  console.warn('🚨 SOS ALERT TRIGGERED 🚨', data);
  return authenticatedPost<SOSAlert>('/api/sos/alert', data);
};

export const resolveSOSAlert = (alertId: string) => {
  console.log('[SafetyAPI] Resolving SOS alert:', alertId);
  return authenticatedPut<{ success: boolean }>(`/api/sos/alert/${alertId}/resolve`, {});
};

// ============================================
// RATINGS & REVIEWS
// ============================================

export const createRating = (data: {
  bookingId: string;
  rideId: string;
  ratedUserId: string;
  rating: number;
  comment?: string;
}) => {
  console.log('[SafetyAPI] Creating rating for booking:', data.bookingId);
  return authenticatedPost<Rating>('/api/ratings', data);
};

export const getUserRatings = (userId: string) => {
  console.log('[SafetyAPI] Fetching ratings for user:', userId);
  return apiGet<UserRatings>(`/api/ratings/user/${userId}`);
};

export const getMyRatings = () => {
  console.log('[SafetyAPI] Fetching my ratings');
  return authenticatedGet<{ givenRatings: Rating[]; receivedRatings: Rating[] }>('/api/ratings/my-ratings');
};

// ============================================
// REPORTING SYSTEM
// ============================================

export const createReport = (data: {
  reportedUserId: string;
  rideId?: string;
  bookingId?: string;
  category: 'safety' | 'vehicle' | 'behavior' | 'payment';
  description: string;
  evidenceUrls?: string[];
}) => {
  console.log('[SafetyAPI] Creating report:', data.category);
  return authenticatedPost<Report>('/api/reports', data);
};

export const uploadReportEvidence = (file: { uri: string; name: string; type: string }) => {
  console.log('[SafetyAPI] Uploading report evidence');
  return authenticatedUpload<{ success: boolean; evidenceUrl: string }>('/api/reports/upload-evidence', file, 'evidence');
};

export const getMyReports = () => {
  console.log('[SafetyAPI] Fetching my reports');
  return authenticatedGet<Report[]>('/api/reports/my-reports');
};

// ============================================
// WHATSAPP INTEGRATION
// ============================================

export const openWhatsAppShare = (message: string, phoneNumber?: string) => {
  const encodedMessage = encodeURIComponent(message);
  let url = `whatsapp://send?text=${encodedMessage}`;
  
  if (phoneNumber) {
    // Remove any non-numeric characters and add country code if needed
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const fullNumber = cleanNumber.startsWith('263') ? cleanNumber : `263${cleanNumber}`;
    url = `whatsapp://send?phone=${fullNumber}&text=${encodedMessage}`;
  }
  
  console.log('[SafetyAPI] Opening WhatsApp with message');
  return url;
};
