import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

// Generate random 6-character booking code
function generateBookingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Broadcast ride update to WebSocket clients
function broadcastRideUpdate(rideId: string, data: any) {
  // This will be called to notify clients of seat availability changes
  // The actual broadcasting is handled in the rides route
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/bookings - Create a booking
  fastify.post(
    '/api/bookings',
    {
      schema: {
        description: 'Create a booking for a ride',
        tags: ['bookings'],
        body: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
            seatsBooked: { type: 'integer', minimum: 1 },
          },
          required: ['rideId', 'seatsBooked'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              rideId: { type: 'string' },
              passengerId: { type: 'string' },
              seatsBooked: { type: 'integer' },
              totalPrice: { type: 'string' },
              status: { type: 'string' },
              bookingCode: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const passengerId = session.user.id;
      const { rideId, seatsBooked } = request.body as {
        rideId?: string;
        seatsBooked?: number;
      };

      // Validation
      if (!rideId || !seatsBooked) {
        app.logger.warn({ passengerId }, 'Missing required fields for booking');
        return reply.status(400).send({
          success: false,
          message: 'Ride ID and seats booked are required',
        });
      }

      if (seatsBooked < 1) {
        app.logger.warn({ passengerId, seatsBooked }, 'Invalid seat count');
        return reply.status(400).send({
          success: false,
          message: 'Must book at least 1 seat',
        });
      }

      app.logger.info(
        { passengerId, rideId, seatsBooked },
        'Creating booking'
      );

      try {
        // Get ride details
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

        if (ride.status !== 'active') {
          app.logger.warn({ rideId, status: ride.status }, 'Ride is not active');
          return reply.status(400).send({
            success: false,
            message: 'This ride is no longer available',
          });
        }

        if (seatsBooked > ride.availableSeats) {
          app.logger.warn(
            { rideId, seatsBooked, availableSeats: ride.availableSeats },
            'Not enough seats available'
          );
          return reply.status(400).send({
            success: false,
            message: `Only ${ride.availableSeats} seats available`,
          });
        }

        // Check if passenger already has a booking on this ride
        const existingBooking = await app.db.query.bookings.findFirst({
          where: and(
            eq(schema.bookings.rideId, rideId),
            eq(schema.bookings.passengerId, passengerId)
          ),
        });

        if (existingBooking && existingBooking.status !== 'cancelled') {
          app.logger.warn(
            { passengerId, rideId },
            'Passenger already has a booking on this ride'
          );
          return reply.status(400).send({
            success: false,
            message: 'You already have a booking on this ride',
          });
        }

        // Calculate total price
        const pricePerSeat = parseFloat(ride.pricePerSeat);
        const totalPrice = seatsBooked * pricePerSeat;

        // Generate booking code
        let bookingCode = generateBookingCode();
        let codeExists = true;
        while (codeExists) {
          const existingCode = await app.db.query.bookings.findFirst({
            where: eq(schema.bookings.bookingCode, bookingCode),
          });
          if (!existingCode) {
            codeExists = false;
          } else {
            bookingCode = generateBookingCode();
          }
        }

        // Create booking
        const [booking] = await app.db
          .insert(schema.bookings)
          .values({
            rideId,
            passengerId,
            seatsBooked,
            totalPrice: totalPrice.toString(),
            status: 'pending',
            bookingCode,
          })
          .returning();

        // Update available seats
        const newAvailableSeats = ride.availableSeats - seatsBooked;
        await app.db
          .update(schema.rides)
          .set({ availableSeats: newAvailableSeats, updatedAt: new Date() })
          .where(eq(schema.rides.id, rideId));

        app.logger.info(
          { bookingId: booking.id, passengerId, rideId, seatsBooked },
          'Booking created successfully'
        );

        // Broadcast seat availability update
        broadcastRideUpdate(rideId, {
          type: 'seats_updated',
          rideId,
          availableSeats: newAvailableSeats,
          bookingCode,
        });

        return {
          id: booking.id,
          rideId: booking.rideId,
          passengerId: booking.passengerId,
          seatsBooked: booking.seatsBooked,
          totalPrice: booking.totalPrice,
          status: booking.status,
          bookingCode: booking.bookingCode,
          createdAt: booking.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error(
          { err: error, passengerId, rideId },
          'Failed to create booking'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create booking',
        });
      }
    }
  );

  // GET /api/bookings/my-bookings - Get passenger bookings
  fastify.get(
    '/api/bookings/my-bookings',
    {
      schema: {
        description: 'Get user bookings as passenger',
        tags: ['bookings'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                rideId: { type: 'string' },
                seatsBooked: { type: 'integer' },
                totalPrice: { type: 'string' },
                status: { type: 'string' },
                bookingCode: { type: 'string' },
                createdAt: { type: 'string' },
                ride: {
                  type: 'object',
                  properties: {
                    origin: { type: 'string' },
                    destination: { type: 'string' },
                    departureTime: { type: 'string' },
                    driver: {
                      type: 'object',
                      properties: {
                        fullName: { type: ['string', 'null'] },
                        phoneNumber: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const passengerId = session.user.id;
      app.logger.info({ passengerId }, 'Fetching passenger bookings');

      try {
        const bookings = await app.db.query.bookings.findMany({
          where: eq(schema.bookings.passengerId, passengerId),
        });

        // Fetch ride and driver details for each booking
        const bookingsWithDetails = await Promise.all(
          bookings.map(async (booking) => {
            const ride = await app.db.query.rides.findFirst({
              where: eq(schema.rides.id, booking.rideId),
              with: {
                driver: true,
              },
            });

            return {
              id: booking.id,
              rideId: booking.rideId,
              seatsBooked: booking.seatsBooked,
              totalPrice: booking.totalPrice,
              status: booking.status,
              bookingCode: booking.bookingCode,
              createdAt: booking.createdAt.toISOString(),
              ride: ride ? {
                origin: ride.origin,
                destination: ride.destination,
                departureTime: ride.departureTime.toISOString(),
                driver: {
                  fullName: (ride.driver as any).fullName,
                  phoneNumber: (ride.driver as any).phoneNumber,
                },
              } : null,
            };
          })
        );

        app.logger.info(
          { passengerId, count: bookingsWithDetails.length },
          'Passenger bookings retrieved successfully'
        );

        return bookingsWithDetails.filter(b => b.ride !== null);
      } catch (error) {
        app.logger.error(
          { err: error, passengerId },
          'Failed to fetch passenger bookings'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch bookings',
        });
      }
    }
  );

  // PUT /api/bookings/:id/cancel - Cancel booking
  fastify.put(
    '/api/bookings/:id/cancel',
    {
      schema: {
        description: 'Cancel a booking',
        tags: ['bookings'],
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

      const passengerId = session.user.id;
      const { id } = request.params as { id?: string };

      if (!id) {
        return reply.status(400).send({
          success: false,
          message: 'Booking ID is required',
        });
      }

      app.logger.info({ bookingId: id, passengerId }, 'Cancelling booking');

      try {
        // Get booking
        const booking = await app.db.query.bookings.findFirst({
          where: eq(schema.bookings.id, id),
        });

        if (!booking) {
          app.logger.warn({ bookingId: id }, 'Booking not found');
          return reply.status(404).send({
            success: false,
            message: 'Booking not found',
          });
        }

        if (booking.passengerId !== passengerId) {
          app.logger.warn(
            { passengerId, bookingId: id, ownerId: booking.passengerId },
            'Unauthorized booking cancellation attempt'
          );
          return reply.status(403).send({
            success: false,
            message: 'You do not have permission to cancel this booking',
          });
        }

        if (booking.status === 'cancelled') {
          app.logger.warn({ bookingId: id }, 'Booking already cancelled');
          return reply.status(400).send({
            success: false,
            message: 'Booking is already cancelled',
          });
        }

        // Get ride to restore seats
        const ride = await app.db.query.rides.findFirst({
          where: eq(schema.rides.id, booking.rideId),
        });

        if (!ride) {
          app.logger.warn({ rideId: booking.rideId }, 'Ride not found');
          return reply.status(500).send({
            success: false,
            message: 'Associated ride not found',
          });
        }

        // Update booking status
        await app.db
          .update(schema.bookings)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(schema.bookings.id, id));

        // Restore available seats
        const newAvailableSeats = ride.availableSeats + booking.seatsBooked;
        await app.db
          .update(schema.rides)
          .set({ availableSeats: newAvailableSeats, updatedAt: new Date() })
          .where(eq(schema.rides.id, booking.rideId));

        app.logger.info(
          { bookingId: id, passengerId, seatsRestored: booking.seatsBooked },
          'Booking cancelled successfully'
        );

        // Broadcast seat availability update
        broadcastRideUpdate(booking.rideId, {
          type: 'seats_updated',
          rideId: booking.rideId,
          availableSeats: newAvailableSeats,
        });

        return {
          success: true,
          message: 'Booking cancelled successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, passengerId, bookingId: id },
          'Failed to cancel booking'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to cancel booking',
        });
      }
    }
  );

  // PUT /api/bookings/:id/confirm - Confirm booking (driver only)
  fastify.put(
    '/api/bookings/:id/confirm',
    {
      schema: {
        description: 'Confirm a booking (driver only)',
        tags: ['bookings'],
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

      const driverId = session.user.id;
      const { id } = request.params as { id?: string };

      if (!id) {
        return reply.status(400).send({
          success: false,
          message: 'Booking ID is required',
        });
      }

      app.logger.info({ bookingId: id, driverId }, 'Confirming booking');

      try {
        // Get booking
        const booking = await app.db.query.bookings.findFirst({
          where: eq(schema.bookings.id, id),
        });

        if (!booking) {
          app.logger.warn({ bookingId: id }, 'Booking not found');
          return reply.status(404).send({
            success: false,
            message: 'Booking not found',
          });
        }

        // Get ride to verify driver ownership
        const ride = await app.db.query.rides.findFirst({
          where: eq(schema.rides.id, booking.rideId),
        });

        if (!ride) {
          app.logger.warn({ rideId: booking.rideId }, 'Ride not found');
          return reply.status(500).send({
            success: false,
            message: 'Associated ride not found',
          });
        }

        // Verify driver owns the ride
        if (ride.driverId !== driverId) {
          app.logger.warn(
            { driverId, bookingId: id, rideDriver: ride.driverId },
            'Unauthorized booking confirmation attempt'
          );
          return reply.status(403).send({
            success: false,
            message: 'You do not have permission to confirm this booking',
          });
        }

        if (booking.status === 'confirmed') {
          app.logger.warn({ bookingId: id }, 'Booking already confirmed');
          return reply.status(400).send({
            success: false,
            message: 'Booking is already confirmed',
          });
        }

        if (booking.status === 'cancelled') {
          app.logger.warn({ bookingId: id }, 'Cannot confirm cancelled booking');
          return reply.status(400).send({
            success: false,
            message: 'Cannot confirm a cancelled booking',
          });
        }

        // Update booking status
        await app.db
          .update(schema.bookings)
          .set({ status: 'confirmed', updatedAt: new Date() })
          .where(eq(schema.bookings.id, id));

        app.logger.info(
          { bookingId: id, driverId, passengerId: booking.passengerId },
          'Booking confirmed successfully'
        );

        return {
          success: true,
          message: 'Booking confirmed successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, driverId, bookingId: id },
          'Failed to confirm booking'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to confirm booking',
        });
      }
    }
  );
}
