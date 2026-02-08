import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/reports - Create report
  fastify.post(
    '/api/reports',
    {
      schema: {
        description: 'Create a safety report',
        tags: ['reports'],
        body: {
          type: 'object',
          properties: {
            reportedUserId: { type: 'string' },
            rideId: { type: 'string' },
            bookingId: { type: 'string' },
            category: { type: 'string', enum: ['Safety', 'Vehicle', 'Behavior', 'Payment'] },
            description: { type: 'string' },
          },
          required: ['category', 'description'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const reporterId = session.user.id;
      const { reportedUserId, rideId, bookingId, category, description } = request.body as {
        reportedUserId?: string;
        rideId?: string;
        bookingId?: string;
        category?: string;
        description?: string;
      };

      if (!category || !description) {
        app.logger.warn({ reporterId }, 'Missing required fields for report');
        return reply.status(400).send({
          success: false,
          message: 'Category and description are required',
        });
      }

      const validCategories = ['Safety', 'Vehicle', 'Behavior', 'Payment'];
      if (!validCategories.includes(category)) {
        app.logger.warn({ reporterId, category }, 'Invalid report category');
        return reply.status(400).send({
          success: false,
          message: 'Invalid report category',
        });
      }

      app.logger.info(
        { reporterId, category, reportedUserId },
        'Creating report'
      );

      try {
        // Create report
        const [report] = await app.db
          .insert(schema.reports)
          .values({
            reporterId,
            reportedUserId: reportedUserId || null,
            rideId: rideId || null,
            bookingId: bookingId || null,
            category: category as any,
            description,
            status: 'open',
          })
          .returning();

        app.logger.info(
          { reportId: report.id, reporterId, category },
          'Report created successfully'
        );

        // TODO: Send notification to admin
        // TODO: Send SMS alert for safety reports

        return {
          id: report.id,
          category: report.category,
          status: report.status,
          createdAt: report.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error(
          { err: error, reporterId },
          'Failed to create report'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create report',
        });
      }
    }
  );

  // POST /api/reports/upload-evidence - Upload evidence for a report
  fastify.post(
    '/api/reports/upload-evidence',
    {
      schema: {
        description: 'Upload evidence for a report',
        tags: ['reports'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              evidenceUrl: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Uploading report evidence');

      try {
        const data = await request.file({
          limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
        });

        if (!data) {
          app.logger.warn({ userId }, 'No file provided for evidence upload');
          return reply.status(400).send({
            success: false,
            message: 'No file provided',
          });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.warn({ userId }, 'Evidence file size exceeded limit');
          return reply.status(413).send({
            success: false,
            message: 'File too large. Maximum size is 15MB',
          });
        }

        const key = `reports/${userId}/${Date.now()}-${data.filename}`;
        const uploadedKey = await app.storage.upload(key, buffer);
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        app.logger.info(
          { userId, key: uploadedKey },
          'Report evidence uploaded successfully'
        );

        return {
          success: true,
          evidenceUrl: url,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to upload report evidence'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to upload evidence',
        });
      }
    }
  );

  // GET /api/reports/my-reports - Get my reports
  fastify.get(
    '/api/reports/my-reports',
    {
      schema: {
        description: 'Get my reports',
        tags: ['reports'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                category: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                reportedUserName: { type: ['string', 'null'] },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const reporterId = session.user.id;
      app.logger.info({ reporterId }, 'Fetching my reports');

      try {
        const myReports = await app.db.query.reports.findMany({
          where: eq(schema.reports.reporterId, reporterId),
        });

        // Get reported user details for each report
        const reportsWithDetails = await Promise.all(
          myReports.map(async (report) => {
            let reportedUserName = null;
            if (report.reportedUserId) {
              const user = await app.db.query.users.findFirst({
                where: eq(schema.users.id, report.reportedUserId),
              });
              reportedUserName = user?.fullName || null;
            }

            return {
              id: report.id,
              category: report.category,
              description: report.description,
              status: report.status,
              reportedUserName,
              createdAt: report.createdAt.toISOString(),
            };
          })
        );

        app.logger.info(
          { reporterId, count: reportsWithDetails.length },
          'My reports retrieved successfully'
        );

        return reportsWithDetails;
      } catch (error) {
        app.logger.error(
          { err: error, reporterId },
          'Failed to fetch my reports'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch reports',
        });
      }
    }
  );
}
