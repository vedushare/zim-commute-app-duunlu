import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gt } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

// Zimbabwe phone format validation
const ZIMBABWE_PHONE_REGEX = /^(?:\+263|0)7(?:1|3|7|8)[0-9]{7}$/;

// Rate limiting store: { phoneNumber: { count: number; resetTime: number } }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Helper function to check rate limit
function checkRateLimit(phoneNumber: string, maxAttempts: number = 3): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(phoneNumber);

  if (!record) {
    rateLimitStore.set(phoneNumber, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }

  if (now >= record.resetTime) {
    rateLimitStore.set(phoneNumber, { count: 1, resetTime: now + 3600000 });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

// Helper function to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to normalize phone number to +263 format
function normalizePhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('0')) {
    return '+263' + phoneNumber.slice(1);
  }
  return phoneNumber;
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/otp/send - Send OTP to phone number
  fastify.post<{ Body: { phoneNumber?: string } }>(
    '/api/otp/send',
    {
      schema: {
        description: 'Send OTP to phone number',
        tags: ['otp'],
        body: {
          type: 'object',
          properties: {
            phoneNumber: { type: 'string', description: 'Zimbabwe phone number' },
          },
          required: ['phoneNumber'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              expiresIn: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { phoneNumber } = request.body as { phoneNumber?: string };

      if (!phoneNumber) {
        app.logger.warn({}, 'Missing phoneNumber in request body');
        return reply.status(400).send({
          success: false,
          message: 'Phone number is required',
        });
      }

      app.logger.info(
        { phoneNumber },
        'OTP send request received'
      );

      // Validate phone number format
      if (!ZIMBABWE_PHONE_REGEX.test(phoneNumber)) {
        app.logger.warn(
          { phoneNumber },
          'Invalid phone number format'
        );
        return reply.status(400).send({
          success: false,
          message: 'Invalid Zimbabwe phone number format. Expected format: +263... or 07...',
        });
      }

      // Check rate limit
      if (!checkRateLimit(phoneNumber, 3)) {
        app.logger.warn(
          { phoneNumber },
          'Rate limit exceeded for OTP send'
        );
        return reply.status(429).send({
          success: false,
          message: 'Too many OTP requests. Please try again later.',
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      try {
        // Store OTP in database
        await app.db.insert(schema.otpVerifications).values({
          phoneNumber: normalizedPhone,
          otp,
          expiresAt,
          verified: false,
          attempts: 0,
        });

        app.logger.info(
          { phoneNumber: normalizedPhone, expiresAt },
          'OTP generated and stored successfully'
        );

        return {
          success: true,
          message: 'OTP sent successfully',
          expiresIn: 300, // 5 minutes in seconds
        };
      } catch (error) {
        app.logger.error(
          { err: error, phoneNumber: normalizedPhone },
          'Failed to send OTP'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to send OTP. Please try again.',
        });
      }
    }
  );

  // POST /api/otp/verify - Verify OTP and create/update user
  fastify.post<{ Body: { phoneNumber?: string; otp?: string } }>(
    '/api/otp/verify',
    {
      schema: {
        description: 'Verify OTP and authenticate user',
        tags: ['otp'],
        body: {
          type: 'object',
          properties: {
            phoneNumber: { type: 'string' },
            otp: { type: 'string' },
          },
          required: ['phoneNumber', 'otp'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  phoneNumber: { type: 'string' },
                  fullName: { type: ['string', 'null'] },
                  email: { type: ['string', 'null'] },
                  profilePhotoUrl: { type: ['string', 'null'] },
                  userType: { type: ['string', 'null'] },
                  homeCity: { type: ['string', 'null'] },
                  verificationLevel: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { phoneNumber, otp } = request.body as { phoneNumber?: string; otp?: string };

      if (!phoneNumber || !otp) {
        app.logger.warn({}, 'Missing phoneNumber or otp in request body');
        return reply.status(400).send({
          success: false,
          message: 'Phone number and OTP are required',
        });
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      app.logger.info(
        { phoneNumber: normalizedPhone },
        'OTP verification request received'
      );

      // Validate phone number format
      if (!ZIMBABWE_PHONE_REGEX.test(phoneNumber)) {
        app.logger.warn(
          { phoneNumber },
          'Invalid phone number format in verification'
        );
        return reply.status(400).send({
          success: false,
          message: 'Invalid Zimbabwe phone number format',
        });
      }

      try {
        // Find the most recent OTP for this phone number
        const otpRecord = await app.db.query.otpVerifications.findFirst({
          where: eq(schema.otpVerifications.phoneNumber, normalizedPhone),
          orderBy: (otp_verifications, { desc }) => [desc(otp_verifications.createdAt)],
        });

        if (!otpRecord) {
          app.logger.warn(
            { phoneNumber: normalizedPhone },
            'OTP record not found'
          );
          return reply.status(400).send({
            success: false,
            message: 'OTP not found. Please request a new OTP.',
          });
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
          app.logger.warn(
            { phoneNumber: normalizedPhone, expiresAt: otpRecord.expiresAt },
            'OTP expired'
          );
          return reply.status(400).send({
            success: false,
            message: 'OTP has expired. Please request a new one.',
          });
        }

        // Check attempt limit
        if (otpRecord.attempts >= 5) {
          app.logger.warn(
            { phoneNumber: normalizedPhone, attempts: otpRecord.attempts },
            'OTP attempt limit exceeded'
          );
          return reply.status(400).send({
            success: false,
            message: 'Maximum OTP attempts exceeded. Please request a new OTP.',
          });
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
          // Increment attempts
          await app.db
            .update(schema.otpVerifications)
            .set({ attempts: otpRecord.attempts + 1 })
            .where(eq(schema.otpVerifications.id, otpRecord.id));

          app.logger.warn(
            { phoneNumber: normalizedPhone, attempts: otpRecord.attempts + 1 },
            'Invalid OTP provided'
          );
          return reply.status(400).send({
            success: false,
            message: 'Invalid OTP. Please try again.',
          });
        }

        // Mark OTP as verified
        await app.db
          .update(schema.otpVerifications)
          .set({ verified: true })
          .where(eq(schema.otpVerifications.id, otpRecord.id));

        // Check if user exists
        let user = await app.db.query.users.findFirst({
          where: eq(schema.users.phoneNumber, normalizedPhone),
        });

        if (!user) {
          // Create new user
          const [newUser] = await app.db
            .insert(schema.users)
            .values({
              phoneNumber: normalizedPhone,
              verificationLevel: 'PhoneVerified',
            })
            .returning();

          user = newUser;
          app.logger.info(
            { userId: user.id, phoneNumber: normalizedPhone },
            'New user created'
          );
        } else {
          // Update existing user to PhoneVerified if needed
          if (user.verificationLevel === undefined) {
            await app.db
              .update(schema.users)
              .set({ verificationLevel: 'PhoneVerified' })
              .where(eq(schema.users.id, user.id));
            user = { ...user, verificationLevel: 'PhoneVerified' };
          }
          app.logger.info(
            { userId: user.id, phoneNumber: normalizedPhone },
            'Existing user verified'
          );
        }

        return {
          success: true,
          user: {
            id: user.id,
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            email: user.email,
            profilePhotoUrl: user.profilePhotoUrl,
            userType: user.userType,
            homeCity: user.homeCity,
            verificationLevel: user.verificationLevel,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        app.logger.error(
          { err: error, phoneNumber: normalizedPhone },
          'Failed to verify OTP'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to verify OTP. Please try again.',
        });
      }
    }
  );

  // POST /api/otp/resend - Resend OTP
  fastify.post<{ Body: { phoneNumber?: string } }>(
    '/api/otp/resend',
    {
      schema: {
        description: 'Resend OTP to phone number',
        tags: ['otp'],
        body: {
          type: 'object',
          properties: {
            phoneNumber: { type: 'string' },
          },
          required: ['phoneNumber'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { phoneNumber } = request.body as { phoneNumber?: string };

      if (!phoneNumber) {
        app.logger.warn({}, 'Missing phoneNumber in resend request body');
        return reply.status(400).send({
          success: false,
          message: 'Phone number is required',
        });
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      app.logger.info(
        { phoneNumber: normalizedPhone },
        'OTP resend request received'
      );

      // Validate phone number format
      if (!ZIMBABWE_PHONE_REGEX.test(phoneNumber)) {
        app.logger.warn(
          { phoneNumber },
          'Invalid phone number format in resend'
        );
        return reply.status(400).send({
          success: false,
          message: 'Invalid Zimbabwe phone number format',
        });
      }

      // Check rate limit
      if (!checkRateLimit(phoneNumber, 3)) {
        app.logger.warn(
          { phoneNumber: normalizedPhone },
          'Rate limit exceeded for OTP resend'
        );
        return reply.status(429).send({
          success: false,
          message: 'Too many resend requests. Please try again later.',
        });
      }

      try {
        // Invalidate previous OTP
        const oldOtp = await app.db.query.otpVerifications.findFirst({
          where: eq(schema.otpVerifications.phoneNumber, normalizedPhone),
          orderBy: (otp_verifications, { desc }) => [desc(otp_verifications.createdAt)],
        });

        if (oldOtp) {
          await app.db
            .delete(schema.otpVerifications)
            .where(eq(schema.otpVerifications.id, oldOtp.id));
          app.logger.info(
            { phoneNumber: normalizedPhone },
            'Previous OTP invalidated'
          );
        }

        // Generate new OTP
        const newOtp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await app.db.insert(schema.otpVerifications).values({
          phoneNumber: normalizedPhone,
          otp: newOtp,
          expiresAt,
          verified: false,
          attempts: 0,
        });

        app.logger.info(
          { phoneNumber: normalizedPhone, expiresAt },
          'New OTP generated and stored'
        );

        return {
          success: true,
          message: 'OTP resent successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, phoneNumber: normalizedPhone },
          'Failed to resend OTP'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to resend OTP. Please try again.',
        });
      }
    }
  );
}
