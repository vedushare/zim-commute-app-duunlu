import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
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
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import { supabase } from '@/app/integrations/supabase/client';
import type { ChatMessage } from '@/utils/chatApi';

// ─── Theme ────────────────────────────────────────────────────────────────────

function useThemeColors(isDark: boolean) {
  return {
    background: isDark ? '#0F1410' : '#F6FAF7',
    surface: isDark ? '#1A2B1E' : '#FFFFFF',
    header: isDark ? '#111D14' : '#FFFFFF',
    headerBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    inputBg: isDark ? '#1A2B1E' : '#FFFFFF',
    inputBorder: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    text: isDark ? '#F0F5F1' : '#1A2E1E',
    textSecondary: isDark ? '#8BA890' : '#5A7A60',
    primary: '#009E49',
    primaryDark: '#007A38',
    bubbleMine: '#009E49',
    bubbleTheirs: isDark ? '#243328' : '#EAF4EE',
    bubbleTextMine: '#FFFFFF',
    bubbleTextTheirs: isDark ? '#F0F5F1' : '#1A2E1E',
    timeText: isDark ? '#5A7A60' : '#9AB89F',
    sendDisabled: isDark ? '#2A3D2E' : '#C8E6D4',
    iconBack: isDark ? '#8BA890' : '#5A7A60',
    statusDot: '#009E49',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ─── Message bubble ───────────────────────────────────────────────────────────

interface BubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showDate: boolean;
  C: ReturnType<typeof useThemeColors>;
}

function MessageBubble({ message, isMine, showDate, C }: BubbleProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      {showDate && (
        <View style={styles.dateSeparatorRow}>
          <View style={[styles.dateSeparatorLine, { backgroundColor: C.inputBorder }]} />
          <Text style={[styles.dateSeparatorText, { color: C.textSecondary }]}>
            {formatDateSeparator(message.created_at)}
          </Text>
          <View style={[styles.dateSeparatorLine, { backgroundColor: C.inputBorder }]} />
        </View>
      )}
      <Animated.View
        style={[
          styles.bubbleRow,
          isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine
              ? [styles.bubbleMine, { backgroundColor: C.bubbleMine }]
              : [styles.bubbleTheirs, { backgroundColor: C.bubbleTheirs }],
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isMine ? C.bubbleTextMine : C.bubbleTextTheirs },
            ]}
          >
            {message.content}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text
              style={[
                styles.bubbleTime,
                { color: isMine ? 'rgba(255,255,255,0.65)' : C.timeText },
              ]}
            >
              {formatTime(message.created_at)}
            </Text>
            {isMine && (
              <Text
                style={[
                  styles.readTick,
                  { color: message.read_at ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' },
                ]}
              >
                {message.read_at ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const C = useThemeColors(isDarkMode);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  // ── Load initial messages ──
  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    console.log('[ChatRoom] Loading messages for room:', roomId);
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('ride_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (fetchError) throw fetchError;
      const msgs = (data ?? []) as ChatMessage[];
      setMessages(msgs);
      setHasMore(msgs.length === 50);

      // Mark received messages as read
      if (user?.id) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('ride_id', roomId)
          .neq('sender_id', user.id)
          .is('read_at', null);
      }
    } catch (err: any) {
      console.error('[ChatRoom] Failed to load messages:', err.message);
      setError(err.message ?? 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [roomId, user?.id]);

  // ── Load older messages ──
  const loadMore = useCallback(async () => {
    if (!roomId || loadingMore || !hasMore || messages.length === 0) return;
    const oldest = messages[0];
    console.log('[ChatRoom] Loading more messages before:', oldest.id);
    setLoadingMore(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('ride_id', roomId)
        .lt('created_at', oldest.created_at)
        .order('created_at', { ascending: true })
        .limit(50);

      if (fetchError) throw fetchError;
      const older = (data ?? []) as ChatMessage[];
      if (older.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => [...older, ...prev]);
        setHasMore(older.length === 50);
      }
    } catch (err: any) {
      console.error('[ChatRoom] Failed to load more:', err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, loadingMore, hasMore, messages]);

  // ── Supabase Realtime subscription ──
  const setupSubscription = useCallback(() => {
    if (!roomId) return;
    console.log('[ChatRoom] Setting up Supabase Realtime for room:', roomId);
    channelRef.current = supabase
      .channel(`messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ride_id=eq.${roomId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          console.log('[ChatRoom] Realtime message received:', msg.id);
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Mark incoming messages from others as read
          if (msg.sender_id !== user?.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', msg.id)
              .then(() => {});
          }
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 80);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `ride_id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, read_at: updated.read_at } : m))
          );
        }
      )
      .subscribe((status) => {
        console.log('[ChatRoom] Channel status:', status);
        setWsConnected(status === 'SUBSCRIBED');
      });
  }, [roomId, user?.id]);

  useEffect(() => {
    loadMessages();
    setupSubscription();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // ── Scroll to bottom after initial load ──
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [loading]);

  // ── Send message ──
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending || !roomId || !user?.id) return;

    console.log('[ChatRoom] Sending message');
    setSending(true);
    setInputText('');

    // Animate send button
    Animated.sequence([
      Animated.timing(sendButtonScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(sendButtonScale, { toValue: 1, useNativeDriver: true, damping: 12 }),
    ]).start();

    try {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          ride_id: roomId,
          sender_id: user.id,
          content: text,
          message_type: 'text',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Realtime will deliver the message, but add optimistically in case of lag
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data as ChatMessage];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    } catch (err: any) {
      console.error('[ChatRoom] Send failed:', err.message);
      setInputText(text); // restore
    } finally {
      setSending(false);
    }
  }, [inputText, sending, roomId, user?.id]);

  // ── Render item ──
  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isMine = item.sender_id === user?.id;
      const showDate =
        index === 0 || !isSameDay(messages[index - 1].created_at, item.created_at);
      return (
        <MessageBubble
          message={item}
          isMine={isMine}
          showDate={showDate}
          C={C}
        />
      );
    },
    [user?.id, messages, C]
  );

  const canSend = inputText.trim().length > 0 && !sending;

  // ── Header ──
  const header = (
    <View style={[styles.header, { backgroundColor: C.header, borderBottomColor: C.headerBorder }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.backArrow, { color: C.iconBack }]}>{'‹'}</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
          Chat
        </Text>
        <View style={styles.headerStatusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: wsConnected ? C.statusDot : C.textSecondary },
            ]}
          />
          <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>
            {wsConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>
      <View style={styles.headerRight} />
    </View>
  );

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top']}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top']}>
        {header}
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: C.text }]}>Failed to load messages</Text>
          <Text style={[styles.errorSub, { color: C.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: C.primary }]}
            onPress={loadMessages}
          >
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top']}>
      {header}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={
            loadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color={C.primary} />
              </View>
            ) : null
          }
          onScrollBeginDrag={() => {
            // Load more when scrolled to top
          }}
          onScroll={(e) => {
            if (e.nativeEvent.contentOffset.y < 60 && hasMore && !loadingMore) {
              loadMore();
            }
          }}
          scrollEventThrottle={200}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                No messages yet. Say hello!
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Input bar */}
        <SafeAreaView edges={['bottom']} style={[styles.inputBar, { backgroundColor: C.header, borderTopColor: C.headerBorder }]}>
          <View style={[styles.inputWrapper, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: C.text }]}
              placeholder="Type a message..."
              placeholderTextColor={C.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              returnKeyType="default"
              blurOnSubmit={false}
            />
          </View>
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: canSend ? C.primary : C.sendDisabled },
              ]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.sendIcon, { color: canSend ? '#FFFFFF' : C.textSecondary }]}>
                  ↑
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '300',
    marginTop: -4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: { width: 40 },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },
  loadMoreIndicator: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Date separator
  dateSeparatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Bubbles
  bubbleRow: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 18,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  readTick: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 120,
    padding: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },

  // Error
  errorText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
