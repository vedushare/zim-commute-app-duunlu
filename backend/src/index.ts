import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema.js';
import { register as registerOtpRoutes } from './routes/otp.js';
import { register as registerUserRoutes } from './routes/users.js';
import { register as registerVehicleRoutes } from './routes/vehicles.js';
import { register as registerRideRoutes } from './routes/rides.js';
import { register as registerBookingRoutes } from './routes/bookings.js';

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
registerVehicleRoutes(app, app.fastify);
registerRideRoutes(app, app.fastify);
registerBookingRoutes(app, app.fastify);

await app.run();
app.logger.info('Application running with phone authentication and ride-sharing system');
