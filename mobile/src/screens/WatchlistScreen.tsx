import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { AppText } from "../components/Typography";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { watchlistService } from "../services/api";
import { AccountStackParamList } from "../navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import OptimizedImage from "../components/OptimizedImage";
import { MovieCardSkeleton } from "../components/SkeletonLoader";
import ErrorView from "../components/ErrorView";
import OfflineBanner from "../components/OfflineBanner";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const CARD_MARGIN = 4;
const LIST_PADDING = 6;
const CARD_WIDTH =
  (SCREEN_WIDTH - LIST_PADDING * 2 - CARD_MARGIN * (NUM_COLUMNS * 2)) /
  NUM_COLUMNS;

type WatchlistScreenNavigationProp = NativeStackNavigationProp<
  AccountStackParamList,
  "Watchlist"
>;

const WatchlistScreen: React.FC = () => {
  const navigation = useNavigation<WatchlistScreenNavigationProp>();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await watchlistService.getAll({ limit: 100 });
      setWatchlist(response.watchlist || response || []);
      setError(null);
    } catch (error: any) {
      console.error("Error loading watchlist:", error);
      setError("Failed to load your watchlist. Please try again.");
      setWatchlist([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [loadWatchlist])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWatchlist();
  }, [loadWatchlist]);

  const handleRemove = async (item: any) => {
    Alert.alert(
      "Remove from Watchlist",
      `Are you sure you want to remove "${item.movieId?.title || "this movie"}" from your watchlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await watchlistService.remove(item._id);
              loadWatchlist();
            } catch (error) {
              Alert.alert("Error", "Failed to remove from watchlist");
            }
          },
        },
      ]
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "#4CAF50";
    if (rating >= 5) return "#FFA726";
    return "#EF5350";
  };

  const renderMovie = ({ item }: { item: any }) => {
    const movie = item.movieId || {};
    const rating = movie.rating || 0;
    const ratingColor = getRatingColor(rating);
    const year = movie.releaseDate
      ? new Date(movie.releaseDate).getFullYear()
      : null;

    return (
      <TouchableOpacity
        style={[styles.movieCard, { width: CARD_WIDTH }]}
        onPress={() => {
          if (movie._id || movie.tmdbId) {
            navigation.navigate("MovieDetails", { movie });
          }
        }}
        activeOpacity={0.8}
      >
        <View style={styles.posterContainer}>
          <OptimizedImage
            uri={movie.posterUrl}
            style={styles.poster}
            placeholderColor="#333"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.movieInfo}>
          <AppText style={styles.movieTitle} numberOfLines={2}>
            {movie.title || "Untitled"}
          </AppText>
          <View style={styles.movieMeta}>
            {year && <AppText style={styles.movieDate}>{year}</AppText>}
            {rating > 0 && (
              <View
                style={[styles.ratingBadge, { backgroundColor: ratingColor }]}
              >
                <Ionicons name="star" size={8} color="#fff" />
                <AppText style={styles.ratingText}>{rating.toFixed(1)}</AppText>
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
      {loading && watchlist.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: 9 }).map((_, index) => (
            <MovieCardSkeleton key={index} width={CARD_WIDTH} />
          ))}
        </View>
      ) : error && watchlist.length === 0 ? (
        <ErrorView message={error} onRetry={loadWatchlist} />
      ) : (
        <FlatList
        data={watchlist}
        renderItem={renderMovie}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={
          watchlist.length === 0 ? styles.listEmpty : styles.list
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
              <Ionicons name="bookmark-outline" size={64} color="#666" />
            </View>
            <AppText style={styles.emptyTitle}>Your Watchlist is Empty</AppText>
            <AppText style={styles.emptyText}>
              Add movies to your watchlist to watch them later!
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
    padding: LIST_PADDING,
    paddingBottom: 24,
  },
  listEmpty: {
    flex: 1,
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
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  movieInfo: {
    padding: 6,
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
    gap: 8,
    flexWrap: "wrap",
  },
  movieDate: {
    fontSize: 12,
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

export default WatchlistScreen;
