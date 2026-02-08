import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte, or, like, gt } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

// Zimbabwe city coordinates
const ZIMBABWE_CITIES = {
  Harare: { lat: -17.8252, lng: 31.0335 },
  Bulawayo: { lat: -20.1500, lng: 28.5833 },
  Mutare: { lat: -18.9707, lng: 32.6704 },
  Gweru: { lat: -19.4500, lng: 29.8167 },
};

type CityName = keyof typeof ZIMBABWE_CITIES;

// Calculate distance using Haversine formula (in km)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate price based on distance
function calculatePrice(distance: number): number {
  const PRICE_PER_KM = 0.15;
  const FUEL_SURCHARGE = 2.0;
  return Math.round((distance * PRICE_PER_KM + FUEL_SURCHARGE) * 100) / 100;
}

// WebSocket clients for real-time ride updates
const rideClients = new Map<string, Set<any>>();

function broadcastRideUpdate(rideId: string, data: any) {
  const clients = rideClients.get(rideId);
  if (clients) {
    for (const client of clients) {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(data));
      }
    }
  }
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/rides - Create a new ride
  fastify.post(
    '/api/rides',
    {
      schema: {
        description: 'Create a new ride',
        tags: ['rides'],
        body: {
          type: 'object',
          properties: {
            vehicleId: { type: 'string' },
            origin: { type: 'string' },
            destination: { type: 'string' },
            viaPoints: { type: 'array', items: { type: 'string' } },
            departureTime: { type: 'string' },
            arrivalTime: { type: 'string' },
            totalSeats: { type: 'integer' },
            pricePerSeat: { type: 'number' },
            instantBook: { type: 'boolean' },
            ladiesOnly: { type: 'boolean' },
            acceptsParcels: { type: 'boolean' },
          },
          required: ['vehicleId', 'origin', 'destination', 'departureTime', 'arrivalTime', 'totalSeats', 'pricePerSeat'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              driverId: { type: 'string' },
              vehicleId: { type: 'string' },
              origin: { type: 'string' },
              destination: { type: 'string' },
              viaPoints: { type: 'array' },
              departureTime: { type: 'string' },
              arrivalTime: { type: 'string' },
              totalSeats: { type: 'integer' },
              availableSeats: { type: 'integer' },
              pricePerSeat: { type: 'string' },
              instantBook: { type: 'boolean' },
              ladiesOnly: { type: 'boolean' },
              acceptsParcels: { type: 'boolean' },
              status: { type: 'string' },
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

      const driverId = session.user.id;
      const {
        vehicleId,
        origin,
        destination,
        viaPoints,
        departureTime,
        arrivalTime,
        totalSeats,
        pricePerSeat,
        instantBook,
        ladiesOnly,
        acceptsParcels,
      } = request.body as any;

      // Validation
      if (
        !vehicleId ||
        !origin ||
        !destination ||
        !departureTime ||
        !arrivalTime ||
        !totalSeats ||
        pricePerSeat === undefined
      ) {
        app.logger.warn({ driverId }, 'Missing required fields for ride creation');
        return reply.status(400).send({
          success: false,
          message: 'All required fields must be provided',
        });
      }

      app.logger.info(
        { driverId, origin, destination, totalSeats },
        'Creating ride'
      );

      try {
        // Verify vehicle ownership
        const vehicle = await app.db.query.vehicles.findFirst({
          where: eq(schema.vehicles.id, vehicleId),
        });

        if (!vehicle) {
          app.logger.warn({ driverId, vehicleId }, 'Vehicle not found');
          return reply.status(404).send({
            success: false,
            message: 'Vehicle not found',
          });
        }

        if (vehicle.userId !== driverId) {
          app.logger.warn(
            { driverId, vehicleId, ownerId: vehicle.userId },
            'Unauthorized ride creation with vehicle'
          );
          return reply.status(403).send({
            success: false,
            message: 'You do not own this vehicle',
          });
        }

        const [ride] = await app.db
          .insert(schema.rides)
          .values({
            driverId,
            vehicleId,
            origin,
            destination,
            viaPoints: viaPoints || [],
            departureTime: new Date(departureTime),
            arrivalTime: new Date(arrivalTime),
            totalSeats,
            availableSeats: totalSeats,
            pricePerSeat: pricePerSeat.toString(),
            instantBook: instantBook || false,
            ladiesOnly: ladiesOnly || false,
            acceptsParcels: acceptsParcels || false,
            status: 'active',
          })
          .returning();

        app.logger.info(
          { rideId: ride.id, driverId, origin, destination },
          'Ride created successfully'
        );

        return {
          id: ride.id,
          driverId: ride.driverId,
          vehicleId: ride.vehicleId,
          origin: ride.origin,
          destination: ride.destination,
          viaPoints: ride.viaPoints,
          departureTime: ride.departureTime.toISOString(),
          arrivalTime: ride.arrivalTime.toISOString(),
          totalSeats: ride.totalSeats,
          availableSeats: ride.availableSeats,
          pricePerSeat: ride.pricePerSeat,
          instantBook: ride.instantBook,
          ladiesOnly: ride.ladiesOnly,
          acceptsParcels: ride.acceptsParcels,
          status: ride.status,
          createdAt: ride.createdAt.toISOString(),
          updatedAt: ride.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error(
          { err: error, driverId },
          'Failed to create ride'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create ride',
        });
      }
    }
  );

  // GET /api/rides/my-rides - Get driver's rides
  fastify.get(
    '/api/rides/my-rides',
    {
      schema: {
        description: 'Get user rides as driver',
        tags: ['rides'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                origin: { type: 'string' },
                destination: { type: 'string' },
                departureTime: { type: 'string' },
                availableSeats: { type: 'integer' },
                pricePerSeat: { type: 'string' },
                status: { type: 'string' },
                bookingsCount: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const driverId = session.user.id;
      app.logger.info({ driverId }, 'Fetching driver rides');

      try {
        const driverRides = await app.db.query.rides.findMany({
          where: eq(schema.rides.driverId, driverId),
        });

        // Get booking counts for each ride
        const ridesWithBookings = await Promise.all(
          driverRides.map(async (ride) => {
            const bookingCount = await app.db
              .select({ count: schema.bookings.id })
              .from(schema.bookings)
              .where(
                and(
                  eq(schema.bookings.rideId, ride.id),
                  or(
                    eq(schema.bookings.status, 'confirmed'),
                    eq(schema.bookings.status, 'pending')
                  )
                )
              )
              .then(r => r[0]?.count || 0);

            return {
              id: ride.id,
              origin: ride.origin,
              destination: ride.destination,
              departureTime: ride.departureTime.toISOString(),
              availableSeats: ride.availableSeats,
              pricePerSeat: ride.pricePerSeat,
              status: ride.status,
              bookingsCount: bookingCount,
            };
          })
        );

        app.logger.info(
          { driverId, count: ridesWithBookings.length },
          'Driver rides retrieved successfully'
        );

        return ridesWithBookings;
      } catch (error) {
        app.logger.error(
          { err: error, driverId },
          'Failed to fetch driver rides'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch rides',
        });
      }
    }
  );

  // GET /api/rides/search - Search rides
  fastify.get(
    '/api/rides/search',
    {
      schema: {
        description: 'Search available rides',
        tags: ['rides'],
        querystring: {
          type: 'object',
          properties: {
            origin: { type: 'string' },
            destination: { type: 'string' },
            date: { type: 'string' },
            minPrice: { type: 'number' },
            maxPrice: { type: 'number' },
            ladiesOnly: { type: 'boolean' },
            verifiedDriversOnly: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
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
                acceptsParcels: { type: 'boolean' },
                driver: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    fullName: { type: ['string', 'null'] },
                    verificationLevel: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const {
        origin,
        destination,
        date,
        minPrice,
        maxPrice,
        ladiesOnly,
        verifiedDriversOnly,
      } = request.query as {
        origin?: string;
        destination?: string;
        date?: string;
        minPrice?: string;
        maxPrice?: string;
        ladiesOnly?: string;
        verifiedDriversOnly?: string;
      };

      app.logger.info(
        { origin, destination, date },
        'Searching rides'
      );

      try {
        let conditions: any[] = [
          eq(schema.rides.status, 'active'),
          gt(schema.rides.availableSeats, 0),
        ];

        // Origin and destination filtering (using LIKE for partial matching)
        if (origin) {
          conditions.push(
            or(
              like(schema.rides.origin, `%${origin}%`),
              like(schema.rides.destination, `%${origin}%`)
            )
          );
        }
        if (destination) {
          conditions.push(
            or(
              like(schema.rides.origin, `%${destination}%`),
              like(schema.rides.destination, `%${destination}%`)
            )
          );
        }

        // Price filtering
        if (minPrice) {
          const minPriceNum = parseFloat(minPrice);
          conditions.push(
            gte(schema.rides.pricePerSeat, minPriceNum.toString())
          );
        }
        if (maxPrice) {
          const maxPriceNum = parseFloat(maxPrice);
          conditions.push(
            lte(schema.rides.pricePerSeat, maxPriceNum.toString())
          );
        }

        // Ladies only filter
        if (ladiesOnly === 'true') {
          conditions.push(eq(schema.rides.ladiesOnly, true));
        }

        // Fetch all rides matching criteria
        const allRides = await app.db.query.rides.findMany({
          where: and(...conditions),
          with: {
            driver: true,
          },
        });

        // Filter by date if provided
        let filteredRides = allRides;
        if (date) {
          const searchDate = new Date(date);
          const nextDay = new Date(searchDate);
          nextDay.setDate(nextDay.getDate() + 1);

          filteredRides = allRides.filter(ride => {
            const rideDate = new Date(ride.departureTime);
            return rideDate >= searchDate && rideDate < nextDay;
          });
        }

        // Filter by verified drivers if requested
        if (verifiedDriversOnly === 'true') {
          filteredRides = filteredRides.filter(ride => {
            if (!ride.driver) return false;
            const driver = ride.driver as any;
            return driver.verificationLevel === 'FullyVerified' || driver.verificationLevel === 'IDUploaded';
          });
        }

        app.logger.info(
          { origin, destination, count: filteredRides.length },
          'Rides search completed'
        );

        return filteredRides
          .filter(ride => ride.driver !== null && ride.driver !== undefined)
          .map(ride => ({
            id: ride.id,
            origin: ride.origin,
            destination: ride.destination,
            departureTime: ride.departureTime.toISOString(),
            availableSeats: ride.availableSeats,
            pricePerSeat: ride.pricePerSeat,
            instantBook: ride.instantBook,
            ladiesOnly: ride.ladiesOnly,
            acceptsParcels: ride.acceptsParcels,
            driver: {
              id: (ride.driver as any).id,
              fullName: (ride.driver as any).fullName,
              verificationLevel: (ride.driver as any).verificationLevel,
            },
          }));
      } catch (error) {
        app.logger.error(
          { err: error, origin, destination },
          'Failed to search rides'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to search rides',
        });
      }
    }
  );

  // GET /api/rides/:id - Get ride details
  fastify.get(
    '/api/rides/:id',
    {
      schema: {
        description: 'Get ride details',
        tags: ['rides'],
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
              id: { type: 'string' },
              origin: { type: 'string' },
              destination: { type: 'string' },
              departureTime: { type: 'string' },
              arrivalTime: { type: 'string' },
              totalSeats: { type: 'integer' },
              availableSeats: { type: 'integer' },
              pricePerSeat: { type: 'string' },
              instantBook: { type: 'boolean' },
              ladiesOnly: { type: 'boolean' },
              acceptsParcels: { type: 'boolean' },
              status: { type: 'string' },
              driver: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  fullName: { type: ['string', 'null'] },
                  phoneNumber: { type: 'string' },
                  verificationLevel: { type: 'string' },
                },
              },
              vehicle: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  make: { type: 'string' },
                  model: { type: 'string' },
                  color: { type: 'string' },
                  licensePlate: { type: 'string' },
                  year: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id?: string };

      if (!id) {
        return reply.status(400).send({
          success: false,
          message: 'Ride ID is required',
        });
      }

      app.logger.info({ rideId: id }, 'Fetching ride details');

      try {
        const ride = await app.db.query.rides.findFirst({
          where: eq(schema.rides.id, id),
          with: {
            driver: true,
            vehicle: true,
          },
        });

        if (!ride) {
          app.logger.warn({ rideId: id }, 'Ride not found');
          return reply.status(404).send({
            success: false,
            message: 'Ride not found',
          });
        }

        app.logger.info({ rideId: id }, 'Ride details retrieved successfully');

        return {
          id: ride.id,
          origin: ride.origin,
          destination: ride.destination,
          departureTime: ride.departureTime.toISOString(),
          arrivalTime: ride.arrivalTime.toISOString(),
          totalSeats: ride.totalSeats,
          availableSeats: ride.availableSeats,
          pricePerSeat: ride.pricePerSeat,
          instantBook: ride.instantBook,
          ladiesOnly: ride.ladiesOnly,
          acceptsParcels: ride.acceptsParcels,
          status: ride.status,
          driver: {
            id: (ride.driver as any).id,
            fullName: (ride.driver as any).fullName,
            phoneNumber: (ride.driver as any).phoneNumber,
            verificationLevel: (ride.driver as any).verificationLevel,
          },
          vehicle: {
            id: (ride.vehicle as any).id,
            make: (ride.vehicle as any).make,
            model: (ride.vehicle as any).model,
            color: (ride.vehicle as any).color,
            licensePlate: (ride.vehicle as any).licensePlate,
            year: (ride.vehicle as any).year,
          },
        };
      } catch (error) {
        app.logger.error(
          { err: error, rideId: id },
          'Failed to fetch ride details'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch ride details',
        });
      }
    }
  );

  // PUT /api/rides/:id - Update ride
  fastify.put(
    '/api/rides/:id',
    {
      schema: {
        description: 'Update a ride',
        tags: ['rides'],
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
            pricePerSeat: { type: 'number' },
            instantBook: { type: 'boolean' },
            ladiesOnly: { type: 'boolean' },
            acceptsParcels: { type: 'boolean' },
            status: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              pricePerSeat: { type: 'string' },
              status: { type: 'string' },
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
          message: 'Ride ID is required',
        });
      }

      const { pricePerSeat, instantBook, ladiesOnly, acceptsParcels, status } =
        request.body as any;

      app.logger.info({ rideId: id, driverId }, 'Updating ride');

      try {
        // Verify ownership
        const ride = await app.db.query.rides.findFirst({
          where: eq(schema.rides.id, id),
        });

        if (!ride) {
          app.logger.warn({ rideId: id }, 'Ride not found');
          return reply.status(404).send({
            success: false,
            message: 'Ride not found',
          });
        }

        if (ride.driverId !== driverId) {
          app.logger.warn(
            { driverId, rideId: id, ownerId: ride.driverId },
            'Unauthorized ride update attempt'
          );
          return reply.status(403).send({
            success: false,
            message: 'You do not have permission to update this ride',
          });
        }

        const updateData: any = { updatedAt: new Date() };
        if (pricePerSeat !== undefined) updateData.pricePerSeat = pricePerSeat.toString();
        if (instantBook !== undefined) updateData.instantBook = instantBook;
        if (ladiesOnly !== undefined) updateData.ladiesOnly = ladiesOnly;
        if (acceptsParcels !== undefined) updateData.acceptsParcels = acceptsParcels;
        if (status !== undefined) updateData.status = status;

        const [updatedRide] = await app.db
          .update(schema.rides)
          .set(updateData)
          .where(eq(schema.rides.id, id))
          .returning();

        app.logger.info({ rideId: id, driverId }, 'Ride updated successfully');

        return {
          id: updatedRide.id,
          pricePerSeat: updatedRide.pricePerSeat,
          status: updatedRide.status,
        };
      } catch (error) {
        app.logger.error(
          { err: error, driverId, rideId: id },
          'Failed to update ride'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to update ride',
        });
      }
    }
  );

  // DELETE /api/rides/:id - Cancel ride
  fastify.delete(
    '/api/rides/:id',
    {
      schema: {
        description: 'Cancel a ride',
        tags: ['rides'],
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
          message: 'Ride ID is required',
        });
      }

      app.logger.info({ rideId: id, driverId }, 'Cancelling ride');

      try {
        // Verify ownership
        const ride = await app.db.query.rides.findFirst({
          where: eq(schema.rides.id, id),
        });

        if (!ride) {
          app.logger.warn({ rideId: id }, 'Ride not found');
          return reply.status(404).send({
            success: false,
            message: 'Ride not found',
          });
        }

        if (ride.driverId !== driverId) {
          app.logger.warn(
            { driverId, rideId: id, ownerId: ride.driverId },
            'Unauthorized ride cancellation attempt'
          );
          return reply.status(403).send({
            success: false,
            message: 'You do not have permission to cancel this ride',
          });
        }

        await app.db
          .update(schema.rides)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(schema.rides.id, id));

        app.logger.info({ rideId: id, driverId }, 'Ride cancelled successfully');

        // Broadcast cancellation to real-time clients
        broadcastRideUpdate(id, {
          type: 'ride_cancelled',
          rideId: id,
        });

        return {
          success: true,
          message: 'Ride cancelled successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, driverId, rideId: id },
          'Failed to cancel ride'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to cancel ride',
        });
      }
    }
  );

  // GET /api/rides/calculate-price - Calculate price for route
  fastify.get(
    '/api/rides/calculate-price',
    {
      schema: {
        description: 'Calculate ride price',
        tags: ['rides'],
        querystring: {
          type: 'object',
          properties: {
            origin: { type: 'string' },
            destination: { type: 'string' },
          },
          required: ['origin', 'destination'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              distance: { type: 'number' },
              suggestedPrice: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { origin, destination } = request.query as {
        origin?: string;
        destination?: string;
      };

      if (!origin || !destination) {
        app.logger.warn({}, 'Missing origin or destination in price calculation');
        return reply.status(400).send({
          success: false,
          message: 'Origin and destination are required',
        });
      }

      app.logger.info({ origin, destination }, 'Calculating ride price');

      try {
        // Get coordinates for origin and destination
        const originCoords = ZIMBABWE_CITIES[origin as CityName];
        const destCoords = ZIMBABWE_CITIES[destination as CityName];

        if (!originCoords || !destCoords) {
          app.logger.warn(
            { origin, destination },
            'Unknown city in price calculation'
          );
          return reply.status(400).send({
            success: false,
            message: 'Origin or destination city not recognized. Available cities: ' +
              Object.keys(ZIMBABWE_CITIES).join(', '),
          });
        }

        // Calculate distance
        const distance = calculateDistance(
          originCoords.lat,
          originCoords.lng,
          destCoords.lat,
          destCoords.lng
        );

        // Calculate suggested price
        const suggestedPrice = calculatePrice(distance);

        app.logger.info(
          { origin, destination, distance, suggestedPrice },
          'Price calculated successfully'
        );

        return {
          distance: Math.round(distance * 100) / 100,
          suggestedPrice,
        };
      } catch (error) {
        app.logger.error(
          { err: error, origin, destination },
          'Failed to calculate price'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to calculate price',
        });
      }
    }
  );

  // WebSocket for real-time ride updates
  fastify.route({
    method: 'GET',
    url: '/ws/rides/:rideId',
    schema: {
      description: 'WebSocket for real-time ride updates',
      tags: ['websocket'],
    },
    wsHandler: (socket, request) => {
      const rideId = (request.params as any).rideId;

      app.logger.info({ rideId }, 'WebSocket client connected for ride updates');

      if (!rideClients.has(rideId)) {
        rideClients.set(rideId, new Set());
      }
      rideClients.get(rideId)!.add(socket);

      socket.on('close', () => {
        const clients = rideClients.get(rideId);
        if (clients) {
          clients.delete(socket);
          if (clients.size === 0) {
            rideClients.delete(rideId);
          }
        }
        app.logger.info({ rideId }, 'WebSocket client disconnected');
      });
    },
    handler: async (request, reply) => {
      return { protocol: 'ws', path: `/ws/rides/${(request.params as any).rideId}` };
    },
  });
}
