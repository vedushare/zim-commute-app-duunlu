
import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import FloatingTabBar from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { isLoading, isAuthenticated, user } = useAuth();

  console.log('TabLayout (iOS): Auth state -', { isLoading, isAuthenticated, hasUser: !!user });

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('TabLayout (iOS): Not authenticated, redirecting to login');
    return <Redirect href="/auth/phone-login" />;
  }

  // Redirect to profile setup if user hasn't completed profile
  if (user && !user.fullName) {
    console.log('TabLayout (iOS): Profile incomplete, redirecting to setup');
    return <Redirect href="/auth/profile-setup" />;
  }

  const tabs = [
    {
      name: '(home)',
      title: 'Home',
      iosIconName: 'house.fill',
      androidIconName: 'home' as const,
    },
    {
      name: 'profile',
      title: 'Profile',
      iosIconName: 'person.fill',
      androidIconName: 'person' as const,
    },
  ];

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={tabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
