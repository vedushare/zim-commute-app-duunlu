
/**
 * Custom Modal Component
 * 
 * A cross-platform modal for confirmations, alerts, and messages.
 * Replaces Alert.alert() which doesn't work well on web.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

export interface CustomModalProps {
  visible?: boolean;
  isVisible?: boolean; // Alternative prop name for compatibility
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  buttons?: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[];
  onClose?: () => void;
  // Simple confirmation pattern props
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function CustomModal({
  visible,
  isVisible,
  title,
  message,
  type = 'info',
  buttons = [],
  onClose,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
}: CustomModalProps) {
  // Support both visible and isVisible props
  const isModalVisible = visible ?? isVisible ?? false;
  
  // Build buttons array from simple props if provided
  let modalButtons = buttons;
  
  if (buttons.length === 0 && (onConfirm || onCancel)) {
    modalButtons = [];
    if (onCancel) {
      modalButtons.push({
        text: cancelText,
        onPress: onCancel,
        style: 'cancel' as const,
      });
    }
    if (onConfirm) {
      modalButtons.push({
        text: confirmText,
        onPress: onConfirm,
        style: 'default' as const,
      });
    }
  }
  
  const defaultButtons = modalButtons.length > 0 ? modalButtons : [
    {
      text: 'OK',
      onPress: onClose || onConfirm || (() => {}),
      style: 'default' as const,
    },
  ];

  const getIconForType = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose || onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{getIconForType()}</Text>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {defaultButtons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                  ]}
                  onPress={button.onPress}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: colors.backgroundAlt,
  },
  buttonDestructive: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: colors.text,
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
});
