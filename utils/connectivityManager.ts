
/**
 * Connectivity Manager for ZimCommute
 * 
 * Monitors network connectivity and provides hooks for components
 * to react to connectivity changes.
 */

import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export interface ConnectivityState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: Network.NetworkStateType;
}

let connectivityListeners: Array<(state: ConnectivityState) => void> = [];
let currentState: ConnectivityState = {
  isConnected: false,
  isInternetReachable: null,
  type: Network.NetworkStateType.UNKNOWN,
};

/**
 * Initialize connectivity monitoring
 */
export async function initializeConnectivityMonitoring(): Promise<void> {
  console.log('[Connectivity] Initializing connectivity monitoring');
  
  // Get initial state
  await updateConnectivityState();
  
  // Set up polling (expo-network doesn't have event listeners in all versions)
  setInterval(async () => {
    await updateConnectivityState();
  }, 5000); // Check every 5 seconds
}

/**
 * Update connectivity state
 */
async function updateConnectivityState(): Promise<void> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    
    const newState: ConnectivityState = {
      isConnected: networkState.isConnected ?? false,
      isInternetReachable: networkState.isInternetReachable ?? null,
      type: networkState.type,
    };

    // Only notify if state changed
    if (
      newState.isConnected !== currentState.isConnected ||
      newState.isInternetReachable !== currentState.isInternetReachable
    ) {
      console.log('[Connectivity] State changed:', newState);
      currentState = newState;
      notifyListeners(newState);
    }
  } catch (error) {
    console.error('[Connectivity] Error updating state:', error);
  }
}

/**
 * Notify all listeners of connectivity change
 */
function notifyListeners(state: ConnectivityState): void {
  connectivityListeners.forEach(listener => {
    try {
      listener(state);
    } catch (error) {
      console.error('[Connectivity] Error in listener:', error);
    }
  });
}

/**
 * Add connectivity listener
 */
export function addConnectivityListener(
  listener: (state: ConnectivityState) => void
): () => void {
  connectivityListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    connectivityListeners = connectivityListeners.filter(l => l !== listener);
  };
}

/**
 * Get current connectivity state
 */
export function getCurrentConnectivityState(): ConnectivityState {
  return currentState;
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return currentState.isConnected && currentState.isInternetReachable !== false;
}

/**
 * React hook for connectivity state
 */
export function useConnectivity(): ConnectivityState & { isOnline: boolean } {
  const [state, setState] = useState<ConnectivityState>(currentState);

  useEffect(() => {
    // Set initial state
    setState(currentState);

    // Subscribe to changes
    const unsubscribe = addConnectivityListener(setState);

    return unsubscribe;
  }, []);

  return {
    ...state,
    isOnline: state.isConnected && state.isInternetReachable !== false,
  };
}

/**
 * Wait for connectivity
 */
export async function waitForConnectivity(timeoutMs: number = 30000): Promise<boolean> {
  if (isOnline()) return true;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeoutMs);

    const unsubscribe = addConnectivityListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      }
    });
  });
}
