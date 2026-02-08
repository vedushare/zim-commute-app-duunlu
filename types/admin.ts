
export interface DashboardMetrics {
  totalUsers: number;
  totalDrivers: number;
  totalPassengers: number;
  activeRidesToday: number;
  totalRevenue: number;
  verificationQueueLength: number;
  reportsQueueLength: number;
  sosAlertsActive: number;
}

export interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  rideCompletionRate: number;
  popularRoutes: Array<{ origin: string; destination: string; count: number }>;
  revenueTrends: Array<{ date: string; amount: number }>;
}

export interface AdminUser {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  email: string | null;
  profilePhotoUrl: string | null;
  userType: string | null;
  homeCity: string | null;
  verificationLevel: string;
  role: string;
  walletBalance: number;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetails extends AdminUser {
  verificationDocuments: Array<{
    id: string;
    documentType: string;
    documentUrl: string;
    status: string;
    uploadedAt: string;
  }>;
  ratings: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  bookings: Array<{
    id: string;
    rideId: string;
    status: string;
    totalPrice: number;
    createdAt: string;
  }>;
  rides: Array<{
    id: string;
    origin: string;
    destination: string;
    status: string;
    createdAt: string;
  }>;
}

export interface VerificationDocument {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
}

export interface AdminRide {
  id: string;
  driverId: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  status: string;
  createdAt: string;
  driver: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  rideId: string | null;
  bookingId: string | null;
  category: string;
  description: string;
  evidenceUrls: string[];
  status: 'pending' | 'reviewed' | 'resolved';
  adminNotes: string | null;
  createdAt: string;
  reporter: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  reportedUser?: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
}

export interface SOSAlert {
  id: string;
  userId: string;
  rideId: string | null;
  locationLat: number | null;
  locationLng: number | null;
  status: 'active' | 'resolved';
  createdAt: string;
  resolvedAt: string | null;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
}

export interface RouteConfig {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  suggestedPrice: number;
  isPopular: boolean;
  createdAt: string;
}

export interface PricingTemplate {
  id: string;
  name: string;
  basePrice: number;
  pricePerKm: number;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
  admin: {
    id: string;
    fullName: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
