import Notification from '../models/Notification';
import UserSettings from '../models/UserSettings';

interface CreateNotificationParams {
  userId: string;
  type: 'review_comment' | 'review_like' | 'new_follower' | 'new_movie' | 'watchlist_update' | 'weekly_digest';
  title: string;
  message: string;
  data?: any;
}

/**
 * Create a notification for a user
 * Checks user preferences before creating notification
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const { userId, type, title, message, data } = params;

    // Get user settings to check notification preferences
    const settings = await UserSettings.findOne({ userId }).lean();
    
    // Check if user has this notification type enabled
    let shouldNotify = true;
    if (settings) {
      switch (type) {
        case 'review_comment':
          shouldNotify = settings.reviewNotifications ?? true;
          break;
        case 'review_like':
          shouldNotify = settings.reviewNotifications ?? true;
          break;
        case 'new_follower':
          shouldNotify = true; // Always notify for followers
          break;
        case 'new_movie':
          shouldNotify = settings.newMovieNotifications ?? true;
          break;
        case 'watchlist_update':
          shouldNotify = settings.watchlistNotifications ?? false;
          break;
        case 'weekly_digest':
          shouldNotify = settings.weeklyDigest ?? true;
          break;
      }
    }

    if (!shouldNotify) {
      return; // User has disabled this notification type
    }

    // Create notification
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
    });

    await notification.save();

    // TODO: Send push notification if user has device tokens registered
    // This will be implemented when push notification service is set up
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Create notification when someone comments on a review
 */
export async function notifyReviewComment(
  reviewOwnerId: string,
  commenterUsername: string,
  reviewId: string,
  commentId: string,
  movieTitle?: string
): Promise<void> {
  await createNotification({
    userId: reviewOwnerId,
    type: 'review_comment',
    title: 'New Comment',
    message: `${commenterUsername} commented on your review${movieTitle ? ` of "${movieTitle}"` : ''}`,
    data: {
      reviewId,
      commentId,
      movieTitle,
    },
  });
}

/**
 * Create notification when someone likes a review
 */
export async function notifyReviewLike(
  reviewOwnerId: string,
  likerUsername: string,
  reviewId: string,
  movieTitle?: string
): Promise<void> {
  await createNotification({
    userId: reviewOwnerId,
    type: 'review_like',
    title: 'Review Liked',
    message: `${likerUsername} liked your review${movieTitle ? ` of "${movieTitle}"` : ''}`,
    data: {
      reviewId,
      movieTitle,
    },
  });
}

/**
 * Create notification when someone follows a user
 */
export async function notifyNewFollower(
  userId: string,
  followerUsername: string,
  followerId: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'new_follower',
    title: 'New Follower',
    message: `${followerUsername} started following you`,
    data: {
      followerId,
    },
  });
}
