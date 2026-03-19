-- ============================================================
-- Migration: Chat messages, live GPS locations, share links
-- Purpose  : Supabase-owned realtime chat + location tracking
-- ============================================================

-- ── Enable pgcrypto extension (needed for gen_random_bytes) ──
create extension if not exists pgcrypto;

-- ── 1. Messages table ─────────────────────────────────────────
-- roomId == ride_id  (one chat room per ride)
-- read_at (nullable timestamptz) replaces the boolean `read` field
create table if not exists public.messages (
  id           uuid        primary key default gen_random_uuid(),
  ride_id      uuid        not null,
  sender_id    uuid        not null,
  content      text        not null,
  message_type text        not null default 'text'
                           check (message_type in ('text', 'location')),
  read_at      timestamptz null,
  created_at   timestamptz not null default now()
);

comment on table public.messages is
  'Ride-scoped chat messages. ride_id acts as the chat room id.';

-- Indexes for common query patterns
create index if not exists messages_ride_id_created_at_idx
  on public.messages (ride_id, created_at asc);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

-- ── 2. Ride locations table ───────────────────────────────────
-- Stores the driver GPS breadcrumb trail for a ride.
-- Supabase Realtime INSERT events on this table power live tracking.
create table if not exists public.ride_locations (
  id         uuid             primary key default gen_random_uuid(),
  ride_id    uuid             not null,
  driver_id  uuid             not null,
  latitude   double precision not null,
  longitude  double precision not null,
  heading    double precision null,
  speed      double precision null,
  created_at timestamptz      not null default now()
);

comment on table public.ride_locations is
  'GPS breadcrumb trail broadcast by the driver during an active ride.';

create index if not exists ride_locations_ride_id_created_at_idx
  on public.ride_locations (ride_id, created_at asc);

create index if not exists ride_locations_driver_id_idx
  on public.ride_locations (driver_id);

-- ── 3. Ride share links table ─────────────────────────────────
-- Tracks share-link tokens with expiry for safety sharing.
create table if not exists public.ride_share_links (
  id          uuid        primary key default gen_random_uuid(),
  ride_id     uuid        not null,
  token       text        not null unique
                          default encode(gen_random_bytes(24), 'hex'),
  created_by  uuid        not null,
  expires_at  timestamptz not null
                          default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

comment on table public.ride_share_links is
  'Share-link tokens that grant anonymous read access to ride tracking data.';

create index if not exists ride_share_links_token_idx
  on public.ride_share_links (token);

create index if not exists ride_share_links_ride_id_idx
  on public.ride_share_links (ride_id);

-- ── 4. Enable Row Level Security ─────────────────────────────

alter table public.messages        enable row level security;
alter table public.ride_locations  enable row level security;
alter table public.ride_share_links enable row level security;

-- ── 5. RLS policies — messages ────────────────────────────────
-- Only ride participants (driver or any passenger who booked) can read messages.
-- Only authenticated users can insert (sender must be themselves).
-- Only the original sender can update their own message's read_at
-- (or any participant can mark received messages as read).

-- SELECT: ride participants only
-- A user is a participant if they are the driver OR have a booking for the ride.
create policy "participants can read messages"
  on public.messages
  for select
  using (
    auth.uid() is not null
    and (
      -- user is the sender
      sender_id = auth.uid()
      or
      -- user is the driver of the ride
      exists (
        select 1 from public.rides r
        where r.id = messages.ride_id
          and r.driver_id = auth.uid()
      )
      or
      -- user has a booking for this ride
      exists (
        select 1 from public.bookings b
        where b.ride_id = messages.ride_id
          and b.passenger_id = auth.uid()
          and b.status not in ('cancelled')
      )
    )
  );

-- INSERT: authenticated participants only; sender_id must equal caller
create policy "participants can insert messages"
  on public.messages
  for insert
  with check (
    auth.uid() is not null
    and sender_id = auth.uid()
    and (
      exists (
        select 1 from public.rides r
        where r.id = messages.ride_id
          and r.driver_id = auth.uid()
      )
      or
      exists (
        select 1 from public.bookings b
        where b.ride_id = messages.ride_id
          and b.passenger_id = auth.uid()
          and b.status not in ('cancelled')
      )
    )
  );

-- UPDATE: participants can update read_at on messages they received
create policy "participants can mark messages read"
  on public.messages
  for update
  using (
    auth.uid() is not null
    and sender_id <> auth.uid()
    and (
      exists (
        select 1 from public.rides r
        where r.id = messages.ride_id
          and r.driver_id = auth.uid()
      )
      or
      exists (
        select 1 from public.bookings b
        where b.ride_id = messages.ride_id
          and b.passenger_id = auth.uid()
          and b.status not in ('cancelled')
      )
    )
  )
  with check (auth.uid() is not null);

-- ── 6. RLS policies — ride_locations ─────────────────────────

-- INSERT: only the driver of the ride can insert location updates
create policy "driver can insert location"
  on public.ride_locations
  for insert
  with check (
    auth.uid() is not null
    and driver_id = auth.uid()
    and exists (
      select 1 from public.rides r
      where r.id = ride_locations.ride_id
        and r.driver_id = auth.uid()
    )
  );

-- SELECT: ride participants or valid share-link holders can read locations
create policy "participants can read locations"
  on public.ride_locations
  for select
  using (
    auth.uid() is not null
    and (
      -- driver themselves
      driver_id = auth.uid()
      or
      -- passenger with active booking
      exists (
        select 1 from public.bookings b
        where b.ride_id = ride_locations.ride_id
          and b.passenger_id = auth.uid()
          and b.status not in ('cancelled')
      )
    )
  );

-- ── 7. RLS policies — ride_share_links ───────────────────────

-- Only ride participants can create share links
create policy "participants can create share links"
  on public.ride_share_links
  for insert
  with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and (
      exists (
        select 1 from public.rides r
        where r.id = ride_share_links.ride_id
          and r.driver_id = auth.uid()
      )
      or
      exists (
        select 1 from public.bookings b
        where b.ride_id = ride_share_links.ride_id
          and b.passenger_id = auth.uid()
          and b.status not in ('cancelled')
      )
    )
  );

-- Anyone can look up a share link by token (to verify it's valid + not expired)
create policy "anyone can read share link by token"
  on public.ride_share_links
  for select
  using (true);
