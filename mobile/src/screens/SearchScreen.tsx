import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { movieSearchService, moviesService } from "../services/api";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SearchStackParamList } from "../navigation/AppNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAllRecentSearches, setShowAllRecentSearches] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

  useEffect(() => {
    loadRecentSearches();
    loadPopularMovies();
    loadTrendingSearches();

    // Rotate placeholder every 3 seconds
    const placeholderInterval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % PLACEHOLDER_MESSAGES.length);
    }, 3000);

    return () => clearInterval(placeholderInterval);
  }, []);

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

  const loadTrendingSearches = async (movies?: Movie[]) => {
    try {
      // Get popular movie titles as trending searches
      // For now, use common Telugu movie titles that are likely popular
      const defaultTrending = ["RRR", "Baahubali", "Pushpa", "KGF", "Salaar"];

      // Use provided movies or current popularMovies state
      const moviesToUse = movies || popularMovies;

      // Try to get from popular movies if available
      if (moviesToUse.length > 0) {
        const titles = moviesToUse
          .slice(0, 5)
          .map((m) => m.title)
          .filter((t) => t && t.length < 20); // Filter out very long titles
        if (titles.length > 0) {
          setTrendingSearches(titles);
          return;
        }
      }

      setTrendingSearches(defaultTrending);
    } catch (error) {
      console.error("Error loading trending searches:", error);
      setTrendingSearches(["RRR", "Baahubali", "Pushpa"]);
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

      // Update trending searches after popular movies load
      loadTrendingSearches(finalMovies);
    } catch (error) {
      console.error("Error loading popular movies:", error);
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
      return;
    }

    try {
      setLoading(true);

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
        setMovies(filteredMovies);
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
          setMovies(finalMovies);
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
      setMovies([]);
    } finally {
      setLoading(false);
    }
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

  const renderMovie = ({ item }: { item: Movie }) => {
    const rating = item.rating || 0;
    const ratingColor = getRatingColor(rating);
    const year = item.releaseDate
      ? new Date(item.releaseDate).getFullYear()
      : null;
    const badge = getMovieBadge(item);

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
          {badge && (
            <View style={[styles.movieBadge, { backgroundColor: badge.color }]}>
              <Ionicons name={badge.icon as any} size={10} color="#fff" />
              <Text style={styles.movieBadgeText}>{badge.label}</Text>
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

  const renderRecentSearch = (query: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchPress(query)}
    >
      <Text style={styles.recentSearchText}>{query}</Text>
    </TouchableOpacity>
  );

  const renderGenreFilter = () => (
    <View style={styles.genreFilterContainer}>
      <Text style={styles.genreFilterTitle}>Browse by Genre</Text>
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
          <Text
            style={[
              styles.genreChipText,
              selectedGenre === null && styles.genreChipTextActive,
            ]}
          >
            All
          </Text>
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
            <Text
              style={[
                styles.genreChipText,
                selectedGenre === genre && styles.genreChipTextActive,
              ]}
            >
              {genre}
            </Text>
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={PLACEHOLDER_MESSAGES[currentPlaceholder]}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                // Clear movies immediately if text is cleared to show recent searches/popular
                if (!text.trim() && !selectedGenre) {
                  setMovies([]);
                }
              }}
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
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Trending Searches */}
          {!searchQuery.trim() &&
            !selectedGenre &&
            trendingSearches.length > 0 && (
              <View style={styles.trendingSearchesContainer}>
                <Text style={styles.trendingLabel}>Trending:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingScrollContent}
                >
                  {trendingSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.trendingChip}
                      onPress={() => handleRecentSearchPress(search)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="flame" size={12} color="#FF6B35" />
                      <Text style={styles.trendingChipText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
        </View>

        {renderGenreFilter()}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : showSearchResults ? (
          movies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="search-outline" size={60} color="#666" />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedGenre
                  ? `No ${selectedGenre} movies found`
                  : "Hmm, we couldn't find that"}
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedGenre
                  ? "Try selecting a different genre or search for a specific movie"
                  : "Try:"}
              </Text>
              {!selectedGenre && (
                <View style={styles.emptySuggestions}>
                  <Text style={styles.emptySuggestionText}>
                    • Check spelling
                  </Text>
                  <Text style={styles.emptySuggestionText}>
                    • Search by genre instead
                  </Text>
                  <Text style={styles.emptySuggestionText}>
                    • Browse popular movies
                  </Text>
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
                  <Text style={styles.surpriseButtonText}>Surprise me</Text>
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
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <View style={styles.sectionHeaderRight}>
                    {recentSearches.length > 4 && (
                      <TouchableOpacity
                        onPress={() =>
                          setShowAllRecentSearches(!showAllRecentSearches)
                        }
                        style={styles.seeAllButton}
                      >
                        <Text style={styles.seeAllText}>
                          {showAllRecentSearches ? "Show Less" : "See All"}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearAllText}>Clear</Text>
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
                  <Text style={styles.sectionTitle}>Popular Movies</Text>
                  {popularMovies.length > 0 && (
                    <Text style={styles.sectionSubtitle}>
                      {popularMovies.length} movies
                    </Text>
                  )}
                </View>
                {loadingPopular ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>
                      Finding great movies...
                    </Text>
                  </View>
                ) : popularMovies.length > 0 ? (
                  <FlatList
                    data={popularMovies}
                    renderItem={renderMovie}
                    keyExtractor={(item) => {
                      const key =
                        item.tmdbId?.toString() ||
                        item._id ||
                        item.id?.toString();
                      return key ? String(key) : Math.random().toString();
                    }}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                  />
                ) : (
                  <View style={styles.emptyPopularContainer}>
                    <Text style={styles.emptyPopularText}>
                      No popular movies available at the moment
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </TouchableWithoutFeedback>
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
    paddingBottom: 8,
    backgroundColor: "#1a1a1a",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginBottom: 8,
  },
  trendingSearchesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  trendingLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginRight: 8,
  },
  trendingScrollContent: {
    gap: 6,
  },
  trendingChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    gap: 4,
    marginRight: 6,
  },
  trendingChipText: {
    color: "#999",
    fontSize: 12,
    fontWeight: "500",
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#2a2a2a",
    color: "#fff",
  },
  clearButton: {
    position: "absolute",
    right: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  ratingDenominator: {
    fontSize: 10,
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
});

export default SearchScreen;
