import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { reviewsService } from '../services/api';
import { HomeStackParamList } from '../navigation/AppNavigator';

type CreateReviewScreenProps = NativeStackScreenProps<HomeStackParamList, 'CreateReview'>;

const CreateReviewScreen: React.FC<CreateReviewScreenProps> = ({ navigation, route }) => {
  const { movie } = route.params;
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastAnimation] = useState(new Animated.Value(-80));

  useEffect(() => {
    if (showSuccessToast) {
      // Animate toast in
      Animated.spring(toastAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto-dismiss and navigate back after 2.5 seconds
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
      Alert.alert('Error', 'Please write a review');
      return;
    }

    try {
      setLoading(true);
      const reviewData: any = {
        rating,
        review: review.trim(),
      };

      if (title.trim()) {
        reviewData.title = title.trim();
      }

      if (movie.tmdbId) {
        reviewData.tmdbId = movie.tmdbId;
      } else if (movie._id) {
        reviewData.movieId = movie._id;
      }

      await reviewsService.create(reviewData);
      
      // Show success toast instead of Alert
      setShowSuccessToast(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderRatingButtons = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.label}>Rating *</Text>
        <View style={styles.ratingButtons}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.ratingButton,
                rating === value && styles.ratingButtonActive,
              ]}
              onPress={() => setRating(value)}
            >
              <Text
                style={[
                  styles.ratingButtonText,
                  rating === value && styles.ratingButtonTextActive,
                ]}
              >
                {value}
              </Text>
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
          <Text style={styles.toastText} numberOfLines={1}>
            {movie.title || 'Movie'} - Review added successfully!
          </Text>
        </Animated.View>
      )}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        scrollEventThrottle={16}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <Text style={styles.movieTitle}>{movie.title || 'Untitled'}</Text>

            {renderRatingButtons()}

            <View style={styles.form}>
              <Text style={styles.label}>Review Title (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Amazing Movie!"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                blurOnSubmit={false}
              />

              <Text style={styles.label}>Your Review *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your review here..."
                placeholderTextColor="#999"
                value={review}
                onChangeText={setReview}
                multiline={true}
                numberOfLines={8}
                textAlignVertical="top"
                blurOnSubmit={true}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#45a049',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  content: {
    width: '100%',
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff',
  },
  ratingContainer: {
    marginBottom: 24,
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  ratingButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  ratingButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#ccc',
  },
  ratingButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#fff',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  textArea: {
    height: 150,
    paddingTop: 12,
    paddingBottom: 12,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateReviewScreen;
