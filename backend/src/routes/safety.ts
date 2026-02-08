import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

// Generate unique share token
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// WhatsApp message template
function getWhatsAppMessage(ride: any, shareLink: string): string {
  return encodeURIComponent(
    `🚗 Join me on ZimCommute!\n\n` +
    `From: ${ride.origin}\n` +
    `To: ${ride.destination}\n` +
    `Departure: ${new Date(ride.departureTime).toLocaleString()}\n` +
    `Price: ZWL ${ride.pricePerSeat}/seat\n\n` +
    `Book now: ${shareLink}\n\n` +
    `🛡️ Safe and verified rides`
  );
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/rides/:rideId/share-link - Generate shareable ride link
  fastify.post(
    '/api/rides/:rideId/share-link',
    {
      schema: {
        description: 'Generate shareable ride link with WhatsApp integration',
        tags: ['safety'],
        params: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
          },
          required: ['rideId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              shareToken: { type: 'string' },
              shareLink: { type: 'string' },
              whatsappLink: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { rideId } = request.params as { rideId?: string };

      if (!rideId) {
        return reply.status(400).send({
          success: false,
          message: 'Ride ID is required',
        });
      }

      app.logger.info({ userId, rideId }, 'Generating share link');

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

        const shareToken = generateShareToken();
        const baseUrl = process.env.API_URL || 'https://zimcommute.app';
        const shareLink = `${baseUrl}/rides/shared/${shareToken}`;
        const whatsappMessage = getWhatsAppMessage(ride, shareLink);
        const whatsappLink = `https://wa.me/?text=${whatsappMessage}`;

        app.logger.info(
          { rideId, shareToken },
          'Share link generated successfully'
        );

        return {
          shareToken,
          shareLink,
          whatsappLink,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId, rideId },
          'Failed to generate share link'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to generate share link',
        });
      }
    }
  );

  // GET /api/rides/shared/:shareToken - Get public ride details
  fastify.get(
    '/api/rides/shared/:shareToken',
    {
      schema: {
        description: 'Get shared ride details (public endpoint)',
        tags: ['safety'],
        params: {
          type: 'object',
          properties: {
            shareToken: { type: 'string' },
          },
          required: ['shareToken'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              origin: { type: 'string' },
              destination: { type: 'string' },
              departureTime: { type: 'string' },
              availableSeats: { type: 'integer' },
              pricePerSeat: { type: 'string' },
              instantBook: { type: 'boolean' },
              ladiesOnly: { type: 'boolean' },
              driverName: { type: ['string', 'null'] },
              driverRating: { type: 'number' },
              vehicleInfo: {
                type: 'object',
                properties: {
                  make: { type: 'string' },
                  model: { type: 'string' },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { shareToken } = request.params as { shareToken?: string };

      if (!shareToken) {
        return reply.status(400).send({
          success: false,
          message: 'Share token is required',
        });
      }

      app.logger.info({ shareToken }, 'Fetching shared ride details');

      try {
        // For MVP, we'll generate a ride based on the token (in production, store mappings in DB)
        // This is a mock implementation
        const ride = await app.db.query.rides.findFirst({
          where: eq(schema.rides.status, 'active'),
        });

        if (!ride) {
          app.logger.warn({ shareToken }, 'No active ride found');
          return reply.status(404).send({
            success: false,
            message: 'Ride not found',
          });
        }

        // Get driver and vehicle info
        const driver = await app.db.query.users.findFirst({
          where: eq(schema.users.id, ride.driverId),
        });

        const vehicle = await app.db.query.vehicles.findFirst({
          where: eq(schema.vehicles.id, ride.vehicleId),
        });

        // Get driver ratings
        const driverRatings = await app.db.query.ratings.findMany({
          where: eq(schema.ratings.ratedUserId, ride.driverId),
        });

        const driverRating = driverRatings.length > 0
          ? Math.round(
              (driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length) * 10
            ) / 10
          : 0;

        app.logger.info(
          { shareToken, rideId: ride.id },
          'Shared ride details retrieved successfully'
        );

        return {
          id: ride.id,
          origin: ride.origin,
          destination: ride.destination,
          departureTime: ride.departureTime.toISOString(),
          availableSeats: ride.availableSeats,
          pricePerSeat: ride.pricePerSeat,
          instantBook: ride.instantBook,
          ladiesOnly: ride.ladiesOnly,
          driverName: driver?.fullName || null,
          driverRating,
          vehicleInfo: vehicle ? {
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
          } : null,
        };
      } catch (error) {
        app.logger.error(
          { err: error, shareToken },
          'Failed to fetch shared ride details'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch ride details',
        });
      }
    }
  );

  // POST /api/sos/alert - Create SOS alert
  fastify.post(
    '/api/sos/alert',
    {
      schema: {
        description: 'Create SOS alert for emergency',
        tags: ['safety'],
        body: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
            locationLat: { type: 'number' },
            locationLng: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
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

      const userId = session.user.id;
      const { rideId, locationLat, locationLng } = request.body as {
        rideId?: string;
        locationLat?: number;
        locationLng?: number;
      };

      app.logger.warn(
        { userId, rideId, lat: locationLat, lng: locationLng },
        'SOS ALERT - EMERGENCY'
      );

      try {
        // Create SOS alert
        const [alert] = await app.db
          .insert(schema.sosAlerts)
          .values({
            userId,
            rideId: rideId || null,
            locationLat: locationLat ? locationLat.toString() : null,
            locationLng: locationLng ? locationLng.toString() : null,
            status: 'active',
          })
          .returning();

        // TODO: Send emergency notification
        // TODO: Alert emergency contacts
        // TODO: Notify admin
        // TODO: Send location to nearby emergency services

        app.logger.warn(
          { alertId: alert.id, userId },
          'SOS alert created successfully'
        );

        return {
          id: alert.id,
          status: alert.status,
          createdAt: alert.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to create SOS alert'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create SOS alert',
        });
      }
    }
  );

  // PUT /api/sos/alert/:id/resolve - Resolve SOS alert
  fastify.put(
    '/api/sos/alert/:id/resolve',
    {
      schema: {
        description: 'Resolve SOS alert',
        tags: ['safety'],
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
        return reply.status(400).send({
          success: false,
          message: 'Alert ID is required',
        });
      }

      app.logger.info({ userId, alertId: id }, 'Resolving SOS alert');

      try {
        // Verify ownership
        const alert = await app.db.query.sosAlerts.findFirst({
          where: eq(schema.sosAlerts.id, id),
        });

        if (!alert) {
          app.logger.warn({ alertId: id }, 'Alert not found');
          return reply.status(404).send({
            success: false,
            message: 'Alert not found',
          });
        }

        if (alert.userId !== userId) {
          app.logger.warn(
            { userId, alertId: id, ownerId: alert.userId },
            'Unauthorized alert resolution attempt'
          );
          return reply.status(403).send({
            success: false,
            message: 'You do not have permission to resolve this alert',
          });
        }

        await app.db
          .update(schema.sosAlerts)
          .set({ status: 'resolved', resolvedAt: new Date() })
          .where(eq(schema.sosAlerts.id, id));

        app.logger.info({ userId, alertId: id }, 'SOS alert resolved successfully');

        return {
          success: true,
          message: 'SOS alert resolved successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId, alertId: id },
          'Failed to resolve SOS alert'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to resolve SOS alert',
        });
      }
    }
  );
}
