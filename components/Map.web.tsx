import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { colors } from '@/styles/commonStyles';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

interface MapProps {
  markers?: MapMarker[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: ViewStyle;
  showsUserLocation?: boolean;
  driverLocation?: { latitude: number; longitude: number };
  origin?: { latitude: number; longitude: number; label?: string };
  destination?: { latitude: number; longitude: number; label?: string };
}

export const Map = ({
  markers = [],
  initialRegion,
  style,
  driverLocation,
  origin,
  destination,
}: MapProps) => {
  const hasOrigin = !!origin;
  const hasDestination = !!destination;
  const hasDriver = !!driverLocation;
  const hasMarkers = markers.length > 0;

  const originLabel = origin?.label || 'Origin';
  const destinationLabel = destination?.label || 'Destination';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.placeholder}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Map View</Text>
        <Text style={styles.subtitle}>Interactive map not available on web</Text>

        {(hasOrigin || hasDestination || hasDriver || hasMarkers) && (
          <View style={styles.locationList}>
            {hasOrigin && (
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.locationLabel}>{originLabel}</Text>
                <Text style={styles.locationCoords}>
                  {origin!.latitude.toFixed(4)}, {origin!.longitude.toFixed(4)}
                </Text>
              </View>
            )}
            {hasDestination && (
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.locationLabel}>{destinationLabel}</Text>
                <Text style={styles.locationCoords}>
                  {destination!.latitude.toFixed(4)}, {destination!.longitude.toFixed(4)}
                </Text>
              </View>
            )}
            {hasDriver && (
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.locationLabel}>Driver</Text>
                <Text style={styles.locationCoords}>
                  {driverLocation!.latitude.toFixed(4)}, {driverLocation!.longitude.toFixed(4)}
                </Text>
              </View>
            )}
            {markers.map((m) => (
              <View key={m.id} style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: '#006B3F' }]} />
                <Text style={styles.locationLabel}>{m.title || m.id}</Text>
                <Text style={styles.locationCoords}>
                  {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default Map;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    width: '100%',
    minHeight: 200,
    backgroundColor: '#f0f4f0',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  locationList: {
    width: '100%',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  locationCoords: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});
