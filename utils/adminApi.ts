
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './api';
import type { AdminUser, DashboardMetrics, AdminReport, VerificationDocument, PromoCode, PricingTemplate, RouteConfig } from '@/types/admin';

// Dashboard
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await authenticatedGet('/api/admin/dashboard/metrics');
  return response;
}

// Users Management
export async function getAdminUsers(page: number = 1, limit: number = 20, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (search) {
    params.append('search', search);
  }
  
  const response = await authenticatedGet(`/api/admin/users?${params.toString()}`);
  return response;
}

export async function banUser(userId: string, reason: string) {
  const response = await authenticatedPost(`/api/admin/users/${userId}/ban`, { reason });
  return response;
}

export async function unbanUser(userId: string) {
  const response = await authenticatedPost(`/api/admin/users/${userId}/unban`, {});
  return response;
}

export async function adjustUserWallet(userId: string, amount: number, reason: string) {
  const response = await authenticatedPost(`/api/admin/users/${userId}/wallet`, { amount, reason });
  return response;
}

export async function getUserOTP(userId: string) {
  const response = await authenticatedGet(`/api/admin/users/${userId}/otp`);
  return response;
}

export async function sendUserOTP(userId: string) {
  const response = await authenticatedPost(`/api/admin/users/${userId}/otp/send`, {});
  return response;
}

export async function createUser(userData: {
  phoneNumber: string;
  fullName?: string;
  email?: string;
  userType?: 'Passenger' | 'Driver';
  homeCity?: string;
  role?: 'user' | 'admin' | 'super_admin';
}) {
  const response = await authenticatedPost('/api/admin/users', userData);
  return response;
}

export async function updateUser(userId: string, userData: {
  fullName?: string;
  email?: string;
  userType?: 'Passenger' | 'Driver';
  homeCity?: string;
  role?: 'user' | 'admin' | 'super_admin';
}) {
  const response = await authenticatedPut(`/api/admin/users/${userId}`, userData);
  return response;
}

export async function deleteUser(userId: string) {
  const response = await authenticatedDelete(`/api/admin/users/${userId}`);
  return response;
}

// Reports Management
export async function getAdminReports(status?: string) {
  const params = status ? `?status=${status}` : '';
  const response = await authenticatedGet(`/api/admin/reports${params}`);
  return response;
}

export async function reviewReport(reportId: string, status: string, adminNotes?: string) {
  const response = await authenticatedPost(`/api/admin/reports/${reportId}/review`, {
    status,
    adminNotes,
  });
  return response;
}

// Verification Queue
export async function getVerificationQueue() {
  const response = await authenticatedGet('/api/admin/verification/queue');
  return response;
}

export async function approveVerificationDocument(documentId: string) {
  const response = await authenticatedPost(`/api/admin/verification/${documentId}/approve`, {});
  return response;
}

export async function rejectVerificationDocument(documentId: string, reason: string) {
  const response = await authenticatedPost(`/api/admin/verification/${documentId}/reject`, {
    reason,
  });
  return response;
}

// Promo Codes
export async function getPromoCodes() {
  const response = await authenticatedGet('/api/admin/promo-codes');
  return response;
}

export async function createPromoCode(promoData: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
}) {
  const response = await authenticatedPost('/api/admin/promo-codes', promoData);
  return response;
}

export async function updatePromoCode(promoId: string, promoData: {
  code?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}) {
  const response = await authenticatedPut(`/api/admin/promo-codes/${promoId}`, promoData);
  return response;
}

export async function deletePromoCode(promoId: string) {
  const response = await authenticatedDelete(`/api/admin/promo-codes/${promoId}`);
  return response;
}

// Pricing Templates
export async function getPricingTemplates() {
  const response = await authenticatedGet('/api/admin/pricing-templates');
  return response;
}

export async function createPricingTemplate(templateData: {
  name: string;
  basePrice: number;
  pricePerKm: number;
  commissionRate: number;
}) {
  const response = await authenticatedPost('/api/admin/pricing-templates', templateData);
  return response;
}

export async function updatePricingTemplate(templateId: string, templateData: {
  name?: string;
  basePrice?: number;
  pricePerKm?: number;
  commissionRate?: number;
  isActive?: boolean;
}) {
  const response = await authenticatedPut(`/api/admin/pricing-templates/${templateId}`, templateData);
  return response;
}

export async function deletePricingTemplate(templateId: string) {
  const response = await authenticatedDelete(`/api/admin/pricing-templates/${templateId}`);
  return response;
}

// Routes Configuration
export async function getRoutes() {
  const response = await authenticatedGet('/api/admin/routes');
  return response;
}

export async function createRoute(routeData: {
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  suggestedPrice: number;
  isPopular?: boolean;
}) {
  const response = await authenticatedPost('/api/admin/routes', routeData);
  return response;
}

export async function updateRoute(routeId: string, routeData: {
  origin?: string;
  destination?: string;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  suggestedPrice?: number;
  isPopular?: boolean;
}) {
  const response = await authenticatedPut(`/api/admin/routes/${routeId}`, routeData);
  return response;
}

export async function deleteRoute(routeId: string) {
  const response = await authenticatedDelete(`/api/admin/routes/${routeId}`);
  return response;
}

export async function initializeRoutes() {
  const response = await authenticatedPost('/api/admin/routes/initialize', {});
  return response;
}

// Audit Logs
export async function getAuditLogs(page: number = 1, limit: number = 50) {
  const response = await authenticatedGet(`/api/admin/audit-logs?page=${page}&limit=${limit}`);
  return response;
}

// SOS Alerts
export async function getSOSAlerts(status?: 'active' | 'resolved') {
  const params = status ? `?status=${status}` : '';
  const response = await authenticatedGet(`/api/admin/sos-alerts${params}`);
  return response;
}

export async function resolveSOSAlert(alertId: string) {
  const response = await authenticatedPost(`/api/admin/sos-alerts/${alertId}/resolve`, {});
  return response;
}

// Rides Management
export async function getAdminRides(status?: string, page: number = 1, limit: number = 20) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (status) {
    params.append('status', status);
  }
  
  const response = await authenticatedGet(`/api/admin/rides?${params.toString()}`);
  return response;
}

export async function cancelRide(rideId: string, reason: string) {
  const response = await authenticatedPost(`/api/admin/rides/${rideId}/cancel`, { reason });
  return response;
}

// SMS Configuration
export async function getSMSConfig() {
  const response = await authenticatedGet('/api/admin/sms-config');
  return response;
}

export async function updateSMSConfig(configData: {
  apiUrl: string;
  apiKey: string;
  senderId: string;
  enabled: boolean;
  testMode: boolean;
}) {
  const response = await authenticatedPost('/api/admin/sms-config', configData);
  return response;
}

export async function sendTestSMS(phoneNumber: string) {
  const response = await authenticatedPost('/api/admin/sms-config/test', { phoneNumber });
  return response;
}
