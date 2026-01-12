import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { AppText } from "../components/Typography";
import { Ionicons } from "@expo/vector-icons";
import { movieSearchService } from "../services/api";
import OptimizedImage from "../components/OptimizedImage";
import { MovieCardSkeleton } from "../components/SkeletonLoader";
import ErrorView from "../components/ErrorView";
import OfflineBanner from "../components/OfflineBanner";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 2;
const LIST_PADDING = 4;
const NUM_COLUMNS = 3;
const CARD_WIDTH =
  (SCREEN_WIDTH - LIST_PADDING * 2 - CARD_MARGIN * (NUM_COLUMNS * 2)) /
  NUM_COLUMNS;

interface Movie {
  _id?: string;
  id?: string;
  title: string;
  posterUrl?: string;
  rating?: number;
  releaseDate?: string;
  tmdbId?: number;
  originalLanguage?: string;
  popularity?: number;
}

interface TrendingTabProps {
  navigation: any;
}

// Calculate trending score
const calculateTrendingScore = (movie: Movie): number => {
  const popularity = movie.popularity || 0;
  const rating = movie.rating || 0;
  
  // Check if movie is recent (last 30 days gets boost)
  let recentBoost = 0;
  if (movie.releaseDate) {
    const releaseDate = new Date(movie.releaseDate);
    const now = new Date();
    const daysSinceRelease = (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRelease <= 7) {
      recentBoost = 1.0; // Full boost for last 7 days
    } else if (daysSinceRelease <= 30) {
      recentBoost = 0.7; // High boost for 7-30 days
    } else if (daysSinceRelease <= 60) {
      recentBoost = 0.3; // Lower boost for 30-60 days
    }
  }
  
  // Normalize values (popularity can be high, rating is 0-10)
  const normalizedPopularity = Math.min(popularity / 100, 1); // Cap at 100
  const normalizedRating = rating / 10;
  
  // Weighted formula
  const score =
    normalizedPopularity * 0.5 +
    recentBoost * 0.3 +
    normalizedRating * 0.2;
  
  return score;
};

const TrendingTab: React.FC<TrendingTabProps> = ({ navigation }) => {
  const [popularThisMonth, setPopularThisMonth] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "#4CAF50";
    if (rating >= 5) return "#FFA726";
    return "#EF5350";
  };

  const getTrendingBadge = (movie: Movie) => {
    if (!movie.releaseDate) return null;
    const releaseDate = new Date(movie.releaseDate);
    const now = new Date();
    const daysSinceRelease = (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRelease <= 7) {
      return { label: "New", icon: "sparkles", color: "#4CAF50" };
    }
    if (daysSinceRelease <= 30) {
      return { label: "Rising", icon: "trending-up", color: "#FFA726" };
    }
    return { label: "Trending", icon: "flame", color: "#FF6B35" };
  };

  const loadPopularThisMonth = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch multiple pages to get enough Indian movies (increased to ensure at least 20 movies)
      let allMovies: Movie[] = [];
      for (let page = 1; page <= 8; page++) {
        const response = await movieSearchService.getTollywood({
          page,
          language: "en",
        });
        if (response.movies) {
          allMovies = [...allMovies, ...response.movies];
        }
      }

      // Filter movies from last 30 days and calculate trending scores
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let recentMovies = allMovies
        .filter((movie) => {
          if (!movie.releaseDate) return false;
          return new Date(movie.releaseDate) >= thirtyDaysAgo;
        })
        .map((movie) => ({
          ...movie,
          trendingScore: calculateTrendingScore(movie),
        }))
        .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));

      // If we don't have at least 20 movies from last 30 days, extend to 60 days
      if (recentMovies.length < 20) {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        recentMovies = allMovies
          .filter((movie) => {
            if (!movie.releaseDate) return false;
            return new Date(movie.releaseDate) >= sixtyDaysAgo;
          })
          .map((movie) => ({
            ...movie,
            trendingScore: calculateTrendingScore(movie),
          }))
          .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
          .slice(0, Math.max(20, recentMovies.length)); // Take at least 20, or more if available
      } else {
        // If we have enough, just take top 20+ (show all if less than 30, otherwise top 30)
        recentMovies = recentMovies.slice(0, Math.max(20, Math.min(30, recentMovies.length)));
      }

      setPopularThisMonth(recentMovies);
      setError(null);
    } catch (error) {
      console.error("Error loading popular this month:", error);
      setError("Failed to load trending movies. Please try again.");
      setPopularThisMonth([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPopularThisMonth();
  }, [loadPopularThisMonth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPopularThisMonth();
    setRefreshing(false);
  }, [loadPopularThisMonth]);

  const renderMovieCard = ({ item }: { item: Movie }) => {
    const rating = item.rating || 0;
    const ratingColor = getRatingColor(rating);
    const year = item.releaseDate
      ? new Date(item.releaseDate).getFullYear()
      : null;
    const badge = getTrendingBadge(item);

    return (
      <TouchableOpacity
        style={[styles.movieCard, { width: CARD_WIDTH }]}
        onPress={() => {
          navigation.navigate("MovieDetails", { movie: item });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.posterContainer}>
          <OptimizedImage
            uri={item.posterUrl}
            style={styles.poster}
            placeholderColor="#333"
          />
          {badge && (
            <View style={[styles.trendingBadge, { backgroundColor: badge.color }]}>
              <Ionicons name={badge.icon as any} size={10} color="#fff" />
              <AppText style={styles.trendingBadgeText}>{badge.label}</AppText>
            </View>
          )}
        </View>
        <View style={styles.movieInfo}>
          <AppText style={styles.movieTitle} numberOfLines={2}>
            {item.title || "Untitled"}
          </AppText>
          <View style={styles.movieMeta}>
            {year && <AppText style={styles.movieDate}>{year}</AppText>}
            {rating > 0 && (
              <View
                style={[styles.ratingBadge, { backgroundColor: ratingColor }]}
              >
                <Ionicons name="star" size={8} color="#fff" />
                <AppText style={styles.ratingText}>{rating.toFixed(1)}</AppText>
                <AppText style={styles.ratingDenominator}>/10</AppText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <AppText style={styles.sectionTitle}>Popular This Month</AppText>
        </View>
        {popularThisMonth.length > 0 && (
          <AppText style={styles.movieCount}>
            {popularThisMonth.length} movies
          </AppText>
        )}
      </View>

      {/* Movies Grid */}
      {loading && popularThisMonth.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: 9 }).map((_, index) => (
            <MovieCardSkeleton key={index} width={CARD_WIDTH} />
          ))}
        </View>
      ) : error && popularThisMonth.length === 0 ? (
        <ErrorView message={error} onRetry={loadPopularThisMonth} />
      ) : (
        <FlatList
          data={popularThisMonth}
          renderItem={renderMovieCard}
          keyExtractor={(item) => {
            const key =
              item.tmdbId?.toString() || item._id || item.id?.toString();
            return key ? String(key) : Math.random().toString();
          }}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.list}
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
                  <Ionicons name="flame-outline" size={64} color="#666" />
                </View>
                <AppText style={styles.emptyTitle}>No Trending Movies</AppText>
                <AppText style={styles.emptyText}>
                  Check back later for trending Indian movies from this month!
                </AppText>
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
    backgroundColor: "#1a1a1a",
  },
  loadingText: {
    marginTop: 16,
    color: "#999",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  movieCount: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  list: {
    padding: LIST_PADDING,
    paddingBottom: 24,
    paddingTop: 4,
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
    lineHeight: 22,
  },
  movieCard: {
    margin: CARD_MARGIN,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  posterContainer: {
    position: "relative",
    width: "100%",
  },
  poster: {
    width: "100%",
    aspectRatio: 0.75,
    backgroundColor: "#333",
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  trendingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  trendingBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  movieInfo: {
    padding: 4,
  },
  movieTitle: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
    color: "#fff",
    lineHeight: 14,
  },
  movieMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  movieDate: {
    fontSize: 10,
    fontWeight: "500",
    color: "#999",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 3,
    paddingVertical: 0,
    borderRadius: 6,
    gap: 1,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  ratingDenominator: {
    fontSize: 7,
    fontWeight: "600",
    color: "#fff",
    opacity: 0.9,
  },
});

export default TrendingTab;
