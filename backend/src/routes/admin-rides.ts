import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
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

  // GET /api/admin/rides - List rides with filters
  fastify.get(
    '/api/admin/rides',
    {
      schema: {
        description: 'List rides with filters (admin only)',
        tags: ['admin'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
            date: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { status, page = 1, limit = 20, date } = request.query as {
        status?: string;
        page?: number;
        limit?: number;
        date?: string;
      };

      app.logger.info({ adminId, status, date }, 'Listing rides');

      try {
        let rides = await app.db.query.rides.findMany();

        // Filter by status
        if (status && status !== 'all') {
          rides = rides.filter(r => r.status === status);
        }

        // Filter by date
        if (date) {
          const filterDate = new Date(date as string);
          filterDate.setHours(0, 0, 0, 0);
          const nextDate = new Date(filterDate);
          nextDate.setDate(nextDate.getDate() + 1);

          rides = rides.filter(
            r => new Date(r.departureTime as any) >= filterDate && new Date(r.departureTime as any) < nextDate
          );
        }

        // Pagination
        const total = rides.length;
        const totalPages = Math.ceil(total / limit);
        const startIdx = (page - 1) * limit;
        const paginatedRides = rides.slice(startIdx, startIdx + limit);

        // Get driver and vehicle info for each ride
        const ridesWithDetails = await Promise.all(
          paginatedRides.map(async (ride) => {
            const driver = await app.db.query.users.findFirst({
              where: eq(schema.users.id, ride.driverId as any),
            });
            const vehicle = await app.db.query.vehicles.findFirst({
              where: eq(schema.vehicles.id, ride.vehicleId as any),
            });
            const bookings = await app.db.query.bookings.findMany({
              where: eq(schema.bookings.rideId, ride.id as any),
            });

            return {
              id: ride.id,
              origin: ride.origin,
              destination: ride.destination,
              departureTime: (ride.departureTime as Date).toISOString(),
              driver: {
                id: driver?.id,
                name: driver?.fullName,
              },
              vehicle: {
                make: vehicle?.make,
                model: vehicle?.model,
                licensePlate: vehicle?.licensePlate,
              },
              totalSeats: ride.totalSeats,
              availableSeats: ride.availableSeats,
              pricePerSeat: ride.pricePerSeat,
              status: ride.status,
              bookingsCount: bookings.length,
            };
          })
        );

        app.logger.info(
          { adminId, total, page },
          'Rides listed successfully'
        );

        return {
          rides: ridesWithDetails,
          total,
          page,
          totalPages,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId },
          'Failed to list rides'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to list rides',
        });
      }
    }
  );

  // PUT /api/admin/rides/:rideId/cancel - Cancel ride
  fastify.put(
    '/api/admin/rides/:rideId/cancel',
    {
      schema: {
        description: 'Cancel ride (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
          },
          required: ['rideId'],
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

      const { rideId } = request.params as { rideId?: string };
      const { reason } = request.body as { reason?: string };

      if (!rideId || !reason) {
        return reply.status(400).send({
          success: false,
          message: 'Ride ID and reason are required',
        });
      }

      app.logger.info({ adminId, rideId, reason }, 'Cancelling ride');

      try {
        const ride = await app.db.query.rides.findFirst({
          where: eq(schema.rides.id, rideId),
        });

        if (!ride) {
          app.logger.warn({ rideId }, 'Ride not found');
          return reply.status(404).send({
            success: false,
            message: 'Ride not found',
          });
        }

        // Cancel ride
        await app.db
          .update(schema.rides)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(schema.rides.id, rideId));

        // Refund all bookings
        const bookings = await app.db.query.bookings.findMany({
          where: and(
            eq(schema.bookings.rideId, rideId),
            eq(schema.bookings.status, 'confirmed')
          ),
        });

        for (const booking of bookings) {
          // Add refund to passenger wallet
          const passenger = await app.db.query.users.findFirst({
            where: eq(schema.users.id, booking.passengerId),
          });

          if (passenger) {
            const refundAmount = parseFloat(booking.totalPrice);
            const newBalance = parseFloat(passenger.walletBalance) + refundAmount;

            await app.db
              .update(schema.users)
              .set({ walletBalance: newBalance.toString() })
              .where(eq(schema.users.id, booking.passengerId));
          }

          // Update booking status
          await app.db
            .update(schema.bookings)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(schema.bookings.id, booking.id));
        }

        await logAdminAction(app, adminId, 'ride_cancelled', 'ride', rideId, {
          reason,
          bookingsRefunded: bookings.length,
        });

        app.logger.info(
          { adminId, rideId, reason },
          'Ride cancelled and refunds processed'
        );

        return {
          success: true,
          message: 'Ride cancelled and refunds processed',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, rideId },
          'Failed to cancel ride'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to cancel ride',
        });
      }
    }
  );

  // PUT /api/admin/rides/:rideId/adjust-price - Adjust ride price
  fastify.put(
    '/api/admin/rides/:rideId/adjust-price',
    {
      schema: {
        description: 'Adjust ride price (admin only)',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
          },
          required: ['rideId'],
        },
        body: {
          type: 'object',
          properties: {
            newPrice: { type: 'number' },
            reason: { type: 'string' },
          },
          required: ['newPrice', 'reason'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminId = await checkAdmin(request, reply);
      if (!adminId) return;

      const { rideId } = request.params as { rideId?: string };
      const { newPrice, reason } = request.body as { newPrice?: number; reason?: string };

      if (!rideId || newPrice === undefined || !reason) {
        return reply.status(400).send({
          success: false,
          message: 'Ride ID, new price, and reason are required',
        });
      }

      app.logger.info({ adminId, rideId, newPrice, reason }, 'Adjusting ride price');

      try {
        const ride = await app.db.query.rides.findFirst({
          where: eq(schema.rides.id, rideId),
        });

        if (!ride) {
          app.logger.warn({ rideId }, 'Ride not found');
          return reply.status(404).send({
            success: false,
            message: 'Ride not found',
          });
        }

        const oldPrice = parseFloat(ride.pricePerSeat);

        await app.db
          .update(schema.rides)
          .set({
            pricePerSeat: newPrice.toString(),
            updatedAt: new Date(),
          })
          .where(eq(schema.rides.id, rideId));

        await logAdminAction(app, adminId, 'price_adjusted', 'ride', rideId, {
          oldPrice,
          newPrice,
          reason,
        });

        app.logger.info(
          { adminId, rideId, oldPrice, newPrice },
          'Ride price adjusted successfully'
        );

        return {
          success: true,
          message: 'Ride price adjusted successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId, rideId },
          'Failed to adjust ride price'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to adjust ride price',
        });
      }
    }
  );
}
