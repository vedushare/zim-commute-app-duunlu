
# ZimCommute Testing Guide

## Testing Strategy

### 1. Unit Tests (Components & Utils)
### 2. Integration Tests (User Flows)
### 3. Performance Tests (Load & Stress)
### 4. Manual Testing (QA Checklist)

---

## 1. Unit Tests

### Setup
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

### Test Files Structure
```
__tests__/
├── components/
│   ├── Button.test.tsx
│   ├── OptimizedImage.test.tsx
│   └── LazyRideList.test.tsx
├── utils/
│   ├── imageCompression.test.ts
│   ├── offlineStorage.test.ts
│   └── performanceMonitor.test.ts
└── hooks/
    └── useDarkMode.test.ts
```

### Example: Button Component Test
```typescript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/button';

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);
    
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" loading onPress={onPress} />);
    
    fireEvent.press(getByText('Test'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### Example: Image Compression Test
```typescript
// __tests__/utils/imageCompression.test.ts
import { compressImage, compressProfilePhoto } from '@/utils/imageCompression';

describe('Image Compression', () => {
  it('compresses image to target size', async () => {
    const mockUri = 'file:///test.jpg';
    const result = await compressImage(mockUri, {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.7,
    });

    expect(result.width).toBeLessThanOrEqual(1024);
    expect(result.height).toBeLessThanOrEqual(1024);
  });

  it('maintains aspect ratio', async () => {
    const mockUri = 'file:///test.jpg';
    const result = await compressImage(mockUri);

    const aspectRatio = result.width / result.height;
    expect(aspectRatio).toBeGreaterThan(0);
  });
});
```

---

## 2. Integration Tests

### Booking Flow Test
```typescript
// __tests__/integration/bookingFlow.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '@/app/(tabs)/(home)/index';
import RideDetailsScreen from '@/app/rides/[id]';

describe('Booking Flow', () => {
  it('completes full booking journey', async () => {
    // 1. Search for rides
    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    );

    fireEvent.changeText(getByPlaceholderText('From'), 'Harare');
    fireEvent.changeText(getByPlaceholderText('To'), 'Bulawayo');
    fireEvent.press(getByText('Search'));

    // 2. Wait for results
    await waitFor(() => {
      expect(getByText(/rides found/i)).toBeTruthy();
    });

    // 3. Select a ride
    const firstRide = getByText(/Harare/i);
    fireEvent.press(firstRide);

    // 4. Book the ride
    await waitFor(() => {
      expect(getByText('Book Ride')).toBeTruthy();
    });

    fireEvent.press(getByText('Book Ride'));

    // 5. Confirm booking
    await waitFor(() => {
      expect(getByText('Booking Confirmed')).toBeTruthy();
    });
  });
});
```

---

## 3. Performance Tests

### Load Testing
```typescript
// __tests__/performance/loadTest.ts
import { performanceMonitor } from '@/utils/performanceMonitor';
import { searchRides } from '@/utils/ridesApi';

describe('Performance Tests', () => {
  it('handles 100 concurrent ride searches', async () => {
    const searches = Array(100).fill(null).map(() => 
      searchRides({
        origin: 'Harare',
        destination: 'Bulawayo',
        date: '2025-02-01',
      })
    );

    const start = Date.now();
    await Promise.all(searches);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000); // Should complete in < 5s
  });

  it('renders 1000 rides without lag', () => {
    const rides = Array(1000).fill(null).map((_, i) => ({
      id: `ride-${i}`,
      origin: 'Harare',
      destination: 'Bulawayo',
      departureTime: new Date().toISOString(),
      pricePerSeat: 10,
      availableSeats: 3,
    }));

    const start = Date.now();
    render(<LazyRideList rides={rides} loading={false} />);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // Should render in < 1s
  });
});
```

---

## 4. Manual Testing Checklist

### Authentication Flow
- [ ] Phone number input accepts valid Zimbabwe numbers
- [ ] OTP is sent and received
- [ ] OTP verification works
- [ ] Invalid OTP shows error
- [ ] Profile setup completes successfully
- [ ] User can skip photo upload
- [ ] Logout works correctly

### Ride Search
- [ ] Search form validates inputs
- [ ] Results load within 2 seconds
- [ ] No results shows appropriate message
- [ ] Filters work correctly
- [ ] Pagination loads more rides
- [ ] Pull-to-refresh works

### Ride Booking
- [ ] Ride details display correctly
- [ ] Book button is enabled/disabled appropriately
- [ ] Booking confirmation shows
- [ ] Booking appears in "My Bookings"
- [ ] Driver receives notification

### Driver Features
- [ ] Post ride form validates inputs
- [ ] Vehicle selection works
- [ ] Price calculation is accurate
- [ ] Ride is posted successfully
- [ ] Driver can view bookings
- [ ] Driver can cancel ride

### Offline Functionality
- [ ] App works without internet
- [ ] Cached rides are displayed
- [ ] Pending operations are queued
- [ ] Sync happens when online
- [ ] Offline indicator shows
- [ ] Cached data warning displays

### Performance
- [ ] Cold start < 3 seconds
- [ ] Screen transitions are smooth
- [ ] Images load progressively
- [ ] No memory leaks
- [ ] Battery drain is acceptable
- [ ] Works on low-end devices

### Safety Features
- [ ] ID verification upload works
- [ ] Emergency contacts can be added
- [ ] Share ride sends SMS
- [ ] SOS button triggers alert
- [ ] Report user form submits
- [ ] Ratings are saved

### UI/UX
- [ ] Dark mode works correctly
- [ ] Colors match Zimbabwe theme
- [ ] Icons display correctly (no "?")
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] Forms are user-friendly

### Edge Cases
- [ ] Handles network errors gracefully
- [ ] Shows appropriate error messages
- [ ] Recovers from crashes
- [ ] Handles empty states
- [ ] Validates all inputs
- [ ] Prevents duplicate submissions

---

## Test Execution

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- Button.test.tsx
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

---

## Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All critical flows
- **Performance Tests**: Key operations benchmarked
- **Manual Tests**: 100% checklist completion

---

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - run: npm run lint
```

---

## Bug Reporting Template

```markdown
**Bug Description:**
Clear description of the issue

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
If applicable

**Device Info:**
- Device: Samsung A52
- OS: Android 12
- App Version: 1.0.0

**Logs:**
Paste relevant console logs
```

---

## Performance Profiling

### React DevTools Profiler
1. Enable profiler in app
2. Record interaction
3. Analyze flame graph
4. Identify slow components

### Sentry Performance Monitoring
1. Check transaction traces
2. Identify slow API calls
3. Review error patterns
4. Monitor crash-free rate

---

**Last Updated**: January 2025
**Next Review**: After each major release
