
# ZimCommute

A Zimbabwean carpooling platform connecting drivers and passengers for safe, affordable rides across Zimbabwe.

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

## Features

### For Passengers
- 🔍 Search for rides by route and date
- 📱 Book seats instantly
- 💬 Contact drivers via WhatsApp
- ⭐ Rate and review rides
- 🔒 Safety features (SOS button, emergency contacts)
- 💰 Wallet system for payments

### For Drivers
- 🚗 Post rides with flexible pricing
- 👥 Manage bookings
- 💵 Track earnings
- ✅ Get verified with ID documents
- 📊 View ride history

### Admin Panel
- 📊 **Web-Based Dashboard**: Access admin panel through any web browser
- 👥 User management (view OTP, ban/unban, adjust wallets)
- ✅ Verification queue (approve/reject ID documents)
- 🚗 Ride management (cancel, adjust pricing)
- 🚨 SOS alert monitoring
- 📋 Report review and moderation
- ⚙️ Configuration (routes, pricing, promo codes)
- 📈 Analytics and data export

## Admin Panel Access

### Web Interface
Access the admin panel through your web browser:

**Development**: `http://localhost:8081/admin-web`  
**Production**: `https://your-app-domain.com/admin-web`

### Requirements
- Admin or super_admin role
- Valid login credentials

### Features
- Real-time metrics dashboard
- User management with OTP access
- Verification queue review
- Ride and booking management
- SOS alert monitoring
- Report moderation
- Configuration management
- Analytics and exports

For detailed instructions, see [ADMIN_WEB_ACCESS.md](./ADMIN_WEB_ACCESS.md)

### Mobile Admin
Admin features are also available in the mobile app:
1. Open the app
2. Go to Profile tab
3. Tap "Admin Dashboard" (only visible to admins)

## Technology Stack

- **Frontend**: React Native + Expo 54
- **Backend**: Fastify + Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Better Auth
- **Maps**: Leaflet (web) / React Native Maps
- **Offline Support**: AsyncStorage + Sync Manager

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd zim-commute-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with:
```
EXPO_PUBLIC_BACKEND_URL=your-backend-url
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

4. Start the development server
```bash
npm run dev
```

### Running on Different Platforms

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── admin/             # Admin screens (mobile)
│   ├── auth/              # Authentication screens
│   ├── rides/             # Ride-related screens
│   ├── safety/            # Safety features
│   └── admin-web.tsx      # Web admin panel entry
├── components/            # Reusable components
├── contexts/              # React contexts (Auth, etc.)
├── utils/                 # Utility functions and API clients
├── types/                 # TypeScript type definitions
├── backend/               # Backend API (Fastify)
│   ├── src/routes/        # API routes
│   └── src/db/            # Database schema
└── assets/                # Images, fonts, etc.
```

## Admin Setup

### Creating the First Admin

1. **Via Supabase SQL Editor**:
```sql
UPDATE users 
SET role = 'super_admin' 
WHERE phone_number = '+263XXXXXXXXX';
```

2. **Via Mobile App** (if you already have a super_admin):
- Log in as super_admin
- Go to Profile → Admin Dashboard → User Management
- Find the user and update their role

### Admin Roles

- **super_admin**: Full access to all features, can promote other admins
- **admin**: Access to most features, cannot promote other admins
- **user**: Regular user (driver or passenger)

## Safety Features

- 🚨 SOS button for emergencies
- 📞 Emergency contacts management
- 🆔 ID verification for drivers
- ⭐ Rating and review system
- 📋 Report system for incidents
- 🔒 Secure authentication

## Offline Support

The app includes offline-first architecture:
- Cached ride searches
- Pending operations queue
- Automatic sync when online
- Offline indicators

## Documentation

- [Admin Setup Guide](./ADMIN_SETUP_GUIDE.md)
- [Admin Web Access](./ADMIN_WEB_ACCESS.md)
- [Backend Integration](./BACKEND_INTEGRATION.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

## Support

For issues or questions:
1. Check the documentation files
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Contact the development team

## License

Copyright © 2024 ZimCommute. All rights reserved.

---

Made with 💙 for creativity using [Natively.dev](https://natively.dev)
