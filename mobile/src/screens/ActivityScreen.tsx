import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import { AppText } from "../components/Typography";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { reviewsService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ActivityStackParamList } from "../navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import OptimizedImage from "../components/OptimizedImage";
import SkeletonLoader from "../components/SkeletonLoader";
import ErrorView from "../components/ErrorView";
import OfflineBanner from "../components/OfflineBanner";

type ActivityScreenNavigationProp = NativeStackNavigationProp<
  ActivityStackParamList,
  "Activity"
>;

const ActivityScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<ActivityScreenNavigationProp>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date to relative time (e.g., "2 hours ago", "3 days ago")
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} ${years === 1 ? "year" : "years"} ago`;
    }
  };

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reviewsService.getAll({ limit: 50 });

      // Handle both direct array and object with reviews property
      let reviewsToSet = [];
      if (Array.isArray(response)) {
        reviewsToSet = response;
      } else if (
        response &&
        response.reviews &&
        Array.isArray(response.reviews)
      ) {
        reviewsToSet = response.reviews;
      } else if (response && Array.isArray(response.data)) {
        reviewsToSet = response.data;
      } else {
        reviewsToSet = [];
      }

      setReviews(reviewsToSet);
      setError(null);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
      setError("Failed to load reviews. Please try again.");
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Reload reviews when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
  };

  const handleReviewPress = (review: any) => {
    const movie = review.movieId || {};
    if (movie._id || movie.tmdbId) {
      navigation.navigate("MovieDetails", { movie });
    }
  };

  // Get rating color and style
  const getRatingStyle = (rating: number) => {
    if (rating >= 8) {
      return {
        backgroundColor: "#4CAF50",
        color: "#FFFFFF",
        icon: "star" as const,
      };
    } else if (rating >= 5) {
      return {
        backgroundColor: "#FFA726",
        color: "#FFFFFF",
        icon: "star" as const,
      };
    } else {
      return {
        backgroundColor: "#EF5350",
        color: "#FFFFFF",
        icon: "star" as const,
      };
    }
  };

  const renderReview = ({ item, index }: { item: any; index: number }) => {
    const movie = item.movieId || {};
    const reviewer = item.userId || {};
    const timeAgo = item.createdAt ? formatRelativeTime(item.createdAt) : "";
    const rating = item.rating || 0;
    const ratingStyle = getRatingStyle(rating);
    const reviewText = item.review || "No review text";
    const isLongReview = reviewText.length > 200;
    const isMediumReview = reviewText.length > 100 && reviewText.length <= 200;

    return (
      <TouchableOpacity
        style={styles.reviewCard}
        onPress={() => handleReviewPress(item)}
        activeOpacity={0.95}
      >
        <View style={styles.reviewContent}>
          {/* Movie Row: Poster + Title + Rating */}
          <View style={styles.movieRow}>
            {/* Movie Poster */}
            <OptimizedImage
              uri={movie.posterUrl}
              style={styles.moviePoster}
              placeholderColor="#333"
            />

            {/* Content Section */}
            <View style={styles.contentSection}>
              {/* Movie Title and Year */}
              <View style={styles.titleRow}>
                <View style={styles.titleContainer}>
                  <AppText style={styles.movieTitle} numberOfLines={2}>
                    {movie.title || "Unknown Movie"}
                  </AppText>
                  {movie.releaseDate && (
                    <AppText style={styles.movieYear}>
                      ({new Date(movie.releaseDate).getFullYear()})
                    </AppText>
                  )}
                </View>
                {/* Rating Badge */}
                <View
                  style={[
                    styles.ratingBadge,
                    { backgroundColor: ratingStyle.backgroundColor },
                  ]}
                >
                  <Ionicons
                    name={ratingStyle.icon}
                    size={8}
                    color={ratingStyle.color}
                  />
                  <AppText
                    style={[styles.ratingText, { color: ratingStyle.color }]}
                  >
                    {rating.toFixed(1)}
                  </AppText>
                  <AppText
                    style={[
                      styles.ratingDenominator,
                      { color: ratingStyle.color },
                    ]}
                  >
                    /10
                  </AppText>
                </View>
              </View>

              {/* User Info Row */}
              <View style={styles.userRow}>
                <View style={styles.userInfo}>
                  {reviewer.avatar ? (
                    <OptimizedImage
                      uri={reviewer.avatar}
                      style={styles.avatar}
                      placeholderColor="#007AFF"
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <AppText style={styles.avatarText}>
                        {(reviewer.username || "A").charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                  )}
                  <AppText style={styles.reviewerName} numberOfLines={1}>
                    {reviewer.username || "Anonymous"}
                  </AppText>
                </View>
                {timeAgo && (
                  <AppText style={styles.reviewTime}>{timeAgo}</AppText>
                )}
              </View>
            </View>
          </View>

          {/* Review Text */}
          <View style={styles.reviewTextContainer}>
            <AppText
              style={styles.reviewText}
              numberOfLines={isLongReview || isMediumReview ? 3 : undefined}
            >
              {reviewText}
            </AppText>
            {(isLongReview || isMediumReview) && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={() => handleReviewPress(item)}
                activeOpacity={0.7}
              >
                <AppText style={styles.readMoreText}>
                  Read full review →
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      {loading && reviews.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewContent}>
                <View style={styles.movieRow}>
                  <SkeletonLoader width={55} height={82} borderRadius={8} />
                  <View style={styles.contentSection}>
                    <SkeletonLoader
                      width="70%"
                      height={16}
                      borderRadius={4}
                      style={{ marginBottom: 8 }}
                    />
                    <SkeletonLoader width="50%" height={12} borderRadius={4} />
                  </View>
                </View>
                <SkeletonLoader
                  width="100%"
                  height={60}
                  borderRadius={4}
                  style={{ marginTop: 10 }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : error && reviews.length === 0 ? (
        <ErrorView message={error} onRetry={loadReviews} />
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => {
            const key = item._id || item.id || Math.random().toString();
            return String(key);
          }}
          contentContainerStyle={
            reviews.length === 0 ? styles.listEmpty : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              colors={["#007AFF"]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="film-outline" size={64} color="#666" />
                </View>
                <AppText style={styles.emptyTitle}>No Reviews Yet</AppText>
                <AppText style={styles.emptyText}>
                  Start reviewing movies to see them appear here!
                </AppText>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => {
                    // Navigate to movies screen
                    navigation.navigate("MovieDetails" as any, {});
                  }}
                  activeOpacity={0.7}
                >
                  <AppText style={styles.browseButtonText}>
                    Browse Movies
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },
  list: {
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
    padding: 16,
  },
  reviewCard: {
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  reviewContent: {
    padding: 14,
  },
  movieRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  moviePoster: {
    width: 70,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#333",
    marginRight: 12,
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  contentSection: {
    flex: 1,
    paddingRight: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 10,
  },
  titleContainer: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
    color: "#fff",
    lineHeight: 18,
  },
  movieYear: {
    fontSize: 11,
    fontWeight: "500",
    color: "#999",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
  },
  ratingDenominator: {
    fontSize: 8,
    fontWeight: "600",
    opacity: 0.9,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  reviewTime: {
    fontSize: 11,
    fontWeight: "400",
    color: "#666",
  },
  reviewTextContainer: {
    marginTop: 4,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#ddd",
    lineHeight: 20,
  },
  readMoreButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});

export default ActivityScreen;
