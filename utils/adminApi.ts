
/**
 * Admin API Client for ZimCommute
 * 
 * This module provides API functions for admin operations.
 * All endpoints require admin or super_admin role.
 */

import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, BACKEND_URL } from './api';
import type {
  DashboardMetrics,
  AnalyticsData,
  AdminUser,
  AdminUserDetails,
  VerificationDocument,
  AdminRide,
  AdminReport,
  SOSAlert,
  RouteConfig,
  PricingTemplate,
  PromoCode,
  AuditLog,
  PaginatedResponse,
} from '@/types/admin';

// Dashboard
export const getDashboardMetrics = () =>
  authenticatedGet<DashboardMetrics>('/api/admin/dashboard/metrics');

export const getDashboardAnalytics = (period: 'daily' | 'weekly' | 'monthly' = 'daily') =>
  authenticatedGet<AnalyticsData>(`/api/admin/dashboard/analytics?period=${period}`);

// User Management
export const getAdminUsers = (params: {
  search?: string;
  page?: number;
  limit?: number;
  role?: 'all' | 'user' | 'driver' | 'passenger';
  status?: 'all' | 'active' | 'banned';
}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.role) queryParams.append('role', params.role);
  if (params.status) queryParams.append('status', params.status);
  
  return authenticatedGet<PaginatedResponse<AdminUser>>(
    `/api/admin/users?${queryParams.toString()}`
  );
};

export const getAdminUserDetails = (userId: string) =>
  authenticatedGet<AdminUserDetails>(`/api/admin/users/${userId}`);

export const createUser = (data: {
  phoneNumber: string;
  fullName?: string;
  email?: string;
  userType?: 'Passenger' | 'Driver';
  homeCity?: string;
  verificationLevel?: 'PhoneVerified' | 'IDUploaded' | 'FullyVerified';
}) =>
  authenticatedPost<{ success: boolean; user: AdminUser }>('/api/admin/users', data);

export const updateUser = (userId: string, data: {
  fullName?: string;
  email?: string;
  userType?: 'Passenger' | 'Driver';
  homeCity?: string;
  verificationLevel?: 'PhoneVerified' | 'IDUploaded' | 'FullyVerified';
}) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/users/${userId}`, data);

export const getUserOTP = (userId: string) =>
  authenticatedGet<{
    success: boolean;
    otp: string;
    phoneNumber: string;
    expiresAt: string;
    verified: boolean;
    attempts: number;
    createdAt: string;
  }>(`/api/admin/users/${userId}/otp`);

export const banUser = (userId: string, reason: string) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/users/${userId}/ban`, { reason });

export const unbanUser = (userId: string) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/users/${userId}/unban`, {});

export const adjustUserWallet = (userId: string, amount: number, reason: string) =>
  authenticatedPut<{ newBalance: number }>(`/api/admin/users/${userId}/wallet`, {
    amount,
    reason,
  });

export const updateUserRole = (userId: string, role: 'user' | 'admin' | 'super_admin') =>
  authenticatedPut<{ success: boolean }>(`/api/admin/users/${userId}/role`, { role });

// Verification Management
export const getVerificationQueue = (params: {
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  return authenticatedGet<PaginatedResponse<VerificationDocument>>(
    `/api/admin/verification/queue?${queryParams.toString()}`
  );
};

export const approveVerificationDocument = (documentId: string) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/verification/${documentId}/approve`, {});

export const rejectVerificationDocument = (documentId: string, reason: string) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/verification/${documentId}/reject`, {
    reason,
  });

// Ride Management
export const getAdminRides = (params: {
  status?: 'all' | 'active' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
  date?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.date) queryParams.append('date', params.date);
  
  return authenticatedGet<PaginatedResponse<AdminRide>>(
    `/api/admin/rides?${queryParams.toString()}`
  );
};

export const cancelRide = (rideId: string, reason: string) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/rides/${rideId}/cancel`, { reason });

export const adjustRidePrice = (rideId: string, newPrice: number, reason: string) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/rides/${rideId}/adjust-price`, {
    newPrice,
    reason,
  });

// Safety Moderation
export const getAdminReports = (params: {
  status?: 'pending' | 'reviewed' | 'resolved';
  category?: 'all' | 'Safety' | 'Vehicle' | 'Behavior' | 'Payment';
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  return authenticatedGet<PaginatedResponse<AdminReport>>(
    `/api/admin/reports?${queryParams.toString()}`
  );
};

export const reviewReport = (
  reportId: string,
  status: 'reviewed' | 'resolved',
  adminNotes: string,
  action?: 'ban_user' | 'warn_user' | 'none'
) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/reports/${reportId}/review`, {
    status,
    adminNotes,
    action,
  });

export const getSOSAlerts = (status?: 'active' | 'resolved') => {
  const queryParams = status ? `?status=${status}` : '';
  return authenticatedGet<{ alerts: SOSAlert[] }>(`/api/admin/sos-alerts${queryParams}`);
};

export const resolveSOSAlert = (alertId: string, notes: string) =>
  authenticatedPut<{ success: boolean }>(`/api/admin/sos-alerts/${alertId}/resolve`, { notes });

// Configuration - Routes
export const getRoutes = () =>
  authenticatedGet<RouteConfig[]>('/api/admin/routes');

export const createRoute = (data: {
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  suggestedPrice: number;
  isPopular: boolean;
}) =>
  authenticatedPost<RouteConfig>('/api/admin/routes', data);

export const updateRoute = (routeId: string, data: {
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  suggestedPrice: number;
  isPopular: boolean;
}) =>
  authenticatedPut<RouteConfig>(`/api/admin/routes/${routeId}`, data);

export const deleteRoute = (routeId: string) =>
  authenticatedDelete<{ success: boolean }>(`/api/admin/routes/${routeId}`);

// Configuration - Pricing Templates
export const getPricingTemplates = () =>
  authenticatedGet<PricingTemplate[]>('/api/admin/pricing-templates');

export const createPricingTemplate = (data: {
  name: string;
  basePrice: number;
  pricePerKm: number;
  commissionRate: number;
}) =>
  authenticatedPost<PricingTemplate>('/api/admin/pricing-templates', data);

export const updatePricingTemplate = (templateId: string, data: {
  name: string;
  basePrice: number;
  pricePerKm: number;
  commissionRate: number;
  isActive: boolean;
}) =>
  authenticatedPut<PricingTemplate>(`/api/admin/pricing-templates/${templateId}`, data);

// Configuration - Promo Codes
export const getPromoCodes = () =>
  authenticatedGet<PromoCode[]>('/api/admin/promo-codes');

export const createPromoCode = (data: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
}) =>
  authenticatedPost<PromoCode>('/api/admin/promo-codes', data);

export const updatePromoCode = (promoId: string, data: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}) =>
  authenticatedPut<PromoCode>(`/api/admin/promo-codes/${promoId}`, data);

export const deletePromoCode = (promoId: string) =>
  authenticatedDelete<{ success: boolean }>(`/api/admin/promo-codes/${promoId}`);

// Audit Logs
export const getAuditLogs = (params: {
  adminId?: string;
  action?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params.adminId) queryParams.append('adminId', params.adminId);
  if (params.action) queryParams.append('action', params.action);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  return authenticatedGet<PaginatedResponse<AuditLog>>(
    `/api/admin/audit-logs?${queryParams.toString()}`
  );
};

// Initialize Zimbabwe Routes
export const initializeRoutes = () =>
  authenticatedPost<{ success: boolean; message: string }>('/api/admin/init-routes', {});

// Export Functions (Web only)
export const exportUsers = () => {
  if (typeof window !== 'undefined') {
    window.open(`${BACKEND_URL}/api/admin/export/users?format=csv`, '_blank');
  }
};

export const exportRides = (startDate?: string, endDate?: string) => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams({ format: 'csv' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    window.open(`${BACKEND_URL}/api/admin/export/rides?${params.toString()}`, '_blank');
  }
};

export const exportRevenue = (startDate?: string, endDate?: string) => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams({ format: 'csv' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    window.open(`${BACKEND_URL}/api/admin/export/revenue?${params.toString()}`, '_blank');
  }
};
