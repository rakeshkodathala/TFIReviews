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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const CARD_MARGIN = 4;
const LIST_PADDING = 8;
const CARD_WIDTH =
  (SCREEN_WIDTH - LIST_PADDING * 2 - CARD_MARGIN * (NUM_COLUMNS * 2)) /
  NUM_COLUMNS;
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SearchStackParamList } from "../navigation/AppNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  useEffect(() => {
    loadRecentSearches();
    loadPopularMovies();
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
      // Calculate date 6 months ago
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Fetch multiple pages from TMDB to ensure we have enough movies
      let allMovies: Movie[] = [];
      const pagesToFetch = 3; // Fetch 3 pages to ensure we get at least 2 movies from last 6 months

      for (let page = 1; page <= pagesToFetch; page++) {
        try {
          const popular = await movieSearchService.getTollywood({
            page,
            language: "en", // Use English to get English titles
          });
          if (popular.movies && popular.movies.length > 0) {
            allMovies = [...allMovies, ...popular.movies];
          }
        } catch (pageError) {
          console.error(`Error loading page ${page}:`, pageError);
        }
      }

      // Filter movies from last 6 months and sort by release date (newest first)
      const filtered = allMovies
        .filter((movie: Movie) => {
          if (!movie.releaseDate) return false;
          const releaseDate = new Date(movie.releaseDate);
          return releaseDate >= sixMonthsAgo;
        })
        .sort((a: Movie, b: Movie) => {
          const dateA = new Date(a.releaseDate || 0).getTime();
          const dateB = new Date(b.releaseDate || 0).getTime();
          return dateB - dateA; // Descending order (newest first)
        });

      // Ensure at least 2 movies are displayed, or show all if less than 2
      if (filtered.length >= 2) {
        setPopularMovies(filtered);
      } else if (filtered.length > 0) {
        // If we have 1 movie, show it
        setPopularMovies(filtered);
      } else {
        // If no movies from last 6 months, get the 2 most recent from all movies
        const sortedAll = allMovies
          .filter((movie: Movie) => movie.releaseDate)
          .sort((a: Movie, b: Movie) => {
            const dateA = new Date(a.releaseDate || 0).getTime();
            const dateB = new Date(b.releaseDate || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 2);
        setPopularMovies(sortedAll);
      }
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
      </View>
    </TouchableOpacity>
  );

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
              placeholder="Search movies..."
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
        </View>

        {renderGenreFilter()}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : showSearchResults ? (
          movies.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {selectedGenre
                  ? `No ${selectedGenre} movies found`
                  : "No movies found"}
              </Text>
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

            {showPopularMovies && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Movies</Text>
                {loadingPopular ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                ) : (
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
    backgroundColor: "#1a1a1a",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
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
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  recentSearchText: {
    color: "#fff",
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
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
    padding: 8,
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
  genreFilterContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  genreFilterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  genreScrollContent: {
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    color: "#ccc",
    fontWeight: "500",
  },
  genreChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default SearchScreen;
