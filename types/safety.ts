
/**
 * Trust & Safety Types for ZimCommute
 */

export interface VerificationDocument {
  id: string;
  userId: string;
  documentType: 'national_id_front' | 'national_id_back' | 'drivers_license' | 'vehicle_registration' | 'selfie';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

export interface VerificationStatus {
  verificationLevel: 'phone' | 'id_pending' | 'verified';
  requiredDocuments: string[];
  uploadedDocuments: string[];
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  bookingId: string;
  rideId: string;
  raterId: string;
  ratedUserId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  raterName?: string;
}

export interface UserRatings {
  averageRating: number;
  totalRatings: number;
  ratings: Rating[];
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  rideId?: string;
  bookingId?: string;
  category: 'safety' | 'vehicle' | 'behavior' | 'payment';
  description: string;
  evidenceUrls?: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  reportedUserName?: string;
}

export interface SOSAlert {
  id: string;
  userId: string;
  rideId?: string;
  locationLat?: number;
  locationLng?: number;
  status: 'active' | 'resolved' | 'false_alarm';
  createdAt: string;
  resolvedAt?: string;
}

export interface ShareRideLink {
  shareLink: string;
  whatsappMessage: string;
}

export interface SharedRideDetails {
  ride: {
    id: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
  };
  driver: {
    fullName: string;
    phoneNumber?: string;
    verificationLevel: string;
  };
  passenger?: {
    fullName: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  estimatedArrival?: string;
}
