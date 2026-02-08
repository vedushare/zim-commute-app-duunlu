import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema.js';
import { register as registerOtpRoutes } from './routes/otp.js';
import { register as registerUserRoutes } from './routes/users.js';
import { register as registerVehicleRoutes } from './routes/vehicles.js';
import { register as registerRideRoutes } from './routes/rides.js';
import { register as registerBookingRoutes } from './routes/bookings.js';
import { register as registerVerificationRoutes } from './routes/verification.js';
import { register as registerEmergencyContactsRoutes } from './routes/emergency-contacts.js';
import { register as registerRatingsRoutes } from './routes/ratings.js';
import { register as registerReportsRoutes } from './routes/reports.js';
import { register as registerSafetyRoutes } from './routes/safety.js';
import { register as registerAdminRoutes } from './routes/admin.js';
import { register as registerAdminDashboardRoutes } from './routes/admin-dashboard.js';
import { register as registerAdminUsersRoutes } from './routes/admin-users.js';
import { register as registerAdminRidesRoutes } from './routes/admin-rides.js';
import { register as registerAdminConfigRoutes } from './routes/admin-config.js';
import { register as registerAdminModerationRoutes } from './routes/admin-moderation.js';

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
registerVerificationRoutes(app, app.fastify);
registerEmergencyContactsRoutes(app, app.fastify);
registerRatingsRoutes(app, app.fastify);
registerReportsRoutes(app, app.fastify);
registerSafetyRoutes(app, app.fastify);
registerAdminRoutes(app, app.fastify);
registerAdminDashboardRoutes(app, app.fastify);
registerAdminUsersRoutes(app, app.fastify);
registerAdminRidesRoutes(app, app.fastify);
registerAdminConfigRoutes(app, app.fastify);
registerAdminModerationRoutes(app, app.fastify);

await app.run();
app.logger.info('Application running with phone authentication, ride-sharing, trust & safety, and admin features');
