
import "react-native-reanimated";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import * as SplashScreen from "expo-splash-screen";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { useNetworkState } from "expo-network";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@/styles/commonStyles";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Auth-aware navigation component
 * Implements the "AUTH BOOTSTRAP" rule to prevent redirect loops
 */
function RootLayoutNav() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoading) {
      // Still loading auth state, don't navigate yet
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('[RootLayout] Auth state:', { isAuthenticated, isLoading, segments });

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to login
      console.log('[RootLayout] Redirecting to phone-login');
      router.replace('/auth/phone-login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but still in auth screens
      // Check if profile is complete
      const isProfileComplete = user?.fullName && user?.userType && user?.homeCity;
      
      if (!isProfileComplete && segments[1] !== 'profile-setup') {
        // Profile incomplete, redirect to profile setup
        console.log('[RootLayout] Redirecting to profile-setup');
        router.replace('/auth/profile-setup');
      } else if (isProfileComplete) {
        // Profile complete, redirect to home
        console.log('[RootLayout] Redirecting to home');
        router.replace('/(tabs)/(home)');
      }
    }
  }, [isLoading, isAuthenticated, segments, user, router]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SystemBars style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/phone-login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/verify-otp" options={{ headerShown: false }} />
        <Stack.Screen name="auth/profile-setup" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const { isConnected } = useNetworkState();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <WidgetProvider>
          <RootLayoutNav />
        </WidgetProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
