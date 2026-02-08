import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, like, gte, lte, count, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { isAdminUser, isSuperAdmin, logAdminAction, ZIMBABWE_ROUTES, DEFAULT_PRICING_TEMPLATE } from '../utils/admin.js';

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

  // GET /api/admin/dashboard/metrics - Get overview metrics
  fastify.get(
    '/api/admin/dashboard/metrics',
    {
      schema: {
        description: 'Get dashboard metrics (admin only)',
        tags: ['admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              totalUsers: { type: 'integer' },
              totalDrivers: { type: 'integer' },
              totalPassengers: { type: 'integer' },
              activeRidesToday: { type: 'integer' },
              totalRevenue: { type: 'number' },
              verificationQueueLength: { type: 'integer' },
              reportsQueueLength: { type: 'integer' },
              sosAlertsActive: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      app.logger.info({ adminId }, 'Fetching dashboard metrics');

      try {
        // Count total users
        const allUsers = await app.db.query.users.findMany();
        const totalUsers = allUsers.length;
        const totalDrivers = allUsers.filter(u => u.userType === 'Driver').length;
        const totalPassengers = allUsers.filter(u => u.userType === 'Passenger').length;

        // Count active rides today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeRidesToday = await app.db.query.rides.findMany({
          where: and(
            eq(schema.rides.status, 'active'),
            gte(schema.rides.departureTime, today as any),
            lte(schema.rides.departureTime, tomorrow as any)
          ),
        });

        // Calculate total revenue (from completed bookings)
        const completedBookings = await app.db.query.bookings.findMany({
          where: eq(schema.bookings.status, 'completed'),
        });

        const totalRevenue = completedBookings.reduce(
          (sum, b) => sum + parseFloat(b.totalPrice),
          0
        );

        // Count verification queue
        const pendingVerifications = await app.db.query.verificationDocuments.findMany({
          where: eq(schema.verificationDocuments.status, 'pending'),
        });

        // Count reports queue
        const openReports = await app.db.query.reports.findMany({
          where: eq(schema.reports.status, 'open'),
        });

        // Count active SOS alerts
        const activeSOS = await app.db.query.sosAlerts.findMany({
          where: eq(schema.sosAlerts.status, 'active'),
        });

        app.logger.info(
          { totalUsers, totalDrivers, activeRidesToday: activeRidesToday.length },
          'Dashboard metrics retrieved successfully'
        );

        return {
          totalUsers,
          totalDrivers,
          totalPassengers,
          activeRidesToday: activeRidesToday.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          verificationQueueLength: pendingVerifications.length,
          reportsQueueLength: openReports.length,
          sosAlertsActive: activeSOS.length,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch dashboard metrics'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch metrics',
        });
      }
    }
  );

  // GET /api/admin/dashboard/analytics - Get analytics data
  fastify.get(
    '/api/admin/dashboard/analytics',
    {
      schema: {
        description: 'Get analytics data (admin only)',
        tags: ['admin'],
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              userGrowth: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
              rideCompletionRate: { type: 'number' },
              popularRoutes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    origin: { type: 'string' },
                    destination: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
              revenueTrends: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    amount: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { period } = request.query as { period?: string };
      app.logger.info({ adminId, period }, 'Fetching analytics');

      try {
        // User growth (last 30 days, grouped by day)
        const users = await app.db.query.users.findMany();
        const userGrowth: any[] = [];
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const dayUsers = users.filter(
            u => new Date(u.createdAt as any) >= date && new Date(u.createdAt as any) < nextDate
          ).length;

          userGrowth.unshift({
            date: date.toISOString().split('T')[0],
            count: dayUsers,
          });
        }

        // Ride completion rate
        const allRides = await app.db.query.rides.findMany();
        const completedRides = allRides.filter(r => r.status === 'completed').length;
        const rideCompletionRate = allRides.length > 0
          ? Math.round((completedRides / allRides.length) * 100)
          : 0;

        // Popular routes
        const routesConfig = await app.db.query.routesConfig.findMany({
          where: eq(schema.routesConfig.isPopular, true),
        });

        const popularRoutes = routesConfig.map(r => ({
          origin: r.origin,
          destination: r.destination,
          count: Math.floor(Math.random() * 100) + 10, // Mock data
        }));

        // Revenue trends (last 30 days)
        const bookings = await app.db.query.bookings.findMany({
          where: eq(schema.bookings.status, 'completed'),
        });

        const revenueTrends: any[] = [];
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const dayRevenue = bookings
            .filter(b => new Date(b.createdAt) >= date && new Date(b.createdAt) < nextDate)
            .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

          revenueTrends.unshift({
            date: date.toISOString().split('T')[0],
            amount: Math.round(dayRevenue * 100) / 100,
          });
        }

        app.logger.info({ adminId }, 'Analytics retrieved successfully');

        return {
          userGrowth,
          rideCompletionRate,
          popularRoutes,
          revenueTrends,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch analytics'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch analytics',
        });
      }
    }
  );

  // POST /api/admin/init-routes - Initialize Zimbabwe routes (call once on setup)
  fastify.post(
    '/api/admin/init-routes',
    {
      schema: {
        description: 'Initialize Zimbabwe routes (admin only)',
        tags: ['admin'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      app.logger.info({ adminId }, 'Initializing Zimbabwe routes');

      try {
        // Check if routes already exist
        const existing = await app.db.query.routesConfig.findMany();
        if (existing.length > 0) {
          return {
            success: false,
            message: 'Routes already initialized',
          };
        }

        // Insert Zimbabwe routes
        for (const route of ZIMBABWE_ROUTES) {
          await app.db.insert(schema.routesConfig).values({
            origin: route.origin,
            destination: route.destination,
            distanceKm: route.distanceKm.toString(),
            estimatedDurationMinutes: route.estimatedDurationMinutes,
            suggestedPrice: route.suggestedPrice.toString(),
            isPopular: route.isPopular,
          });
        }

        // Insert default pricing template
        await app.db.insert(schema.pricingTemplates).values({
          name: DEFAULT_PRICING_TEMPLATE.name,
          basePrice: DEFAULT_PRICING_TEMPLATE.basePrice.toString(),
          pricePerKm: DEFAULT_PRICING_TEMPLATE.pricePerKm.toString(),
          commissionRate: DEFAULT_PRICING_TEMPLATE.commissionRate.toString(),
          isActive: true,
        });

        await logAdminAction(app, adminId, 'init_routes', 'system', 'routes', {
          routesCount: ZIMBABWE_ROUTES.length,
        });

        app.logger.info(
          { adminId, routesCount: ZIMBABWE_ROUTES.length },
          'Zimbabwe routes initialized successfully'
        );

        return {
          success: true,
          message: 'Routes initialized successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to initialize routes'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to initialize routes',
        });
      }
    }
  );
}
