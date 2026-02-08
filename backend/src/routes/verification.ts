import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/verification/upload-document - Upload verification document
  fastify.post(
    '/api/verification/upload-document',
    {
      schema: {
        description: 'Upload verification document',
        tags: ['verification'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              documentType: { type: 'string' },
              status: { type: 'string' },
              uploadedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Uploading verification document');

      try {
        const data = await request.file({
          limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
        });

        if (!data) {
          app.logger.warn({ userId }, 'No file provided for document upload');
          return reply.status(400).send({
            success: false,
            message: 'No file provided',
          });
        }

        // Get documentType from fields
        const fields = await request.file();
        const documentType = (request.body as any)?.documentType || 'NationalID';

        // Validate document type
        const validTypes = ['NationalID', 'Passport', 'DriversLicense', 'VehicleRegistration', 'Selfie'];
        if (!validTypes.includes(documentType)) {
          app.logger.warn({ userId, documentType }, 'Invalid document type');
          return reply.status(400).send({
            success: false,
            message: 'Invalid document type',
          });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.warn({ userId }, 'Document file size exceeded limit');
          return reply.status(413).send({
            success: false,
            message: 'File too large. Maximum size is 20MB',
          });
        }

        const key = `verification/${userId}/${documentType}/${Date.now()}-${data.filename}`;
        const uploadedKey = await app.storage.upload(key, buffer);

        // Store document record
        const [doc] = await app.db
          .insert(schema.verificationDocuments)
          .values({
            userId,
            documentType: documentType as any,
            documentUrl: uploadedKey,
            status: 'pending',
          })
          .returning();

        app.logger.info(
          { userId, documentId: doc.id, documentType },
          'Verification document uploaded successfully'
        );

        return {
          id: doc.id,
          documentType: doc.documentType,
          status: doc.status,
          uploadedAt: doc.uploadedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to upload verification document'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to upload document',
        });
      }
    }
  );

  // GET /api/verification/documents - Get user's verification documents
  fastify.get(
    '/api/verification/documents',
    {
      schema: {
        description: 'Get user verification documents',
        tags: ['verification'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                documentType: { type: 'string' },
                status: { type: 'string' },
                rejectionReason: { type: ['string', 'null'] },
                uploadedAt: { type: 'string' },
                reviewedAt: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching user verification documents');

      try {
        const documents = await app.db.query.verificationDocuments.findMany({
          where: eq(schema.verificationDocuments.userId, userId),
        });

        app.logger.info(
          { userId, count: documents.length },
          'Documents retrieved successfully'
        );

        return documents.map(doc => ({
          id: doc.id,
          documentType: doc.documentType,
          status: doc.status,
          rejectionReason: doc.rejectionReason,
          uploadedAt: doc.uploadedAt.toISOString(),
          reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
        }));
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to fetch verification documents'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch documents',
        });
      }
    }
  );

  // GET /api/verification/status - Get user verification status
  fastify.get(
    '/api/verification/status',
    {
      schema: {
        description: 'Get user verification status',
        tags: ['verification'],
        response: {
          200: {
            type: 'object',
            properties: {
              verificationLevel: { type: 'string' },
              documents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    documentType: { type: 'string' },
                    status: { type: 'string' },
                  },
                },
              },
              isFullyVerified: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching verification status');

      try {
        const user = await app.db.query.users.findFirst({
          where: eq(schema.users.id, userId),
        });

        if (!user) {
          return reply.status(404).send({
            success: false,
            message: 'User not found',
          });
        }

        const documents = await app.db.query.verificationDocuments.findMany({
          where: eq(schema.verificationDocuments.userId, userId),
        });

        const isFullyVerified = user.verificationLevel === 'FullyVerified';

        return {
          verificationLevel: user.verificationLevel,
          documents: documents.map(doc => ({
            documentType: doc.documentType,
            status: doc.status,
          })),
          isFullyVerified,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to fetch verification status'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch verification status',
        });
      }
    }
  );
}
