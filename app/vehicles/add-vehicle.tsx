
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { CustomModal } from '@/components/ui/CustomModal';
import { createVehicle } from '@/utils/ridesApi';
import Button from '@/components/button';

export default function AddVehicleScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [seats, setSeats] = useState('');
  
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });

  const handleAddVehicle = async () => {
    if (!make.trim()) {
      setErrorModal({ visible: true, message: 'Please enter vehicle make' });
      return;
    }
    if (!model.trim()) {
      setErrorModal({ visible: true, message: 'Please enter vehicle model' });
      return;
    }
    if (!year || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1) {
      setErrorModal({ visible: true, message: 'Please enter a valid year' });
      return;
    }
    if (!color.trim()) {
      setErrorModal({ visible: true, message: 'Please enter vehicle color' });
      return;
    }
    if (!licensePlate.trim()) {
      setErrorModal({ visible: true, message: 'Please enter license plate' });
      return;
    }
    if (!seats || parseInt(seats) < 1 || parseInt(seats) > 7) {
      setErrorModal({ visible: true, message: 'Seats must be between 1 and 7' });
      return;
    }

    try {
      setLoading(true);
      console.log('Adding vehicle:', make, model, year);
      
      await createVehicle({
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        color: color.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        seats: parseInt(seats),
      });

      setSuccessModal({ visible: true, message: 'Vehicle added successfully!' });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Failed to add vehicle:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to add vehicle' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Add Vehicle', headerShown: true }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Make</Text>
        <TextInput
          style={styles.input}
          value={make}
          onChangeText={setMake}
          placeholder="e.g., Toyota"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="e.g., Corolla"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Year</Text>
        <TextInput
          style={styles.input}
          value={year}
          onChangeText={setYear}
          keyboardType="number-pad"
          placeholder="e.g., 2020"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Color</Text>
        <TextInput
          style={styles.input}
          value={color}
          onChangeText={setColor}
          placeholder="e.g., Silver"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>License Plate</Text>
        <TextInput
          style={styles.input}
          value={licensePlate}
          onChangeText={setLicensePlate}
          placeholder="e.g., ABC 1234"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Number of Seats</Text>
        <TextInput
          style={styles.input}
          value={seats}
          onChangeText={setSeats}
          keyboardType="number-pad"
          placeholder="1-7"
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Adding...' : 'Add Vehicle'}
            onPress={handleAddVehicle}
            disabled={loading}
          />
        </View>
      </ScrollView>

      <CustomModal
        visible={errorModal.visible}
        title="Error"
        message={errorModal.message}
        type="error"
        buttons={[{ text: 'OK', onPress: () => setErrorModal({ visible: false, message: '' }) }]}
        onClose={() => setErrorModal({ visible: false, message: '' })}
      />

      <CustomModal
        visible={successModal.visible}
        title="Success"
        message={successModal.message}
        type="success"
        buttons={[{ text: 'OK', onPress: () => setSuccessModal({ visible: false, message: '' }) }]}
        onClose={() => setSuccessModal({ visible: false, message: '' })}
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
  scrollContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
});
