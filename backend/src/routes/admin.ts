import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // Helper function to check if user is admin (mock for MVP)
  async function isAdmin(userId: string): Promise<boolean> {
    // TODO: Implement proper admin role check
    // For now, we'll check if user email is in admin list
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const user = await app.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    return user ? adminEmails.includes(user.email || '') : false;
  }

  // GET /api/admin/verification-queue - Get verification documents pending review
  fastify.get(
    '/api/admin/verification-queue',
    {
      schema: {
        description: 'Get verification documents pending review (admin only)',
        tags: ['admin'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                userName: { type: ['string', 'null'] },
                phoneNumber: { type: 'string' },
                documentType: { type: 'string' },
                status: { type: 'string' },
                uploadedAt: { type: 'string' },
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

      // Check admin permissions
      if (!(await isAdmin(userId))) {
        app.logger.warn({ userId }, 'Unauthorized admin access attempt');
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to access this resource',
        });
      }

      app.logger.info({}, 'Fetching verification queue');

      try {
        const pendingDocs = await app.db.query.verificationDocuments.findMany({
          where: eq(schema.verificationDocuments.status, 'pending'),
        });

        // Get user details for each document
        const docsWithUserInfo = await Promise.all(
          pendingDocs.map(async (doc) => {
            const user = await app.db.query.users.findFirst({
              where: eq(schema.users.id, doc.userId),
            });

            return {
              id: doc.id,
              userId: doc.userId,
              userName: user?.fullName || null,
              phoneNumber: user?.phoneNumber || '',
              documentType: doc.documentType,
              status: doc.status,
              uploadedAt: doc.uploadedAt.toISOString(),
            };
          })
        );

        app.logger.info(
          { count: docsWithUserInfo.length },
          'Verification queue retrieved successfully'
        );

        return docsWithUserInfo;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch verification queue'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch verification queue',
        });
      }
    }
  );

  // PUT /api/admin/verification/:id/approve - Approve verification document
  fastify.put(
    '/api/admin/verification/:id/approve',
    {
      schema: {
        description: 'Approve verification document (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const adminId = session.user.id;
      const { id } = request.params as { id?: string };

      if (!id) {
        return reply.status(400).send({
          success: false,
          message: 'Document ID is required',
        });
      }

      // Check admin permissions
      if (!(await isAdmin(adminId))) {
        app.logger.warn({ adminId }, 'Unauthorized admin access attempt');
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to perform this action',
        });
      }

      app.logger.info({ adminId, documentId: id }, 'Approving verification document');

      try {
        const doc = await app.db.query.verificationDocuments.findFirst({
          where: eq(schema.verificationDocuments.id, id),
        });

        if (!doc) {
          app.logger.warn({ documentId: id }, 'Document not found');
          return reply.status(404).send({
            success: false,
            message: 'Document not found',
          });
        }

        // Update document status
        await app.db
          .update(schema.verificationDocuments)
          .set({
            status: 'approved',
            reviewedAt: new Date(),
          })
          .where(eq(schema.verificationDocuments.id, id));

        // Check if all documents for user are approved, then update user verification level
        const allDocs = await app.db.query.verificationDocuments.findMany({
          where: eq(schema.verificationDocuments.userId, doc.userId),
        });

        const allApproved = allDocs.every(d => d.status === 'approved' || d.id === id);

        if (allApproved) {
          await app.db
            .update(schema.users)
            .set({ verificationLevel: 'FullyVerified', updatedAt: new Date() })
            .where(eq(schema.users.id, doc.userId));

          app.logger.info(
            { userId: doc.userId },
            'User verification level updated to FullyVerified'
          );
        }

        app.logger.info(
          { adminId, documentId: id, userId: doc.userId },
          'Verification document approved successfully'
        );

        // TODO: Send approval notification to user

        return {
          success: true,
          message: 'Document approved successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, documentId: id },
          'Failed to approve verification document'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to approve document',
        });
      }
    }
  );

  // PUT /api/admin/verification/:id/reject - Reject verification document
  fastify.put(
    '/api/admin/verification/:id/reject',
    {
      schema: {
        description: 'Reject verification document with reason (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            rejectionReason: { type: 'string' },
          },
          required: ['rejectionReason'],
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const adminId = session.user.id;
      const { id } = request.params as { id?: string };
      const { rejectionReason } = request.body as {
        rejectionReason?: string;
      };

      if (!id || !rejectionReason) {
        return reply.status(400).send({
          success: false,
          message: 'Document ID and rejection reason are required',
        });
      }

      // Check admin permissions
      if (!(await isAdmin(adminId))) {
        app.logger.warn({ adminId }, 'Unauthorized admin access attempt');
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to perform this action',
        });
      }

      app.logger.info(
        { adminId, documentId: id, reason: rejectionReason },
        'Rejecting verification document'
      );

      try {
        const doc = await app.db.query.verificationDocuments.findFirst({
          where: eq(schema.verificationDocuments.id, id),
        });

        if (!doc) {
          app.logger.warn({ documentId: id }, 'Document not found');
          return reply.status(404).send({
            success: false,
            message: 'Document not found',
          });
        }

        // Update document status
        await app.db
          .update(schema.verificationDocuments)
          .set({
            status: 'rejected',
            rejectionReason,
            reviewedAt: new Date(),
          })
          .where(eq(schema.verificationDocuments.id, id));

        app.logger.info(
          { adminId, documentId: id, userId: doc.userId },
          'Verification document rejected successfully'
        );

        // TODO: Send rejection notification to user with reason

        return {
          success: true,
          message: 'Document rejected successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, documentId: id },
          'Failed to reject verification document'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to reject document',
        });
      }
    }
  );
}
