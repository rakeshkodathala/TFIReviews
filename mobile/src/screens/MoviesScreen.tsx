import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { moviesService, movieSearchService } from "../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const CARD_MARGIN = 4;
const LIST_PADDING = 4;
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
}

interface MoviesScreenProps {
  navigation: any;
}

const MoviesScreen: React.FC<MoviesScreenProps> = ({ navigation }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMovies = useCallback(async () => {
    try {
      setLoading(true);
      // Sort by updatedAt descending to show latest reviewed/added movies first
      const dbMovies = await moviesService.getAll({
        limit: 20,
        sortBy: "updatedAt",
      });
      if (dbMovies.movies && dbMovies.movies.length > 0) {
        setMovies(dbMovies.movies);
      } else {
        const popular = await movieSearchService.getTollywood({ page: 1 });
        setMovies(popular.movies || []);
      }
    } catch (error) {
      console.error("Error loading movies:", error);
      try {
        const popular = await movieSearchService.getTollywood({ page: 1 });
        setMovies(popular.movies || []);
      } catch (err) {
        console.error("Error loading popular movies:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Automatically reload movies when screen comes into focus
  // This happens when returning from CreateReview screen
  useFocusEffect(
    useCallback(() => {
      loadMovies();
    }, [loadMovies])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMovies();
    setRefreshing(false);
  };

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={[styles.movieCard, { width: CARD_WIDTH }]}
      onPress={() => {
        navigation.navigate("MovieDetails", { movie: item });
      }}
    >
      {item.posterUrl ? (
        <Image source={{ uri: item.posterUrl }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={styles.posterText}>No Image</Text>
        </View>
      )}
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {item.title || "Untitled"}
        </Text>
        {item.rating !== undefined &&
          item.rating !== null &&
          typeof item.rating === "number" && (
            <Text style={styles.movieRating}>⭐ {item.rating.toFixed(1)}</Text>
          )}
        {item.releaseDate && (
          <Text style={styles.movieDate}>
            {isNaN(new Date(item.releaseDate).getTime())
              ? ""
              : String(new Date(item.releaseDate).getFullYear())}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && movies.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading movies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => {
          const key =
            item.tmdbId?.toString() || item._id || item.id?.toString();
          return key ? String(key) : Math.random().toString();
        }}
        numColumns={3}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No movies found</Text>
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
  },
  loadingText: {
    marginTop: 16,
    color: "#999",
  },
  list: {
    padding: 4,
  },
  movieCard: {
    margin: CARD_MARGIN,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  poster: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: "#333",
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  posterText: {
    color: "#999",
    fontSize: 12,
  },
  movieInfo: {
    padding: 6,
  },
  movieTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#fff",
  },
  movieRating: {
    fontSize: 10,
    color: "#999",
  },
  movieDate: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default MoviesScreen;
