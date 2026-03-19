/**
 * Chats tab screen — re-exports the chat rooms list.
 * This file satisfies the expo-router tab route for the "chats" tab
 * defined in app/(tabs)/_layout.tsx.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import { getChatRooms, ChatRoom } from '@/utils/chatApi';

// ─── Theme ────────────────────────────────────────────────────────────────────

function useThemeColors(isDarkMode: boolean) {
  return {
    background: isDarkMode ? '#0F1410' : '#F6FAF7',
    surface: isDarkMode ? '#1A2B1E' : '#FFFFFF',
    surfaceSecondary: isDarkMode ? '#243328' : '#F0F7F2',
    text: isDarkMode ? '#F0F5F1' : '#1A2E1E',
    textSecondary: isDarkMode ? '#8BA890' : '#5A7A60',
    textTertiary: isDarkMode ? '#5A7A60' : '#9AB89F',
    primary: '#009E49',
    primaryMuted: isDarkMode ? 'rgba(0,158,73,0.15)' : 'rgba(0,158,73,0.10)',
    border: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    unreadBg: '#009E49',
    unreadText: '#FFFFFF',
  };
}

// ─── Animated list item ───────────────────────────────────────────────────────

function AnimatedItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRow({ C }: { C: ReturnType<typeof useThemeColors> }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.skeletonRow, { opacity, backgroundColor: C.surface }]}>
      <View style={[styles.skeletonAvatar, { backgroundColor: C.surfaceSecondary }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '55%', backgroundColor: C.surfaceSecondary }]} />
        <View style={[styles.skeletonLine, { width: '80%', marginTop: 8, backgroundColor: C.surfaceSecondary }]} />
      </View>
    </Animated.View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChatsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const C = useThemeColors(isDarkMode);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async (isRefresh = false) => {
    console.log('[ChatsTab] Loading chat rooms, isRefresh:', isRefresh);
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await getChatRooms();
      setRooms(data);
      console.log('[ChatsTab] Loaded', data.length, 'rooms');
    } catch (err: any) {
      console.error('[ChatsTab] Failed to load rooms:', err.message);
      setError(err.message || 'Failed to load chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, loadRooms]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms(true);
  }, [loadRooms]);

  const handleRoomPress = useCallback((room: ChatRoom) => {
    console.log('[ChatsTab] Opening room:', room.id);
    router.push(`/chat/${room.id}`);
  }, [router]);

  // ── Not authenticated ──
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Chats</Text>
        </View>
        <View style={styles.centeredState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: C.primaryMuted }]}>
            <Text style={styles.emptyIcon}>💬</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: C.text }]}>Sign in to chat</Text>
          <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
            Log in to message drivers and passengers
          </Text>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: C.primary }]}
            onPress={() => router.push('/auth/phone-login')}
          >
            <Text style={styles.ctaButtonText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading skeletons ──
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Chats</Text>
        </View>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonRow key={i} C={C} />
        ))}
      </SafeAreaView>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Chats</Text>
        </View>
        <View style={styles.centeredState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <Text style={styles.emptyIcon}>⚠️</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: C.text }]}>Couldn't load chats</Text>
          <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: C.primary }]}
            onPress={() => loadRooms()}
          >
            <Text style={styles.ctaButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Room row renderer ──
  const renderRoom = ({ item, index }: { item: ChatRoom; index: number }) => {
    const isDriver = user?.id === item.driver_id;
    const otherRole = isDriver ? 'Passenger' : 'Driver';
    const otherInitial = otherRole[0];
    const lastMsgPreview = item.last_message?.content ?? 'No messages yet';
    const lastMsgTime = item.last_message?.created_at
      ? formatRelativeTime(item.last_message.created_at)
      : '';
    const unreadCount = item.unread_count ?? 0;
    const hasUnread = unreadCount > 0;
    const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);

    return (
      <AnimatedItem index={index}>
        <TouchableOpacity
          style={[styles.roomRow, { backgroundColor: C.surface, borderBottomColor: C.border }]}
          onPress={() => handleRoomPress(item)}
          activeOpacity={0.75}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: C.primaryMuted }]}>
            <Text style={[styles.avatarText, { color: C.primary }]}>{otherInitial}</Text>
          </View>

          {/* Content */}
          <View style={styles.roomContent}>
            <View style={styles.roomTopRow}>
              <Text
                style={[
                  styles.roomName,
                  { color: C.text },
                  hasUnread && styles.roomNameBold,
                ]}
                numberOfLines={1}
              >
                {otherRole}
              </Text>
              {lastMsgTime ? (
                <Text style={[styles.timeText, { color: C.textTertiary }]}>{lastMsgTime}</Text>
              ) : null}
            </View>
            <View style={styles.roomBottomRow}>
              <Text
                style={[
                  styles.lastMessage,
                  { color: hasUnread ? C.text : C.textSecondary },
                  hasUnread && { fontWeight: '500' },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {lastMsgPreview}
              </Text>
              {hasUnread ? (
                <View style={[styles.unreadBadge, { backgroundColor: C.unreadBg }]}>
                  <Text style={[styles.unreadText, { color: C.unreadText }]}>{unreadLabel}</Text>
                </View>
              ) : (
                <Text style={[styles.chevron, { color: C.textTertiary }]}>›</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedItem>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Chats</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        contentContainerStyle={rooms.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centeredState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: C.primaryMuted }]}>
              <Text style={styles.emptyIcon}>💬</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No active chats</Text>
            <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
              Your conversations with drivers and passengers will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyListContent: {
    flex: 1,
    paddingBottom: 120,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  roomContent: {
    flex: 1,
    gap: 4,
  },
  roomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  roomNameBold: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  roomBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 22,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 24,
  },
  ctaButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Skeleton
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 1,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
  },
});
