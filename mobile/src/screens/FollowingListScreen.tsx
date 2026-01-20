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

type FollowingListScreenProps = NativeStackScreenProps<HomeStackParamList, 'FollowingList'>;

interface FollowingItem {
  user: {
    _id: string;
    id?: string;
    username: string;
    name?: string;
    avatar?: string;
  };
  followedAt: string;
}

const FollowingListScreen: React.FC<FollowingListScreenProps> = ({ navigation, route }) => {
  const { userId } = route.params;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [following, setFollowing] = useState<FollowingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followLoading, setFollowLoading] = useState<{ [key: string]: boolean }>({});

  const loadFollowing = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setLoading(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const response = await usersService.getFollowing(userId, { page: pageNum, limit: 20 });
      const newFollowing = response.following || [];

      if (refresh) {
        setFollowing(newFollowing);
      } else {
        setFollowing((prev) => [...prev, ...newFollowing]);
      }

      setHasMore(pageNum < response.pagination.pages);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading following:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load following');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFollowing(1, true);
    }, [userId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFollowing(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadFollowing(page + 1);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setFollowLoading((prev) => ({ ...prev, [targetUserId]: true }));
      await usersService.unfollow(targetUserId);
      
      // Remove from following list
      setFollowing((prev) =>
        prev.filter(
          (item) => item.user._id !== targetUserId && item.user.id !== targetUserId
        )
      );
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to unfollow user');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const renderFollowing = ({ item }: { item: FollowingItem }) => {
    const followingUser = item.user;
    const followingId = followingUser._id || followingUser.id;
    const currentUserId = currentUser?._id || currentUser?.id;
    const isOwnProfile = followingId === currentUserId;
    const isCurrentUser = userId === currentUserId;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => {
          if (!isOwnProfile) {
            navigation.navigate('UserProfile', { userId: followingId });
          }
        }}
        activeOpacity={0.7}
        disabled={isOwnProfile}
      >
        <View style={styles.userInfo}>
          {followingUser.avatar ? (
            <Image source={{ uri: followingUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AppText style={styles.avatarText}>
                {followingUser.username?.charAt(0).toUpperCase() || 'U'}
              </AppText>
            </View>
          )}
          <View style={styles.userDetails}>
            <AppText style={styles.username}>{followingUser.username || 'User'}</AppText>
            {followingUser.name && <AppText style={styles.name}>{followingUser.name}</AppText>}
            <AppText style={styles.followedDate}>
              Following since {new Date(item.followedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </AppText>
          </View>
        </View>
        {!isOwnProfile && isCurrentUser && isAuthenticated && (
          <TouchableOpacity
            style={styles.unfollowButton}
            onPress={() => handleUnfollow(followingId)}
            disabled={followLoading[followingId]}
            activeOpacity={0.7}
          >
            {followLoading[followingId] ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <>
                <Ionicons name="person-remove" size={16} color="#FF3B30" />
                <AppText style={styles.unfollowButtonText}>Unfollow</AppText>
              </>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && following.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={following}
        renderItem={renderFollowing}
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
              <Ionicons name="person-add-outline" size={64} color="#666" />
              <AppText style={styles.emptyStateText}>Not following anyone yet</AppText>
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
  unfollowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    backgroundColor: 'transparent',
    gap: 6,
  },
  unfollowButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
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

export default FollowingListScreen;
