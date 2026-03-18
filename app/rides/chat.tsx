import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet, apiPost } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_type: 'passenger' | 'driver';
  content: string;
  created_at: string;
  read: boolean;
}

export default function ChatScreen() {
  const { ride_id, sender_id: paramSenderId, sender_type } = useLocalSearchParams<{
    ride_id: string;
    sender_id?: string;
    sender_type: 'passenger' | 'driver';
  }>();
  const { user } = useAuth();

  const senderId = paramSenderId || user?.id || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!ride_id) return;

    console.log('[Chat] Mounting chat screen for ride:', ride_id, 'sender:', senderId, 'type:', sender_type);
    loadMessages();
    markAsRead();
    setupRealtimeSubscription();

    return () => {
      console.log('[Chat] Cleaning up realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [ride_id]);

  const loadMessages = async () => {
    console.log('[Chat] Fetching messages for ride:', ride_id);
    try {
      const data = await apiGet<{ messages: Message[] } | Message[]>(`/api/messages/${ride_id}`);
      const msgs = Array.isArray(data) ? data : (data as any).messages ?? [];
      setMessages(msgs);
      console.log('[Chat] Loaded', msgs.length, 'messages');
    } catch (err: any) {
      console.error('[Chat] Error loading messages:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!senderId) return;
    try {
      await apiPost(`/api/messages/${ride_id}/read`, { sender_id: senderId });
      console.log('[Chat] Messages marked as read');
    } catch (err: any) {
      console.error('[Chat] Error marking messages as read:', err.message);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('[Chat] Setting up realtime subscription for messages');
    channelRef.current = supabase
      .channel(`messages-${ride_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ride_id=eq.${ride_id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          console.log('[Chat] New message received:', newMsg.id);
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe((status) => {
        console.log('[Chat] Messages channel status:', status);
      });
  };

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || !ride_id || !senderId) return;

    console.log('[Chat] User tapped Send message for ride:', ride_id);
    setSending(true);
    setInputText('');

    try {
      const newMsg = await apiPost<Message>('/api/messages', {
        ride_id,
        sender_id: senderId,
        sender_type: sender_type || 'passenger',
        content,
      });
      console.log('[Chat] Message sent:', newMsg.id);
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        if (exists) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      console.error('[Chat] Error sending message:', err.message);
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === senderId || item.sender_type === (sender_type || 'passenger');
    const timeText = formatTime(item.created_at);

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMine ? styles.timeTextMine : styles.timeTextOther]}>
            {timeText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Messages', headerShown: true }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol ios_icon_name="paperplane.fill" android_material_icon_name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  messageRow: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTextOther: {
    color: colors.text,
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
  },
  timeTextMine: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  timeTextOther: {
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
