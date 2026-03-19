/**
 * Chat API utilities for ZimCommute
 * Connects to the Supabase Edge Function at /functions/v1/chat
 */

import { getAuthToken } from './api';

const CHAT_BASE_URL = 'https://sbayoiscitldgmfwueld.supabase.co/functions/v1/chat';

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

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'location';
  read_at: string | null;
  created_at: string;
}

async function chatFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');

  const url = `${CHAT_BASE_URL}${path}`;
  console.log(`[ChatAPI] ${options.method ?? 'GET'} ${path}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[ChatAPI] Error:', data);
    throw new Error(data.error ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}

export async function createOrGetChatRoom(params: {
  ride_id: string;
  driver_id: string;
  passenger_id: string;
}): Promise<ChatRoom> {
  return chatFetch<ChatRoom>('/api/chat/rooms', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  const data = await chatFetch<{ rooms: ChatRoom[] }>('/api/chat/rooms');
  return data.rooms;
}

export async function getChatMessages(
  roomId: string,
  options?: { before?: string; limit?: number }
): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (options?.before) params.set('before', options.before);
  if (options?.limit) params.set('limit', String(options.limit));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const data = await chatFetch<{ messages: ChatMessage[] }>(
    `/api/chat/rooms/${roomId}/messages${qs}`
  );
  return data.messages;
}

export async function sendChatMessage(
  roomId: string,
  content: string,
  message_type: 'text' | 'location' = 'text'
): Promise<ChatMessage> {
  return chatFetch<ChatMessage>(`/api/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, message_type }),
  });
}

export async function markMessagesRead(roomId: string): Promise<void> {
  await chatFetch<{ success: boolean }>(`/api/chat/rooms/${roomId}/read`, {
    method: 'POST',
  });
}

/**
 * Open a WebSocket connection to the chat room.
 * Returns the WebSocket instance — caller is responsible for closing it.
 */
export async function openChatWebSocket(
  roomId: string,
  onMessage: (msg: ChatMessage) => void,
  onError?: (e: Event) => void
): Promise<WebSocket> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');

  const wsUrl = `wss://sbayoiscitldgmfwueld.supabase.co/functions/v1/chat/api/chat/ws/${roomId}?token=${encodeURIComponent(token)}`;
  console.log('[ChatWS] Connecting to room:', roomId);

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[ChatWS] Connected to room:', roomId);
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as ChatMessage;
      console.log('[ChatWS] Received message:', msg.id);
      onMessage(msg);
    } catch (err) {
      console.error('[ChatWS] Failed to parse message:', err);
    }
  };

  ws.onerror = (e) => {
    console.error('[ChatWS] Error:', e);
    onError?.(e);
  };

  ws.onclose = () => {
    console.log('[ChatWS] Disconnected from room:', roomId);
  };

  return ws;
}
