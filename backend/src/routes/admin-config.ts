import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
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

  // GET /api/admin/routes - Get all configured routes
  fastify.get(
    '/api/admin/routes',
    {
      schema: {
        description: 'Get configured routes (admin only)',
        tags: ['admin'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      app.logger.info({ adminId }, 'Fetching routes configuration');

      try {
        const routes = await app.db.query.routesConfig.findMany();

        app.logger.info(
          { adminId, count: routes.length },
          'Routes retrieved successfully'
        );

        return routes.map(r => ({
          id: r.id,
          origin: r.origin,
          destination: r.destination,
          distanceKm: parseFloat((r.distanceKm as string)),
          estimatedDurationMinutes: r.estimatedDurationMinutes,
          suggestedPrice: parseFloat((r.suggestedPrice as string)),
          isPopular: r.isPopular,
          createdAt: (r.createdAt as Date).toISOString(),
        }));
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch routes'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch routes',
        });
      }
    }
  );

  // POST /api/admin/routes - Create new route
  fastify.post(
    '/api/admin/routes',
    {
      schema: {
        description: 'Create new route (admin only)',
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            origin: { type: 'string' },
            destination: { type: 'string' },
            distanceKm: { type: 'number' },
            estimatedDurationMinutes: { type: 'integer' },
            suggestedPrice: { type: 'number' },
            isPopular: { type: 'boolean' },
          },
          required: ['origin', 'destination', 'distanceKm', 'estimatedDurationMinutes', 'suggestedPrice'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { origin, destination, distanceKm, estimatedDurationMinutes, suggestedPrice, isPopular } =
        request.body as {
          origin?: string;
          destination?: string;
          distanceKm?: number;
          estimatedDurationMinutes?: number;
          suggestedPrice?: number;
          isPopular?: boolean;
        };

      if (!origin || !destination || !distanceKm || !estimatedDurationMinutes || !suggestedPrice) {
        return reply.status(400).send({
          success: false,
          message: 'All fields are required',
        });
      }

      app.logger.info({ adminId, origin, destination }, 'Creating route');

      try {
        const [route] = await app.db
          .insert(schema.routesConfig)
          .values({
            origin,
            destination,
            distanceKm: distanceKm.toString(),
            estimatedDurationMinutes,
            suggestedPrice: suggestedPrice.toString(),
            isPopular: isPopular || false,
          })
          .returning();

        await logAdminAction(app, adminId, 'route_created', 'route', route.id, {
          origin,
          destination,
          distanceKm,
        });

        app.logger.info(
          { adminId, routeId: route.id },
          'Route created successfully'
        );

        return {
          id: route.id,
          origin: route.origin,
          destination: route.destination,
          distanceKm: parseFloat(route.distanceKm),
          estimatedDurationMinutes: route.estimatedDurationMinutes,
          suggestedPrice: parseFloat(route.suggestedPrice),
          isPopular: route.isPopular,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to create route'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create route',
        });
      }
    }
  );

  // PUT /api/admin/routes/:routeId - Update route
  fastify.put(
    '/api/admin/routes/:routeId',
    {
      schema: {
        description: 'Update route (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            routeId: { type: 'string' },
          },
          required: ['routeId'],
        },
        body: {
          type: 'object',
          properties: {
            origin: { type: 'string' },
            destination: { type: 'string' },
            distanceKm: { type: 'number' },
            estimatedDurationMinutes: { type: 'integer' },
            suggestedPrice: { type: 'number' },
            isPopular: { type: 'boolean' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { routeId } = request.params as { routeId?: string };
      const { origin, destination, distanceKm, estimatedDurationMinutes, suggestedPrice, isPopular } =
        request.body as any;

      if (!routeId) {
        return reply.status(400).send({
          success: false,
          message: 'Route ID is required',
        });
      }

      app.logger.info({ adminId, routeId }, 'Updating route');

      try {
        const route = await app.db.query.routesConfig.findFirst({
          where: eq(schema.routesConfig.id, routeId),
        });

        if (!route) {
          app.logger.warn({ routeId }, 'Route not found');
          return reply.status(404).send({
            success: false,
            message: 'Route not found',
          });
        }

        const updateData: any = {};
        if (origin) updateData.origin = origin;
        if (destination) updateData.destination = destination;
        if (distanceKm) updateData.distanceKm = distanceKm.toString();
        if (estimatedDurationMinutes) updateData.estimatedDurationMinutes = estimatedDurationMinutes;
        if (suggestedPrice) updateData.suggestedPrice = suggestedPrice.toString();
        if (isPopular !== undefined) updateData.isPopular = isPopular;

        const [updated] = await app.db
          .update(schema.routesConfig)
          .set(updateData)
          .where(eq(schema.routesConfig.id, routeId))
          .returning();

        await logAdminAction(app, adminId, 'route_updated', 'route', routeId, updateData);

        app.logger.info({ adminId, routeId }, 'Route updated successfully');

        return {
          id: updated.id,
          origin: updated.origin,
          destination: updated.destination,
          distanceKm: parseFloat((updated.distanceKm as string)),
          estimatedDurationMinutes: updated.estimatedDurationMinutes,
          suggestedPrice: parseFloat((updated.suggestedPrice as string)),
          isPopular: updated.isPopular,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, routeId },
          'Failed to update route'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to update route',
        });
      }
    }
  );

  // DELETE /api/admin/routes/:routeId - Delete route
  fastify.delete(
    '/api/admin/routes/:routeId',
    {
      schema: {
        description: 'Delete route (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            routeId: { type: 'string' },
          },
          required: ['routeId'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { routeId } = request.params as { routeId?: string };

      if (!routeId) {
        return reply.status(400).send({
          success: false,
          message: 'Route ID is required',
        });
      }

      app.logger.info({ adminId, routeId }, 'Deleting route');

      try {
        const route = await app.db.query.routesConfig.findFirst({
          where: eq(schema.routesConfig.id, routeId),
        });

        if (!route) {
          app.logger.warn({ routeId }, 'Route not found');
          return reply.status(404).send({
            success: false,
            message: 'Route not found',
          });
        }

        await app.db.delete(schema.routesConfig).where(eq(schema.routesConfig.id, routeId));

        await logAdminAction(app, adminId, 'route_deleted', 'route', routeId, {});

        app.logger.info({ adminId, routeId }, 'Route deleted successfully');

        return {
          success: true,
          message: 'Route deleted successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, routeId },
          'Failed to delete route'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to delete route',
        });
      }
    }
  );

  // GET /api/admin/pricing-templates - Get pricing templates
  fastify.get(
    '/api/admin/pricing-templates',
    {
      schema: {
        description: 'Get pricing templates (admin only)',
        tags: ['admin'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      app.logger.info({ adminId }, 'Fetching pricing templates');

      try {
        const templates = await app.db.query.pricingTemplates.findMany();

        return templates.map(t => ({
          id: t.id,
          name: t.name,
          basePrice: parseFloat((t.basePrice as string)),
          pricePerKm: parseFloat((t.pricePerKm as string)),
          commissionRate: parseFloat((t.commissionRate as string)),
          isActive: t.isActive,
          createdAt: (t.createdAt as Date).toISOString(),
        }));
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch pricing templates'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch pricing templates',
        });
      }
    }
  );

  // POST /api/admin/pricing-templates - Create pricing template
  fastify.post(
    '/api/admin/pricing-templates',
    {
      schema: {
        description: 'Create pricing template (admin only)',
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            basePrice: { type: 'number' },
            pricePerKm: { type: 'number' },
            commissionRate: { type: 'number' },
          },
          required: ['name', 'basePrice', 'pricePerKm', 'commissionRate'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { name, basePrice, pricePerKm, commissionRate } = request.body as any;

      if (!name || basePrice === undefined || pricePerKm === undefined || commissionRate === undefined) {
        return reply.status(400).send({
          success: false,
          message: 'All fields are required',
        });
      }

      app.logger.info({ adminId, name }, 'Creating pricing template');

      try {
        const [template] = await app.db
          .insert(schema.pricingTemplates)
          .values({
            name,
            basePrice: basePrice.toString(),
            pricePerKm: pricePerKm.toString(),
            commissionRate: commissionRate.toString(),
            isActive: true,
          })
          .returning();

        await logAdminAction(app, adminId, 'template_created', 'pricing_template', template.id, {
          name,
        });

        app.logger.info({ adminId, templateId: template.id }, 'Pricing template created successfully');

        return {
          id: template.id,
          name: template.name,
          basePrice: parseFloat(template.basePrice),
          pricePerKm: parseFloat(template.pricePerKm),
          commissionRate: parseFloat(template.commissionRate),
          isActive: template.isActive,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to create pricing template'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create pricing template',
        });
      }
    }
  );

  // GET /api/admin/promo-codes - Get promo codes
  fastify.get(
    '/api/admin/promo-codes',
    {
      schema: {
        description: 'Get promo codes (admin only)',
        tags: ['admin'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      app.logger.info({ adminId }, 'Fetching promo codes');

      try {
        const codes = await app.db.query.promoCodes.findMany();

        return codes.map(c => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: parseFloat((c.discountValue as string)),
          maxUses: c.maxUses,
          currentUses: c.currentUses,
          validFrom: (c.validFrom as Date).toISOString(),
          validUntil: (c.validUntil as Date).toISOString(),
          isActive: c.isActive,
          createdAt: (c.createdAt as Date).toISOString(),
        }));
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch promo codes'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch promo codes',
        });
      }
    }
  );

  // POST /api/admin/promo-codes - Create promo code
  fastify.post(
    '/api/admin/promo-codes',
    {
      schema: {
        description: 'Create promo code (admin only)',
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            discountType: { type: 'string', enum: ['percentage', 'fixed'] },
            discountValue: { type: 'number' },
            maxUses: { type: 'integer' },
            validFrom: { type: 'string' },
            validUntil: { type: 'string' },
          },
          required: ['code', 'discountType', 'discountValue', 'validFrom', 'validUntil'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { code, discountType, discountValue, maxUses, validFrom, validUntil } = request.body as any;

      if (!code || !discountType || discountValue === undefined || !validFrom || !validUntil) {
        return reply.status(400).send({
          success: false,
          message: 'All fields are required',
        });
      }

      app.logger.info({ adminId, code }, 'Creating promo code');

      try {
        const [promo] = await app.db
          .insert(schema.promoCodes)
          .values({
            code: code.toUpperCase(),
            discountType: discountType as any,
            discountValue: discountValue.toString(),
            maxUses: maxUses || null,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            isActive: true,
          })
          .returning();

        await logAdminAction(app, adminId, 'promo_created', 'promo_code', promo.id, { code });

        app.logger.info({ adminId, promoId: promo.id }, 'Promo code created successfully');

        return {
          id: promo.id,
          code: promo.code,
          discountType: promo.discountType,
          discountValue: parseFloat(promo.discountValue),
          isActive: promo.isActive,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to create promo code'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create promo code',
        });
      }
    }
  );

  // DELETE /api/admin/promo-codes/:promoId - Delete promo code
  fastify.delete(
    '/api/admin/promo-codes/:promoId',
    {
      schema: {
        description: 'Delete promo code (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            promoId: { type: 'string' },
          },
          required: ['promoId'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { promoId } = request.params as { promoId?: string };

      if (!promoId) {
        return reply.status(400).send({
          success: false,
          message: 'Promo ID is required',
        });
      }

      app.logger.info({ adminId, promoId }, 'Deleting promo code');

      try {
        const promo = await app.db.query.promoCodes.findFirst({
          where: eq(schema.promoCodes.id, promoId),
        });

        if (!promo) {
          app.logger.warn({ promoId }, 'Promo not found');
          return reply.status(404).send({
            success: false,
            message: 'Promo code not found',
          });
        }

        await app.db.delete(schema.promoCodes).where(eq(schema.promoCodes.id, promoId));

        await logAdminAction(app, adminId, 'promo_deleted', 'promo_code', promoId, {});

        app.logger.info({ adminId, promoId }, 'Promo code deleted successfully');

        return {
          success: true,
          message: 'Promo code deleted successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, promoId },
          'Failed to delete promo code'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to delete promo code',
        });
      }
    }
  );

  // GET /api/admin/audit-logs - Get audit logs
  fastify.get(
    '/api/admin/audit-logs',
    {
      schema: {
        description: 'Get audit logs (admin only)',
        tags: ['admin'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 50 },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { page = 1, limit = 50 } = request.query as { page?: number; limit?: number };

      app.logger.info({ adminId, page }, 'Fetching audit logs');

      try {
        const logs = await app.db.query.adminAuditLogs.findMany();

        const total = logs.length;
        const totalPages = Math.ceil(total / limit);
        const startIdx = (page - 1) * limit;
        const paginatedLogs = logs.slice(startIdx, startIdx + limit);

        return {
          logs: paginatedLogs.map(l => ({
            id: l.id,
            adminId: l.adminId,
            action: l.action,
            targetType: l.targetType,
            targetId: l.targetId,
            details: l.details,
            createdAt: (l.createdAt as Date).toISOString(),
          })),
          total,
          page,
          totalPages,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to fetch audit logs'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch audit logs',
        });
      }
    }
  );
}
