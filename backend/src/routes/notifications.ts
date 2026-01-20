import express, { Router, Response } from 'express';
import Notification from '../models/Notification';
import UserSettings from '../models/UserSettings';
import DeviceToken from '../models/DeviceToken';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

// Get user's notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const isUnreadOnly = unreadOnly === 'true';

    const query: any = { userId };
    if (isUnreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .select('-__v')
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
      unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification preferences
router.get('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get preferences from UserSettings
    const settings = await UserSettings.findOne({ userId }).lean();
    if (!settings) {
      // Return defaults
      return res.json({
        reviewNotifications: true,
        newMovieNotifications: true,
        watchlistNotifications: false,
        weeklyDigest: true,
      });
    }

    res.json({
      reviewNotifications: settings.reviewNotifications,
      newMovieNotifications: settings.newMovieNotifications,
      watchlistNotifications: settings.watchlistNotifications,
      weeklyDigest: settings.weeklyDigest,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.post('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      reviewNotifications,
      newMovieNotifications,
      watchlistNotifications,
      weeklyDigest,
    } = req.body;

    // Find or create settings
    let settings = await UserSettings.findOne({ userId });
    if (!settings) {
      settings = new UserSettings({ userId });
    }

    // Update notification preferences
    if (typeof reviewNotifications === 'boolean') {
      settings.reviewNotifications = reviewNotifications;
    }
    if (typeof newMovieNotifications === 'boolean') {
      settings.newMovieNotifications = newMovieNotifications;
    }
    if (typeof watchlistNotifications === 'boolean') {
      settings.watchlistNotifications = watchlistNotifications;
    }
    if (typeof weeklyDigest === 'boolean') {
      settings.weeklyDigest = weeklyDigest;
    }

    await settings.save();

    res.json({
      message: 'Notification preferences updated successfully',
      preferences: {
        reviewNotifications: settings.reviewNotifications,
        newMovieNotifications: settings.newMovieNotifications,
        watchlistNotifications: settings.watchlistNotifications,
        weeklyDigest: settings.weeklyDigest,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const notificationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await Notification.updateMany({ userId, read: false }, { read: true });

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const notificationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register device token for push notifications
router.post('/register-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { token, platform, deviceId, appVersion } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!token || !platform) {
      return res.status(400).json({ error: 'Token and platform are required' });
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return res.status(400).json({ error: 'Platform must be ios, android, or web' });
    }

    // Deactivate old tokens for this device (if deviceId provided)
    if (deviceId) {
      await DeviceToken.updateMany(
        { userId, deviceId, isActive: true },
        { isActive: false }
      );
    }

    // Check if token already exists
    let deviceToken = await DeviceToken.findOne({ token });
    if (deviceToken) {
      // Update existing token
      deviceToken.userId = userId as any;
      deviceToken.platform = platform;
      deviceToken.deviceId = deviceId;
      deviceToken.appVersion = appVersion;
      deviceToken.isActive = true;
      await deviceToken.save();
    } else {
      // Create new token
      deviceToken = new DeviceToken({
        userId,
        token,
        platform,
        deviceId,
        appVersion,
        isActive: true,
      });
      await deviceToken.save();
    }

    res.json({
      message: 'Device token registered successfully',
      deviceToken: {
        id: deviceToken._id,
        platform: deviceToken.platform,
        isActive: deviceToken.isActive,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // Token already exists, update it
      try {
        const tokenFromBody = req.body?.token;
        if (tokenFromBody) {
          const existingToken = await DeviceToken.findOne({ token: tokenFromBody });
          if (existingToken) {
            existingToken.userId = req.userId as any;
            existingToken.isActive = true;
            await existingToken.save();
            return res.json({
              message: 'Device token updated successfully',
              deviceToken: {
                id: existingToken._id,
                platform: existingToken.platform,
                isActive: existingToken.isActive,
              },
            });
          }
        }
      } catch (updateError) {
        // Fall through to error response
      }
    }
    res.status(500).json({ error: error.message });
  }
});

// Unregister device token
router.delete('/register-token/:token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { token } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const deviceToken = await DeviceToken.findOneAndUpdate(
      { token, userId },
      { isActive: false },
      { new: true }
    );

    if (!deviceToken) {
      return res.status(404).json({ error: 'Device token not found' });
    }

    res.json({ message: 'Device token unregistered successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
