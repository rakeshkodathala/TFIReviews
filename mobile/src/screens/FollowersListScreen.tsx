import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { AppText } from '../components/Typography';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usersService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HomeStackParamList } from '../navigation/AppNavigator';

type FollowersListScreenProps = NativeStackScreenProps<HomeStackParamList, 'FollowersList'>;

interface FollowerItem {
  user: {
    _id: string;
    id?: string;
    username: string;
    name?: string;
    avatar?: string;
  };
  followedAt: string;
}

const FollowersListScreen: React.FC<FollowersListScreenProps> = ({ navigation, route }) => {
  const { userId } = route.params;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followLoading, setFollowLoading] = useState<{ [key: string]: boolean }>({});

  const loadFollowers = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setLoading(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const response = await usersService.getFollowers(userId, { page: pageNum, limit: 20 });
      const newFollowers = response.followers || [];

      // Check follow status for each follower if current user is authenticated
      if (isAuthenticated && currentUser) {
        const currentUserId = currentUser._id || currentUser.id;
        const enrichedFollowers = await Promise.all(
          newFollowers.map(async (follower: FollowerItem) => {
            const followerId = follower.user._id || follower.user.id;
            if (followerId && followerId !== currentUserId) {
              try {
                const status = await usersService.getFollowStatus(followerId);
                return { ...follower, user: { ...follower.user, isFollowing: status.isFollowing } };
              } catch {
                return { ...follower, user: { ...follower.user, isFollowing: false } };
              }
            }
            return follower;
          })
        );

        if (refresh) {
          setFollowers(enrichedFollowers);
        } else {
          setFollowers((prev) => [...prev, ...enrichedFollowers]);
        }
      } else {
        if (refresh) {
          setFollowers(newFollowers);
        } else {
          setFollowers((prev) => [...prev, ...newFollowers]);
        }
      }

      setHasMore(pageNum < response.pagination.pages);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading followers:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load followers');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFollowers(1, true);
    }, [userId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFollowers(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadFollowers(page + 1);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to follow users');
      return;
    }

    try {
      setFollowLoading((prev) => ({ ...prev, [targetUserId]: true }));
      await usersService.follow(targetUserId);
      
      // Update the followers list to reflect the follow status
      setFollowers((prev) =>
        prev.map((item) =>
          item.user._id === targetUserId || item.user.id === targetUserId
            ? { ...item, user: { ...item.user, isFollowing: true } }
            : item
        )
      );
    } catch (error: any) {
      console.error('Error following user:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to follow user');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setFollowLoading((prev) => ({ ...prev, [targetUserId]: true }));
      await usersService.unfollow(targetUserId);
      
      // Update the followers list to reflect the unfollow status
      setFollowers((prev) =>
        prev.map((item) =>
          item.user._id === targetUserId || item.user.id === targetUserId
            ? { ...item, user: { ...item.user, isFollowing: false } }
            : item
        )
      );
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to unfollow user');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const renderFollower = ({ item }: { item: FollowerItem }) => {
    const followerUser = item.user;
    const followerId = followerUser._id || followerUser.id;
    const currentUserId = currentUser?._id || currentUser?.id;
    const isOwnProfile = followerId === currentUserId;
    const isFollowing = (followerUser as any).isFollowing || false;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => {
          if (!isOwnProfile) {
            navigation.navigate('UserProfile', { userId: followerId });
          }
        }}
        activeOpacity={0.7}
        disabled={isOwnProfile}
      >
        <View style={styles.userInfo}>
          {followerUser.avatar ? (
            <Image source={{ uri: followerUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AppText style={styles.avatarText}>
                {followerUser.username?.charAt(0).toUpperCase() || 'U'}
              </AppText>
            </View>
          )}
          <View style={styles.userDetails}>
            <AppText style={styles.username}>{followerUser.username || 'User'}</AppText>
            {followerUser.name && <AppText style={styles.name}>{followerUser.name}</AppText>}
            <AppText style={styles.followedDate}>
              Followed {new Date(item.followedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </AppText>
          </View>
        </View>
        {!isOwnProfile && isAuthenticated && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => {
              if (isFollowing) {
                handleUnfollow(followerId);
              } else {
                handleFollow(followerId);
              }
            }}
            disabled={followLoading[followerId]}
            activeOpacity={0.7}
          >
            {followLoading[followerId] ? (
              <ActivityIndicator size="small" color={isFollowing ? '#fff' : '#007AFF'} />
            ) : (
              <>
                <Ionicons
                  name={isFollowing ? 'checkmark' : 'add'}
                  size={16}
                  color={isFollowing ? '#fff' : '#007AFF'}
                />
                <AppText
                  style={[styles.followButtonText, isFollowing && styles.followingButtonText]}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </AppText>
              </>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && followers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={followers}
        renderItem={renderFollower}
        keyExtractor={(item) => item.user._id || item.user.id || Math.random().toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#666" />
              <AppText style={styles.emptyStateText}>No followers yet</AppText>
            </View>
          ) : null
        }
      />
    </View>
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
  list: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  followedDate: {
    fontSize: 12,
    color: '#666',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default FollowersListScreen;
