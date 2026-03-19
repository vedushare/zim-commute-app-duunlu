import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { and, eq, gt, gte, count } from 'drizzle-orm';
import crypto from 'node:crypto';
import * as schema from '../db/schema.js';
import * as authSchema from '../db/auth-schema.js';
import type { App } from '../index.js';
import { sendOTPSMS } from '../utils/sms.js';

const OTP_EXPIRATION_MS = 10 * 60 * 1000;
const OTP_EXPIRATION_SECONDS = OTP_EXPIRATION_MS / 1000;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SESSION_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Valid Zimbabwe phone numbers: +263/0/263 followed by 7X XXXXXXX
const ZIMBABWE_PHONE_REGEX = /^(?:\+263|0|263)7(?:1|3|7|8)[0-9]{7}$/;

function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function isValidZimbabwePhone(phoneNumber: string): boolean {
  return ZIMBABWE_PHONE_REGEX.test(phoneNumber);
}

async function checkOTPRateLimit(
  app: App,
  phoneNumber: string
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - OTP_RATE_WINDOW_MS);
  const [{ value: recentCount }] = await app.db
    .select({ value: count() })
    .from(schema.otpVerifications)
    .where(
      and(
        eq(schema.otpVerifications.phoneNumber, phoneNumber),
        gte(schema.otpVerifications.createdAt, oneHourAgo)
      )
    );
  return recentCount >= OTP_RATE_LIMIT;
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/otp/send - Send a new OTP to a phone number
  fastify.post(
    '/api/otp/send',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { phoneNumber } = request.body as { phoneNumber?: string };

      if (!phoneNumber) {
        return reply.status(400).send({ success: false, message: 'Phone number is required' });
      }

      if (!isValidZimbabwePhone(phoneNumber)) {
        return reply.status(400).send({ success: false, message: 'Invalid phone number format. Must be a valid Zimbabwe number.' });
      }

      // Rate limit: max OTP_RATE_LIMIT requests per OTP_RATE_WINDOW_MS per phone number
      if (await checkOTPRateLimit(app, phoneNumber)) {
        return reply.status(429).send({ success: false, message: 'Too many OTP requests. Please try again later.' });
      }

      // Expire any existing unverified OTPs for this phone before creating a new one
      await app.db
        .update(schema.otpVerifications)
        .set({ expiresAt: new Date() })
        .where(
          and(
            eq(schema.otpVerifications.phoneNumber, phoneNumber),
            eq(schema.otpVerifications.verified, false),
            gt(schema.otpVerifications.expiresAt, new Date())
          )
        );

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

      // TODO: hash OTPs before storing
      await app.db.insert(schema.otpVerifications).values({
        phoneNumber,
        otp,
        expiresAt,
      });

      let smsStatus: 'sent' | 'disabled' | 'test_mode' | 'connection_error' | 'provider_error';
      let message = 'OTP sent';
      try {
        smsStatus = await sendOTPSMS(otp, phoneNumber);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[OTP] Failed to send SMS:', err);
        smsStatus = errMsg.toLowerCase().includes('connect') ? 'connection_error' : 'provider_error';
        message = errMsg;
      }

      return { success: true, message, smsStatus, expiresIn: OTP_EXPIRATION_SECONDS };
    }
  );

  // POST /api/otp/verify - Verify an OTP for a phone number
  fastify.post(
    '/api/otp/verify',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { phoneNumber, otp } = request.body as { phoneNumber?: string; otp?: string };

      if (!phoneNumber || !otp) {
        return reply.status(400).send({ success: false, message: 'Phone number and OTP are required' });
      }

      if (!isValidZimbabwePhone(phoneNumber)) {
        return reply.status(400).send({ success: false, message: 'Invalid phone number format. Must be a valid Zimbabwe number.' });
      }

      const record = await app.db.query.otpVerifications.findFirst({
        where: and(
          eq(schema.otpVerifications.phoneNumber, phoneNumber),
          eq(schema.otpVerifications.verified, false),
          gt(schema.otpVerifications.expiresAt, new Date())
        ),
      });

      if (!record) {
        return reply.status(400).send({ success: false, message: 'OTP not found or expired' });
      }

      if (record.attempts >= MAX_OTP_ATTEMPTS) {
        return reply.status(400).send({ success: false, message: 'Too many attempts' });
      }

      if (record.otp !== otp) {
        await app.db
          .update(schema.otpVerifications)
          .set({ attempts: record.attempts + 1 })
          .where(eq(schema.otpVerifications.id, record.id));
        return reply.status(400).send({ success: false, message: 'Invalid OTP' });
      }

      await app.db
        .update(schema.otpVerifications)
        .set({ verified: true })
        .where(eq(schema.otpVerifications.id, record.id));

      // Find or create the app user
      let user = await app.db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phoneNumber),
      });

      if (!user) {
        const [newUser] = await app.db.insert(schema.users).values({ phoneNumber }).returning();
        user = newUser;
      }

      // Ensure a corresponding better-auth user record exists (required for session foreign key)
      const placeholderEmail = `phone+${phoneNumber.replace(/[^a-zA-Z0-9]/g, '')}@noreply.zimcommute.app`;
      await app.db
        .insert(authSchema.user)
        .values({
          id: user.id,
          name: phoneNumber,
          email: placeholderEmail,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();

      // Generate a session token and persist it
      const token = crypto.randomBytes(32).toString('hex');
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_MS);

      await app.db.insert(authSchema.session).values({
        id: sessionId,
        token,
        userId: user.id,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          fullName: user.fullName,
          email: user.email,
          profilePhotoUrl: user.profilePhotoUrl,
          userType: user.userType,
          homeCity: user.homeCity,
          verificationLevel: user.verificationLevel,
          role: user.role,
          walletBalance: user.walletBalance,
          isBanned: user.isBanned,
          banReason: user.banReason,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      };
    }
  );

  // POST /api/otp/resend - Resend OTP to a phone number
  fastify.post(
    '/api/otp/resend',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { phoneNumber } = request.body as { phoneNumber?: string };

      if (!phoneNumber) {
        return reply.status(400).send({ success: false, message: 'Phone number is required' });
      }

      if (!isValidZimbabwePhone(phoneNumber)) {
        return reply.status(400).send({ success: false, message: 'Invalid phone number format. Must be a valid Zimbabwe number.' });
      }

      // Rate limit: max OTP_RATE_LIMIT requests per OTP_RATE_WINDOW_MS per phone number
      if (await checkOTPRateLimit(app, phoneNumber)) {
        return reply.status(429).send({ success: false, message: 'Too many OTP requests. Please try again later.' });
      }

      // Expire any existing unverified OTPs for this phone before creating a new one
      await app.db
        .update(schema.otpVerifications)
        .set({ expiresAt: new Date() })
        .where(
          and(
            eq(schema.otpVerifications.phoneNumber, phoneNumber),
            eq(schema.otpVerifications.verified, false),
            gt(schema.otpVerifications.expiresAt, new Date())
          )
        );

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

      // TODO: hash OTPs before storing
      await app.db.insert(schema.otpVerifications).values({
        phoneNumber,
        otp,
        expiresAt,
      });

      let smsStatus: 'sent' | 'disabled' | 'test_mode' | 'connection_error' | 'provider_error';
      let message = 'OTP resent';
      try {
        smsStatus = await sendOTPSMS(otp, phoneNumber);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[OTP] Failed to send SMS:', err);
        smsStatus = errMsg.toLowerCase().includes('connect') ? 'connection_error' : 'provider_error';
        message = errMsg;
      }

      return { success: true, message, smsStatus, expiresIn: OTP_EXPIRATION_SECONDS };
    }
  );
}

