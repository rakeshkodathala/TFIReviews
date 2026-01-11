import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { reviewsService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ActivityStackParamList } from "../navigation/AppNavigator";

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
    } catch (error: any) {
      console.error("Error loading reviews:", error);
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

  const renderReview = ({ item }: { item: any }) => {
    const movie = item.movieId || {};
    const reviewer = item.userId || {};
    const timeAgo = item.createdAt ? formatRelativeTime(item.createdAt) : "";

    return (
      <TouchableOpacity
        style={styles.reviewCard}
        onPress={() => handleReviewPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.reviewContent}>
          {/* Row 1: Poster and Movie Info */}
          <View style={styles.movieRow}>
            {/* Movie Poster */}
            {movie.posterUrl ? (
              <Image
                source={{ uri: movie.posterUrl }}
                style={styles.moviePoster}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.moviePoster, styles.posterPlaceholder]}>
                <Text style={styles.posterPlaceholderText}>🎬</Text>
              </View>
            )}

            {/* Movie Info: Name, Year, Rating */}
            <View style={styles.movieInfoSection}>
              <Text style={styles.movieTitle} numberOfLines={2}>
                {movie.title || "Unknown Movie"}
              </Text>
              <View style={styles.movieMeta}>
                {movie.releaseDate && (
                  <>
                    <Text style={styles.movieYear}>
                      {new Date(movie.releaseDate).getFullYear()}
                    </Text>
                    <View style={styles.divider} />
                  </>
                )}
                <Text style={styles.reviewRating}>
                  ⭐ {item.rating || 0}/10
                </Text>
              </View>
            </View>
          </View>

          {/* Row 2: User Name and Time */}
          <View style={styles.userRow}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(reviewer.username || "A").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.reviewerName} numberOfLines={1}>
                {reviewer.username || "Anonymous"}
              </Text>
            </View>
            {timeAgo && <Text style={styles.reviewTime}>{timeAgo}</Text>}
          </View>

          {/* Review Text */}
          <Text style={styles.reviewText} numberOfLines={4}>
            {item.review || "No review text"}
          </Text>

          {/* Read More Indicator */}
          {item.review && item.review.length > 150 && (
            <Text style={styles.readMore}>Tap to read full review →</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share your thoughts on a movie!
              </Text>
            </View>
          ) : null
        }
      />
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
    padding: 16,
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
    padding: 16,
  },
  reviewCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  reviewContent: {
    padding: 12,
  },
  movieRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#333",
    marginRight: 10,
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  posterPlaceholderText: {
    fontSize: 24,
  },
  movieInfoSection: {
    flex: 1,
    justifyContent: "center",
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  movieMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  movieYear: {
    fontSize: 12,
    color: "#999",
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: "#555",
  },
  reviewRating: {
    fontSize: 13,
    color: "#FFD700",
    fontWeight: "700",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
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
  },
  reviewTime: {
    fontSize: 11,
    color: "#999",
  },
  reviewText: {
    fontSize: 14,
    color: "#ddd",
    lineHeight: 20,
    marginBottom: 4,
  },
  readMore: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

export default ActivityScreen;
