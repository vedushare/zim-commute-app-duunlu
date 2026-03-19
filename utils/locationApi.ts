/**
 * GPS Location API for ZimCommute
 * Wraps the /locations Supabase Edge Function endpoints and WebSocket connection.
 */

import { getAuthToken } from './api';

const SUPABASE_FUNCTIONS_URL = 'https://sbayoiscitldgmfwueld.supabase.co/functions/v1';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiYXlvaXNjaXRsZGdtZnd1ZWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mzc2MjksImV4cCI6MjA4NjExMzYyOX0.RspgJLYEbUzaRLh65Kqynbjmfsz-Po-sbLbFt6jf6IM';

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

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function locationFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed: ${response.status}`);
  }
  return data as T;
}

// ─── REST endpoints ───────────────────────────────────────────────────────────

/**
 * POST /api/locations/{rideId}
 * Driver posts their current GPS position. Returns the saved LocationUpdate.
 */
export async function updateLocation(
  rideId: string,
  payload: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  }
): Promise<LocationUpdate> {
  return locationFetch<LocationUpdate>(`/locations/${rideId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/locations/{rideId}
 * Returns the latest GPS location for a ride.
 */
export async function getLatestLocation(rideId: string): Promise<LocationUpdate> {
  return locationFetch<LocationUpdate>(`/locations/${rideId}`, { method: 'GET' });
}

/**
 * GET /api/locations/{rideId}/history
 * Returns the breadcrumb trail as a flat LocationUpdate[].
 * The tracking screen consumes this as an array directly.
 */
export async function getLocationHistory(
  rideId: string,
  limit = 100
): Promise<LocationUpdate[]> {
  const result = await locationFetch<{ locations: LocationUpdate[] }>(
    `/locations/${rideId}/history?limit=${limit}`,
    { method: 'GET' }
  );
  return result.locations ?? [];
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

/**
 * Opens a WebSocket connection to receive real-time location updates for a ride.
 *
 * The tracking screen uses this as:
 *   const ws = openLocationWebSocket(rideId, token, onUpdate);
 *   ws.onopen / ws.onerror / ws.onclose are set by the caller.
 *
 * @param rideId   The ride to subscribe to
 * @param token    Bearer token for authentication (passed as query param)
 * @param onUpdate Called with each incoming LocationUpdate
 * @returns        The raw WebSocket so the caller can attach lifecycle handlers
 */
export function openLocationWebSocket(
  rideId: string,
  token: string,
  onUpdate: (location: LocationUpdate) => void
): WebSocket {
  const wsBase = SUPABASE_FUNCTIONS_URL
    .replace(/^https/, 'wss')
    .replace(/^http/, 'ws');
  const url = `${wsBase}/locations/ws/${rideId}?token=${encodeURIComponent(token)}`;

  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string);
      // Skip the initial handshake frame
      if (data?.type === 'connected') return;
      onUpdate(data as LocationUpdate);
    } catch {
      // ignore malformed frames
    }
  };

  return ws;
}

/**
 * Async convenience wrapper — resolves once the socket is open.
 * Returns a cleanup function that closes the socket.
 */
export async function subscribeToRideLocation(
  rideId: string,
  onUpdate: (location: LocationUpdate) => void,
  onError?: (err: Event) => void
): Promise<() => void> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required for location subscription');

  const ws = openLocationWebSocket(rideId, token, onUpdate);

  ws.onerror = (err) => {
    console.error('[LocationWS] error', err);
    onError?.(err);
  };

  ws.onclose = () => {
    console.log('[LocationWS] closed for ride', rideId);
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}
