import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { reviewsService } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type CreateReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateReview'>;

const CreateReviewScreen: React.FC<CreateReviewScreenProps> = ({ navigation, route }) => {
  const { movie } = route.params;
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Success', 'Review submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
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
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#666',
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
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
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
