
/**
 * Performance Monitoring Utility for ZimCommute
 * 
 * Tracks app performance metrics and identifies bottlenecks.
 * Helps optimize for Zimbabwe's lower-end devices.
 */

import { InteractionManager } from 'react-native';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 100; // Keep only last 100 metrics

/**
 * Start tracking a performance metric
 */
export function startMetric(name: string): void {
  const metric: PerformanceMetric = {
    name,
    startTime: Date.now(),
  };
  
  metrics.push(metric);
  
  // Keep only last MAX_METRICS
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
  
  console.log(`[Performance] Started tracking: ${name}`);
}

/**
 * End tracking a performance metric
 */
export function endMetric(name: string): number | null {
  const metric = metrics.find(m => m.name === name && !m.endTime);
  
  if (!metric) {
    console.warn(`[Performance] Metric not found: ${name}`);
    return null;
  }
  
  metric.endTime = Date.now();
  metric.duration = metric.endTime - metric.startTime;
  
  console.log(`[Performance] ${name}: ${metric.duration}ms`);
  
  // Warn if operation took too long
  if (metric.duration > 1000) {
    console.warn(`[Performance] SLOW OPERATION: ${name} took ${metric.duration}ms`);
  }
  
  return metric.duration;
}

/**
 * Track screen load time
 */
export function trackScreenLoad(screenName: string): () => void {
  const metricName = `screen_load_${screenName}`;
  startMetric(metricName);
  
  return () => {
    // Wait for interactions to complete before measuring
    InteractionManager.runAfterInteractions(() => {
      endMetric(metricName);
    });
  };
}

/**
 * Track API call duration
 */
export function trackAPICall(endpoint: string): () => void {
  const metricName = `api_${endpoint}`;
  startMetric(metricName);
  
  return () => {
    endMetric(metricName);
  };
}

/**
 * Get all metrics
 */
export function getMetrics(): PerformanceMetric[] {
  return metrics.filter(m => m.duration !== undefined);
}

/**
 * Get average duration for a metric
 */
export function getAverageDuration(name: string): number | null {
  const relevantMetrics = metrics.filter(m => m.name === name && m.duration !== undefined);
  
  if (relevantMetrics.length === 0) {
    return null;
  }
  
  const total = relevantMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
  return total / relevantMetrics.length;
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metrics.length = 0;
  console.log('[Performance] Metrics cleared');
}

/**
 * Log performance summary
 */
export function logPerformanceSummary(): void {
  const completedMetrics = getMetrics();
  
  if (completedMetrics.length === 0) {
    console.log('[Performance] No metrics to report');
    return;
  }
  
  console.log('[Performance] === Performance Summary ===');
  
  // Group by metric name
  const grouped = completedMetrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric.duration!);
    return acc;
  }, {} as Record<string, number[]>);
  
  // Log averages
  Object.entries(grouped).forEach(([name, durations]) => {
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    console.log(`[Performance] ${name}:`);
    console.log(`  - Average: ${avg.toFixed(2)}ms`);
    console.log(`  - Min: ${min}ms`);
    console.log(`  - Max: ${max}ms`);
    console.log(`  - Count: ${durations.length}`);
  });
  
  console.log('[Performance] === End Summary ===');
}
