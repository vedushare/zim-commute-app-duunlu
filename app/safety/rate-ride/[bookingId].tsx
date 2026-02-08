
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Button from '@/components/button';
import { CustomModal } from '@/components/ui/CustomModal';
import { colors } from '@/styles/commonStyles';
import { createRating } from '@/utils/safetyApi';

export default function RateRideScreen() {
  const router = useRouter();
  const { bookingId, rideId, ratedUserId } = useLocalSearchParams<{ 
    bookingId: string;
    rideId?: string;
    ratedUserId?: string;
  }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      showModal('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    if (!rideId || !ratedUserId) {
      showModal('Error', 'Missing ride or user information. Please try again from the booking details.');
      return;
    }

    setIsSubmitting(true);
    console.log('[RateRide] Submitting rating:', rating, 'stars for booking:', bookingId);
    
    try {
      await createRating({
        bookingId,
        rideId,
        ratedUserId,
        rating,
        comment: comment.trim() || undefined,
      });
      
      showModal('Thank You!', 'Your rating has been submitted successfully.');
      console.log('[RateRide] Rating submitted successfully');
      
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('[RateRide] Error submitting rating:', error);
      showModal('Error', error.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= rating;
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => {
            console.log('[RateRide] User selected', i, 'stars');
            setRating(i);
          }}
          style={styles.starButton}
        >
          <IconSymbol
            ios_icon_name={isFilled ? 'star.fill' : 'star'}
            android_material_icon_name={isFilled ? 'star' : 'star-border'}
            size={48}
            color={isFilled ? '#FFD700' : colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Rate Your Ride',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="star.circle.fill"
            android_material_icon_name="star"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>How was your ride?</Text>
          <Text style={styles.headerSubtitle}>
            Your feedback helps us maintain a safe and reliable community.
          </Text>
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.starsContainer}>{renderStars()}</View>
          <Text style={styles.ratingLabel}>{getRatingLabel()}</Text>
        </View>

        <View style={styles.commentCard}>
          <Text style={styles.commentLabel}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Share more details about your experience..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Rating Guidelines:</Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipStars}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.tipText}>Excellent - Safe, punctual, friendly</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipStars}>⭐⭐⭐⭐</Text>
            <Text style={styles.tipText}>Very Good - Minor issues</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipStars}>⭐⭐⭐</Text>
            <Text style={styles.tipText}>Good - Acceptable experience</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipStars}>⭐⭐</Text>
            <Text style={styles.tipText}>Fair - Several issues</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipStars}>⭐</Text>
            <Text style={styles.tipText}>Poor - Serious concerns</Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={20}
            color={colors.warning}
          />
          <Text style={styles.warningText}>
            If you experienced safety issues, please also file a report through the Report User feature.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Submitting...' : 'Submit Rating'}
          onPress={handleSubmitRating}
          disabled={isSubmitting || rating === 0}
          style={styles.submitButton}
        />
      </View>

      <CustomModal
        isVisible={modalVisible}
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
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  ratingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  commentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipStars: {
    fontSize: 14,
    width: 80,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  warningText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    width: '100%',
  },
});
