# ZimCommute

A ride-sharing and commute app built for Zimbabwe, connecting drivers and passengers across the country.

## Features

- 🚗 **Ride sharing** — drivers broadcast routes, passengers book seats
- 📍 **Real-time location tracking** — live GPS broadcast via Supabase Realtime
- 💬 **In-ride chat** — passenger ↔ driver messaging per trip
- 🔐 **OTP phone authentication** — SMS-based login flow
- 💳 **Wallet system** — in-app balance for cashless payments
- 🛡️ **Safety features** — SOS alerts and emergency contacts
- ⭐ **Ratings & reviews** — post-ride feedback for drivers and passengers
- 🖥️ **Admin panel** — web-based dashboard for platform management

## Screenshots

> _Screenshots and demo GIFs coming soon._

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile app | [Expo](https://expo.dev) + [React Native](https://reactnative.dev) + TypeScript |
| Backend API | [Fastify](https://fastify.dev) (Node.js) with Drizzle ORM |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| Realtime | Supabase Realtime (WebSockets) |
| Auth | Better Auth + JWT |
| SMS / OTP | Configurable SMS provider |

## Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [npm](https://www.npmjs.com) v9 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- A [Supabase](https://supabase.com) project

## Installation

```bash
# Clone the repository
git clone https://github.com/vedushare/zim-commute-app-duunlu.git
cd zim-commute-app-duunlu

# Install mobile app dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

## Environment Variables

### Mobile app

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Then open `app.json` and update the `extra` section with your Supabase credentials:

```json
"extra": {
  "backendUrl": "http://localhost:3000",
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseAnonKey": "your-supabase-anon-key"
}
```

### Backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL, JWT secrets, and SMS provider credentials
```

## Running the App

```bash
# Start the Expo development server
npm run dev

# Run on Android emulator / device
npm run android

# Run on iOS simulator / device
npm run ios

# Run in web browser
npm run web
```

## Backend Setup

```bash
cd backend

# Apply database migrations
npm run db:migrate

# Start the development server (with hot-reload)
npm run dev
```

The backend API will be available at `http://localhost:3000` by default.

## Project Structure

```
zim-commute-app-duunlu/
├── app/                        # Expo Router screens
│   ├── integrations/supabase/  # Supabase client & type definitions
│   ├── rides/                  # Ride flow screens
│   ├── chat/                   # In-ride chat
│   └── admin*/                 # Admin panel screens
├── backend/                    # Fastify API server
│   └── src/
│       ├── db/                 # Drizzle ORM schema & migrations
│       ├── routes/             # API route handlers
│       └── utils/              # Shared utilities (SMS, auth, etc.)
├── utils/                      # Frontend utilities (API client, storage)
├── components/                 # Reusable React Native components
├── supabase/                   # Supabase migrations
├── app.json                    # Expo configuration (includes extra config)
├── .env.example                # Environment variable template
└── backend/.env.example        # Backend environment variable template
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please ensure your code passes the linter before submitting:

```bash
npm run lint
```

## License

[MIT](./LICENSE)

