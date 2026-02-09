
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getRoutes, createRoute, updateRoute, deleteRoute, initializeRoutes } from '@/utils/adminApi';
import type { RouteConfig } from '@/types/admin';
import { CustomModal } from '@/components/ui/CustomModal';
import Button from '@/components/button';
import { ZIMBABWE_CITIES } from '@/constants/zimbabwe';

export default function RoutesConfigScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formDistance, setFormDistance] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formIsPopular, setFormIsPopular] = useState(false);

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const loadRoutes = useCallback(async () => {
    console.log('Loading routes configuration');
    try {
      const data = await getRoutes();
      setRoutes(data);
    } catch (error: any) {
      console.error('Failed to load routes:', error);
      showModal('Error', error.message || 'Failed to load routes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showModal]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  const handleInitializeRoutes = async () => {
    try {
      await initializeRoutes();
      showModal('Success', 'Zimbabwe routes have been initialized');
      loadRoutes();
    } catch (error: any) {
      console.error('Failed to initialize routes:', error);
      showModal('Error', error.message || 'Failed to initialize routes');
    }
  };

  const handleCreateRoute = () => {
    setIsCreating(true);
    setSelectedRoute(null);
    setFormOrigin('');
    setFormDestination('');
    setFormDistance('');
    setFormDuration('');
    setFormPrice('');
    setFormIsPopular(false);
    setEditModalVisible(true);
  };

  const handleEditRoute = (route: RouteConfig) => {
    setIsCreating(false);
    setSelectedRoute(route);
    setFormOrigin(route.origin);
    setFormDestination(route.destination);
    setFormDistance(route.distanceKm.toString());
    setFormDuration(route.estimatedDurationMinutes.toString());
    setFormPrice(route.suggestedPrice.toString());
    setFormIsPopular(route.isPopular);
    setEditModalVisible(true);
  };

  const handleSaveRoute = async () => {
    const distanceKm = parseFloat(formDistance);
    const estimatedDurationMinutes = parseInt(formDuration);
    const suggestedPrice = parseFloat(formPrice);
    
    if (!formOrigin || !formDestination) {
      showModal('Error', 'Please select origin and destination');
      return;
    }
    
    if (isNaN(distanceKm) || isNaN(estimatedDurationMinutes) || isNaN(suggestedPrice)) {
      showModal('Error', 'Please enter valid numbers for distance, duration, and price');
      return;
    }

    try {
      if (isCreating) {
        await createRoute({
          origin: formOrigin,
          destination: formDestination,
          distanceKm,
          estimatedDurationMinutes,
          suggestedPrice,
          isPopular: formIsPopular,
        });
        showModal('Success', 'Route created successfully');
      } else if (selectedRoute) {
        await updateRoute(selectedRoute.id, {
          origin: formOrigin,
          destination: formDestination,
          distanceKm,
          estimatedDurationMinutes,
          suggestedPrice,
          isPopular: formIsPopular,
        });
        showModal('Success', 'Route updated successfully');
      }
      setEditModalVisible(false);
      loadRoutes();
    } catch (error: any) {
      console.error('Failed to save route:', error);
      showModal('Error', error.message || 'Failed to save route');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await deleteRoute(routeId);
      showModal('Success', 'Route deleted successfully');
      loadRoutes();
    } catch (error: any) {
      console.error('Failed to delete route:', error);
      showModal('Error', error.message || 'Failed to delete route');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Route Management', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Route Management', headerShown: true }} />
      
      <View style={styles.header}>
        <Button
          title="Initialize Zimbabwe Routes"
          onPress={handleInitializeRoutes}
          style={styles.initButton}
        />
        <Button
          title="Add Route"
          onPress={handleCreateRoute}
          style={styles.addButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.routesList}>
          {routes.map((route) => {
            const routeText = `${route.origin} → ${route.destination}`;
            const distanceText = `${route.distanceKm} km`;
            const durationText = `${route.estimatedDurationMinutes} min`;
            const priceText = `$${route.suggestedPrice.toFixed(2)}`;
            
            return (
              <View key={route.id} style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeText}>{routeText}</Text>
                    {route.isPopular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.routeDetails}>
                  <View style={styles.routeDetailRow}>
                    <IconSymbol
                      ios_icon_name="map"
                      android_material_icon_name="map"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.routeDetailText}>{distanceText}</Text>
                  </View>
                  <View style={styles.routeDetailRow}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="schedule"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.routeDetailText}>{durationText}</Text>
                  </View>
                  <View style={styles.routeDetailRow}>
                    <IconSymbol
                      ios_icon_name="dollarsign.circle"
                      android_material_icon_name="attach-money"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.routeDetailText}>{priceText}</Text>
                  </View>
                </View>

                <View style={styles.routeActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditRoute(route)}
                  >
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRoute(route.id)}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={16}
                      color={colors.danger}
                    />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {routes.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="map"
                android_material_icon_name="map"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No routes configured</Text>
              <Text style={styles.emptyStateSubtext}>
                Click "Initialize Zimbabwe Routes" to add default routes
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit/Create Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isCreating ? 'Create Route' : 'Edit Route'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.formLabel}>Origin</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Select origin city"
                placeholderTextColor={colors.textSecondary}
                value={formOrigin}
                onChangeText={setFormOrigin}
              />

              <Text style={styles.formLabel}>Destination</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Select destination city"
                placeholderTextColor={colors.textSecondary}
                value={formDestination}
                onChangeText={setFormDestination}
              />

              <Text style={styles.formLabel}>Distance (km)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter distance in kilometers"
                placeholderTextColor={colors.textSecondary}
                value={formDistance}
                onChangeText={setFormDistance}
                keyboardType="decimal-pad"
              />

              <Text style={styles.formLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter estimated duration"
                placeholderTextColor={colors.textSecondary}
                value={formDuration}
                onChangeText={setFormDuration}
                keyboardType="number-pad"
              />

              <Text style={styles.formLabel}>Suggested Price ($)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter suggested price"
                placeholderTextColor={colors.textSecondary}
                value={formPrice}
                onChangeText={setFormPrice}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormIsPopular(!formIsPopular)}
              >
                <View style={[styles.checkbox, formIsPopular && styles.checkboxChecked]}>
                  {formIsPopular && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={16}
                      color="#FFFFFF"
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Mark as popular route</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setEditModalVisible(false)}
                style={styles.cancelButton}
              />
              <Button
                title="Save"
                onPress={handleSaveRoute}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onConfirm={() => setModalVisible(false)}
        confirmText="OK"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  initButton: {
    flex: 1,
    backgroundColor: colors.info,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  routesList: {
    padding: 16,
  },
  routeCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  routeHeader: {
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  popularBadge: {
    backgroundColor: colors.warning,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  routeDetails: {
    gap: 8,
    marginBottom: 12,
  },
  routeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDetailText: {
    fontSize: 14,
    color: colors.text,
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    paddingVertical: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.danger + '20',
    borderRadius: 8,
    paddingVertical: 10,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalForm: {
    maxHeight: 400,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
