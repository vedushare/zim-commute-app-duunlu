import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { and, eq, gt } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { sendOTPSMS } from '../utils/sms.js';

const OTP_EXPIRATION_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

      await app.db.insert(schema.otpVerifications).values({
        phoneNumber,
        otp,
        expiresAt,
      });

      try {
        await sendOTPSMS(otp, phoneNumber);
      } catch (err) {
        console.error('[OTP] Failed to send SMS:', err);
      }

      return { success: true, message: 'OTP sent' };
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

      const existingUser = await app.db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phoneNumber),
      });

      if (!existingUser) {
        await app.db.insert(schema.users).values({ phoneNumber });
      }

      return { success: true, message: 'OTP verified' };
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

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

      await app.db.insert(schema.otpVerifications).values({
        phoneNumber,
        otp,
        expiresAt,
      });

      try {
        await sendOTPSMS(otp, phoneNumber);
      } catch (err) {
        console.error('[OTP] Failed to send SMS:', err);
      }

      return { success: true, message: 'OTP resent' };
    }
  );
}

