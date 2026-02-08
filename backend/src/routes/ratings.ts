import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, avg, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/ratings - Create rating
  fastify.post(
    '/api/ratings',
    {
      schema: {
        description: 'Create a rating for a ride',
        tags: ['ratings'],
        body: {
          type: 'object',
          properties: {
            rideId: { type: 'string' },
            bookingId: { type: 'string' },
            ratedUserId: { type: 'string' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
          },
          required: ['rideId', 'ratedUserId', 'rating'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              rating: { type: 'integer' },
              comment: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const raterId = session.user.id;
      const { rideId, bookingId, ratedUserId, rating, comment } = request.body as {
        rideId?: string;
        bookingId?: string;
        ratedUserId?: string;
        rating?: number;
        comment?: string;
      };

      if (!rideId || !ratedUserId || !rating) {
        app.logger.warn({ raterId }, 'Missing required fields for rating');
        return reply.status(400).send({
          success: false,
          message: 'Ride ID, rated user ID, and rating are required',
        });
      }

      if (rating < 1 || rating > 5) {
        app.logger.warn({ raterId, rating }, 'Invalid rating value');
        return reply.status(400).send({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      app.logger.info(
        { raterId, ratedUserId, rideId, rating },
        'Creating rating'
      );

      try {
        // Verify ride exists
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

        // Verify rater participated in the ride
        if (ride.driverId !== raterId) {
          // Check if rater is a passenger on this ride
          const booking = await app.db.query.bookings.findFirst({
            where: and(
              eq(schema.bookings.rideId, rideId),
              eq(schema.bookings.passengerId, raterId)
            ),
          });

          if (!booking) {
            app.logger.warn(
              { raterId, rideId },
              'Rater did not participate in this ride'
            );
            return reply.status(403).send({
              success: false,
              message: 'You did not participate in this ride',
            });
          }
        }

        // Check if rating already exists
        const existingRating = await app.db.query.ratings.findFirst({
          where: and(
            eq(schema.ratings.raterId, raterId),
            eq(schema.ratings.rideId, rideId),
            eq(schema.ratings.ratedUserId, ratedUserId)
          ),
        });

        if (existingRating) {
          app.logger.warn(
            { raterId, rideId, ratedUserId },
            'Rating already exists for this combination'
          );
          return reply.status(400).send({
            success: false,
            message: 'You have already rated this user for this ride',
          });
        }

        // Create rating
        const [newRating] = await app.db
          .insert(schema.ratings)
          .values({
            rideId,
            bookingId: bookingId || null,
            raterId,
            ratedUserId,
            rating,
            comment: comment || null,
          })
          .returning();

        app.logger.info(
          { ratingId: newRating.id, raterId, ratedUserId },
          'Rating created successfully'
        );

        return {
          id: newRating.id,
          rating: newRating.rating,
          comment: newRating.comment,
          createdAt: newRating.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error(
          { err: error, raterId },
          'Failed to create rating'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create rating',
        });
      }
    }
  );

  // GET /api/ratings/user/:userId - Get ratings for a user
  fastify.get(
    '/api/ratings/user/:userId',
    {
      schema: {
        description: 'Get ratings for a user',
        tags: ['ratings'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              averageRating: { type: 'number' },
              totalRatings: { type: 'integer' },
              ratings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    rating: { type: 'integer' },
                    comment: { type: ['string', 'null'] },
                    raterName: { type: ['string', 'null'] },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.params as { userId?: string };

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      app.logger.info({ userId }, 'Fetching user ratings');

      try {
        // Verify user exists
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

        // Get ratings for this user
        const userRatings = await app.db.query.ratings.findMany({
          where: eq(schema.ratings.ratedUserId, userId),
        });

        // Get rater details for each rating
        const ratingsWithDetails = await Promise.all(
          userRatings.map(async (rating) => {
            const rater = await app.db.query.users.findFirst({
              where: eq(schema.users.id, rating.raterId),
            });

            return {
              id: rating.id,
              rating: rating.rating,
              comment: rating.comment,
              raterName: rater?.fullName || null,
              createdAt: rating.createdAt.toISOString(),
            };
          })
        );

        // Calculate average rating
        const averageRating = userRatings.length > 0
          ? Math.round(
              (userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length) * 10
            ) / 10
          : 0;

        app.logger.info(
          { userId, totalRatings: userRatings.length, averageRating },
          'User ratings retrieved successfully'
        );

        return {
          averageRating,
          totalRatings: userRatings.length,
          ratings: ratingsWithDetails,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to fetch user ratings'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch ratings',
        });
      }
    }
  );

  // GET /api/ratings/my-ratings - Get ratings given and received
  fastify.get(
    '/api/ratings/my-ratings',
    {
      schema: {
        description: 'Get my ratings (given and received)',
        tags: ['ratings'],
        response: {
          200: {
            type: 'object',
            properties: {
              averageRatingReceived: { type: 'number' },
              ratingsReceived: { type: 'integer' },
              ratingsGiven: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching my ratings');

      try {
        // Get ratings received
        const ratingsReceived = await app.db.query.ratings.findMany({
          where: eq(schema.ratings.ratedUserId, userId),
        });

        // Get ratings given
        const ratingsGiven = await app.db.query.ratings.findMany({
          where: eq(schema.ratings.raterId, userId),
        });

        // Calculate average rating received
        const averageRatingReceived = ratingsReceived.length > 0
          ? Math.round(
              (ratingsReceived.reduce((sum, r) => sum + r.rating, 0) / ratingsReceived.length) * 10
            ) / 10
          : 0;

        app.logger.info(
          { userId, received: ratingsReceived.length, given: ratingsGiven.length },
          'My ratings retrieved successfully'
        );

        return {
          averageRatingReceived,
          ratingsReceived: ratingsReceived.length,
          ratingsGiven: ratingsGiven.length,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to fetch my ratings'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch ratings',
        });
      }
    }
  );
}
