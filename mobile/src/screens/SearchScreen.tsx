import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { AppText, AppTextInput } from "../components/Typography";
import OptimizedImage from "../components/OptimizedImage";
import { MovieCardSkeleton } from "../components/SkeletonLoader";
import ErrorView from "../components/ErrorView";
import OfflineBanner from "../components/OfflineBanner";
import { movieSearchService, moviesService } from "../services/api";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SearchStackParamList } from "../navigation/AppNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const CARD_MARGIN = 2;
const LIST_PADDING = 4;
const SECTION_PADDING = 16; // Padding used in section style
const CARD_WIDTH =
  (SCREEN_WIDTH - LIST_PADDING * 2 - CARD_MARGIN * (NUM_COLUMNS * 2)) /
  NUM_COLUMNS;
// Card width for Popular Movies section (accounts for section padding)
const POPULAR_CARD_WIDTH =
  (SCREEN_WIDTH - SECTION_PADDING * 2 - CARD_MARGIN * (NUM_COLUMNS * 2)) /
  NUM_COLUMNS;

interface Movie {
  _id?: string;
  id?: string;
  title: string;
  posterUrl?: string;
  rating?: number;
  releaseDate?: string;
  tmdbId?: number;
  genre?: string[];
}

type SearchScreenNavigationProp = NativeStackNavigationProp<
  SearchStackParamList,
  "Search"
>;

const RECENT_SEARCHES_KEY = "@tfireviews:recent_searches";
const MAX_RECENT_SEARCHES = 10;

// TMDB Genre IDs mapping
const GENRE_MAP: { [key: string]: number } = {
  Action: 28,
  Drama: 18,
  Comedy: 35,
  Romance: 10749,
  Thriller: 53,
  Horror: 27,
  Family: 10751,
  Adventure: 12,
  Crime: 80,
  "Sci-Fi": 878,
  Fantasy: 14,
};

// Common genres for Tollywood/Telugu movies
const GENRES = Object.keys(GENRE_MAP);

// Rotating placeholder messages
const PLACEHOLDER_MESSAGES = [
  "What movie are you craving tonight?",
  "Search by mood, actor, or vibe...",
  "Find your next obsession",
  "Type anything... we'll find it",
  "Discover your perfect movie",
];

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAllRecentSearches, setShowAllRecentSearches] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [sortBy, setSortBy] = useState<
    "relevance" | "rating" | "date" | "popularity"
  >("relevance");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const searchInputRef = useRef<any>(null);
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRecentSearches();
    loadPopularMovies();

    // Rotate placeholder every 3 seconds
    const placeholderInterval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % PLACEHOLDER_MESSAGES.length);
    }, 3000);

    return () => clearInterval(placeholderInterval);
  }, []);

  // Auto-focus search input when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Small delay to ensure the screen is fully mounted
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  // Animate border color on focus
  useEffect(() => {
    Animated.timing(borderColorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  // Debounced search effect - triggers search as user types
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    // If search query is empty, clear results and don't search
    if (!searchQuery.trim()) {
      // If there's a selected genre, show genre results
      if (selectedGenre) {
        handleSearch(undefined, selectedGenre);
      } else {
        setMovies([]);
      }
      return;
    }

    // Set up debounced search - wait 500ms after user stops typing
    const timer = setTimeout(() => {
      console.log("Debounced search triggered for:", searchQuery);
      handleSearch(searchQuery, selectedGenre);
    }, 500);

    setDebounceTimer(timer);

    // Cleanup timer on unmount or when searchQuery changes
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // Only depend on searchQuery to avoid double searches

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery) return;

      const updated = [
        trimmedQuery,
        ...recentSearches.filter((s) => s !== trimmedQuery),
      ].slice(0, MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  const loadPopularMovies = async () => {
    try {
      setLoadingPopular(true);
      // Calculate date: 10 months ago (movies from last 6-10 months)
      const tenMonthsAgo = new Date();
      tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);

      // Fetch multiple pages from TMDB to ensure we have enough movies
      let allMovies: Movie[] = [];
      const targetMovies = 50;
      const maxPages = 10; // Fetch up to 10 pages to get at least 50 movies
      let page = 1;

      // Keep fetching pages until we have enough movies or run out of pages
      while (allMovies.length < targetMovies * 2 && page <= maxPages) {
        try {
          const popular = await movieSearchService.getTollywood({
            page,
            language: "en", // Use English to get English titles
          });
          if (popular.movies && popular.movies.length > 0) {
            allMovies = [...allMovies, ...popular.movies];
            page++;
          } else {
            // No more movies available
            break;
          }
        } catch (pageError) {
          console.error(`Error loading page ${page}:`, pageError);
          break;
        }
      }

      // Filter movies from last 6-10 months (released between 10 months ago and now)
      // and sort by release date (newest first)
      const filtered = allMovies
        .filter((movie: Movie) => {
          if (!movie.releaseDate) return false;
          const releaseDate = new Date(movie.releaseDate);
          // Movies released in the last 10 months
          return releaseDate >= tenMonthsAgo;
        })
        .sort((a: Movie, b: Movie) => {
          const dateA = new Date(a.releaseDate || 0).getTime();
          const dateB = new Date(b.releaseDate || 0).getTime();
          return dateB - dateA; // Descending order (newest first)
        });

      // Display at least 50 movies (or all available if less than 50)
      const finalMovies = filtered.slice(
        0,
        Math.max(targetMovies, filtered.length)
      );

      setPopularMovies(finalMovies);
      setError(null);
    } catch (error) {
      console.error("Error loading popular movies:", error);
      setError("Failed to load popular movies. Please try again.");
      setPopularMovies([]);
    } finally {
      setLoadingPopular(false);
    }
  };

  const handleSearch = async (
    queryOverride?: string,
    genreOverride?: string | null
  ) => {
    // Use queryOverride if provided, otherwise use searchQuery state
    const activeQuery =
      queryOverride !== undefined ? queryOverride : searchQuery;
    // Use genreOverride if provided, otherwise use selectedGenre state
    const activeGenre =
      genreOverride !== undefined ? genreOverride : selectedGenre;

    console.log("handleSearch called with:", {
      activeQuery,
      activeGenre,
      queryOverride,
      genreOverride,
    });

    // Allow searching by genre alone (without text query)
    if (!activeQuery.trim() && !activeGenre) {
      console.log("No search query or genre, clearing results");
      setMovies([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (activeQuery.trim()) {
        await saveRecentSearch(activeQuery);
      }

      // PRIORITY: If there's a text query, search by movie title first
      if (activeQuery.trim()) {
        console.log("Searching for movies with query:", activeQuery);
        // Search for movies by title/name - use English for titles
        const results = await movieSearchService.search({
          query: activeQuery,
          language: "en", // Use English to get English titles
        });

        // Filter by genre if selected (for TMDB search results)
        let filteredMovies = results.movies || [];
        if (activeGenre && filteredMovies.length > 0) {
          filteredMovies = filteredMovies.filter((movie: Movie) => {
            // Check if movie has genre array and includes selected genre
            return (
              movie.genre &&
              Array.isArray(movie.genre) &&
              movie.genre.includes(activeGenre)
            );
          });
        }

        console.log(`Found ${filteredMovies.length} movies`);

        // Apply sorting
        const sortedMovies = sortMovies(filteredMovies, sortBy);
        setMovies(sortedMovies);
        setError(null);
        setLoading(false);
        return;
      }

      // If no text query but genre is selected, show movies by genre
      if (activeGenre) {
        const genreId = GENRE_MAP[activeGenre];
        console.log(
          `Searching for genre: ${activeGenre}, Genre ID: ${genreId}`
        );
        if (genreId) {
          // Fetch multiple pages to get at least 30 movies
          let allMovies: Movie[] = [];
          const targetMovies = 30;
          let page = 1;
          const maxPages = 3; // Fetch up to 3 pages to ensure we get at least 30 movies

          // Keep fetching pages until we have at least 30 movies or run out of pages
          while (allMovies.length < targetMovies && page <= maxPages) {
            try {
              console.log(
                `Fetching genre ${activeGenre} (ID: ${genreId}), page ${page}...`
              );
              const results = await movieSearchService.getByGenre(genreId, {
                page,
                language: "en", // Use English to get English titles
              });
              console.log(
                `Received ${
                  results?.movies?.length || 0
                } movies from page ${page}`
              );
              if (results && results.movies && results.movies.length > 0) {
                allMovies = [...allMovies, ...results.movies];
                page++;
              } else {
                // No more movies available
                console.log(`No more movies on page ${page}, stopping fetch`);
                break;
              }
            } catch (pageError: any) {
              console.error(
                `Error loading page ${page} for genre ${activeGenre}:`,
                pageError?.response?.data || pageError?.message || pageError
              );
              break;
            }
          }
          console.log(
            `Total movies fetched for genre ${activeGenre}: ${allMovies.length}`
          );

          // Display at least 30 movies (or all if we have less than 30)
          const finalMovies =
            allMovies.length >= targetMovies
              ? allMovies.slice(0, targetMovies)
              : allMovies;
          console.log(
            `Setting ${finalMovies.length} movies for genre ${activeGenre}`
          );

          // Apply sorting
          const sortedMovies = sortMovies(finalMovies, sortBy);
          setMovies(sortedMovies);
          setError(null);
          setLoading(false);
          return;
        } else {
          console.error(`Genre ID not found for genre: ${activeGenre}`);
        }
      }

      // If neither text nor genre, clear results
      setMovies([]);
    } catch (error: any) {
      console.error("Error searching movies:", error);
      console.error(
        "Error details:",
        error?.response?.data || error?.message || error
      );
      // Show error to user
      if (error?.response?.data?.error) {
        console.error("API Error:", error.response.data.error);
      }
      setError("Failed to search movies. Please try again.");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const sortMovies = (movies: Movie[], sortType: string): Movie[] => {
    const sorted = [...movies];
    switch (sortType) {
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "date":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.releaseDate || 0).getTime();
          const dateB = new Date(b.releaseDate || 0).getTime();
          return dateB - dateA; // Newest first
        });
      case "popularity":
        // Sort by rating as popularity proxy (higher rated = more popular)
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "relevance":
      default:
        return sorted; // Keep original order (relevance from API)
    }
  };

  const handleSortChange = (
    newSort: "relevance" | "rating" | "date" | "popularity"
  ) => {
    setSortBy(newSort);
    setShowSortOptions(false);
    // Re-sort current movies
    const sortedMovies = sortMovies(movies, newSort);
    setMovies(sortedMovies);
  };

  const handleGenreSelect = async (genre: string | null) => {
    setSelectedGenre(genre);
    // If genre is selected, automatically search with the new genre
    if (genre) {
      // Trigger search with the selected genre (pass it directly to avoid state timing issues)
      await handleSearch(undefined, genre);
    } else {
      // If "All" is selected, clear genre filter and re-search if there's a query
      if (searchQuery.trim()) {
        // Re-search without genre filter
        await handleSearch(undefined, undefined);
      } else {
        // Clear results and show popular movies
        setMovies([]);
      }
    }
  };

  const handleRecentSearchPress = async (query: string) => {
    setSearchQuery(query);
    try {
      setLoading(true);
      await saveRecentSearch(query);
      const results = await movieSearchService.search({
        query: query,
        language: "en", // Use English to get English titles
      });
      setMovies(results.movies || []);
    } catch (error) {
      console.error("Error searching movies:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "#4CAF50";
    if (rating >= 5) return "#FFA726";
    return "#EF5350";
  };

  const getMovieBadge = (
    movie: Movie
  ): { label: string; color: string; icon: string } | null => {
    if (!movie.releaseDate) return null;

    const releaseDate = new Date(movie.releaseDate);
    const now = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // New badge (released in last 2 months)
    if (releaseDate >= twoMonthsAgo) {
      return { label: "New", color: "#4CAF50", icon: "sparkles" };
    }

    // Top Rated badge (8.5+ rating)
    if (movie.rating && movie.rating >= 8.5) {
      return { label: "Top Rated", color: "#FFA726", icon: "star" };
    }

    // Hidden Gem (8+ rating, but less popular - we'll use rating as proxy)
    if (movie.rating && movie.rating >= 8 && movie.rating < 8.5) {
      return { label: "Hidden Gem", color: "#8E44AD", icon: "diamond" };
    }

    return null;
  };

  const renderMovie = ({
    item,
    cardWidth = CARD_WIDTH,
  }: {
    item: Movie;
    cardWidth?: number;
  }) => {
    const rating = item.rating || 0;
    const ratingColor = getRatingColor(rating);
    const year = item.releaseDate
      ? new Date(item.releaseDate).getFullYear()
      : null;
    const badge = getMovieBadge(item);

    return (
      <TouchableOpacity
        style={[styles.movieCard, { width: cardWidth }]}
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
            <View style={[styles.movieBadge, { backgroundColor: badge.color }]}>
              <Ionicons name={badge.icon as any} size={10} color="#fff" />
              <AppText style={styles.movieBadgeText}>{badge.label}</AppText>
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

  const renderRecentSearch = (query: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchPress(query)}
    >
      <AppText style={styles.recentSearchText}>{query}</AppText>
    </TouchableOpacity>
  );

  const renderGenreFilter = () => (
    <View style={styles.genreFilterContainer}>
      <AppText style={styles.genreFilterTitle}>Browse by Genre</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.genreChip,
            selectedGenre === null && styles.genreChipActive,
          ]}
          onPress={() => handleGenreSelect(null)}
        >
          <AppText
            style={[
              styles.genreChipText,
              selectedGenre === null && styles.genreChipTextActive,
            ]}
          >
            All
          </AppText>
        </TouchableOpacity>
        {GENRES.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              styles.genreChip,
              selectedGenre === genre && styles.genreChipActive,
            ]}
            onPress={() => handleGenreSelect(genre)}
          >
            <AppText
              style={[
                styles.genreChipText,
                selectedGenre === genre && styles.genreChipTextActive,
              ]}
            >
              {genre}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const showSearchResults =
    searchQuery.trim().length > 0 || selectedGenre !== null;
  const showRecentSearches = !showSearchResults && recentSearches.length > 0;
  const showPopularMovies = !showSearchResults && !loadingPopular;

  // Clear genre filter when clearing search
  const handleClearSearch = () => {
    setSearchQuery("");
    setMovies([]);
    setSelectedGenre(null);
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <Animated.View
              style={[
                styles.searchInputContainer,
                {
                  borderColor: borderColorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#333", "#007AFF"],
                  }),
                  shadowOpacity: borderColorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                },
              ]}
            >
              <View style={styles.searchIconContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={isFocused ? "#007AFF" : "#666"}
                />
              </View>
              <AppTextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={PLACEHOLDER_MESSAGES[currentPlaceholder]}
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  // Clear movies immediately if text is cleared to show recent searches/popular
                  if (!text.trim() && !selectedGenre) {
                    setMovies([]);
                  }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={(e) => {
                  const query = e.nativeEvent.text || searchQuery;
                  console.log("Search submitted with query:", query);
                  if (query.trim()) {
                    // Clear any pending debounced search
                    if (debounceTimer) {
                      clearTimeout(debounceTimer);
                      setDebounceTimer(null);
                    }
                    // Immediate search on enter
                    handleSearch(query);
                  }
                }}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={true}
                enablesReturnKeyAutomatically={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearSearch}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>

          {renderGenreFilter()}

          {/* Sort Options - Only show when there are search results */}
          {showSearchResults && movies.length > 0 && (
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setShowSortOptions(!showSortOptions)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="swap-vertical-outline"
                  size={18}
                  color="#007AFF"
                />
                <AppText style={styles.sortButtonText}>
                  Sort:{" "}
                  {sortBy === "relevance"
                    ? "Relevance"
                    : sortBy === "rating"
                    ? "Rating"
                    : sortBy === "date"
                    ? "Release Date"
                    : "Popularity"}
                </AppText>
                <Ionicons
                  name={showSortOptions ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#007AFF"
                />
              </TouchableOpacity>

              {showSortOptions && (
                <View style={styles.sortOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      sortBy === "relevance" && styles.sortOptionActive,
                    ]}
                    onPress={() => handleSortChange("relevance")}
                    activeOpacity={0.7}
                  >
                    <AppText
                      style={[
                        styles.sortOptionText,
                        sortBy === "relevance" && styles.sortOptionTextActive,
                      ]}
                    >
                      Relevance
                    </AppText>
                    {sortBy === "relevance" && (
                      <Ionicons name="checkmark" size={18} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      sortBy === "rating" && styles.sortOptionActive,
                    ]}
                    onPress={() => handleSortChange("rating")}
                    activeOpacity={0.7}
                  >
                    <AppText
                      style={[
                        styles.sortOptionText,
                        sortBy === "rating" && styles.sortOptionTextActive,
                      ]}
                    >
                      Rating (High to Low)
                    </AppText>
                    {sortBy === "rating" && (
                      <Ionicons name="checkmark" size={18} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      sortBy === "date" && styles.sortOptionActive,
                    ]}
                    onPress={() => handleSortChange("date")}
                    activeOpacity={0.7}
                  >
                    <AppText
                      style={[
                        styles.sortOptionText,
                        sortBy === "date" && styles.sortOptionTextActive,
                      ]}
                    >
                      Release Date (Newest)
                    </AppText>
                    {sortBy === "date" && (
                      <Ionicons name="checkmark" size={18} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      sortBy === "popularity" && styles.sortOptionActive,
                    ]}
                    onPress={() => handleSortChange("popularity")}
                    activeOpacity={0.7}
                  >
                    <AppText
                      style={[
                        styles.sortOptionText,
                        sortBy === "popularity" && styles.sortOptionTextActive,
                      ]}
                    >
                      Popularity
                    </AppText>
                    {sortBy === "popularity" && (
                      <Ionicons name="checkmark" size={18} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {loading ? (
            <FlatList
              data={Array.from({ length: 9 })}
              renderItem={() => <MovieCardSkeleton width={CARD_WIDTH} />}
              keyExtractor={(_, index) => `skeleton-${index}`}
              numColumns={3}
              contentContainerStyle={styles.list}
            />
          ) : error && showSearchResults ? (
            <ErrorView
              message={error}
              onRetry={() => handleSearch(searchQuery, selectedGenre)}
            />
          ) : showSearchResults ? (
            movies.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="search-outline" size={60} color="#666" />
                </View>
                <AppText style={styles.emptyTitle}>
                  {selectedGenre
                    ? `No ${selectedGenre} movies found`
                    : "Hmm, we couldn't find that"}
                </AppText>
                <AppText style={styles.emptySubtext}>
                  {selectedGenre
                    ? "Try selecting a different genre or search for a specific movie"
                    : "Try:"}
                </AppText>
                {!selectedGenre && (
                  <View style={styles.emptySuggestions}>
                    <AppText style={styles.emptySuggestionText}>
                      • Check spelling
                    </AppText>
                    <AppText style={styles.emptySuggestionText}>
                      • Search by genre instead
                    </AppText>
                    <AppText style={styles.emptySuggestionText}>
                      • Browse popular movies
                    </AppText>
                  </View>
                )}
                {!selectedGenre && (
                  <TouchableOpacity
                    style={styles.surpriseButton}
                    onPress={() => {
                      // Show a random popular movie
                      if (popularMovies.length > 0) {
                        const randomMovie =
                          popularMovies[
                            Math.floor(Math.random() * popularMovies.length)
                          ];
                        navigation.navigate("MovieDetails", {
                          movie: randomMovie,
                        });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <AppText style={styles.surpriseButtonText}>
                      Surprise me
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
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
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={Keyboard.dismiss}
              />
            )
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
            >
              {showRecentSearches && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <AppText style={styles.sectionTitle}>
                      Recent Searches
                    </AppText>
                    <View style={styles.sectionHeaderRight}>
                      {recentSearches.length > 4 && (
                        <TouchableOpacity
                          onPress={() =>
                            setShowAllRecentSearches(!showAllRecentSearches)
                          }
                          style={styles.seeAllButton}
                        >
                          <AppText style={styles.seeAllText}>
                            {showAllRecentSearches ? "Show Less" : "See All"}
                          </AppText>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={clearRecentSearches}>
                        <AppText style={styles.clearAllText}>Clear</AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.recentSearchesContainer}>
                    {(showAllRecentSearches
                      ? recentSearches
                      : recentSearches.slice(0, 4)
                    ).map((query, index) => renderRecentSearch(query, index))}
                  </View>
                </View>
              )}

              {showRecentSearches && showPopularMovies && (
                <View style={styles.sectionDivider} />
              )}

              {showPopularMovies && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <AppText style={styles.sectionTitle}>
                      Popular Movies
                    </AppText>
                    {popularMovies.length > 0 && (
                      <AppText style={styles.sectionSubtitle}>
                        {popularMovies.length} movies
                      </AppText>
                    )}
                  </View>
                  {loadingPopular ? (
                    <View style={styles.popularMoviesGrid}>
                      {Array.from({ length: 9 }).map((_, index) => (
                        <MovieCardSkeleton
                          key={index}
                          width={POPULAR_CARD_WIDTH}
                        />
                      ))}
                    </View>
                  ) : error && !showSearchResults ? (
                    <ErrorView message={error} onRetry={loadPopularMovies} />
                  ) : popularMovies.length > 0 ? (
                    <View style={styles.popularMoviesGrid}>
                      {popularMovies.map((item, index) => {
                        const key =
                          item.tmdbId?.toString() ||
                          item._id ||
                          item.id?.toString() ||
                          `popular-${index}`;
                        return (
                          <View key={key}>
                            {renderMovie({
                              item,
                              cardWidth: POPULAR_CARD_WIDTH,
                            })}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyPopularContainer}>
                      <AppText style={styles.emptyPopularText}>
                        No popular movies available at the moment
                      </AppText>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </TouchableWithoutFeedback>
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
  searchContainer: {
    padding: 12,
    paddingBottom: 4,
    backgroundColor: "#1a1a1a",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#333",
    marginBottom: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 2,
    minHeight: 32, // Reduced from 44
  },
  searchIconContainer: {
    paddingLeft: 12,
    paddingRight: 6,
    justifyContent: "center",
    alignItems: "center",
    height: 32, // Match search bar height
  },
  searchInput: {
    flex: 1,
    height: 32, // Reduced from 40
    paddingRight: 12,
    paddingVertical: 0, // Remove default padding to ensure proper centering
    paddingTop: 3, // Explicitly set to 0 for Android
    paddingBottom: 0, // Explicitly set to 0 for Android
    fontSize: 15,
    color: "#fff",
    textAlignVertical: "center", // Center text vertically (Android)
    includeFontPadding: false, // Remove extra padding (Android)
    lineHeight: 15, // Match fontSize to prevent extra spacing
  },
  clearButton: {
    paddingRight: 14,
    paddingLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    height: 32, // Match search bar height
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  seeAllButton: {
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  clearAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  recentSearchesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recentSearchItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  recentSearchText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  emptyPopularContainer: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyPopularText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  list: {
    padding: LIST_PADDING,
    paddingBottom: 24,
  },
  popularMoviesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: LIST_PADDING,
    paddingBottom: 24,
  },
  movieCard: {
    margin: CARD_MARGIN,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
    // Glow effect for entire card (poster, title, rating)
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    // Border for additional glow effect
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.2)",
  },
  posterContainer: {
    position: "relative",
    width: "100%",
  },
  poster: {
    width: "100%",
    aspectRatio: 0.75,
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
    backgroundColor: "#333",
  },
  movieBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  movieBadgeText: {
    fontSize: 10,
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
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  emptySuggestions: {
    alignItems: "flex-start",
    marginBottom: 20,
  },
  emptySuggestionText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 6,
    textAlign: "left",
    lineHeight: 20,
  },
  surpriseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  surpriseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
  },
  genreFilterContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  genreFilterTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  genreScrollContent: {
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
    marginRight: 8,
  },
  genreChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  genreChipText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  genreChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  sortButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  sortOptionsContainer: {
    marginTop: 8,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sortOptionActive: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  sortOptionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

export default SearchScreen;
