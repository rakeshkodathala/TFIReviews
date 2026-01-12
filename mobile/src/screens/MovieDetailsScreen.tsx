import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Share,
  Platform,
} from 'react-native';
import { AppText } from '../components/Typography';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { movieSearchService, reviewsService, watchlistService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HomeStackParamList } from '../navigation/AppNavigator';

type MovieDetailsScreenProps = NativeStackScreenProps<HomeStackParamList, 'MovieDetails'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 500;
const HEADER_HEIGHT = 60;
const STICKY_HEADER_THRESHOLD = HERO_HEIGHT - HEADER_HEIGHT - 100;

const MovieDetailsScreen: React.FC<MovieDetailsScreenProps> = ({ navigation, route }) => {
  const { movie: initialMovie } = route.params;
  const [movie, setMovie] = useState(initialMovie);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewSort, setReviewSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Find user's review
  const userReview = reviews.find((r) => {
    const reviewUserId = r.userId?._id || r.userId?.id;
    const currentUserId = user?._id || user?.id;
    return reviewUserId === currentUserId;
  });

  // Animate content on load
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const movieData = initialMovie;
    if (movieData) {
      if (movieData.tmdbId) {
        loadMovieDetails(movieData.tmdbId);
      } else {
        setLoading(false);
      }
      loadReviews(movieData);
      if (isAuthenticated) {
        checkWatchlistStatus(movieData);
      }
    } else {
      setLoading(false);
      setLoadingReviews(false);
    }
  }, []);

  // Refresh reviews when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (initialMovie) {
        loadReviews(initialMovie);
        if (isAuthenticated) {
          checkWatchlistStatus(initialMovie);
        }
      }
    }, [initialMovie, isAuthenticated])
  );

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

  const checkWatchlistStatus = async (movieData: any) => {
    try {
      const response = await watchlistService.check(
        movieData._id,
        movieData.tmdbId
      );
      setIsInWatchlist(response.isInWatchlist || false);
      if (response.watchlistItem) {
        setWatchlistId(response.watchlistItem._id || response.watchlistItem.id);
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to add movies to your watchlist');
      return;
    }

    try {
      setWatchlistLoading(true);
      if (isInWatchlist && watchlistId) {
        await watchlistService.remove(watchlistId);
        setIsInWatchlist(false);
        setWatchlistId(null);
        Alert.alert('Removed', 'Movie removed from watchlist');
      } else {
        const response = await watchlistService.add(
          movie._id,
          movie.tmdbId
        );
        setIsInWatchlist(true);
        if (response.watchlistItem) {
          setWatchlistId(response.watchlistItem._id || response.watchlistItem.id);
        }
        Alert.alert('Added', 'Movie added to watchlist');
      }
    } catch (error: any) {
      console.error('Error toggling watchlist:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to update watchlist'
      );
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to write a review');
      return;
    }
    if (userReview) {
      navigation.navigate('CreateReview', { movie, review: userReview });
    } else {
      navigation.navigate('CreateReview', { movie });
    }
  };

  const handleRateIt = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to rate this movie');
      return;
    }
    handleWriteReview();
  };

  const handleShare = async () => {
    try {
      const rating = movie.rating ? `${movie.rating.toFixed(1)}/10` : '';
      const message = `Check out "${movie.title}"${rating ? ` (${rating})` : ''} on TFI Reviews!`;
      
      await Share.share({
        message,
        title: movie.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return '#4CAF50'; // Green
    if (rating >= 6) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 9) return 'Masterpiece';
    if (rating >= 8) return 'Excellent';
    if (rating >= 7) return 'Good';
    if (rating >= 6) return 'Decent';
    if (rating >= 5) return 'Average';
    return 'Skip';
  };

  // Calculate average rating from reviews
  const communityRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'highest') return (b.rating || 0) - (a.rating || 0);
    if (reviewSort === 'lowest') return (a.rating || 0) - (b.rating || 0);
    // Recent (default)
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Get top review (highest rated)
  const topReview = sortedReviews.length > 0 && reviewSort === 'recent'
    ? sortedReviews.reduce((top, current) => 
        (current.rating || 0) > (top.rating || 0) ? current : top
      )
    : null;

  // Get backdrop URL
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.posterUrl;

  // Parallax animation for backdrop
  const backdropTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [0, HERO_HEIGHT * 0.5],
    extrapolate: 'clamp',
  });

  // Sticky header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [STICKY_HEADER_THRESHOLD, STICKY_HEADER_THRESHOLD + 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : null;

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            opacity: headerOpacity,
            pointerEvents: headerOpacity._value > 0.5 ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <AppText style={styles.stickyHeaderTitle} numberOfLines={1}>
          {movie.title || 'Movie'}
        </AppText>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Animated.View
            style={[
              styles.backdropContainer,
              { transform: [{ translateY: backdropTranslateY }] },
            ]}
          >
            {backdropUrl && (
              <Image
                source={{ uri: backdropUrl }}
                style={styles.backdrop}
                resizeMode="cover"
              />
            )}
          </Animated.View>
          
          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} />
          
          {/* Hero Content */}
          <Animated.View
            style={[
              styles.heroContent,
              { opacity: fadeAnim },
            ]}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.heroShareButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Poster and Info */}
            <View style={styles.heroMainContent}>
              {movie.posterUrl && (
                <Image
                  source={{ uri: movie.posterUrl }}
                  style={styles.poster}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.heroInfo}>
                <View style={styles.heroTitleRow}>
                  <View style={styles.heroTitleContainer}>
                    <AppText style={styles.title}>{movie.title || 'Untitled'}</AppText>
                    
                    {movie.titleTelugu && (
                      <AppText style={styles.titleTelugu}>{movie.titleTelugu}</AppText>
                    )}
                    
                    <View style={styles.heroMeta}>
                      {releaseYear && (
                        <AppText style={styles.heroMetaText}>{releaseYear}</AppText>
                      )}
                      {movie.genre && movie.genre.length > 0 && releaseYear && (
                        <AppText style={styles.heroMetaText}> • </AppText>
                      )}
                      {movie.genre && movie.genre.length > 0 && (
                        <AppText style={styles.heroMetaText}>
                          {movie.genre.slice(0, 2).join(', ')}
                        </AppText>
                      )}
                    </View>
                  </View>
                  
                  {/* Rating Badge in Hero */}
                  {movie.rating !== undefined && movie.rating > 0 && (
                    <Animated.View
                      style={[
                        { opacity: fadeAnim },
                      ]}
                    >
                      <View
                        style={[
                          styles.heroRatingBadge,
                          { borderColor: getRatingColor(movie.rating) },
                        ]}
                      >
                        <AppText style={styles.heroRatingNumber}>
                          {movie.rating.toFixed(1)}
                        </AppText>
                        <AppText style={styles.heroRatingLabel}>TFI</AppText>
                      </View>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        </View>


        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim },
          ]}
        >
          {/* Watchlist Button */}
          {isAuthenticated && (
            <TouchableOpacity
              style={[
                styles.watchlistButton,
                isInWatchlist && styles.watchlistButtonActive,
              ]}
              onPress={handleToggleWatchlist}
              disabled={watchlistLoading}
              activeOpacity={0.8}
            >
              {watchlistLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isInWatchlist ? "bookmark" : "bookmark-outline"}
                    size={20}
                    color="#fff"
                  />
                  <AppText style={styles.watchlistButtonText}>
                    {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Primary CTA - Write Review */}
          {!userReview && (
            <TouchableOpacity
              style={styles.primaryCTA}
              onPress={handleWriteReview}
              activeOpacity={0.8}
            >
              <View style={styles.primaryCTAContent}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                <View style={styles.primaryCTAText}>
                  <AppText style={styles.primaryCTATitle}>Share Your Thoughts</AppText>
                  <AppText style={styles.primaryCTASubtitle}>
                    {reviews.length === 0
                      ? 'Be the first to review this movie'
                      : `${reviews.length} people have reviewed this`}
                  </AppText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Your Rating Card - Personal Connection */}
          {userReview && (
            <View style={styles.ratingCard}>
              <View style={styles.ratingCardHeader}>
                <View style={styles.ratingCardTitleRow}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <AppText style={styles.ratingCardTitle}>Your Rating</AppText>
                </View>
                <TouchableOpacity onPress={handleWriteReview}>
                  <AppText style={styles.editButtonText}>Edit</AppText>
                </TouchableOpacity>
              </View>
              <View style={styles.ratingCardContent}>
                <View
                  style={[
                    styles.yourRatingBadge,
                    { borderColor: getRatingColor(userReview.rating) },
                  ]}
                >
                  <AppText style={styles.yourRatingNumber}>
                    {userReview.rating}/10
                  </AppText>
                </View>
                <View style={styles.ratingCardInfo}>
                  <AppText style={styles.ratingCardMessage}>
                    {userReview.rating >= 8
                      ? "You loved this! 🎬"
                      : userReview.rating >= 6
                      ? "You liked this 👍"
                      : "You didn't enjoy this"}
                  </AppText>
                  {userReview.review && (
                    <AppText style={styles.ratingCardSnippet} numberOfLines={2}>
                      "{userReview.review}"
                    </AppText>
                  )}
                  <TouchableOpacity
                    style={styles.viewFullReviewButton}
                    onPress={handleWriteReview}
                  >
                    <AppText style={styles.viewFullReviewText}>View Full Review</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Community Rating Card - Social Proof */}
          {reviews.length > 0 && (
            <View style={styles.ratingCard}>
              <View style={styles.ratingCardTitleRow}>
                <Ionicons name="people" size={20} color="#007AFF" />
                <AppText style={styles.ratingCardTitle}>Community Rating</AppText>
              </View>
              <View style={styles.ratingCardContent}>
                <View style={styles.communityRatingBadge}>
                  <AppText style={styles.communityRatingNumber}>
                    {communityRating.toFixed(1)}
                  </AppText>
                  <AppText style={styles.communityRatingLabel}>/10</AppText>
                </View>
                <View style={styles.ratingCardInfo}>
                  <AppText style={styles.ratingCardMessage}>
                    from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </AppText>
                  {movie.totalReviews && movie.totalReviews > reviews.length && (
                    <AppText style={styles.ratingCardSubtext}>
                      {movie.totalReviews} total reviews
                    </AppText>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Top Review Highlight - Engagement Hook */}
          {topReview && topReview._id !== userReview?._id && (
            <View style={styles.highlightCard}>
              <View style={styles.highlightHeader}>
                <Ionicons name="trophy" size={18} color="#FFD700" />
                <AppText style={styles.highlightTitle}>Most Helpful Review</AppText>
              </View>
              <View style={styles.highlightContent}>
                <View style={styles.highlightAuthor}>
                  {topReview.userId?.avatar ? (
                    <Image
                      source={{ uri: topReview.userId.avatar }}
                      style={styles.highlightAvatar}
                    />
                  ) : (
                    <View style={styles.highlightAvatarPlaceholder}>
                      <Ionicons name="person" size={16} color="#666" />
                    </View>
                  )}
                  <View>
                    <AppText style={styles.highlightAuthorName}>
                      {topReview.userId?.username || 'Anonymous'}
                    </AppText>
                    <View
                      style={[
                        styles.highlightRating,
                        { backgroundColor: `${getRatingColor(topReview.rating)}20` },
                      ]}
                    >
                      <AppText
                        style={[
                          styles.highlightRatingText,
                          { color: getRatingColor(topReview.rating) },
                        ]}
                      >
                        {topReview.rating}/10
                      </AppText>
                    </View>
                  </View>
                </View>
                {topReview.review && (
                  <AppText style={styles.highlightText} numberOfLines={3}>
                    "{topReview.review}"
                  </AppText>
                )}
              </View>
            </View>
          )}

          {/* Overview - Key Information */}
          {(movie.description || movie.synopsis) && (
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Overview</AppText>
              <AppText style={styles.sectionText}>
                {movie.description || movie.synopsis || ''}
              </AppText>
            </View>
          )}

          {/* Director - Quick Info */}
          {movie.director && (
            <View style={styles.infoRow}>
              <Ionicons name="film-outline" size={18} color="#007AFF" />
              <View style={styles.infoRowContent}>
                <AppText style={styles.infoRowLabel}>Director</AppText>
                <AppText style={styles.infoRowValue}>{String(movie.director || '')}</AppText>
              </View>
            </View>
          )}

          {/* Cast - Horizontal Scroll */}
          {movie.cast && movie.cast.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>Cast</AppText>
                {movie.cast.length > 10 && (
                  <TouchableOpacity>
                    <AppText style={styles.seeAllText}>See All</AppText>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castContainer}
              >
                {movie.cast.slice(0, 10).map((actor: any, index: number) => {
                  // Handle both string (old format) and object (new format with photos)
                  const actorName = typeof actor === 'string' ? actor : actor.name;
                  const actorId = typeof actor === 'object' ? actor.id || actor.tmdbId : null;
                  const profilePath = typeof actor === 'object' ? actor.profilePath : null;
                  const character = typeof actor === 'object' ? actor.character : '';

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.castCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (actorId) {
                          navigation.navigate('CastDetails', {
                            personId: actorId,
                            personName: actorName,
                          });
                        }
                      }}
                    >
                      {profilePath ? (
                        <Image
                          source={{ uri: profilePath }}
                          style={styles.castAvatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.castAvatarPlaceholder}>
                          <Ionicons name="person" size={24} color="#666" />
                        </View>
                      )}
                      <AppText style={styles.castName} numberOfLines={2}>
                        {actorName}
                      </AppText>
                      {character && (
                        <AppText style={styles.castCharacter} numberOfLines={1}>
                          {character}
                        </AppText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Genres - Quick Tags */}
          {movie.genre && movie.genre.length > 0 && (
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Genres</AppText>
              <View style={styles.genreContainer}>
                {movie.genre.map((g: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.genreTag}
                    activeOpacity={0.7}
                  >
                    <AppText style={styles.genreText}>{g}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Reviews Section - Main Engagement */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <AppText style={styles.reviewsTitle}>
                Reviews {reviews.length > 0 && `(${reviews.length})`}
              </AppText>
              {reviews.length > 1 && (
                <View style={styles.sortButtons}>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      reviewSort === 'recent' && styles.sortButtonActive,
                    ]}
                    onPress={() => setReviewSort('recent')}
                  >
                    <AppText
                      style={[
                        styles.sortButtonText,
                        reviewSort === 'recent' && styles.sortButtonTextActive,
                      ]}
                    >
                      Recent
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      reviewSort === 'highest' && styles.sortButtonActive,
                    ]}
                    onPress={() => setReviewSort('highest')}
                  >
                    <AppText
                      style={[
                        styles.sortButtonText,
                        reviewSort === 'highest' && styles.sortButtonTextActive,
                      ]}
                    >
                      Highest
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      reviewSort === 'lowest' && styles.sortButtonActive,
                    ]}
                    onPress={() => setReviewSort('lowest')}
                  >
                    <AppText
                      style={[
                        styles.sortButtonText,
                        reviewSort === 'lowest' && styles.sortButtonTextActive,
                      ]}
                    >
                      Lowest
                    </AppText>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {loadingReviews ? (
              <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
            ) : reviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color="#333" />
                <AppText style={styles.emptyStateTitle}>No Reviews Yet</AppText>
                <AppText style={styles.emptyStateText}>
                  Be the first to share your thoughts and help others discover this movie!
                </AppText>
                {isAuthenticated && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={handleWriteReview}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                    <AppText style={styles.emptyStateButtonText}>
                      Write the First Review
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              sortedReviews.map((review) => {
                const reviewUserId = review.userId?._id || review.userId?.id;
                const currentUserId = user?._id || user?.id;
                const isUserReview = reviewUserId === currentUserId;
                return (
                  <View
                    key={review._id}
                    style={[
                      styles.reviewCard,
                      isUserReview && styles.userReviewCard,
                    ]}
                  >
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAuthorContainer}>
                        {review.userId?.avatar ? (
                          <Image
                            source={{ uri: review.userId.avatar }}
                            style={styles.reviewAvatar}
                          />
                        ) : (
                          <View style={styles.reviewAvatarPlaceholder}>
                            <Ionicons name="person" size={16} color="#666" />
                          </View>
                        )}
                        <View>
                          <AppText style={styles.reviewAuthor}>
                            {review.userId?.username || 'Anonymous'}
                            {isUserReview && (
                              <AppText style={styles.yourReviewBadge}> • You</AppText>
                            )}
                          </AppText>
                          {review.createdAt && (
                            <AppText style={styles.reviewDate}>
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </AppText>
                          )}
                        </View>
                      </View>
                      <View
                        style={[
                          styles.reviewRatingBadge,
                          { backgroundColor: `${getRatingColor(review.rating)}20` },
                        ]}
                      >
                        <AppText
                          style={[
                            styles.reviewRatingText,
                            { color: getRatingColor(review.rating) },
                          ]}
                        >
                          {review.rating}/10
                        </AppText>
                      </View>
                    </View>
                    {review.title && (
                      <AppText style={styles.reviewTitle}>{String(review.title || '')}</AppText>
                    )}
                    <AppText style={styles.reviewText}>{review.review || ''}</AppText>
                  </View>
                );
              })
            )}
          </View>

          {/* Bottom Spacing for Floating Button */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Floating Rate It Button - Always Accessible */}
      {isAuthenticated && !userReview && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleRateIt}
          activeOpacity={0.8}
        >
          <Ionicons name="star" size={22} color="#fff" />
          <AppText style={styles.floatingButtonText}>Rate It</AppText>
        </TouchableOpacity>
      )}
    </View>
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
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  backdropContainer: {
    position: 'absolute',
    width: '100%',
    height: HERO_HEIGHT + 100,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 30,
  },
  heroBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroShareButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroRatingBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroRatingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroRatingLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: -4,
  },
  titleTelugu: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaText: {
    fontSize: 15,
    color: '#ccc',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ratingBadgeContainer: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 24,
    zIndex: 10,
  },
  ratingBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ratingNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: -4,
  },
  ratingTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  watchlistButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#333',
  },
  watchlistButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  watchlistButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  primaryCTA: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  primaryCTAText: {
    flex: 1,
  },
  primaryCTATitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  primaryCTASubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  ratingCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  ratingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  editButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  ratingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  yourRatingBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourRatingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  communityRatingBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  communityRatingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  communityRatingLabel: {
    fontSize: 20,
    color: '#999',
    marginLeft: 4,
  },
  ratingCardInfo: {
    flex: 1,
  },
  ratingCardMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  ratingCardSnippet: {
    fontSize: 14,
    color: '#ccc',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  ratingCardSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  viewFullReviewButton: {
    marginTop: 8,
  },
  viewFullReviewText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  highlightCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  highlightContent: {
    gap: 12,
  },
  highlightAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  highlightAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightAuthorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  highlightRating: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  highlightRatingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  highlightText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoRowContent: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRowValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  castContainer: {
    paddingRight: 20,
  },
  castCard: {
    width: 90,
    marginRight: 12,
    alignItems: 'center',
  },
  castAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2a2a2a',
    marginBottom: 8,
  },
  castAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  castName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 2,
  },
  castCharacter: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  genreText: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewsHeader: {
    marginBottom: 20,
  },
  reviewsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  loadingIndicator: {
    marginVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  userReviewCard: {
    borderColor: '#007AFF',
    borderWidth: 1.5,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
  },
  reviewAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  yourReviewBadge: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  reviewRatingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default MovieDetailsScreen;
