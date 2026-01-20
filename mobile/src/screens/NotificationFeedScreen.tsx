import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { AppText } from '../components/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notificationsService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AccountStackParamList } from '../navigation/AppNavigator';

type NotificationFeedScreenProps = NativeStackScreenProps<AccountStackParamList, 'NotificationFeed'>;

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

const NotificationFeedScreen: React.FC<NotificationFeedScreenProps> = ({ navigation }) => {
  const { isAuthenticated, isGuest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = useCallback(async (pageNum: number = 1, showRefresh: boolean = false) => {
    if (!isAuthenticated || isGuest) {
      setLoading(false);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await notificationsService.getAll({
        page: pageNum,
        limit: 20,
      });

      if (pageNum === 1) {
        setNotifications(response.notifications || []);
      } else {
        setNotifications((prev) => [...prev, ...(response.notifications || [])]);
      }

      setUnreadCount(response.unreadCount || 0);
      setHasMore(response.pagination.page < response.pagination.pages);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isGuest]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications(1);
    }, [loadNotifications])
  );

  const handleRefresh = () => {
    setPage(1);
    loadNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotifications(nextPage);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationsService.delete(notificationId);
              setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
              // Update unread count if it was unread
              const notification = notifications.find((n) => n._id === notificationId);
              if (notification && !notification.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_comment':
        return 'chatbubble-outline';
      case 'review_like':
        return 'heart-outline';
      case 'new_follower':
        return 'person-add-outline';
      case 'new_movie':
        return 'film-outline';
      case 'watchlist_update':
        return 'bookmark-outline';
      case 'weekly_digest':
        return 'mail-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'review_comment':
        return '#007AFF';
      case 'review_like':
        return '#FF3B30';
      case 'new_follower':
        return '#4CAF50';
      case 'new_movie':
        return '#FF9500';
      case 'watchlist_update':
        return '#9C27B0';
      case 'weekly_digest':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated || isGuest) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Ionicons name="notifications-outline" size={64} color="#666" />
        <AppText style={styles.emptyTitle}>Login Required</AppText>
        <AppText style={styles.emptyText}>
          Please login to view your notifications
        </AppText>
      </View>
    );
  }

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      {notifications.length > 0 && unreadCount > 0 && (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#007AFF" />
            <AppText style={styles.markAllText}>Mark all as read</AppText>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#007AFF" />
        }
        onScrollEndDrag={handleLoadMore}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#666" />
            <AppText style={styles.emptyTitle}>No Notifications</AppText>
            <AppText style={styles.emptyText}>
              You're all caught up! New notifications will appear here.
            </AppText>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification._id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard,
              ]}
              onPress={() => handleMarkAsRead(notification._id)}
              activeOpacity={0.7}
            >
              <View style={styles.notificationContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${getNotificationColor(notification.type)}15` },
                  ]}
                >
                  <Ionicons
                    name={getNotificationIcon(notification.type) as any}
                    size={20}
                    color={getNotificationColor(notification.type)}
                  />
                </View>
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <AppText style={styles.notificationTitle} numberOfLines={1}>
                      {notification.title}
                    </AppText>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <AppText style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </AppText>
                  <AppText style={styles.notificationTime}>
                    {formatTime(notification.createdAt)}
                  </AppText>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(notification._id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#999" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {loading && notifications.length > 0 && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loadingMore} />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  headerActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
  },
  markAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  unreadCard: {
    borderColor: '#007AFF',
    borderWidth: 1.5,
    backgroundColor: '#2a2a2a',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 4,
    flexShrink: 0,
  },
  loadingMore: {
    marginVertical: 16,
  },
});

export default NotificationFeedScreen;
