
/**
 * Dark Mode Hook for ZimCommute
 * 
 * Provides dark mode state and toggle functionality.
 * Persists user preference in AsyncStorage.
 */

import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = '@zimcommute_dark_mode';

export function useDarkMode() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDarkModePreference();
  }, []);

  const loadDarkModePreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(DARK_MODE_KEY);
      if (savedPreference !== null) {
        setIsDarkMode(savedPreference === 'true');
      }
    } catch (error) {
      console.error('[DarkMode] Failed to load preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem(DARK_MODE_KEY, String(newValue));
      console.log('[DarkMode] Preference saved:', newValue);
    } catch (error) {
      console.error('[DarkMode] Failed to save preference:', error);
    }
  };

  return {
    isDarkMode,
    toggleDarkMode,
    isLoading,
  };
}
