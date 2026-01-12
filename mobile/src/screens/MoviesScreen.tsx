import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/Typography";
import OptimizedImage from "../components/OptimizedImage";
import { MovieCardSkeleton } from "../components/SkeletonLoader";
import ErrorView from "../components/ErrorView";
import OfflineBanner from "../components/OfflineBanner";
import { useFocusEffect } from "@react-navigation/native";
import {
  moviesService,
  movieSearchService,
  reviewsService,
  authService,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import TrendingTab from "./TrendingTab";
import { typography } from "../constants/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const CARD_MARGIN = 2;
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
  updatedAt?: string;
  genre?: string[];
  totalReviews?: number;
  popularity?: number;
  userRating?: number; // User's own rating for this movie
  reviewDate?: string; // When user reviewed it
}

interface MoviesScreenProps {
  navigation: any;
}

type SortOption = "recent" | "best" | "worst" | "newest" | "alphabetical";
type TabType = "foryou" | "trending" | "myreviews";

const MoviesScreen: React.FC<MoviesScreenProps> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("foryou");

  // For You tab - personalized content
  const [recentlyReviewed, setRecentlyReviewed] = useState<Movie[]>([]);
  const [tasteSnapshot, setTasteSnapshot] = useState<{
    avgRating: number;
    topGenre: string;
    hiddenGemsCount: number;
    totalReviews: number;
  } | null>(null);
  const [becauseYouLoved, setBecauseYouLoved] = useState<{
    sourceMovie: Movie;
    recommendations: Movie[];
  } | null>(null);
  const [hiddenGems, setHiddenGems] = useState<Movie[]>([]);
  const [rewatchWorthy, setRewatchWorthy] = useState<Movie[]>([]);
  const [loadingForYou, setLoadingForYou] = useState(true);
  const [refreshingForYou, setRefreshingForYou] = useState(false);
  // My Reviews tab - user's personalized movies
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [showSortModal, setShowSortModal] = useState(false);

  const loadForYouContent = useCallback(async () => {
    if (!isAuthenticated) {
      setLoadingForYou(false);
      return;
    }

    try {
      setLoadingForYou(true);

      // 1. Get user's recent reviews
      const myReviewsData = await authService.getMyReviews(10);
      const myReviews = myReviewsData.reviews || [];
      const recentMovies: Movie[] = myReviews.map((review: any) => ({
        ...review.movieId,
        userRating: review.rating,
        reviewDate: review.createdAt,
      }));
      setRecentlyReviewed(recentMovies);

      // 2. Get user stats for taste snapshot
      const stats = await authService.getStats();

      // Calculate top genre from user's reviews
      const allUserReviews = await authService.getMyReviews(100);
      const genreCounts: { [key: string]: number } = {};
      allUserReviews.reviews?.forEach((review: any) => {
        if (review.movieId?.genre) {
          review.movieId.genre.forEach((g: string) => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
          });
        }
      });
      const topGenre =
        Object.keys(genreCounts).length > 0
          ? Object.keys(genreCounts).reduce((a: string, b: string) =>
              genreCounts[a] > genreCounts[b] ? a : b
            )
          : "Action";

      // Count hidden gems (high-rated movies with low popularity)
      const highRatedMovies =
        allUserReviews.reviews
          ?.filter((r: any) => r.rating >= 8)
          .map((r: any) => r.movieId) || [];
      const hiddenGemsCount = highRatedMovies.filter(
        (m: any) => (m.totalReviews || 0) < 10 || (m.rating || 0) >= 8
      ).length;

      setTasteSnapshot({
        avgRating: stats.avgRating || 0,
        topGenre,
        hiddenGemsCount,
        totalReviews: stats.totalReviews || 0,
      });

      // 3. "Because You Loved..." - Find user's highest rated movie and recommend similar
      const sortedByRating = [...(allUserReviews.reviews || [])].sort(
        (a: any, b: any) => b.rating - a.rating
      );

      if (sortedByRating.length > 0) {
        const lovedMovie = sortedByRating[0].movieId;
        const lovedGenres = lovedMovie.genre || [];
        const lovedRating = sortedByRating[0].rating;

        // Get all movies to find similar ones
        const allMoviesData = await moviesService.getAll({ limit: 200 });
        const allMovies = allMoviesData.movies || [];

        // Find movies with similar genres and rating range
        const recommendations = allMovies
          .filter((m: Movie) => {
            if (m._id === lovedMovie._id) return false; // Exclude the source movie
            if (!m.genre || m.genre.length === 0) return false;

            // Check genre overlap
            const genreOverlap = m.genre.some((g) => lovedGenres.includes(g));
            if (!genreOverlap) return false;

            // Check rating range (within 1.5 points)
            const ratingDiff = Math.abs((m.rating || 0) - lovedRating);
            return ratingDiff <= 1.5;
          })
          .slice(0, 10);

        if (recommendations.length > 0) {
          setBecauseYouLoved({
            sourceMovie: lovedMovie,
            recommendations,
          });
        }
      }

      // 4. Hidden Gems - High rating (≥8) but low popularity (<20 reviews)
      const allMoviesData = await moviesService.getAll({ limit: 200 });
      const allMovies = allMoviesData.movies || [];
      const gems = allMovies
        .filter((m: Movie) => {
          const rating = m.rating || 0;
          const reviews = m.totalReviews || 0;
          return rating >= 8 && reviews < 20;
        })
        .sort((a: Movie, b: Movie) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);
      setHiddenGems(gems);

      // 5. Rewatch Worthy - User's high-rated movies (≥8)
      const rewatch =
        allUserReviews.reviews
          ?.filter((r: any) => r.rating >= 8)
          .map((r: any) => ({
            ...r.movieId,
            userRating: r.rating,
          }))
          .slice(0, 10) || [];
      setRewatchWorthy(rewatch);
    } catch (error) {
      console.error("Error loading For You content:", error);
    } finally {
      setLoadingForYou(false);
    }
  }, [isAuthenticated]);

  const loadMovies = useCallback(async (page = 1, append = false) => {
    try {
      setError(null);
      if (!append) {
        setLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      const dbMovies = await moviesService.getAll({
        limit: 20,
        page,
        sortBy: "updatedAt",
      });
      if (dbMovies.movies && dbMovies.movies.length > 0) {
        if (append) {
          setAllMovies(prev => [...prev, ...dbMovies.movies]);
          setMovies(prev => [...prev, ...dbMovies.movies]);
        } else {
          setAllMovies(dbMovies.movies);
          setMovies(dbMovies.movies);
        }
        setHasMore(dbMovies.movies.length === 20);
        setCurrentPage(page);
      } else if (!append) {
        const popular = await movieSearchService.getTollywood({ page: 1 });
        const moviesList = popular.movies || [];
        setAllMovies(moviesList);
        setMovies(moviesList);
        setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      console.error("Error loading movies:", error);
      setError(error.response?.data?.error || "Failed to load movies");
      if (!append) {
        try {
          const popular = await movieSearchService.getTollywood({ page: 1 });
          const moviesList = popular.movies || [];
          setAllMovies(moviesList);
          setMovies(moviesList);
          setHasMore(false);
        } catch (err) {
          console.error("Error loading popular movies:", err);
        }
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMoreMovies = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadMovies(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, loading, currentPage, loadMovies]);

  useEffect(() => {
    if (activeTab === "foryou") {
      loadForYouContent();
    } else if (activeTab === "myreviews") {
      loadMovies(1, false);
    }
  }, [activeTab, loadForYouContent, loadMovies]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "foryou") {
        loadForYouContent();
      } else if (activeTab === "myreviews") {
        loadMovies(1, false);
      }
    }, [activeTab, loadForYouContent, loadMovies])
  );

  // Filter and sort movies
  const filteredAndSortedMovies = useMemo(() => {
    let filtered = [...allMovies];

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
  }, [allMovies, sortOption]);

  useEffect(() => {
    setMovies(filteredAndSortedMovies);
  }, [filteredAndSortedMovies]);

  const onRefresh = useCallback(async () => {
    if (activeTab === "foryou") {
      setRefreshingForYou(true);
      await loadForYouContent();
      setRefreshingForYou(false);
    } else if (activeTab === "myreviews") {
      setRefreshing(true);
      await loadMovies(1, false);
      setRefreshing(false);
    }
  }, [activeTab, loadForYouContent, loadMovies]);

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
    return renderMovieCard(item);
  };

  const renderMovieCard = React.useCallback((item: Movie, showUserRating = false) => {
    const rating =
      showUserRating && item.userRating ? item.userRating : item.rating || 0;
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
          <OptimizedImage
            uri={item.posterUrl}
            style={styles.poster}
            placeholderColor="#333"
          />
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
  }, [navigation]);

  const renderHorizontalSection = (
    title: string,
    movies: Movie[],
    emptyMessage: string,
    showUserRating = false,
    badge?: string
  ) => {
    if (movies.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>{title}</AppText>
          {badge && (
            <View style={styles.badgeContainer}>
              <AppText style={styles.badgeText}>{badge}</AppText>
            </View>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {movies.map((movie) => (
            <View key={movie._id || movie.tmdbId || Math.random()} style={{ marginRight: CARD_MARGIN }}>
              {renderMovieCard(movie, showUserRating)}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderForYouContent = () => {
    if (!isAuthenticated) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="person-outline" size={64} color="#666" />
          <AppText style={styles.emptyTitle}>Sign In to See Your Feed</AppText>
          <AppText style={styles.emptyText}>
            Create an account to get personalized movie recommendations tailored
            to your taste.
          </AppText>
        </View>
      );
    }

    if (loadingForYou && recentlyReviewed.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <AppText style={styles.loadingText}>
            Loading your personalized feed...
          </AppText>
        </View>
      );
    }

    // Check if user has any reviews
    const hasNoContent =
      recentlyReviewed.length === 0 &&
      !tasteSnapshot &&
      !becauseYouLoved &&
      hiddenGems.length === 0 &&
      rewatchWorthy.length === 0;

    if (hasNoContent) {
      return (
        <ScrollView
          contentContainerStyle={styles.forYouScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshingForYou}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              colors={["#007AFF"]}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={64} color="#666" />
            <AppText style={styles.emptyTitle}>
              Start Your Movie Journey
            </AppText>
            <AppText style={styles.emptyText}>
              Review your first movie to unlock personalized recommendations and
              discover films tailored to your taste.
            </AppText>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate("Search")}
              activeOpacity={0.7}
            >
              <AppText style={styles.browseButtonText}>Browse Movies</AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.forYouScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshingForYou}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
      >
        {/* 1. Recently Reviewed */}
        {recentlyReviewed.length > 0 && (
          <View style={styles.sectionContainer}>
            <AppText style={styles.sectionTitle}>Recently Reviewed</AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recentlyReviewed.map((movie) => (
                <View key={movie._id || movie.tmdbId || Math.random()} style={{ marginRight: CARD_MARGIN }}>
                  {renderMovieCard(movie, true)}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 2. Taste Snapshot */}
        {tasteSnapshot && (
          <View style={styles.tasteSnapshotCard}>
            <View style={styles.tasteSnapshotHeader}>
              <Ionicons name="film" size={24} color="#007AFF" />
              <AppText style={styles.tasteSnapshotTitle}>
                Your Taste This Month
              </AppText>
            </View>
            <View style={styles.tasteSnapshotContent}>
              <View style={styles.tasteSnapshotItem}>
                <Ionicons name="star" size={20} color="#FFA726" />
                <AppText style={styles.tasteSnapshotLabel}>Avg rating:</AppText>
                <AppText style={styles.tasteSnapshotValue}>
                  {tasteSnapshot.avgRating.toFixed(1)}
                </AppText>
              </View>
              <View style={styles.tasteSnapshotItem}>
                <Ionicons name="color-palette" size={20} color="#9C27B0" />
                <AppText style={styles.tasteSnapshotLabel}>Top genre:</AppText>
                <AppText style={styles.tasteSnapshotValue}>
                  {tasteSnapshot.topGenre}
                </AppText>
              </View>
              <View style={styles.tasteSnapshotItem}>
                <Ionicons name="diamond" size={20} color="#00BCD4" />
                <AppText style={styles.tasteSnapshotLabel}>
                  Hidden gems:
                </AppText>
                <AppText style={styles.tasteSnapshotValue}>
                  {tasteSnapshot.hiddenGemsCount}
                </AppText>
              </View>
            </View>
          </View>
        )}

        {/* 3. Because You Loved... */}
        {becauseYouLoved && becauseYouLoved.recommendations.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>
                Because You Loved {becauseYouLoved.sourceMovie.title}
              </AppText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {becauseYouLoved.recommendations.map((movie) => (
                <View key={movie._id || movie.tmdbId || Math.random()} style={{ marginRight: CARD_MARGIN }}>
                  {renderMovieCard(movie)}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. Hidden Gems */}
        {renderHorizontalSection(
          "Hidden Gems for You",
          hiddenGems,
          "",
          false
        )}

        {/* 5. Rewatch Worthy */}
        {renderHorizontalSection(
          "Rewatch Worthy",
          rewatchWorthy,
          "",
          true
        )}
      </ScrollView>
    );
  };

  const renderMyReviewsContent = () => {
    if (loading && movies.length === 0) {
      return (
        <View style={styles.list}>
          {Array.from({ length: 9 }).map((_, index) => (
            <MovieCardSkeleton key={index} width={CARD_WIDTH} />
          ))}
        </View>
      );
    }

    if (error && movies.length === 0) {
      return (
        <ErrorView
          message={error}
          onRetry={() => loadMovies(1, false)}
        />
      );
    }

    return (
      <>
        {/* Sort Bar */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={18} color="#007AFF" />
            <AppText style={styles.sortButtonText}>
              {getSortLabel(sortOption)}
            </AppText>
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
          onEndReached={loadMoreMovies}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="film-outline" size={64} color="#666" />
              </View>
              <AppText style={styles.emptyTitle}>No Movies Found</AppText>
              <AppText style={styles.emptyText}>
                Try changing the sort option or start reviewing movies!
              </AppText>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => {
                  setSortOption("recent");
                }}
                activeOpacity={0.7}
              >
                <AppText style={styles.browseButtonText}>Reset Sort</AppText>
              </TouchableOpacity>
            </View>
          }
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "foryou" && styles.tabActive]}
          onPress={() => setActiveTab("foryou")}
          activeOpacity={0.7}
        >
          <AppText
            style={[
              styles.tabText,
              activeTab === "foryou" && styles.tabTextActive,
            ]}
          >
            For You
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "trending" && styles.tabActive]}
          onPress={() => setActiveTab("trending")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="flame"
            size={16}
            color={activeTab === "trending" ? "#007AFF" : "#999"}
          />
          <AppText
            style={[
              styles.tabText,
              activeTab === "trending" && styles.tabTextActive,
            ]}
          >
            Trending
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "myreviews" && styles.tabActive]}
          onPress={() => setActiveTab("myreviews")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="document-text"
            size={16}
            color={activeTab === "myreviews" ? "#007AFF" : "#999"}
          />
          <AppText
            style={[
              styles.tabText,
              activeTab === "myreviews" && styles.tabTextActive,
            ]}
          >
            My Reviews
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === "foryou" ? (
        renderForYouContent()
      ) : activeTab === "myreviews" ? (
        renderMyReviewsContent()
      ) : (
        <TrendingTab navigation={navigation} />
      )}

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
              <AppText style={styles.modalTitle}>Sort By</AppText>
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
                <AppText
                  style={[
                    styles.sortOptionText,
                    sortOption === option && styles.sortOptionTextActive,
                  ]}
                >
                  {getSortLabel(option)}
                </AppText>
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    ...typography.styles.buttonSmall,
    color: "#999",
  },
  tabTextActive: {
    color: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#999",
    ...typography.styles.bodySmall,
  },
  filtersContainer: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 4,
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
    alignSelf: "flex-start",
    gap: 6,
  },
  sortButtonText: {
    ...typography.styles.buttonSmall,
    color: "#007AFF",
  },
  list: {
    padding: LIST_PADDING,
    paddingBottom: 24,
    paddingTop: 4,
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
    aspectRatio: 0.65,
    backgroundColor: "#333",
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
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
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
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
    fontSize: typography.fontSize.xs - 1,
    fontFamily: typography.fontFamily.bold,
    color: "#fff",
  },
  ratingDenominator: {
    fontSize: typography.fontSize.xs - 3,
    fontFamily: typography.fontFamily.semiBold,
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
    ...typography.styles.h3,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    ...typography.styles.bodySmall,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  browseButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  browseButtonText: {
    ...typography.styles.buttonSmall,
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
    ...typography.styles.h3,
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
    ...typography.styles.body,
    fontFamily: typography.fontFamily.medium,
    color: "#fff",
  },
  sortOptionTextActive: {
    ...typography.styles.button,
    color: "#007AFF",
  },
  // For You tab styles
  forYouScrollContent: {
    paddingBottom: 24,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: LIST_PADDING,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.styles.h4,
    color: "#fff",
  },
  badgeContainer: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...typography.styles.caption,
    fontFamily: typography.fontFamily.semiBold,
    color: "#fff",
  },
  horizontalScroll: {
    paddingRight: LIST_PADDING,
    paddingVertical: 4,
  },
  tasteSnapshotCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: LIST_PADDING,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  tasteSnapshotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  tasteSnapshotTitle: {
    ...typography.styles.h4,
    color: "#fff",
  },
  tasteSnapshotContent: {
    gap: 16,
  },
  tasteSnapshotItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tasteSnapshotLabel: {
    ...typography.styles.bodySmall,
    color: "#999",
    flex: 1,
  },
  tasteSnapshotValue: {
    ...typography.styles.body,
    fontFamily: typography.fontFamily.bold,
    color: "#fff",
  },
});

export default MoviesScreen;
