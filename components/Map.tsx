import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

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
  // Extended props for ride tracking
  driverLocation?: { latitude: number; longitude: number };
  origin?: { latitude: number; longitude: number; label?: string };
  destination?: { latitude: number; longitude: number; label?: string };
}

export const Map = ({
  markers = [],
  initialRegion,
  style,
  showsUserLocation = false,
  driverLocation,
  origin,
  destination,
}: MapProps) => {

  const resolvedRegion = initialRegion ?? {
    latitude: origin?.latitude ?? driverLocation?.latitude ?? -17.8252,
    longitude: origin?.longitude ?? driverLocation?.longitude ?? 31.0335,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Build combined markers list from both legacy markers prop and new typed props
  const allMarkers = useMemo(() => {
    const combined: Array<{ id: string; lat: number; lng: number; title: string; color: string }> = [];

    markers.forEach((m) => {
      combined.push({ id: m.id, lat: m.latitude, lng: m.longitude, title: m.title || m.id, color: '#006B3F' });
    });

    if (origin) {
      combined.push({ id: 'origin', lat: origin.latitude, lng: origin.longitude, title: origin.label || 'Origin', color: '#10B981' });
    }
    if (destination) {
      combined.push({ id: 'destination', lat: destination.latitude, lng: destination.longitude, title: destination.label || 'Destination', color: '#EF4444' });
    }
    if (driverLocation) {
      combined.push({ id: 'driver', lat: driverLocation.latitude, lng: driverLocation.longitude, title: 'Driver', color: '#3B82F6' });
    }

    return combined;
  }, [markers, origin, destination, driverLocation]);

  const mapHtml = useMemo(() => {
    const centerLat = resolvedRegion.latitude;
    const centerLng = resolvedRegion.longitude;
    const zoom = 13;
    const markersJson = JSON.stringify(allMarkers);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            var markersData = ${markersJson};
            markersData.forEach(function(m) {
                var icon = L.divIcon({
                    className: '',
                    html: '<div style="width:14px;height:14px;border-radius:50%;background:' + m.color + ';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                });
                var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
                if (m.title) {
                    marker.bindPopup('<b>' + m.title + '</b>');
                }
            });

            window.updateDriverLocation = function(lat, lng) {
                if (window.driverMarker) {
                    window.driverMarker.setLatLng([lat, lng]);
                }
            };
        </script>
    </body>
    </html>
    `;
  }, [allMarkers, resolvedRegion]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        scrollEnabled={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#006B3F" />
          </View>
        )}
      />
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
    backgroundColor: '#e5e7eb',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
