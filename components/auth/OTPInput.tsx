
import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '@/styles/commonStyles';

interface OTPInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  error?: boolean;
}

export function OTPInput({ length = 6, value, onChangeText, error }: OTPInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleChangeText = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');

    if (digit.length === 0) {
      // Handle backspace
      const newValue = value.substring(0, index) + value.substring(index + 1);
      onChangeText(newValue);

      // Move to previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (digit.length === 1) {
      // Handle single digit input
      const newValue = value.substring(0, index) + digit + value.substring(index + 1);
      onChangeText(newValue);

      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (digit.length > 1) {
      // Handle paste of multiple digits
      const newValue = digit.substring(0, length);
      onChangeText(newValue);

      // Focus last filled input
      const lastIndex = Math.min(newValue.length - 1, length - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOTP = async () => {
    console.log('[OTPInput] User tapped Paste OTP button');
    try {
      const clipboardText = await Clipboard.getStringAsync();
      console.log('[OTPInput] Clipboard content retrieved');
      const match = clipboardText.match(/\d{6}/);
      if (match) {
        const otpCode = match[0];
        console.log('[OTPInput] Extracted OTP from clipboard:', otpCode);
        onChangeText(otpCode);
        const lastIndex = Math.min(otpCode.length - 1, length - 1);
        inputRefs.current[lastIndex]?.focus();
      } else {
        console.log('[OTPInput] No 6-digit OTP found in clipboard');
      }
    } catch (err) {
      console.error('[OTPInput] Failed to read clipboard:', err);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] || '';
          const isFocused = focusedIndex === index;

          // Only set textContentType on iOS and only on the first input box
          // to trigger the system OTP suggestion without crashing on Android
          const isFirstInput = index === 0;

          // On Android, 'one-time-code' / 'sms-otp' triggers an internal React
          // Navigation route lookup that crashes with "Cannot read property 'route'
          // of undefined". Use it only on iOS; fall back to 'off' on Android.
          const autoCompleteValue = Platform.OS === 'ios' && isFirstInput ? 'one-time-code' : 'off';

          return (
            <TextInput
              key={index}
              ref={ref => (inputRefs.current[index] = ref)}
              style={[
                styles.input,
                isFocused && styles.inputFocused,
                error && styles.inputError,
                digit && styles.inputFilled,
              ]}
              value={digit}
              onChangeText={text => handleChangeText(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={1}
              autoComplete={autoCompleteValue}
              {...(Platform.OS === 'ios' && isFirstInput ? { textContentType: 'oneTimeCode' } : {})}
            />
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.pasteButton}
        onPress={handlePasteOTP}
        activeOpacity={0.7}
      >
        <Text style={styles.pasteButtonText}>Paste OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
  },
  input: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.card,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundAlt,
  },
  pasteButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 4,
  },
  pasteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
