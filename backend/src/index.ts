import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema.js';
import { register as registerOtpRoutes } from './routes/otp.js';
import { register as registerUserRoutes } from './routes/users.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication and storage
app.withAuth();
app.withStorage();

// Register routes AFTER app is configured
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerOtpRoutes(app, app.fastify);
registerUserRoutes(app, app.fastify);

await app.run();
app.logger.info('Application running with phone authentication system');
