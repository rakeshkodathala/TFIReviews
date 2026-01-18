import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { AppText } from "../components/Typography";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { authService, reviewsService } from "../services/api";
import { AccountStackParamList } from "../navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import OptimizedImage from "../components/OptimizedImage";
import SkeletonLoader from "../components/SkeletonLoader";
import ErrorView from "../components/ErrorView";
import OfflineBanner from "../components/OfflineBanner";

type MyReviewsScreenNavigationProp = NativeStackNavigationProp<
  AccountStackParamList,
  "MyReviews"
>;

const MyReviewsScreen: React.FC = () => {
  const navigation = useNavigation<MyReviewsScreenNavigationProp>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "#4CAF50";
    if (rating >= 5) return "#FFA726";
    return "#EF5350";
  };

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.getMyReviews(100);
      setReviews(response.reviews || []);
      setError(null);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
      setError("Failed to load your reviews. Please try again.");
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReviews();
  }, [loadReviews]);

  const handleEdit = (review: any) => {
    const movie = review.movieId || {};
    if (movie._id || movie.tmdbId) {
      navigation.navigate("CreateReview", { movie, review });
    }
  };

  const handleDelete = (review: any) => {
    const movie = review.movieId || {};
    const movieTitle = movie.title || "this movie";

    Alert.alert(
      "Delete Review",
      `Are you sure you want to delete your review for "${movieTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await reviewsService.delete(review._id || review.id);
              loadReviews();
              Alert.alert("Success", "Review deleted successfully");
            } catch (error: any) {
              console.error("Error deleting review:", error);
              Alert.alert(
                "Error",
                error.response?.data?.error || "Failed to delete review"
              );
            }
          },
        },
      ]
    );
  };

  const renderReview = ({ item }: { item: any }) => {
    const rating = item.rating || 0;
    const ratingColor = getRatingColor(rating);
    const movie = item.movieId || {};

    return (
      <View style={styles.reviewCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (movie._id || movie.tmdbId) {
              navigation.navigate("MovieDetails", { movie });
            }
          }}
        >
          <View style={styles.reviewHeader}>
            <OptimizedImage
              uri={movie.posterUrl}
              style={styles.poster}
              placeholderColor="#333"
            />
            <View style={styles.reviewInfo}>
              <AppText style={styles.movieTitle} numberOfLines={2}>
                {movie.title || "Unknown Movie"}
              </AppText>
              <AppText style={styles.reviewDate}>
                {formatDate(item.createdAt || item.updatedAt)}
              </AppText>
              <View
                style={[styles.ratingBadge, { backgroundColor: ratingColor }]}
              >
                <Ionicons name="star" size={10} color="#fff" />
                <AppText style={styles.ratingText}>{rating}/10</AppText>
              </View>
            </View>
          </View>
          {item.review && (
            <AppText style={styles.reviewText} numberOfLines={3}>
              {item.review}
            </AppText>
          )}
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color="#007AFF" />
            <AppText style={styles.editButtonText}>Edit</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#EF5350" />
            <AppText style={styles.deleteButtonText}>Delete</AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      {loading && reviews.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <SkeletonLoader width={80} height={120} borderRadius={8} />
                <View style={styles.reviewInfo}>
                  <SkeletonLoader
                    width="80%"
                    height={16}
                    borderRadius={4}
                    style={{ marginBottom: 8 }}
                  />
                  <SkeletonLoader
                    width="60%"
                    height={12}
                    borderRadius={4}
                    style={{ marginBottom: 12 }}
                  />
                  <SkeletonLoader width="50%" height={24} borderRadius={4} />
                </View>
              </View>
              <SkeletonLoader
                width="100%"
                height={60}
                borderRadius={4}
                style={{ marginTop: 10 }}
              />
            </View>
          ))}
        </View>
      ) : error && reviews.length === 0 ? (
        <ErrorView message={error} onRetry={loadReviews} />
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) =>
            item._id || item.id || Math.random().toString()
          }
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
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={64} color="#666" />
              </View>
              <AppText style={styles.emptyTitle}>No Reviews Yet</AppText>
              <AppText style={styles.emptyText}>
                Start reviewing movies to see them appear here!
              </AppText>
            </View>
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
    backgroundColor: "#1a1a1a",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  listEmpty: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.2)",
    // Glow effect for entire card (poster, title, rating)
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  poster: {
    width: 60,
    height: 67,
    borderRadius: 8,
    backgroundColor: "#333",
    // Glow effect for border
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  reviewInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
    color: "#fff",
    lineHeight: 14,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 0,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  reviewText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(239, 83, 80, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF5350",
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF5350",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default MyReviewsScreen;
