import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { AppText, AppTextInput } from '../components/Typography';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { reviewsService } from '../services/api';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type CreateReviewScreenProps = NativeStackScreenProps<HomeStackParamList, 'CreateReview'>;

const CreateReviewScreen: React.FC<CreateReviewScreenProps> = ({ navigation, route }) => {
  const { movie, review: existingReview } = route.params;
  const { isAuthenticated, isGuest } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [review, setReview] = useState(existingReview?.review || '');
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastAnimation] = useState(new Animated.Value(-80));
  const [focused, setFocused] = useState(false);

  const isEditing = !!existingReview;
  const reviewLength = review.length;
  const minReviewLength = 10;
  const maxReviewLength = 1000;

  // Redirect guests to login
  useEffect(() => {
    if (!isAuthenticated || isGuest) {
      Alert.alert(
        'Login Required',
        'Please login or sign up to write a review',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [isAuthenticated, isGuest, navigation]);

  useEffect(() => {
    if (showSuccessToast) {
      Animated.spring(toastAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(toastAnimation, {
          toValue: -80,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccessToast(false);
          navigation.goBack();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [showSuccessToast, toastAnimation, navigation]);

  const handleSubmit = async () => {
    if (!review.trim()) {
      Alert.alert('Review Required', 'Please share your thoughts about this movie');
      return;
    }

    if (review.trim().length < minReviewLength) {
      Alert.alert(
        'Review Too Short',
        `Please write at least ${minReviewLength} characters to help others understand your opinion.`
      );
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing && existingReview?._id) {
        // Update existing review - only send rating and review
        await reviewsService.update(existingReview._id, {
          rating,
          review: review.trim(),
        });
      } else {
        // Create new review - include movie identifier
        const reviewData: any = {
          rating,
          review: review.trim(),
        };

        // Ensure we have either tmdbId or movieId
        if (movie.tmdbId) {
          reviewData.tmdbId = movie.tmdbId;
        } else if (movie._id) {
          reviewData.movieId = movie._id;
        } else {
          throw new Error('Movie identifier is missing. Please try again.');
        }

        console.log('Submitting review with data:', { 
          rating: reviewData.rating, 
          reviewLength: reviewData.review.length,
          hasTmdbId: !!reviewData.tmdbId,
          hasMovieId: !!reviewData.movieId,
          tmdbId: reviewData.tmdbId,
          movieId: reviewData.movieId,
        });
        console.log('Movie object:', { 
          tmdbId: movie.tmdbId, 
          _id: movie._id,
          title: movie.title 
        });
        
        await reviewsService.create(reviewData);
      }
      
      setShowSuccessToast(true);
    } catch (error: any) {
      console.error('Review submission error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to submit review. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for specific common errors
      if (errorMessage.includes('already reviewed')) {
        Alert.alert(
          'Already Reviewed',
          'You have already reviewed this movie. You can edit your existing review from the movie details page.',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (value: number) => {
    if (value >= 8) return '#4CAF50';
    if (value >= 6) return '#FFC107';
    return '#F44336';
  };

  const getRatingLabel = (value: number) => {
    if (value >= 9) return 'Masterpiece';
    if (value >= 8) return 'Excellent';
    if (value >= 7) return 'Good';
    if (value >= 6) return 'Decent';
    if (value >= 5) return 'Average';
    return 'Poor';
  };

  const renderStarRating = () => {
    return (
      <View style={styles.ratingSection}>
        <View style={styles.ratingHeader}>
          <AppText style={styles.ratingLabel}>How would you rate this movie?</AppText>
          {rating > 0 && (
            <View style={[styles.ratingBadge, { borderColor: getRatingColor(rating) }]}>
              <AppText style={styles.ratingBadgeText}>{rating}/10</AppText>
              <AppText style={[styles.ratingBadgeLabel, { color: getRatingColor(rating) }]}>
                {getRatingLabel(rating)}
              </AppText>
            </View>
          )}
        </View>
        
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.starButton}
              onPress={() => setRating(value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rating >= value ? 'star' : 'star-outline'}
                size={26}
                color={rating >= value ? getRatingColor(rating) : '#666'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {showSuccessToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastAnimation }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <AppText style={styles.toastText} numberOfLines={1}>
            {movie.title || 'Movie'} - Review {isEditing ? 'updated' : 'added'} successfully!
          </AppText>
        </Animated.View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Movie Info Card */}
            <View style={styles.movieCard}>
              {movie.posterUrl && (
                <Image
                  source={{ uri: movie.posterUrl }}
                  style={styles.moviePoster}
                  resizeMode="cover"
                />
              )}
              <View style={styles.movieInfo}>
                <AppText style={styles.movieTitle} numberOfLines={2}>
                  {movie.title || 'Untitled'}
                </AppText>
                {movie.releaseDate && (
                  <AppText style={styles.movieYear}>
                    {new Date(movie.releaseDate).getFullYear()}
                  </AppText>
                )}
              </View>
            </View>

            {/* Rating Section */}
            {renderStarRating()}

            {/* Review Text Section */}
            <View style={styles.reviewSection}>
              <View style={styles.reviewHeader}>
                <AppText style={styles.reviewLabel}>
                  Share your thoughts {isEditing && '(Editing)'}
                </AppText>
                <AppText style={styles.characterCount}>
                  {reviewLength}/{maxReviewLength}
                </AppText>
              </View>
              
              <View
                style={[
                  styles.textAreaContainer,
                  focused && styles.textAreaContainerFocused,
                  reviewLength < minReviewLength && reviewLength > 0 && styles.textAreaContainerWarning,
                ]}
              >
                <AppTextInput
                  style={styles.textArea}
                  placeholder="What did you think of this movie? Share your honest opinion..."
                  placeholderTextColor="#666"
                  value={review}
                  onChangeText={setReview}
                  multiline={true}
                  numberOfLines={8}
                  textAlignVertical="top"
                  maxLength={maxReviewLength}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  blurOnSubmit={false}
                />
                {reviewLength > 0 && reviewLength < minReviewLength && (
                  <View style={styles.minLengthWarning}>
                    <Ionicons name="information-circle" size={16} color="#FFC107" />
                    <AppText style={styles.minLengthText}>
                      At least {minReviewLength} characters required ({minReviewLength - reviewLength} more)
                    </AppText>
                  </View>
                )}
              </View>

              {/* Helper Text */}
              <View style={styles.helperTextContainer}>
                <Ionicons name="bulb-outline" size={16} color="#666" />
                <AppText style={styles.helperText}>
                  Be honest and specific. Your review helps others discover great movies!
                </AppText>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || reviewLength < minReviewLength) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || reviewLength < minReviewLength}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isEditing ? 'checkmark-circle' : 'send'}
                    size={20}
                    color="#fff"
                  />
                  <AppText style={styles.submitButtonText}>
                    {isEditing ? 'Update Review' : 'Submit Review'}
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    width: '100%',
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
    gap: 16,
  },
  moviePoster: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  movieYear: {
    fontSize: 14,
    color: '#999',
  },
  ratingSection: {
    marginBottom: 32,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  ratingBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  ratingBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 2,
  },
  starButton: {
    flex: 1,
    minWidth: 0,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  characterCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  textAreaContainer: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    marginBottom: 12,
    minHeight: 200,
  },
  textAreaContainerFocused: {
    borderColor: '#007AFF',
  },
  textAreaContainerWarning: {
    borderColor: '#FFC107',
  },
  textArea: {
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 200,
    lineHeight: 24,
  },
  minLengthWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  minLengthText: {
    fontSize: 12,
    color: '#FFC107',
    flex: 1,
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CreateReviewScreen;
