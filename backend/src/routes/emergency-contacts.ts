import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/emergency-contacts - Create emergency contact
  fastify.post(
    '/api/emergency-contacts',
    {
      schema: {
        description: 'Create emergency contact',
        tags: ['emergency-contacts'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phoneNumber: { type: 'string' },
            relationship: { type: 'string' },
          },
          required: ['name', 'phoneNumber', 'relationship'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              phoneNumber: { type: 'string' },
              relationship: { type: 'string' },
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
      const { name, phoneNumber, relationship } = request.body as {
        name?: string;
        phoneNumber?: string;
        relationship?: string;
      };

      if (!name || !phoneNumber || !relationship) {
        app.logger.warn({ userId }, 'Missing required fields for emergency contact');
        return reply.status(400).send({
          success: false,
          message: 'Name, phone number, and relationship are required',
        });
      }

      app.logger.info(
        { userId, name, phoneNumber },
        'Creating emergency contact'
      );

      try {
        const [contact] = await app.db
          .insert(schema.emergencyContacts)
          .values({
            userId,
            name,
            phoneNumber,
            relationship,
          })
          .returning();

        app.logger.info(
          { userId, contactId: contact.id },
          'Emergency contact created successfully'
        );

        return {
          id: contact.id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          relationship: contact.relationship,
          createdAt: contact.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to create emergency contact'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to create emergency contact',
        });
      }
    }
  );

  // GET /api/emergency-contacts - Get user's emergency contacts
  fastify.get(
    '/api/emergency-contacts',
    {
      schema: {
        description: 'Get user emergency contacts',
        tags: ['emergency-contacts'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                phoneNumber: { type: 'string' },
                relationship: { type: 'string' },
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

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching emergency contacts');

      try {
        const contacts = await app.db.query.emergencyContacts.findMany({
          where: eq(schema.emergencyContacts.userId, userId),
        });

        app.logger.info(
          { userId, count: contacts.length },
          'Emergency contacts retrieved successfully'
        );

        return contacts.map(contact => ({
          id: contact.id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          relationship: contact.relationship,
          createdAt: contact.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to fetch emergency contacts'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch emergency contacts',
        });
      }
    }
  );

  // DELETE /api/emergency-contacts/:id - Delete emergency contact
  fastify.delete(
    '/api/emergency-contacts/:id',
    {
      schema: {
        description: 'Delete emergency contact',
        tags: ['emergency-contacts'],
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
          message: 'Contact ID is required',
        });
      }

      app.logger.info({ userId, contactId: id }, 'Deleting emergency contact');

      try {
        // Verify ownership
        const contact = await app.db.query.emergencyContacts.findFirst({
          where: eq(schema.emergencyContacts.id, id),
        });

        if (!contact) {
          app.logger.warn({ contactId: id }, 'Contact not found');
          return reply.status(404).send({
            success: false,
            message: 'Contact not found',
          });
        }

        if (contact.userId !== userId) {
          app.logger.warn(
            { userId, contactId: id, ownerId: contact.userId },
            'Unauthorized contact deletion attempt'
          );
          return reply.status(403).send({
            success: false,
            message: 'You do not have permission to delete this contact',
          });
        }

        await app.db
          .delete(schema.emergencyContacts)
          .where(eq(schema.emergencyContacts.id, id));

        app.logger.info({ userId, contactId: id }, 'Emergency contact deleted successfully');

        return {
          success: true,
          message: 'Emergency contact deleted successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId, contactId: id },
          'Failed to delete emergency contact'
        );
        return reply.status(500).send({
          success: false,
          message: 'Failed to delete emergency contact',
        });
      }
    }
  );
}
