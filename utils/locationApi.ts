/**
 * GPS Location utilities for ZimCommute.
 *
 * Live tracking is now fully Supabase-owned:
 *   - Driver inserts locations into public.ride_locations directly.
 *   - Passengers subscribe via Supabase Realtime postgres_changes.
 *   - Use the supabase client from @/app/integrations/supabase/client in screens.
 *
 * @deprecated openLocationWebSocket / subscribeToRideLocation — custom WebSocket
 *             is no longer used. Supabase Realtime channels replace it.
 * @deprecated updateLocation / getLatestLocation / getLocationHistory — REST helpers
 *             are no longer used; use the supabase client directly.
 */

export interface LocationUpdate {
  id: string;
  ride_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  created_at: string;
}
