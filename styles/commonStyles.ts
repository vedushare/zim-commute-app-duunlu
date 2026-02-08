
import { StyleSheet } from 'react-native';

export const colors = {
  // Primary brand colors (Zimbabwe flag inspired)
  primary: '#009E49', // Green
  secondary: '#FFD100', // Yellow
  accent: '#EF2B2D', // Red
  
  // UI colors
  background: '#FFFFFF',
  backgroundAlt: '#F3F4F6',
  card: '#F8F9FA',
  border: '#E5E7EB',
  
  // Text colors
  text: '#1F2937',
  textSecondary: '#6B7280',
  
  // Status colors
  success: '#10B981',
  error: '#EF4444',
  danger: '#DC2626', // Darker red for destructive actions
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
});
