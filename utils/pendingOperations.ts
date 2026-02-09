
/**
 * Pending Operations Queue for ZimCommute
 * 
 * Manages operations that need to be synced when the device comes back online.
 * Implements retry logic with exponential backoff.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './offlineStorage';

export type OperationType =
  | 'CREATE_RIDE'
  | 'UPDATE_RIDE'
  | 'DELETE_RIDE'
  | 'CREATE_BOOKING'
  | 'CANCEL_BOOKING'
  | 'UPDATE_PROFILE'
  | 'CREATE_VEHICLE'
  | 'DELETE_VEHICLE'
  | 'CREATE_EMERGENCY_CONTACT'
  | 'DELETE_EMERGENCY_CONTACT'
  | 'CREATE_RATING'
  | 'CREATE_REPORT';

export interface PendingOperation {
  id: string;
  type: OperationType;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
  localId?: string; // For optimistic UI updates
}

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 60000; // 1 minute

/**
 * Add operation to pending queue
 */
export async function addPendingOperation(
  type: OperationType,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any,
  localId?: string
): Promise<string> {
  try {
    const operations = await getPendingOperations();
    
    const operation: PendingOperation = {
      id: generateOperationId(),
      type,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      status: 'pending',
      localId,
    };

    operations.push(operation);
    await savePendingOperations(operations);

    console.log(`[PendingOperations] Added operation: ${type} (${operation.id})`);
    return operation.id;
  } catch (error) {
    console.error('[PendingOperations] Error adding operation:', error);
    throw error;
  }
}

/**
 * Get all pending operations
 */
export async function getPendingOperations(): Promise<PendingOperation[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('[PendingOperations] Error getting operations:', error);
    return [];
  }
}

/**
 * Save pending operations
 */
async function savePendingOperations(operations: PendingOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_OPERATIONS,
      JSON.stringify(operations)
    );
  } catch (error) {
    console.error('[PendingOperations] Error saving operations:', error);
    throw error;
  }
}

/**
 * Update operation status
 */
export async function updateOperationStatus(
  operationId: string,
  status: PendingOperation['status'],
  error?: string
): Promise<void> {
  try {
    const operations = await getPendingOperations();
    const operation = operations.find(op => op.id === operationId);

    if (operation) {
      operation.status = status;
      if (error) operation.error = error;
      if (status === 'processing') operation.retryCount++;
      
      await savePendingOperations(operations);
      console.log(`[PendingOperations] Updated operation ${operationId} status: ${status}`);
    }
  } catch (error) {
    console.error('[PendingOperations] Error updating operation status:', error);
  }
}

/**
 * Remove completed or failed operations
 */
export async function removeOperation(operationId: string): Promise<void> {
  try {
    const operations = await getPendingOperations();
    const filtered = operations.filter(op => op.id !== operationId);
    await savePendingOperations(filtered);
    console.log(`[PendingOperations] Removed operation: ${operationId}`);
  } catch (error) {
    console.error('[PendingOperations] Error removing operation:', error);
  }
}

/**
 * Clear all pending operations
 */
export async function clearPendingOperations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OPERATIONS);
    console.log('[PendingOperations] Cleared all pending operations');
  } catch (error) {
    console.error('[PendingOperations] Error clearing operations:', error);
  }
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number): number {
  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
    MAX_RETRY_DELAY
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

/**
 * Check if operation should be retried
 */
export function shouldRetryOperation(operation: PendingOperation): boolean {
  return (
    operation.status !== 'completed' &&
    operation.retryCount < operation.maxRetries
  );
}

/**
 * Get operations ready for retry
 */
export async function getOperationsReadyForRetry(): Promise<PendingOperation[]> {
  try {
    const operations = await getPendingOperations();
    const now = Date.now();

    return operations.filter(op => {
      if (op.status === 'completed') return false;
      if (op.retryCount >= op.maxRetries) return false;
      
      const delay = getRetryDelay(op.retryCount);
      const nextRetryTime = op.timestamp + delay;
      
      return now >= nextRetryTime;
    });
  } catch (error) {
    console.error('[PendingOperations] Error getting operations ready for retry:', error);
    return [];
  }
}

/**
 * Generate unique operation ID
 */
function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get operation by local ID
 */
export async function getOperationByLocalId(localId: string): Promise<PendingOperation | null> {
  try {
    const operations = await getPendingOperations();
    return operations.find(op => op.localId === localId) || null;
  } catch (error) {
    console.error('[PendingOperations] Error getting operation by local ID:', error);
    return null;
  }
}

/**
 * Get pending operations count
 */
export async function getPendingOperationsCount(): Promise<number> {
  try {
    const operations = await getPendingOperations();
    return operations.filter(op => op.status === 'pending' || op.status === 'processing').length;
  } catch (error) {
    console.error('[PendingOperations] Error getting pending count:', error);
    return 0;
  }
}
