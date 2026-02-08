import { pgTable, uuid, text, timestamp, boolean, integer, decimal, jsonb, foreignKey, numeric } from 'drizzle-orm/pg-core';

/**
 * Users table for phone authentication system
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text('phone_number').notNull().unique(),
  fullName: text('full_name'),
  email: text('email'),
  profilePhotoUrl: text('profile_photo_url'),
  userType: text('user_type', { enum: ['Passenger', 'Driver'] }),
  homeCity: text('home_city'),
  verificationLevel: text('verification_level', { enum: ['PhoneVerified', 'IDUploaded', 'FullyVerified'] }).notNull().default('PhoneVerified'),
  role: text('role', { enum: ['user', 'admin', 'super_admin'] }).notNull().default('user'),
  walletBalance: numeric('wallet_balance', { precision: 10, scale: 2 }).notNull().default('0'),
  isBanned: boolean('is_banned').notNull().default(false),
  banReason: text('ban_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * OTP Verifications table for phone authentication
 */
export const otpVerifications = pgTable('otp_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text('phone_number').notNull(),
  otp: text('otp').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verified: boolean('verified').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Vehicles table for ride-sharing system
 */
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  color: text('color').notNull(),
  licensePlate: text('license_plate').notNull().unique(),
  seats: integer('seats').notNull(), // 1-7
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * Rides table for ride-sharing system
 */
export const rides = pgTable('rides', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  viaPoints: jsonb('via_points'), // Array of points
  departureTime: timestamp('departure_time', { withTimezone: true }).notNull(),
  arrivalTime: timestamp('arrival_time', { withTimezone: true }).notNull(),
  totalSeats: integer('total_seats').notNull(),
  availableSeats: integer('available_seats').notNull(),
  pricePerSeat: decimal('price_per_seat', { precision: 10, scale: 2 }).notNull(),
  instantBook: boolean('instant_book').notNull().default(false),
  ladiesOnly: boolean('ladies_only').notNull().default(false),
  acceptsParcels: boolean('accepts_parcels').notNull().default(false),
  status: text('status', { enum: ['active', 'cancelled', 'completed'] }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * Bookings table for ride-sharing system
 */
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').notNull().references(() => rides.id, { onDelete: 'cascade' }),
  passengerId: uuid('passenger_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  seatsBooked: integer('seats_booked').notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'completed', 'cancelled'] }).notNull().default('pending'),
  bookingCode: text('booking_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * Verification documents table for trust and safety
 */
export const verificationDocuments = pgTable('verification_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentType: text('document_type', { enum: ['NationalID', 'Passport', 'DriversLicense', 'VehicleRegistration', 'Selfie'] }).notNull(),
  documentUrl: text('document_url').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

/**
 * Emergency contacts table
 */
export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  relationship: text('relationship').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Ratings table for driver/passenger ratings
 */
export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  rideId: uuid('ride_id').notNull().references(() => rides.id, { onDelete: 'cascade' }),
  raterId: uuid('rater_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ratedUserId: uuid('rated_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Reports table for safety reporting
 */
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reportedUserId: uuid('reported_user_id').references(() => users.id, { onDelete: 'cascade' }),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  category: text('category', { enum: ['Safety', 'Vehicle', 'Behavior', 'Payment'] }).notNull(),
  description: text('description').notNull(),
  evidenceUrls: jsonb('evidence_urls'), // Array of file URLs
  status: text('status', { enum: ['open', 'investigating', 'resolved', 'closed'] }).notNull().default('open'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * SOS alerts table
 */
export const sosAlerts = pgTable('sos_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'cascade' }),
  locationLat: numeric('location_lat', { precision: 10, scale: 7 }),
  locationLng: numeric('location_lng', { precision: 10, scale: 7 }),
  status: text('status', { enum: ['active', 'resolved'] }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

/**
 * Admin audit logs table
 */
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Promo codes table
 */
export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type', { enum: ['percentage', 'fixed'] }).notNull(),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  maxUses: integer('max_uses'),
  currentUses: integer('current_uses').notNull().default(0),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Pricing templates table
 */
export const pricingTemplates = pgTable('pricing_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  pricePerKm: numeric('price_per_km', { precision: 10, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Routes configuration table
 */
export const routesConfig = pgTable('routes_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  distanceKm: numeric('distance_km', { precision: 10, scale: 2 }).notNull(),
  estimatedDurationMinutes: integer('estimated_duration_minutes').notNull(),
  suggestedPrice: numeric('suggested_price', { precision: 10, scale: 2 }).notNull(),
  isPopular: boolean('is_popular').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
