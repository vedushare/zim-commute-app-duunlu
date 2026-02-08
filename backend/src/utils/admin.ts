import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

/**
 * Check if user has admin role
 */
export async function isAdminUser(app: App, userId: string): Promise<boolean> {
  const user = await app.db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  return user ? (user.role === 'admin' || user.role === 'super_admin') : false;
}

/**
 * Check if user has super admin role
 */
export async function isSuperAdmin(app: App, userId: string): Promise<boolean> {
  const user = await app.db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  return user ? user.role === 'super_admin' : false;
}

/**
 * Log admin action to audit trail
 */
export async function logAdminAction(
  app: App,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: any
): Promise<void> {
  try {
    await app.db.insert(schema.adminAuditLogs).values({
      adminId,
      action,
      targetType,
      targetId,
      details: details || null,
    });
  } catch (error) {
    app.logger.error(
      { err: error, adminId, action },
      'Failed to log admin action'
    );
  }
}

/**
 * Zimbabwe routes data
 */
export const ZIMBABWE_ROUTES = [
  {
    origin: 'Harare',
    destination: 'Bulawayo',
    distanceKm: 440,
    estimatedDurationMinutes: 360,
    suggestedPrice: 25,
    isPopular: true,
  },
  {
    origin: 'Harare',
    destination: 'Mutare',
    distanceKm: 265,
    estimatedDurationMinutes: 210,
    suggestedPrice: 18,
    isPopular: true,
  },
  {
    origin: 'Harare',
    destination: 'Gweru',
    distanceKm: 275,
    estimatedDurationMinutes: 180,
    suggestedPrice: 16,
    isPopular: true,
  },
  {
    origin: 'Bulawayo',
    destination: 'Victoria Falls',
    distanceKm: 440,
    estimatedDurationMinutes: 360,
    suggestedPrice: 28,
    isPopular: true,
  },
  {
    origin: 'Harare',
    destination: 'Masvingo',
    distanceKm: 290,
    estimatedDurationMinutes: 240,
    suggestedPrice: 17,
    isPopular: true,
  },
  {
    origin: 'Harare',
    destination: 'Chitungwiza',
    distanceKm: 25,
    estimatedDurationMinutes: 30,
    suggestedPrice: 3,
    isPopular: false,
  },
  {
    origin: 'Bulawayo',
    destination: 'Gweru',
    distanceKm: 165,
    estimatedDurationMinutes: 120,
    suggestedPrice: 12,
    isPopular: false,
  },
  {
    origin: 'Mutare',
    destination: 'Chimanimani',
    distanceKm: 135,
    estimatedDurationMinutes: 150,
    suggestedPrice: 10,
    isPopular: false,
  },
  {
    origin: 'Harare',
    destination: 'Kariba',
    distanceKm: 365,
    estimatedDurationMinutes: 300,
    suggestedPrice: 22,
    isPopular: false,
  },
  {
    origin: 'Harare',
    destination: 'Chinhoyi',
    distanceKm: 120,
    estimatedDurationMinutes: 90,
    suggestedPrice: 8,
    isPopular: false,
  },
];

/**
 * Default pricing template
 */
export const DEFAULT_PRICING_TEMPLATE = {
  name: 'Standard Pricing',
  basePrice: 2.0,
  pricePerKm: 0.15,
  commissionRate: 15,
  isActive: true,
};
