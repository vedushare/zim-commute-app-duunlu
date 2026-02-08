import type { FastifyInstance } from 'fastify';
import type { App } from '../index.js';

// This file is deprecated - all verification routes have been consolidated into admin-moderation.ts
// Keeping this file with an empty register function for backward compatibility in index.ts

export function register(app: App, fastify: FastifyInstance) {
  // All admin routes are now handled by:
  // - admin-dashboard.ts (metrics and analytics)
  // - admin-users.ts (user management)
  // - admin-rides.ts (ride management)
  // - admin-config.ts (configuration)
  // - admin-moderation.ts (reports, SOS alerts, verification)
}
