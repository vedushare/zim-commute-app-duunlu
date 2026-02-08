import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/vehicles - Create a new vehicle
  fastify.post(
    '/api/vehicles',
    {
      schema: {
        description: 'Create a new vehicle',
        tags: ['vehicles'],
        body: {
          type: 'object',
          properties: {
            make: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            color: { type: 'string' },
            licensePlate: { type: 'string' },
            seats: { type: 'integer', minimum: 1, maximum: 7 },
          },
          required: ['make', 'model', 'year', 'color', 'licensePlate', 'seats'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              make: { type: 'string' },
              model: { type: 'string' },
              year: { type: 'integer' },
              color: { type: 'string' },
              licensePlate: { type: 'string' },
              seats: { type: 'integer' },
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
      const { make, model, year, color, licensePlate, seats } = request.body as {
        make?: string;
        model?: string;
        year?: number;
        color?: string;
        licensePlate?: string;
        seats?: number;
      };

      // Validation
      if (!make || !model || !year || !color || !licensePlate || seats === undefined) {
        app.logger.warn({ userId }, 'Missing required fields for vehicle creation');
        return reply.status(400).send({
          success: false,
          message: 'All vehicle fields are required',
        });
      }

      if (seats < 1 || seats > 7) {
        app.logger.warn({ userId, seats }, 'Invalid seat count');
        return reply.status(400).send({
          success: false,
          message: 'Vehicle seats must be between 1 and 7',
        });
      }

      app.logger.info(
        { userId, make, model, licensePlate },
        'Creating vehicle'
      );

      try {
        const [vehicle] = await app.db
          .insert(schema.vehicles)
          .values({
            userId,
            make,
            model,
            year,
            color,
            licensePlate,
            seats,
          })
          .returning();

        app.logger.info(
          { vehicleId: vehicle.id, userId },
          'Vehicle created successfully'
        );

        return {
          id: vehicle.id,
          userId: vehicle.userId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          licensePlate: vehicle.licensePlate,
          seats: vehicle.seats,
          createdAt: vehicle.createdAt.toISOString(),
          updatedAt: vehicle.updatedAt.toISOString(),
        };
      } catch (error: any) {
        if (error.code === '23505') {
          // Unique constraint violation
          app.logger.warn(
            { userId, licensePlate },
            'License plate already exists'
          );
          return reply.status(400).send({
            success: false,
            message: 'License plate already registered',
          });
        }

        app.logger.error(
          { err: error, userId },
          'Failed to create vehicle'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create vehicle',
        });
      }
    }
  );

  // GET /api/vehicles - Get user's vehicles
  fastify.get(
    '/api/vehicles',
    {
      schema: {
        description: 'Get user vehicles',
        tags: ['vehicles'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                make: { type: 'string' },
                model: { type: 'string' },
                year: { type: 'integer' },
                color: { type: 'string' },
                licensePlate: { type: 'string' },
                seats: { type: 'integer' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
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
      app.logger.info({ userId }, 'Fetching user vehicles');

      try {
        const userVehicles = await app.db.query.vehicles.findMany({
          where: eq(schema.vehicles.userId, userId),
        });

        app.logger.info(
          { userId, count: userVehicles.length },
          'Vehicles retrieved successfully'
        );

        return userVehicles.map(v => ({
          id: v.id,
          userId: v.userId,
          make: v.make,
          model: v.model,
          year: v.year,
          color: v.color,
          licensePlate: v.licensePlate,
          seats: v.seats,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to fetch vehicles'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch vehicles',
        });
      }
    }
  );

  // DELETE /api/vehicles/:id - Delete vehicle
  fastify.delete(
    '/api/vehicles/:id',
    {
      schema: {
        description: 'Delete a vehicle',
        tags: ['vehicles'],
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

      const userId = session.user.id;
      const { id } = request.params as { id?: string };

      if (!id) {
        app.logger.warn({}, 'Missing vehicle ID in delete request');
        return reply.status(400).send({
          success: false,
          message: 'Vehicle ID is required',
        });
      }

      app.logger.info({ userId, vehicleId: id }, 'Deleting vehicle');

      try {
        // Check ownership
        const vehicle = await app.db.query.vehicles.findFirst({
          where: eq(schema.vehicles.id, id),
        });

        if (!vehicle) {
          app.logger.warn({ userId, vehicleId: id }, 'Vehicle not found');
          return reply.status(404).send({
            success: false,
            message: 'Vehicle not found',
          });
        }

        if (vehicle.userId !== userId) {
          app.logger.warn(
            { userId, vehicleId: id, ownerId: vehicle.userId },
            'Unauthorized vehicle deletion attempt'
          );
          return reply.status(403).send({
            success: false,
            message: 'You do not have permission to delete this vehicle',
          });
        }

        await app.db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));

        app.logger.info({ userId, vehicleId: id }, 'Vehicle deleted successfully');

        return {
          success: true,
          message: 'Vehicle deleted successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId, vehicleId: id },
          'Failed to delete vehicle'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to delete vehicle',
        });
      }
    }
  );
}
