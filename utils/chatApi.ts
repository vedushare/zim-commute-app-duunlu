/**
 * Chat type definitions for ZimCommute.
 *
 * The chat architecture is now fully Supabase-owned:
 *   - Messages are stored in public.messages (ride_id == roomId).
 *   - Real-time updates are delivered via Supabase Realtime postgres_changes.
 *   - Use the supabase client from @/app/integrations/supabase/client directly
 *     in screens; this file exports shared types and Supabase-backed helpers.
 */

import { supabase } from '@/app/integrations/supabase/client';

export interface ChatRoom {
  id: string;
  ride_id: string;
  driver_id: string;
  passenger_id: string;
  status: 'active' | 'closed';
  created_at: string;
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

/**
 * A single chat message stored in public.messages.
 * ride_id is the canonical room identifier (roomId === rideId).
 * read_at (nullable timestamp) replaces the legacy boolean `read` field.
 */
export interface ChatMessage {
  id: string;
  /** ride_id doubles as the chat room id — roomId === rideId */
  ride_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'location';
  /** null = unread; ISO timestamp = when the recipient read it */
  read_at: string | null;
  created_at: string;
}

/**
 * Fetch the list of chat rooms (rides with messages) for the current user.
 * Uses Supabase directly; RLS ensures only the user's rides are returned.
 */
export async function getChatRooms(): Promise<ChatRoom[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('ride_id, created_at, content, sender_id, read_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id ?? '';

  // Group messages by ride_id to build a room list
  const roomMap = new Map<string, ChatRoom>();
  for (const msg of (data ?? []) as Array<{
    ride_id: string;
    created_at: string;
    content: string;
    sender_id: string;
    read_at: string | null;
  }>) {
    if (!roomMap.has(msg.ride_id)) {
      roomMap.set(msg.ride_id, {
        id: msg.ride_id,
        ride_id: msg.ride_id,
        driver_id: '',
        passenger_id: '',
        status: 'active',
        created_at: msg.created_at,
        last_message: {
          content: msg.content,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
        },
        unread_count: 0,
      });
    }
    // Count messages from others that haven't been read yet
    if (userId && msg.sender_id !== userId && msg.read_at === null) {
      const room = roomMap.get(msg.ride_id);
      if (room) room.unread_count += 1;
    }
  }

  return Array.from(roomMap.values()).sort((a, b) => {
    const aTime = a.last_message?.created_at ?? a.created_at;
    const bTime = b.last_message?.created_at ?? b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

