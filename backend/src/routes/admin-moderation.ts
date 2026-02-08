import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { isAdminUser, logAdminAction } from '../utils/admin.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // Middleware to check admin role
  const checkAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return null;

    const isAdmin = await isAdminUser(app, session.user.id);
    if (!isAdmin) {
      app.logger.warn({ userId: session.user.id }, 'Unauthorized admin access attempt');
      reply.status(403).send({
        success: false,
        message: 'You do not have permission to access this resource',
      });
      return null;
    }

    return session.user.id;
  };

  // GET /api/admin/reports - Get reports with filters
  fastify.get(
    '/api/admin/reports',
    {
      schema: {
        description: 'Get safety reports (admin only)',
        tags: ['admin'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            category: { type: 'string' },
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { status, category, page = 1, limit = 20 } = request.query as {
        status?: string;
        category?: string;
        page?: number;
        limit?: number;
      };

      app.logger.info({ adminId, status, category }, 'Fetching reports');

      try {
        let reports = await app.db.query.reports.findMany();

        // Filter by status
        if (status && status !== 'all') {
          reports = reports.filter(r => r.status === status);
        }

        // Filter by category
        if (category && category !== 'all') {
          reports = reports.filter(r => r.category === category);
        }

        // Pagination
        const total = reports.length;
        const totalPages = Math.ceil(total / limit);
        const startIdx = (page - 1) * limit;
        const paginatedReports = reports.slice(startIdx, startIdx + limit);

        // Get reporter and reported user details
        const reportsWithDetails = await Promise.all(
          paginatedReports.map(async (r) => {
            const reporter = await app.db.query.users.findFirst({
              where: eq(schema.users.id, r.reporterId as any),
            });
            const reportedUser = r.reportedUserId
              ? await app.db.query.users.findFirst({
                  where: eq(schema.users.id, r.reportedUserId as any),
                })
              : null;

            return {
              id: r.id,
              reporter: {
                id: reporter?.id,
                name: reporter?.fullName,
                phone: reporter?.phoneNumber,
              },
              reportedUser: reportedUser ? {
                id: reportedUser.id,
                name: reportedUser.fullName,
                phone: reportedUser.phoneNumber,
              } : null,
              category: r.category,
              description: r.description,
              status: r.status,
              createdAt: (r.createdAt as Date).toISOString(),
            };
          })
        );

        app.logger.info(
          { adminId, total, page },
          'Reports retrieved successfully'
        );

        return {
          reports: reportsWithDetails,
          total,
          page,
          totalPages,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch reports'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch reports',
        });
      }
    }
  );

  // PUT /api/admin/reports/:reportId/review - Review and respond to report
  fastify.put(
    '/api/admin/reports/:reportId/review',
    {
      schema: {
        description: 'Review report and take action (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            reportId: { type: 'string' },
          },
          required: ['reportId'],
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['reviewed', 'resolved'] },
            adminNotes: { type: 'string' },
            action: { type: 'string', enum: ['ban_user', 'warn_user', 'none'] },
          },
          required: ['status', 'adminNotes'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { reportId } = request.params as { reportId?: string };
      const { status, adminNotes, action } = request.body as {
        status?: string;
        adminNotes?: string;
        action?: string;
      };

      if (!reportId || !status || !adminNotes) {
        return reply.status(400).send({
          success: false,
          message: 'Report ID, status, and notes are required',
        });
      }

      app.logger.info({ adminId, reportId, status, action }, 'Reviewing report');

      try {
        const report = await app.db.query.reports.findFirst({
          where: eq(schema.reports.id, reportId),
        });

        if (!report) {
          app.logger.warn({ reportId }, 'Report not found');
          return reply.status(404).send({
            success: false,
            message: 'Report not found',
          });
        }

        // Update report
        await app.db
          .update(schema.reports)
          .set({
            status: status as any,
            adminNotes,
          })
          .where(eq(schema.reports.id, reportId));

        // Take action on reported user if specified
        if (action === 'ban_user' && report.reportedUserId) {
          await app.db
            .update(schema.users)
            .set({
              isBanned: true,
              banReason: `Banned due to report: ${report.category} - ${adminNotes}`,
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, report.reportedUserId));

          await logAdminAction(app, adminId, 'user_banned_from_report', 'report', reportId, {
            reportedUserId: report.reportedUserId,
            reason: adminNotes,
          });

          app.logger.info(
            { adminId, userId: report.reportedUserId },
            'User banned due to report'
          );
        }

        await logAdminAction(app, adminId, 'report_reviewed', 'report', reportId, {
          status,
          action,
        });

        app.logger.info(
          { adminId, reportId, status },
          'Report reviewed successfully'
        );

        return {
          success: true,
          message: 'Report reviewed successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, reportId },
          'Failed to review report'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to review report',
        });
      }
    }
  );

  // GET /api/admin/sos-alerts - Get SOS alerts
  fastify.get(
    '/api/admin/sos-alerts',
    {
      schema: {
        description: 'Get SOS alerts (admin only)',
        tags: ['admin'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'resolved', 'all'] },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { status = 'all' } = request.query as { status?: string };

      app.logger.info({ adminId, status }, 'Fetching SOS alerts');

      try {
        let alerts = await app.db.query.sosAlerts.findMany();

        if (status !== 'all') {
          alerts = alerts.filter(a => a.status === status);
        }

        const alertsWithDetails = await Promise.all(
          alerts.map(async (alert) => {
            const user = await app.db.query.users.findFirst({
              where: eq(schema.users.id, alert.userId as any),
            });
            const ride = alert.rideId
              ? await app.db.query.rides.findFirst({
                  where: eq(schema.rides.id, alert.rideId as any),
                })
              : null;

            return {
              id: alert.id,
              user: {
                id: user?.id,
                name: user?.fullName,
                phone: user?.phoneNumber,
              },
              ride: ride ? {
                id: ride.id,
                origin: ride.origin,
                destination: ride.destination,
              } : null,
              location: {
                lat: alert.locationLat ? parseFloat((alert.locationLat as string)) : null,
                lng: alert.locationLng ? parseFloat((alert.locationLng as string)) : null,
              },
              status: alert.status,
              createdAt: (alert.createdAt as Date).toISOString(),
              resolvedAt: alert.resolvedAt ? (alert.resolvedAt as Date).toISOString() : null,
            };
          })
        );

        app.logger.info(
          { adminId, count: alertsWithDetails.length },
          'SOS alerts retrieved successfully'
        );

        return {
          alerts: alertsWithDetails,
          total: alertsWithDetails.length,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch SOS alerts'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch SOS alerts',
        });
      }
    }
  );

  // PUT /api/admin/sos-alerts/:alertId/resolve - Resolve SOS alert
  fastify.put(
    '/api/admin/sos-alerts/:alertId/resolve',
    {
      schema: {
        description: 'Resolve SOS alert (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            alertId: { type: 'string' },
          },
          required: ['alertId'],
        },
        body: {
          type: 'object',
          properties: {
            notes: { type: 'string' },
          },
          required: ['notes'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { alertId } = request.params as { alertId?: string };
      const { notes } = request.body as { notes?: string };

      if (!alertId || !notes) {
        return reply.status(400).send({
          success: false,
          message: 'Alert ID and notes are required',
        });
      }

      app.logger.info({ adminId, alertId }, 'Resolving SOS alert');

      try {
        const alert = await app.db.query.sosAlerts.findFirst({
          where: eq(schema.sosAlerts.id, alertId),
        });

        if (!alert) {
          app.logger.warn({ alertId }, 'SOS alert not found');
          return reply.status(404).send({
            success: false,
            message: 'SOS alert not found',
          });
        }

        await app.db
          .update(schema.sosAlerts)
          .set({
            status: 'resolved',
            resolvedAt: new Date(),
          })
          .where(eq(schema.sosAlerts.id, alertId));

        await logAdminAction(app, adminId, 'sos_resolved', 'sos_alert', alertId, {
          notes,
        });

        app.logger.info(
          { adminId, alertId },
          'SOS alert resolved successfully'
        );

        return {
          success: true,
          message: 'SOS alert resolved successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, alertId },
          'Failed to resolve SOS alert'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to resolve SOS alert',
        });
      }
    }
  );

  // GET /api/admin/verification/queue - Get verification documents pending review
  fastify.get(
    '/api/admin/verification/queue',
    {
      schema: {
        description: 'Get verification queue (admin only)',
        tags: ['admin'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { status = 'pending', page = 1, limit = 20 } = request.query as {
        status?: string;
        page?: number;
        limit?: number;
      };

      app.logger.info({ adminId, status, page }, 'Fetching verification queue');

      try {
        let docs = await app.db.query.verificationDocuments.findMany();

        if (status && status !== 'all') {
          docs = docs.filter(d => d.status === status);
        }

        const total = docs.length;
        const totalPages = Math.ceil(total / limit);
        const startIdx = (page - 1) * limit;
        const paginatedDocs = docs.slice(startIdx, startIdx + limit);

        const docsWithUser = await Promise.all(
          paginatedDocs.map(async (doc) => {
            const user = await app.db.query.users.findFirst({
              where: eq(schema.users.id, doc.userId as any),
            });

            return {
              id: doc.id,
              user: {
                id: user?.id,
                name: user?.fullName,
                phone: user?.phoneNumber,
              },
              documentType: doc.documentType,
              status: doc.status,
              uploadedAt: (doc.uploadedAt as Date).toISOString(),
              rejectionReason: doc.rejectionReason,
            };
          })
        );

        app.logger.info(
          { adminId, total, page },
          'Verification queue retrieved successfully'
        );

        return {
          documents: docsWithUser,
          total,
          page,
          totalPages,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch verification queue'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch verification queue',
        });
      }
    }
  );

  // PUT /api/admin/verification/:documentId/approve - Approve document
  fastify.put(
    '/api/admin/verification/:documentId/approve',
    {
      schema: {
        description: 'Approve verification document (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string' },
          },
          required: ['documentId'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { documentId } = request.params as { documentId?: string };

      if (!documentId) {
        return reply.status(400).send({
          success: false,
          message: 'Document ID is required',
        });
      }

      app.logger.info({ adminId, documentId }, 'Approving document');

      try {
        const doc = await app.db.query.verificationDocuments.findFirst({
          where: eq(schema.verificationDocuments.id, documentId),
        });

        if (!doc) {
          app.logger.warn({ documentId }, 'Document not found');
          return reply.status(404).send({
            success: false,
            message: 'Document not found',
          });
        }

        await app.db
          .update(schema.verificationDocuments)
          .set({
            status: 'approved',
            reviewedAt: new Date(),
          })
          .where(eq(schema.verificationDocuments.id, documentId));

        // Check if user has all documents approved
        const allDocs = await app.db.query.verificationDocuments.findMany({
          where: eq(schema.verificationDocuments.userId, doc.userId),
        });

        const allApproved = allDocs.every(d => d.status === 'approved' || d.id === documentId);
        if (allApproved) {
          await app.db
            .update(schema.users)
            .set({
              verificationLevel: 'FullyVerified',
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, doc.userId));

          app.logger.info(
            { userId: doc.userId },
            'User upgraded to FullyVerified'
          );
        }

        await logAdminAction(app, adminId, 'document_approved', 'verification_document', documentId, {
          userId: doc.userId,
        });

        app.logger.info({ adminId, documentId }, 'Document approved successfully');

        return {
          success: true,
          message: 'Document approved successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, documentId },
          'Failed to approve document'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to approve document',
        });
      }
    }
  );

  // PUT /api/admin/verification/:documentId/reject - Reject document
  fastify.put(
    '/api/admin/verification/:documentId/reject',
    {
      schema: {
        description: 'Reject verification document (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string' },
          },
          required: ['documentId'],
        },
        body: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
          },
          required: ['reason'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { documentId } = request.params as { documentId?: string };
      const { reason } = request.body as { reason?: string };

      if (!documentId || !reason) {
        return reply.status(400).send({
          success: false,
          message: 'Document ID and reason are required',
        });
      }

      app.logger.info({ adminId, documentId }, 'Rejecting document');

      try {
        const doc = await app.db.query.verificationDocuments.findFirst({
          where: eq(schema.verificationDocuments.id, documentId),
        });

        if (!doc) {
          app.logger.warn({ documentId }, 'Document not found');
          return reply.status(404).send({
            success: false,
            message: 'Document not found',
          });
        }

        await app.db
          .update(schema.verificationDocuments)
          .set({
            status: 'rejected',
            rejectionReason: reason,
            reviewedAt: new Date(),
          })
          .where(eq(schema.verificationDocuments.id, documentId));

        await logAdminAction(app, adminId, 'document_rejected', 'verification_document', documentId, {
          userId: doc.userId,
          reason,
        });

        app.logger.info({ adminId, documentId }, 'Document rejected successfully');

        return {
          success: true,
          message: 'Document rejected successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, documentId },
          'Failed to reject document'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to reject document',
        });
      }
    }
  );
}
