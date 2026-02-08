import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, like, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { isAdminUser, isSuperAdmin, logAdminAction } from '../utils/admin.js';

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

  // GET /api/admin/users - Search and list users
  fastify.get(
    '/api/admin/users',
    {
      schema: {
        description: 'Search and list users (admin only)',
        tags: ['admin'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
            role: { type: 'string' },
            status: { type: 'string', enum: ['all', 'active', 'banned'] },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { search, page = 1, limit = 20, role, status = 'all' } = request.query as {
        search?: string;
        page?: number;
        limit?: number;
        role?: string;
        status?: string;
      };

      app.logger.info({ adminId, search, role, status }, 'Searching users');

      try {
        let users = await app.db.query.users.findMany();

        // Filter by search term
        if (search) {
          const searchStr = search as string;
          users = users.filter(
            u =>
              (u.phoneNumber as string).includes(searchStr) ||
              (u.fullName && (u.fullName as string).toLowerCase().includes(searchStr.toLowerCase()))
          );
        }

        // Filter by role
        if (role && role !== 'all') {
          users = users.filter(u => u.userType === role);
        }

        // Filter by status
        if (status === 'banned') {
          users = users.filter(u => u.isBanned);
        } else if (status === 'active') {
          users = users.filter(u => !u.isBanned);
        }

        // Pagination
        const total = users.length;
        const totalPages = Math.ceil(total / limit);
        const startIdx = (page - 1) * limit;
        const paginatedUsers = users.slice(startIdx, startIdx + limit);

        app.logger.info(
          { adminId, total, page, limit },
          'Users search completed'
        );

        return {
          users: paginatedUsers.map(u => ({
            id: u.id,
            phoneNumber: u.phoneNumber,
            fullName: u.fullName,
            email: u.email,
            userType: u.userType,
            verificationLevel: u.verificationLevel,
            isBanned: u.isBanned,
            banReason: u.banReason,
            walletBalance: u.walletBalance,
            createdAt: (u.createdAt as Date).toISOString(),
          })),
          total,
          page,
          totalPages,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to search users'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to search users',
        });
      }
    }
  );

  // GET /api/admin/users/:userId - Get user details
  fastify.get(
    '/api/admin/users/:userId',
    {
      schema: {
        description: 'Get user details (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { userId } = request.params as { userId?: string };

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      app.logger.info({ adminId, userId }, 'Fetching user details');

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

        // Get user's documents
        const documents = await app.db.query.verificationDocuments.findMany({
          where: eq(schema.verificationDocuments.userId, userId),
        });

        // Get user's ratings
        const ratingsReceived = await app.db.query.ratings.findMany({
          where: eq(schema.ratings.ratedUserId, userId),
        });

        const avgRating = ratingsReceived.length > 0
          ? Math.round(
              (ratingsReceived.reduce((sum, r) => sum + r.rating, 0) / ratingsReceived.length) * 10
            ) / 10
          : 0;

        // Get user's rides (if driver)
        const rides = await app.db.query.rides.findMany({
          where: eq(schema.rides.driverId, userId),
        });

        // Get user's bookings (if passenger)
        const bookings = await app.db.query.bookings.findMany({
          where: eq(schema.bookings.passengerId, userId),
        });

        app.logger.info({ adminId, userId }, 'User details retrieved successfully');

        return {
          id: user.id,
          phoneNumber: user.phoneNumber,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType,
          verificationLevel: user.verificationLevel,
          role: user.role,
          isBanned: user.isBanned,
          banReason: user.banReason,
          walletBalance: user.walletBalance,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          documents: documents.map(d => ({
            id: d.id,
            documentType: d.documentType,
            status: d.status,
            uploadedAt: d.uploadedAt.toISOString(),
          })),
          rating: avgRating,
          totalRatings: ratingsReceived.length,
          totalRides: rides.length,
          totalBookings: bookings.length,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, userId },
          'Failed to fetch user details'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch user details',
        });
      }
    }
  );

  // PUT /api/admin/users/:userId/ban - Ban user
  fastify.put(
    '/api/admin/users/:userId/ban',
    {
      schema: {
        description: 'Ban user (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
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

      const { userId } = request.params as { userId?: string };
      const { reason } = request.body as { reason?: string };

      if (!userId || !reason) {
        return reply.status(400).send({
          success: false,
          message: 'User ID and reason are required',
        });
      }

      app.logger.info({ adminId, userId, reason }, 'Banning user');

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

        await app.db
          .update(schema.users)
          .set({
            isBanned: true,
            banReason: reason,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));

        await logAdminAction(app, adminId, 'user_banned', 'user', userId, { reason });

        app.logger.info(
          { adminId, userId, reason },
          'User banned successfully'
        );

        return {
          success: true,
          message: 'User banned successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, userId },
          'Failed to ban user'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to ban user',
        });
      }
    }
  );

  // PUT /api/admin/users/:userId/unban - Unban user
  fastify.put(
    '/api/admin/users/:userId/unban',
    {
      schema: {
        description: 'Unban user (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { userId } = request.params as { userId?: string };

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      app.logger.info({ adminId, userId }, 'Unbanning user');

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

        await app.db
          .update(schema.users)
          .set({
            isBanned: false,
            banReason: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));

        await logAdminAction(app, adminId, 'user_unbanned', 'user', userId, {});

        app.logger.info({ adminId, userId }, 'User unbanned successfully');

        return {
          success: true,
          message: 'User unbanned successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, userId },
          'Failed to unban user'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to unban user',
        });
      }
    }
  );

  // PUT /api/admin/users/:userId/wallet - Adjust wallet balance
  fastify.put(
    '/api/admin/users/:userId/wallet',
    {
      schema: {
        description: 'Adjust wallet balance (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        body: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            reason: { type: 'string' },
          },
          required: ['amount', 'reason'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { userId } = request.params as { userId?: string };
      const { amount, reason } = request.body as { amount?: number; reason?: string };

      if (!userId || amount === undefined || !reason) {
        return reply.status(400).send({
          success: false,
          message: 'User ID, amount, and reason are required',
        });
      }

      app.logger.info({ adminId, userId, amount, reason }, 'Adjusting wallet balance');

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

        const currentBalance = parseFloat(user.walletBalance);
        const newBalance = currentBalance + amount;

        await app.db
          .update(schema.users)
          .set({
            walletBalance: newBalance.toString(),
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));

        await logAdminAction(app, adminId, 'wallet_adjusted', 'user', userId, {
          previousBalance: currentBalance,
          newBalance,
          amount,
          reason,
        });

        app.logger.info(
          { adminId, userId, amount, newBalance },
          'Wallet balance adjusted successfully'
        );

        return {
          success: true,
          newBalance: Math.round(newBalance * 100) / 100,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, userId },
          'Failed to adjust wallet balance'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to adjust wallet balance',
        });
      }
    }
  );

  // PUT /api/admin/users/:userId/role - Change user role (super admin only)
  fastify.put(
    '/api/admin/users/:userId/role',
    {
      schema: {
        description: 'Change user role (super admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        body: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
          },
          required: ['role'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      // Check if super admin
      const isSuperAdminUser = await isSuperAdmin(app, adminId);
      if (!isSuperAdminUser) {
        app.logger.warn({ adminId }, 'Non-super-admin attempted role change');
        return reply.status(403).send({
          success: false,
          message: 'Only super admins can change user roles',
        });
      }

      const { userId } = request.params as { userId?: string };
      const { role } = request.body as { role?: string };

      if (!userId || !role) {
        return reply.status(400).send({
          success: false,
          message: 'User ID and role are required',
        });
      }

      app.logger.info({ adminId, userId, role }, 'Changing user role');

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

        await app.db
          .update(schema.users)
          .set({
            role: role as any,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));

        await logAdminAction(app, adminId, 'role_changed', 'user', userId, {
          previousRole: user.role,
          newRole: role,
        });

        app.logger.info(
          { adminId, userId, role },
          'User role changed successfully'
        );

        return {
          success: true,
          message: 'User role changed successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, userId },
          'Failed to change user role'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to change user role',
        });
      }
    }
  );
}
