import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ScrollView,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { moviesService, movieSearchService } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const CARD_MARGIN = 4;
const LIST_PADDING = 6;
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
  updatedAt?: string;
}

interface MoviesScreenProps {
  navigation: any;
}

type RatingFilter = "all" | "high" | "medium" | "low";
type YearFilter = "all" | "2020s" | "2010s" | "2000s" | "classics";
type SortOption = "recent" | "best" | "worst" | "newest" | "alphabetical";

const MoviesScreen: React.FC<MoviesScreenProps> = ({ navigation }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [showSortModal, setShowSortModal] = useState(false);

  const loadMovies = useCallback(async () => {
    try {
      setLoading(true);
      const dbMovies = await moviesService.getAll({
        limit: 100,
        sortBy: "updatedAt",
      });
      if (dbMovies.movies && dbMovies.movies.length > 0) {
        setAllMovies(dbMovies.movies);
        setMovies(dbMovies.movies);
      } else {
        const popular = await movieSearchService.getTollywood({ page: 1 });
        const moviesList = popular.movies || [];
        setAllMovies(moviesList);
        setMovies(moviesList);
      }
    } catch (error) {
      console.error("Error loading movies:", error);
      try {
        const popular = await movieSearchService.getTollywood({ page: 1 });
        const moviesList = popular.movies || [];
        setAllMovies(moviesList);
        setMovies(moviesList);
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

  useFocusEffect(
    useCallback(() => {
      loadMovies();
    }, [loadMovies])
  );

  // Filter and sort movies
  const filteredAndSortedMovies = useMemo(() => {
    let filtered = [...allMovies];

    // Apply rating filter
    if (ratingFilter !== "all") {
      filtered = filtered.filter((movie) => {
        const rating = movie.rating || 0;
        if (ratingFilter === "high") return rating >= 8;
        if (ratingFilter === "medium") return rating >= 5 && rating < 8;
        if (ratingFilter === "low") return rating < 5;
        return true;
      });
    }

    // Apply year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter((movie) => {
        if (!movie.releaseDate) return false;
        const year = new Date(movie.releaseDate).getFullYear();
        if (yearFilter === "2020s") return year >= 2020;
        if (yearFilter === "2010s") return year >= 2010 && year < 2020;
        if (yearFilter === "2000s") return year >= 2000 && year < 2010;
        if (yearFilter === "classics") return year < 2000;
        return true;
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortOption === "recent") {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      } else if (sortOption === "best") {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortOption === "worst") {
        return (a.rating || 0) - (b.rating || 0);
      } else if (sortOption === "newest") {
        const yearA = a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0;
        const yearB = b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0;
        return yearB - yearA;
      } else if (sortOption === "alphabetical") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });

    return filtered;
  }, [allMovies, ratingFilter, yearFilter, sortOption]);

  useEffect(() => {
    setMovies(filteredAndSortedMovies);
  }, [filteredAndSortedMovies]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMovies();
    setRefreshing(false);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "#4CAF50";
    if (rating >= 5) return "#FFA726";
    return "#EF5350";
  };

  const getSortLabel = (option: SortOption) => {
    const labels: { [key: string]: string } = {
      recent: "Recently Reviewed",
      best: "Highest Rated",
      worst: "Lowest Rated",
      newest: "Newest Release",
      alphabetical: "A-Z",
    };
    return labels[option] || option;
  };

  const renderMovie = ({ item }: { item: Movie }) => {
    const rating = item.rating || 0;
    const ratingColor = getRatingColor(rating);
    const year = item.releaseDate
      ? new Date(item.releaseDate).getFullYear()
      : null;

    return (
      <TouchableOpacity
        style={[styles.movieCard, { width: CARD_WIDTH }]}
        onPress={() => {
          navigation.navigate("MovieDetails", { movie: item });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.posterContainer}>
          {item.posterUrl ? (
            <Image source={{ uri: item.posterUrl }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Ionicons name="film-outline" size={24} color="#666" />
            </View>
          )}
        </View>
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {item.title || "Untitled"}
          </Text>
          <View style={styles.movieMeta}>
            {year && <Text style={styles.movieDate}>{year}</Text>}
            {rating > 0 && (
              <View
                style={[styles.ratingBadge, { backgroundColor: ratingColor }]}
              >
                <Ionicons name="star" size={10} color="#fff" />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                <Text style={styles.ratingDenominator}>/10</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterChip = (
    label: string,
    value: RatingFilter | YearFilter,
    currentValue: RatingFilter | YearFilter,
    onPress: () => void,
    filterType: "rating" | "year"
  ) => {
    // Ensure we're comparing the correct filter type
    const isActive = value === currentValue;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => {
          onPress();
        }}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterChipText,
            isActive && styles.filterChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

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
      {/* Filters and Sort Bar */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {/* Rating Filters */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Rating:</Text>
            {renderFilterChip(
              "All",
              "all",
              ratingFilter,
              () => setRatingFilter("all"),
              "rating"
            )}
            {renderFilterChip(
              "High (8+)",
              "high",
              ratingFilter,
              () => setRatingFilter("high"),
              "rating"
            )}
            {renderFilterChip(
              "Medium (5-7)",
              "medium",
              ratingFilter,
              () => setRatingFilter("medium"),
              "rating"
            )}
            {renderFilterChip(
              "Low (<5)",
              "low",
              ratingFilter,
              () => setRatingFilter("low"),
              "rating"
            )}
          </View>

          {/* Separator */}
          <View style={styles.filterSeparator} />

          {/* Year Filters */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Year:</Text>
            {renderFilterChip(
              "All",
              "all",
              yearFilter,
              () => setYearFilter("all"),
              "year"
            )}
            {renderFilterChip(
              "2020s",
              "2020s",
              yearFilter,
              () => setYearFilter("2020s"),
              "year"
            )}
            {renderFilterChip(
              "2010s",
              "2010s",
              yearFilter,
              () => setYearFilter("2010s"),
              "year"
            )}
            {renderFilterChip(
              "2000s",
              "2000s",
              yearFilter,
              () => setYearFilter("2000s"),
              "year"
            )}
            {renderFilterChip(
              "Classics",
              "classics",
              yearFilter,
              () => setYearFilter("classics"),
              "year"
            )}
          </View>
        </ScrollView>

        {/* Sort Button */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={18} color="#007AFF" />
          <Text style={styles.sortButtonText}>{getSortLabel(sortOption)}</Text>
        </TouchableOpacity>
      </View>

      {/* Movies Grid */}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="film-outline" size={64} color="#666" />
            </View>
            <Text style={styles.emptyTitle}>No Movies Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters or start reviewing movies!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => {
                setRatingFilter("all");
                setYearFilter("all");
                setSortOption("recent");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.browseButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {(
              [
                "recent",
                "best",
                "worst",
                "newest",
                "alphabetical",
              ] as SortOption[]
            ).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortOption,
                  sortOption === option && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortOption(option);
                  setShowSortModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortOption === option && styles.sortOptionTextActive,
                  ]}
                >
                  {getSortLabel(option)}
                </Text>
                {sortOption === option && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    fontSize: 14,
  },
  filtersContainer: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  filtersScroll: {
    paddingRight: 12,
    gap: 12,
  },
  filterGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 16,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginRight: 4,
  },
  filterSeparator: {
    width: 1,
    height: 24,
    backgroundColor: "#333",
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
  },
  filterChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  list: {
    padding: LIST_PADDING,
    paddingBottom: 24,
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
    aspectRatio: 2 / 3,
    backgroundColor: "#333",
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  movieInfo: {
    padding: 6,
  },
  movieTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    color: "#fff",
    lineHeight: 16,
  },
  movieMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  movieDate: {
    fontSize: 11,
    fontWeight: "500",
    color: "#999",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  ratingDenominator: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
    opacity: 0.9,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sortOptionActive: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  sortOptionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

export default MoviesScreen;
