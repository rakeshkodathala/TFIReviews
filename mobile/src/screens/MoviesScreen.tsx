import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { moviesService, movieSearchService } from "../services/api";

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const dbMovies = await moviesService.getAll({ limit: 20 });
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
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMovies();
      return;
    }

    try {
      setLoading(true);
      const results = await movieSearchService.search({
        query: searchQuery,
        language: "te",
      });
      setMovies(results.movies || []);
    } catch (error) {
      console.error("Error searching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMovies();
    setRefreshing(false);
  };

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => navigation.navigate("MovieDetails", { movie: item })}
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
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => {
          const key =
            item.tmdbId?.toString() || item._id || item.id?.toString();
          return key ? String(key) : Math.random().toString();
        }}
        numColumns={2}
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
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    padding: 8,
  },
  movieCard: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  poster: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: "#ddd",
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
    padding: 8,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  movieRating: {
    fontSize: 12,
    color: "#666",
  },
  movieDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
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
