import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { movieSearchService, reviewsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HomeStackParamList } from '../navigation/AppNavigator';

type MovieDetailsScreenProps = NativeStackScreenProps<HomeStackParamList, 'MovieDetails'>;

const MovieDetailsScreen: React.FC<MovieDetailsScreenProps> = ({ navigation, route }) => {
  const { movie: initialMovie } = route.params;
  const [movie, setMovie] = useState(initialMovie);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const movieData = initialMovie;
    if (movieData) {
      // Load movie details only if tmdbId exists
      if (movieData.tmdbId) {
        loadMovieDetails(movieData.tmdbId);
      } else {
        setLoading(false);
      }
      // Load reviews
      loadReviews(movieData);
    } else {
      setLoading(false);
      setLoadingReviews(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const loadMovieDetails = async (tmdbId: number) => {
    try {
      const details = await movieSearchService.getMovieDetails(tmdbId);
      setMovie((prev: any) => ({ ...prev, ...details }));
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (movieData: any) => {
    try {
      setLoadingReviews(true);
      let reviewsData;
      
      if (movieData?.tmdbId) {
        reviewsData = await reviewsService.getByTmdbId(movieData.tmdbId);
      } else if (movieData?._id) {
        reviewsData = await reviewsService.getByMovie(movieData._id);
      }
      
      setReviews(reviewsData?.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to write a review');
      return;
    }
    navigation.navigate('CreateReview', { movie });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {movie.posterUrl && (
        <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{movie.title || 'Untitled'}</Text>
        
        {movie.titleTelugu && (
          <Text style={styles.titleTelugu}>{movie.titleTelugu}</Text>
        )}

        <View style={styles.metaContainer}>
          {movie.rating && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Rating</Text>
              <Text style={styles.metaValue}>⭐ {movie.rating.toFixed(1)}</Text>
            </View>
          )}
          {movie.releaseDate && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Release</Text>
              <Text style={styles.metaValue}>
                {new Date(movie.releaseDate).getFullYear()}
              </Text>
            </View>
          )}
        </View>

        {movie.director && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Director</Text>
            <Text style={styles.sectionText}>{String(movie.director || '')}</Text>
          </View>
        )}

        {movie.cast && movie.cast.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <Text style={styles.sectionText}>{movie.cast.join(', ') || ''}</Text>
          </View>
        )}

        {movie.genre && movie.genre.length > 0 && (
          <View style={styles.genreContainer}>
            {movie.genre.map((g: string, index: number) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{g}</Text>
              </View>
            ))}
          </View>
        )}

        {movie.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionText}>{String(movie.description || '')}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.reviewButton} onPress={handleWriteReview}>
          <Text style={styles.reviewButtonText}>Write a Review</Text>
        </TouchableOpacity>

        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>Reviews</Text>
          {loadingReviews ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.userId?.username || 'Anonymous'}</Text>
                  <Text style={styles.reviewRating}>⭐ {review.rating || 0}/10</Text>
                </View>
                {review.title && (
                  <Text style={styles.reviewTitle}>{String(review.title || '')}</Text>
                )}
                <Text style={styles.reviewText}>{review.review || ''}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poster: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  titleTelugu: {
    fontSize: 18,
    color: '#999',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: '#999',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  sectionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  genreTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: {
    fontSize: 12,
    color: '#ccc',
  },
  reviewButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  noReviews: {
    color: '#999',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reviewRating: {
    fontSize: 14,
    color: '#007AFF',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  reviewText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});

export default MovieDetailsScreen;
