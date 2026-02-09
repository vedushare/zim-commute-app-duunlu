
# ZimCommute - Developer Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app on physical device)

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies (if running locally)
cd backend
npm install
cd ..
```

### Running the App

```bash
# Start the Expo development server
npm run dev

# Or for specific platforms:
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## 📱 App Structure

```
ZimCommute/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── (home)/              # Home/Search screen
│   │   └── profile.tsx          # User profile
│   ├── auth/                    # Authentication screens
│   │   ├── phone-login.tsx      # Phone number input
│   │   ├── verify-otp.tsx       # OTP verification
│   │   └── profile-setup.tsx    # Profile completion
│   ├── rides/                   # Ride management
│   │   ├── post-ride.tsx        # Create ride
│   │   └── [id].tsx             # Ride details
│   ├── bookings/                # Booking management
│   │   └── my-bookings.tsx      # User bookings
│   ├── safety/                  # Trust & safety features
│   │   ├── verify-id.tsx        # ID verification
│   │   ├── emergency-contacts.tsx
│   │   ├── share-ride/[rideId].tsx
│   │   ├── rate-ride/[bookingId].tsx
│   │   └── report-user.tsx
│   ├── admin/                   # Admin screens
│   │   ├── users.tsx            # User management
│   │   ├── verification.tsx     # Document verification
│   │   ├── reports.tsx          # Report moderation
│   │   ├── sos-alerts.tsx       # SOS management
│   │   ├── rides.tsx            # Ride management
│   │   ├── configuration.tsx    # System config
│   │   └── analytics.tsx        # Analytics dashboard
│   └── vehicles/                # Vehicle management
│       └── add-vehicle.tsx      # Add vehicle
├── components/                  # Reusable components
│   ├── auth/                    # Auth components
│   ├── safety/                  # Safety components
│   ├── ui/                      # UI components
│   └── button.tsx               # Custom button
├── contexts/                    # React contexts
│   └── AuthContext.tsx          # Authentication state
├── utils/                       # Utility functions
│   ├── api.ts                   # API client
│   ├── ridesApi.ts              # Ride-specific API
│   ├── safetyApi.ts             # Safety API
│   └── adminApi.ts              # Admin API
├── types/                       # TypeScript types
│   ├── auth.ts                  # Auth types
│   ├── rides.ts                 # Ride types
│   ├── safety.ts                # Safety types
│   └── admin.ts                 # Admin types
├── constants/                   # App constants
│   └── zimbabwe.ts              # Zimbabwe-specific data
├── styles/                      # Styling
│   └── commonStyles.ts          # Common styles
└── app/integrations/supabase/   # Supabase integration
    ├── client.ts                # Supabase client
    └── types.ts                 # Database types
```

## 🔑 Key Concepts

### 1. Authentication Flow

```typescript
// Login with phone number
import { sendOTP, verifyOTP } from '@/utils/api';

// Step 1: Send OTP
await sendOTP('+263771234567');

// Step 2: Verify OTP
const response = await verifyOTP('+263771234567', '123456');
const { user } = response;

// Step 3: Token is automatically stored in SecureStore
// All subsequent API calls will include the token
```

### 2. Making API Calls

```typescript
import { authenticatedGet, authenticatedPost } from '@/utils/api';

// GET request
const rides = await authenticatedGet('/api/rides/my-rides');

// POST request
const newRide = await authenticatedPost('/api/rides', {
  origin: 'Harare',
  destination: 'Bulawayo',
  departureTime: '2024-02-10T08:00:00Z',
  // ... other fields
});
```

### 3. Using Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Text>Please log in</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user?.fullName}</Text>
      <Button onPress={signOut} title="Sign Out" />
    </View>
  );
}
```

### 4. Navigation

```typescript
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();

  const navigateToRide = (rideId: string) => {
    router.push(`/rides/${rideId}`);
  };

  return <Button onPress={() => navigateToRide('123')} title="View Ride" />;
}
```

### 5. Error Handling

```typescript
import { CustomModal } from '@/components/ui/CustomModal';

function MyComponent() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const handleAction = async () => {
    try {
      await authenticatedPost('/api/bookings', { /* data */ });
      setModalTitle('Success');
      setModalMessage('Booking created successfully!');
      setModalVisible(true);
    } catch (error: any) {
      setModalTitle('Error');
      setModalMessage(error.message || 'Something went wrong');
      setModalVisible(true);
    }
  };

  return (
    <>
      <Button onPress={handleAction} title="Book Ride" />
      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onConfirm={() => setModalVisible(false)}
      />
    </>
  );
}
```

## 🎨 Styling

### Using Common Styles

```typescript
import { colors } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
  },
});
```

### Zimbabwe Color Scheme

```typescript
// Green, Yellow, Black, Red (Zimbabwe flag colors)
colors.primary = '#006400';    // Green
colors.secondary = '#FFD700';  // Yellow
colors.accent = '#DC143C';     // Red
colors.background = '#FFFFFF'; // White
colors.text = '#000000';       // Black
```

## 🔐 Security Best Practices

1. **Never hardcode sensitive data** - Use environment variables
2. **Always validate user input** - Check for empty fields, valid formats
3. **Use HTTPS only** - Backend API uses HTTPS
4. **Store tokens securely** - Use SecureStore, not AsyncStorage
5. **Implement proper error handling** - Don't expose sensitive error details
6. **Check user permissions** - Verify user owns data before operations

## 📊 Database Schema Quick Reference

### Users Table
```typescript
{
  id: string;
  phoneNumber: string;
  fullName: string | null;
  email: string | null;
  profilePhotoUrl: string | null;
  userType: 'Passenger' | 'Driver' | null;
  homeCity: string | null;
  verificationLevel: 'PhoneVerified' | 'IDUploaded' | 'FullyVerified';
  role: 'user' | 'admin' | 'super_admin';
  walletBalance: number;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Rides Table
```typescript
{
  id: string;
  driverId: string;
  vehicleId: string;
  origin: string;
  destination: string;
  viaPoints: string[] | null;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  instantBook: boolean;
  ladiesOnly: boolean;
  acceptsParcels: boolean;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

### Bookings Table
```typescript
{
  id: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  bookingCode: string;
  createdAt: string;
  updatedAt: string;
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] User can register with phone number
- [ ] User can verify OTP
- [ ] User can complete profile setup
- [ ] Driver can add vehicle
- [ ] Driver can post ride
- [ ] Passenger can search rides
- [ ] Passenger can book ride
- [ ] User can view bookings
- [ ] User can upload ID documents
- [ ] User can add emergency contacts
- [ ] User can share ride link
- [ ] User can rate completed ride
- [ ] User can report safety issues
- [ ] Admin can view dashboard
- [ ] Admin can verify documents
- [ ] Admin can manage users

### API Testing with cURL

```bash
# Test OTP send
curl -X POST https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+263771234567"}'

# Test ride search (replace TOKEN with actual JWT)
curl -X GET "https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev/api/rides/search?origin=Harare&destination=Bulawayo" \
  -H "Authorization: Bearer TOKEN"
```

## 🐛 Common Issues & Solutions

### Issue: "Authentication required" error
**Solution**: User is not logged in. Redirect to login screen.

### Issue: "Network request failed"
**Solution**: Check internet connection or backend URL in `app.json`.

### Issue: App crashes on startup
**Solution**: Clear cache with `expo start -c` or reinstall dependencies.

### Issue: Changes not reflecting
**Solution**: Restart Metro bundler or clear cache.

### Issue: TypeScript errors
**Solution**: Run `npx tsc --noEmit` to check for type errors.

## 📚 Additional Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Documentation**: https://reactnative.dev/
- **Supabase Documentation**: https://supabase.com/docs
- **Drizzle ORM Documentation**: https://orm.drizzle.team/
- **TypeScript Documentation**: https://www.typescriptlang.org/docs/

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request with clear description

## 📞 Support

For issues or questions:
- Check the documentation first
- Review error logs in console
- Check backend logs if API-related
- Contact the development team

---

**Happy Coding! 🚀**
