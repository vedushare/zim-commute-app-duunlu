import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

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
