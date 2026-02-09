
# ZimCommute Offline-First Architecture

## Overview

ZimCommute now implements a robust offline-first architecture that allows users to continue using the app even with poor or no internet connectivity. This is critical for Zimbabwe where network connectivity can be unreliable and data costs are high.

## Key Features

### 1. **Offline Data Access**
- **Cached Ride Search**: Previously searched rides are cached for 1 hour
- **Profile Data**: User profile cached for 24 hours
- **Vehicles**: Vehicle list cached for 24 hours
- **Bookings**: User bookings cached for 1 hour
- **Emergency Contacts**: Cached for 24 hours
- **Route Data**: Zimbabwe city routes cached for 7 days

### 2. **Pending Operations Queue**
When offline, user actions are queued and automatically synced when connectivity returns:
- Create/update/delete rides
- Create/cancel bookings
- Update profile
- Add/remove vehicles
- Add/remove emergency contacts
- Submit ratings and reports

### 3. **Automatic Sync**
- **Background Sync**: Automatically syncs when device comes online
- **Retry Logic**: Exponential backoff for failed operations (1s → 2s → 4s → 8s → 16s → 60s max)
- **Conflict Resolution**: Last write wins strategy with timestamps
- **Incremental Updates**: Only syncs changed data

### 4. **UI Indicators**
- **Offline Banner**: Clear "Offline Mode" indicator at top of screen
- **Sync Status**: Shows last sync time and pending operations count
- **Cached Data Warnings**: Alerts when viewing stale data
- **Manual Sync Button**: Users can trigger sync manually

## Architecture Components

### Core Modules

#### 1. **Offline Storage** (`utils/offlineStorage.ts`)
- Manages local data persistence using AsyncStorage
- Handles cache expiration and versioning
- Provides unified interface for storing/retrieving data

```typescript
// Store data with expiration
await storeData(STORAGE_KEYS.USER_PROFILE, userData, CACHE_EXPIRATION.USER_PROFILE);

// Retrieve data (returns null if expired)
const cachedData = await getData(STORAGE_KEYS.USER_PROFILE, CACHE_EXPIRATION.USER_PROFILE);
```

#### 2. **Pending Operations** (`utils/pendingOperations.ts`)
- Queues operations that need to sync
- Implements retry logic with exponential backoff
- Tracks operation status (pending/processing/failed/completed)

```typescript
// Add operation to queue
await addPendingOperation('CREATE_RIDE', '/api/rides', 'POST', rideData);

// Get pending operations
const operations = await getPendingOperations();
```

#### 3. **Connectivity Manager** (`utils/connectivityManager.ts`)
- Monitors network connectivity in real-time
- Provides React hooks for components
- Triggers sync when connectivity restored

```typescript
// Use in components
const { isOnline, isConnected, isInternetReachable } = useConnectivity();

// Check connectivity
if (isOnline()) {
  // Perform online operation
}
```

#### 4. **Sync Manager** (`utils/syncManager.ts`)
- Orchestrates synchronization between local and remote data
- Processes pending operations queue
- Fetches latest data from server
- Notifies UI of sync status

```typescript
// Trigger manual sync
await forceSyncNow();

// Listen to sync status
addSyncListener((status) => {
  console.log('Sync status:', status);
});
```

#### 5. **Offline API** (`utils/offlineApi.ts`)
- Wraps existing API calls with offline-first logic
- Returns cached data when offline
- Implements optimistic UI updates
- Queues operations for later sync

```typescript
// Offline-first API call
const { data, fromCache } = await searchRides(params);

if (fromCache) {
  // Show cached data warning
}
```

### UI Components

#### 1. **OfflineIndicator** (`components/offline/OfflineIndicator.tsx`)
- Displays banner when device is offline
- Shows "Offline Mode" message
- Indicates changes will sync when online

#### 2. **SyncStatusIndicator** (`components/offline/SyncStatusIndicator.tsx`)
- Shows last sync time
- Displays pending operations count
- Provides manual sync button
- Shows sync progress

#### 3. **CachedDataWarning** (`components/offline/CachedDataWarning.tsx`)
- Alerts users when viewing cached data
- Configurable warning/info style
- Custom messages

#### 4. **Pending Operations Screen** (`app/offline/pending-operations.tsx`)
- Lists all queued operations
- Shows operation status and retry count
- Allows manual sync or clear all
- Displays operation errors

## Cache Strategy

### Cache Expiration Times

| Data Type | Expiration | Rationale |
|-----------|-----------|-----------|
| User Profile | 24 hours | Changes infrequently |
| Active Rides | 1 hour | Time-sensitive data |
| Route Data | 7 days | Static reference data |
| Wallet Balance | Real-time | Financial data (show cached with warning) |
| My Rides | 1 hour | Moderately dynamic |
| My Bookings | 1 hour | Moderately dynamic |
| Vehicles | 24 hours | Changes infrequently |
| Emergency Contacts | 24 hours | Changes infrequently |

### Cache Invalidation

Caches are automatically invalidated when:
1. Data expires based on TTL
2. User performs update operation
3. Successful sync from server
4. Manual cache clear

## Sync Mechanism

### Sync Flow

1. **Connectivity Check**: Verify device is online
2. **Process Pending Operations**: Execute queued operations with retry logic
3. **Fetch Server Data**: Get latest data from backend
4. **Update Local Cache**: Store fresh data with timestamps
5. **Notify UI**: Update sync status indicators

### Retry Logic

Failed operations are retried with exponential backoff:
- Attempt 1: 1 second delay
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay
- Attempt 4: 8 seconds delay
- Attempt 5: 16 seconds delay
- Max delay: 60 seconds

After 5 failed attempts, operation is marked as failed and requires manual intervention.

### Conflict Resolution

**Strategy**: Last Write Wins (LWW)

- Each operation includes a timestamp
- Server accepts the most recent update
- No complex merge logic (keeps implementation simple)
- Suitable for ZimCommute's use case where conflicts are rare

## Data Versioning

Each cached item includes:
- `data`: The actual data
- `timestamp`: When it was cached
- `version`: Schema version (for future migrations)

```typescript
interface CachedData<T> {
  data: T;
  timestamp: number;
  version: number;
}
```

## Network Considerations for Zimbabwe

### Slow Networks
- **Timeout Handling**: Graceful fallback to cached data
- **Progressive Loading**: Show cached data immediately, update when fresh data arrives
- **Minimal Payloads**: Only sync changed data

### Data Costs
- **Efficient Sync**: Incremental updates only
- **Compression**: Consider implementing response compression
- **User Control**: Manual sync option to control data usage

### Intermittent Connectivity
- **Automatic Retry**: Operations retry automatically when online
- **Queue Persistence**: Pending operations survive app restarts
- **Graceful Degradation**: App remains functional offline

## Usage Examples

### Implementing Offline-First in a Screen

```typescript
import { useConnectivity } from '@/utils/connectivityManager';
import { searchRides as searchRidesOffline } from '@/utils/offlineApi';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { CachedDataWarning } from '@/components/offline/CachedDataWarning';

export default function RideSearchScreen() {
  const { isOnline } = useConnectivity();
  const [rides, setRides] = useState([]);
  const [fromCache, setFromCache] = useState(false);

  const handleSearch = async (params) => {
    const { data, fromCache } = await searchRidesOffline(params);
    setRides(data);
    setFromCache(fromCache);
  };

  return (
    <View>
      <OfflineIndicator />
      {fromCache && (
        <CachedDataWarning 
          message="Showing cached results"
          type="warning"
        />
      )}
      {/* Rest of UI */}
    </View>
  );
}
```

### Creating an Offline-First Operation

```typescript
import { addPendingOperation } from '@/utils/pendingOperations';
import { isOnline } from '@/utils/connectivityManager';

async function createRide(rideData) {
  if (isOnline()) {
    // Try online first
    try {
      return await api.createRide(rideData);
    } catch (error) {
      // Fall through to offline handling
    }
  }

  // Queue for later sync
  const operationId = await addPendingOperation(
    'CREATE_RIDE',
    '/api/rides',
    'POST',
    rideData
  );

  // Return optimistic response
  return {
    id: `local_${Date.now()}`,
    ...rideData,
    status: 'pending_sync'
  };
}
```

## Testing Offline Functionality

### Simulating Offline Mode

1. **iOS Simulator**: 
   - Settings → Developer → Network Link Conditioner → Enable → 100% Loss

2. **Android Emulator**:
   - Extended Controls → Cellular → Data Status → Denied

3. **Physical Device**:
   - Enable Airplane Mode
   - Or disable WiFi/Mobile Data

### Test Scenarios

1. **Search Rides Offline**: Should show cached results
2. **Create Ride Offline**: Should queue operation and show in pending list
3. **Come Back Online**: Should auto-sync pending operations
4. **Failed Sync**: Should retry with exponential backoff
5. **View Pending Operations**: Should show all queued changes
6. **Manual Sync**: Should trigger immediate sync

## Monitoring and Debugging

### Console Logs

All offline-first modules log extensively:
- `[OfflineStorage]`: Cache operations
- `[PendingOperations]`: Queue management
- `[Connectivity]`: Network state changes
- `[SyncManager]`: Sync operations
- `[OfflineAPI]`: API calls and cache hits

### Sync Status

Check sync status programmatically:

```typescript
import { getSyncStatus } from '@/utils/syncManager';

const status = getSyncStatus();
console.log('Last sync:', new Date(status.lastSyncTime));
console.log('Pending:', status.pendingOperationsCount);
console.log('Failed:', status.failedOperationsCount);
```

## Future Enhancements

### Potential Improvements

1. **Selective Sync**: Allow users to choose what to sync
2. **WiFi-Only Sync**: Option to sync only on WiFi
3. **Compression**: Compress cached data to save storage
4. **Background Sync**: Use background tasks for sync
5. **Conflict UI**: Show conflicts to user for manual resolution
6. **Offline Maps**: Cache map tiles for offline navigation
7. **Smart Prefetching**: Predict and prefetch likely needed data
8. **Storage Limits**: Implement cache size limits and LRU eviction

## Troubleshooting

### Common Issues

**Issue**: Pending operations not syncing
- **Solution**: Check connectivity, view pending operations screen, try manual sync

**Issue**: Cached data too old
- **Solution**: Pull to refresh, or wait for automatic sync

**Issue**: App using too much storage
- **Solution**: Clear cache from settings (to be implemented)

**Issue**: Sync failing repeatedly
- **Solution**: Check backend logs, verify API endpoints, check auth token

## Performance Considerations

### Storage Usage
- AsyncStorage has ~6MB limit on Android
- Monitor cache size and implement cleanup if needed
- Consider using SQLite for larger datasets

### Memory Usage
- Don't load entire cache into memory
- Lazy load data as needed
- Implement pagination for large lists

### Battery Usage
- Connectivity monitoring is lightweight
- Sync only when necessary
- Use exponential backoff to reduce retries

## Security Considerations

### Data Protection
- Sensitive data (auth tokens) stored in SecureStore
- Cache data stored in AsyncStorage (not encrypted by default)
- Consider encrypting sensitive cached data

### Sync Security
- All sync operations use authenticated API calls
- Bearer tokens included in requests
- Server validates ownership before updates

## Conclusion

The offline-first architecture makes ZimCommute resilient to poor connectivity, reduces data costs, and provides a better user experience. Users can search rides, view bookings, and manage their profile even without internet, with changes automatically syncing when connectivity returns.

This implementation is specifically designed for Zimbabwe's network conditions and user needs, ensuring the app remains functional and useful even in challenging connectivity environments.
