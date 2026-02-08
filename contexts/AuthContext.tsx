
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'zimcommute_auth_token';
const USER_KEY = 'zimcommute_user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null,
    error: null,
  });

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    console.log('AuthContext: Loading stored auth data');
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        console.log('AuthContext: Found stored auth, user:', user.phoneNumber);
        setState({
          isLoading: false,
          isAuthenticated: true,
          user,
          token,
          error: null,
        });
      } else {
        console.log('AuthContext: No stored auth found');
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
        });
      }
    } catch (error) {
      console.error('AuthContext: Error loading stored auth:', error);
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: 'Failed to load authentication',
      });
    }
  };

  const login = async (token: string, user: User) => {
    console.log('AuthContext: Logging in user:', user.phoneNumber);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      
      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        token,
        error: null,
      });
      console.log('AuthContext: Login successful');
    } catch (error) {
      console.error('AuthContext: Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logging out user');
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      });
      console.log('AuthContext: Logout successful');
    } catch (error) {
      console.error('AuthContext: Error during logout:', error);
      // Still clear state even if SecureStore fails
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      });
    }
  };

  const updateUser = (user: User) => {
    console.log('AuthContext: Updating user data');
    setState(prev => ({
      ...prev,
      user,
    }));
    // Also update stored user data
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch(error => {
      console.error('AuthContext: Error updating stored user:', error);
    });
  };

  const refreshUser = async () => {
    console.log('AuthContext: Refreshing user data from backend');
    if (!state.token) {
      console.log('AuthContext: No token, cannot refresh');
      return;
    }

    try {
      // Import getCurrentUser dynamically to avoid circular dependency
      const { getCurrentUser } = await import('@/utils/api');
      
      const updatedUser = await getCurrentUser();
      
      console.log('AuthContext: User data refreshed successfully');
      
      // Convert backend user to our User type
      const user: User = {
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        fullName: updatedUser.fullName || undefined,
        email: updatedUser.email || undefined,
        profilePhotoUrl: updatedUser.profilePhotoUrl || undefined,
        userType: (updatedUser.userType as 'Passenger' | 'Driver') || undefined,
        homeCity: updatedUser.homeCity || undefined,
        verificationLevel: updatedUser.verificationLevel as 'PhoneVerified' | 'IDUploaded' | 'FullyVerified',
        createdAt: updatedUser.createdAt,
      };
      
      updateUser(user);
    } catch (error) {
      console.error('AuthContext: Error refreshing user data:', error);
      // Don't throw - just log the error
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
