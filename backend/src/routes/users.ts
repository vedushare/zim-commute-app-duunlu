import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/users/me - Get current user profile
  fastify.get(
    '/api/users/me',
    {
      schema: {
        description: 'Get current user profile',
        tags: ['users'],
        response: {
          200: {
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching user profile');

      try {
        const user = await app.db.query.users.findFirst({
          where: eq(schema.users.id, userId),
        });

        if (!user) {
          app.logger.warn({ userId }, 'User not found');
          return reply.status(404).send({
            success: false,
            message: 'User not found',
          });
        }

        app.logger.info({ userId }, 'User profile retrieved successfully');

        return {
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
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to fetch user profile'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch user profile',
        });
      }
    }
  );

  // PUT /api/users/profile - Update user profile
  fastify.put(
    '/api/users/profile',
    {
      schema: {
        description: 'Update user profile',
        tags: ['users'],
        body: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            email: { type: 'string' },
            userType: { type: 'string', enum: ['Passenger', 'Driver'] },
            homeCity: { type: 'string' },
          },
        },
        response: {
          200: {
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { fullName, email, userType, homeCity } = request.body as {
        fullName?: string;
        email?: string;
        userType?: 'Passenger' | 'Driver';
        homeCity?: string;
      };

      app.logger.info(
        { userId, fullName, email, userType, homeCity },
        'Updating user profile'
      );

      try {
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (fullName !== undefined) updateData.fullName = fullName;
        if (email !== undefined) updateData.email = email;
        if (userType !== undefined) updateData.userType = userType;
        if (homeCity !== undefined) updateData.homeCity = homeCity;

        const [updatedUser] = await app.db
          .update(schema.users)
          .set(updateData)
          .where(eq(schema.users.id, userId))
          .returning();

        app.logger.info(
          { userId, updatedFields: Object.keys(updateData) },
          'User profile updated successfully'
        );

        return {
          id: updatedUser.id,
          phoneNumber: updatedUser.phoneNumber,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          profilePhotoUrl: updatedUser.profilePhotoUrl,
          userType: updatedUser.userType,
          homeCity: updatedUser.homeCity,
          verificationLevel: updatedUser.verificationLevel,
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to update user profile'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to update user profile',
        });
      }
    }
  );

  // POST /api/users/upload-profile-photo - Upload profile photo
  fastify.post(
    '/api/users/upload-profile-photo',
    {
      schema: {
        description: 'Upload profile photo',
        tags: ['users'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              profilePhotoUrl: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Uploading profile photo');

      try {
        const data = await request.file({
          limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        });

        if (!data) {
          app.logger.warn({ userId }, 'No file provided for profile photo upload');
          return reply.status(400).send({
            success: false,
            message: 'No file provided',
          });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.warn({ userId }, 'File size exceeded limit');
          return reply.status(413).send({
            success: false,
            message: 'File too large. Maximum size is 10MB',
          });
        }

        const key = `profile-photos/${userId}/${Date.now()}-${data.filename}`;
        const uploadedKey = await app.storage.upload(key, buffer);
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        // Update user profile with photo URL
        await app.db
          .update(schema.users)
          .set({
            profilePhotoUrl: uploadedKey,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));

        app.logger.info(
          { userId, key: uploadedKey },
          'Profile photo uploaded successfully'
        );

        return {
          success: true,
          profilePhotoUrl: url,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to upload profile photo'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to upload profile photo',
        });
      }
    }
  );

  // POST /api/users/upload-id-document - Upload ID document
  fastify.post(
    '/api/users/upload-id-document',
    {
      schema: {
        description: 'Upload ID document for verification',
        tags: ['users'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              verificationLevel: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Uploading ID document');

      try {
        const data = await request.file({
          limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit for documents
        });

        if (!data) {
          app.logger.warn({ userId }, 'No file provided for ID document upload');
          return reply.status(400).send({
            success: false,
            message: 'No file provided',
          });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.warn({ userId }, 'Document file size exceeded limit');
          return reply.status(413).send({
            success: false,
            message: 'File too large. Maximum size is 15MB',
          });
        }

        const key = `id-documents/${userId}/${Date.now()}-${data.filename}`;
        const uploadedKey = await app.storage.upload(key, buffer);

        // Update user verification level to IDUploaded
        const [updatedUser] = await app.db
          .update(schema.users)
          .set({
            verificationLevel: 'IDUploaded',
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId))
          .returning();

        app.logger.info(
          { userId, key: uploadedKey, verificationLevel: 'IDUploaded' },
          'ID document uploaded successfully'
        );

        return {
          success: true,
          verificationLevel: updatedUser.verificationLevel,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to upload ID document'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to upload ID document',
        });
      }
    }
  );
}
