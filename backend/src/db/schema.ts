import { pgTable, uuid, text, timestamp, boolean, integer, decimal, jsonb, foreignKey } from 'drizzle-orm/pg-core';

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
