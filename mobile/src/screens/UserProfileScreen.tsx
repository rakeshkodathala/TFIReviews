import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { AppText } from '../components/Typography';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usersService, reviewsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HomeStackParamList } from '../navigation/AppNavigator';

type UserProfileScreenProps = NativeStackScreenProps<HomeStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ navigation, route }) => {
  const { userId } = route.params;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const currentUserId = currentUser?._id || currentUser?.id;
      const userData = await usersService.getById(userId, currentUserId);
      setProfileUser(userData);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserReviews = async () => {
    try {
      setReviewsLoading(true);
      // Get reviews by user ID (we'll need to add this endpoint or filter client-side)
      const allReviews = await reviewsService.getAll({ limit: 20 });
      const userReviews = (allReviews.reviews || []).filter(
        (review: any) => (review.userId?._id || review.userId?.id) === userId
      );
      setReviews(userReviews);
    } catch (error) {
      console.error('Error loading user reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      loadUserReviews();
    }, [userId])
  );

  const handleFollow = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to follow users');
      return;
    }

    try {
      setFollowLoading(true);
      const response = await usersService.follow(userId);
      setProfileUser((prev: any) => ({
        ...prev,
        isFollowing: true,
        followerCount: response.followerCount,
      }));
    } catch (error: any) {
      console.error('Error following user:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setFollowLoading(true);
      const response = await usersService.unfollow(userId);
      setProfileUser((prev: any) => ({
        ...prev,
        isFollowing: false,
        followerCount: response.followerCount,
      }));
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserProfile(), loadUserReviews()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.centerContainer}>
        <AppText style={styles.errorText}>User not found</AppText>
      </View>
    );
  }

  const isOwnProfile = profileUser.isOwnProfile || false;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
      }
    >
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profileUser.avatar ? (
              <Image source={{ uri: profileUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <AppText style={styles.avatarText}>
                  {profileUser.username?.charAt(0).toUpperCase() || 'U'}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.userInfoContainer}>
            <AppText style={styles.username}>{profileUser.username || 'User'}</AppText>
            {profileUser.name && <AppText style={styles.name}>{profileUser.name}</AppText>}
            {profileUser.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#999" />
                <AppText style={styles.location}>{profileUser.location}</AppText>
              </View>
            )}

            {/* Follower/Following Counts */}
            <View style={styles.followStats}>
              <TouchableOpacity
                style={styles.followStatItem}
                onPress={() => {
                  navigation.navigate('FollowersList', { userId });
                }}
                activeOpacity={0.7}
              >
                <AppText style={styles.followStatNumber}>
                  {profileUser.followerCount || 0}
                </AppText>
                <AppText style={styles.followStatLabel}>Followers</AppText>
              </TouchableOpacity>
              <View style={styles.followStatDivider} />
              <TouchableOpacity
                style={styles.followStatItem}
                onPress={() => {
                  navigation.navigate('FollowingList', { userId });
                }}
                activeOpacity={0.7}
              >
                <AppText style={styles.followStatNumber}>
                  {profileUser.followingCount || 0}
                </AppText>
                <AppText style={styles.followStatLabel}>Following</AppText>
              </TouchableOpacity>
            </View>

            {/* Follow/Unfollow Button */}
            {!isOwnProfile && isAuthenticated && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  profileUser.isFollowing && styles.followingButton,
                ]}
                onPress={profileUser.isFollowing ? handleUnfollow : handleFollow}
                disabled={followLoading}
                activeOpacity={0.7}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={profileUser.isFollowing ? '#fff' : '#007AFF'} />
                ) : (
                  <>
                    <Ionicons
                      name={profileUser.isFollowing ? 'checkmark' : 'add'}
                      size={18}
                      color={profileUser.isFollowing ? '#fff' : '#007AFF'}
                    />
                    <AppText
                      style={[
                        styles.followButtonText,
                        profileUser.isFollowing && styles.followingButtonText,
                      ]}
                    >
                      {profileUser.isFollowing ? 'Following' : 'Follow'}
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Reviews</AppText>
          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#666" />
              <AppText style={styles.emptyStateText}>No reviews yet</AppText>
            </View>
          ) : (
            reviews.map((review) => (
              <TouchableOpacity
                key={review._id}
                style={styles.reviewCard}
                onPress={() => {
                  const movie = review.movieId || {};
                  if (movie._id || movie.tmdbId) {
                    navigation.navigate('MovieDetails', { movie });
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewMovieInfo}>
                    {review.movieId?.posterUrl ? (
                      <Image
                        source={{ uri: review.movieId.posterUrl }}
                        style={styles.reviewPoster}
                      />
                    ) : (
                      <View style={styles.reviewPosterPlaceholder}>
                        <Ionicons name="film-outline" size={20} color="#999" />
                      </View>
                    )}
                    <View style={styles.reviewMovieDetails}>
                      <AppText style={styles.reviewMovieTitle} numberOfLines={1}>
                        {review.movieId?.title || 'Unknown Movie'}
                      </AppText>
                      {review.movieId?.releaseDate && (
                        <AppText style={styles.reviewMovieYear}>
                          {new Date(review.movieId.releaseDate).getFullYear()}
                        </AppText>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.reviewRatingBadge,
                      {
                        backgroundColor: `${
                          review.rating >= 8
                            ? '#4CAF50'
                            : review.rating >= 5
                            ? '#FFA726'
                            : '#EF5350'
                        }20`,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.reviewRatingText,
                        {
                          color:
                            review.rating >= 8
                              ? '#4CAF50'
                              : review.rating >= 5
                              ? '#FFA726'
                              : '#EF5350',
                        },
                      ]}
                    >
                      {review.rating}/10
                    </AppText>
                  </View>
                </View>
                {review.title && (
                  <AppText style={styles.reviewTitle}>{review.title}</AppText>
                )}
                <AppText style={styles.reviewText} numberOfLines={3}>
                  {review.review}
                </AppText>
                {review.createdAt && (
                  <AppText style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </AppText>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    borderWidth: 3,
    borderColor: '#2a2a2a',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2a2a2a',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: '#999',
  },
  followStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 24,
  },
  followStatItem: {
    alignItems: 'center',
  },
  followStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  followStatLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  followStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#333',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
    gap: 6,
  },
  followingButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  followButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
    marginTop: 12,
  },
  reviewCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewMovieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reviewPoster: {
    width: 50,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  reviewPosterPlaceholder: {
    width: 50,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewMovieDetails: {
    flex: 1,
  },
  reviewMovieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  reviewMovieYear: {
    fontSize: 13,
    color: '#999',
  },
  reviewRatingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default UserProfileScreen;
