import React, { useState, useCallback } from "react";
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
import { authService } from "../services/api";
import { AccountStackParamList } from "../navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";

type MyReviewsScreenNavigationProp = NativeStackNavigationProp<
  AccountStackParamList,
  "MyReviews"
>;

const MyReviewsScreen: React.FC = () => {
  const navigation = useNavigation<MyReviewsScreenNavigationProp>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    } catch (error: any) {
      console.error("Error loading reviews:", error);
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

  const renderReview = ({ item }: { item: any }) => {
    const rating = item.rating || 0;
    const ratingColor = getRatingColor(rating);
    const movie = item.movieId || {};

    return (
      <TouchableOpacity
        style={styles.reviewCard}
        activeOpacity={0.7}
        onPress={() => {
          if (movie._id || movie.tmdbId) {
            navigation.navigate("MovieDetails", { movie });
          }
        }}
      >
        <View style={styles.reviewHeader}>
          {movie.posterUrl ? (
            <Image
              source={{ uri: movie.posterUrl }}
              style={styles.poster}
            />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Ionicons name="film-outline" size={24} color="#666" />
            </View>
          )}
          <View style={styles.reviewInfo}>
            <Text style={styles.movieTitle} numberOfLines={2}>
              {movie.title || "Unknown Movie"}
            </Text>
            <Text style={styles.reviewDate}>
              {formatDate(item.createdAt || item.updatedAt)}
            </Text>
            <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={styles.ratingText}>{rating}/10</Text>
            </View>
          </View>
        </View>
        {item.review && (
          <Text style={styles.reviewText} numberOfLines={3}>
            {item.review}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
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
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyText}>
              Start reviewing movies to see them appear here!
            </Text>
          </View>
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
    borderColor: "#333",
  },
  reviewHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  reviewInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  reviewText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
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
