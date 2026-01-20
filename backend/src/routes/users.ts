import express, { Router, Request, Response } from 'express';
import User from '../models/User';
import Follow from '../models/Follow';
import UserSettings from '../models/UserSettings';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';
import { notifyNewFollower } from '../services/notificationService';

const router: Router = express.Router();

// Get user profile by ID
router.get('/:id', async (req: Request<{ id: string }, {}, {}, { userId?: string }>, res: Response) => {
  try {
    const { userId } = req.query; // Current user ID (if authenticated)
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId)
      .select('-password -__v')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get follower and following counts
    const followerCount = await Follow.countDocuments({ followingId: targetUserId });
    const followingCount = await Follow.countDocuments({ followerId: targetUserId });

    // Check if current user is following this user
    let isFollowing = false;
    if (userId && userId !== targetUserId) {
      const follow = await Follow.findOne({
        followerId: userId,
        followingId: targetUserId,
      });
      isFollowing = !!follow;
    }

    res.json({
      ...user,
      followerCount,
      followingCount,
      isFollowing,
      isOwnProfile: userId === targetUserId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's followers
router.get('/:id/followers', async (req: Request<{ id: string }, {}, {}, { page?: string; limit?: string }>, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.params.id;

    const follows = await Follow.find({ followingId: userId })
      .populate('followerId', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    const total = await Follow.countDocuments({ followingId: userId });

    res.json({
      followers: follows.map((follow: any) => ({
        user: follow.followerId,
        followedAt: follow.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get users that a user is following
router.get('/:id/following', async (req: Request<{ id: string }, {}, {}, { page?: string; limit?: string }>, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.params.id;

    const follows = await Follow.find({ followerId: userId })
      .populate('followingId', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    const total = await Follow.countDocuments({ followerId: userId });

    res.json({
      following: follows.map((follow: any) => ({
        user: follow.followingId,
        followedAt: follow.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check if current user is following a user
router.get('/:id/follow-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const targetUserId = req.params.id;

    if (userId === targetUserId) {
      return res.json({ isFollowing: false, isOwnProfile: true });
    }

    const follow = await Follow.findOne({
      followerId: userId,
      followingId: targetUserId,
    });

    res.json({
      isFollowing: !!follow,
      isOwnProfile: false,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Follow a user
router.post('/:id/follow', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const targetUserId = req.params.id;

    // Prevent self-following
    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      followerId: userId,
      followingId: targetUserId,
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    const follow = new Follow({
      followerId: userId,
      followingId: targetUserId,
    });
    await follow.save();

    // Get updated counts
    const followerCount = await Follow.countDocuments({ followingId: targetUserId });
    const followingCount = await Follow.countDocuments({ followerId: userId });

    // Send notification to user being followed
    const follower = await User.findById(userId).select('username').lean();
    if (follower) {
      notifyNewFollower(
        targetUserId,
        follower.username || 'Someone',
        userId
      ).catch((err) => console.error('Error sending follow notification:', err));
    }

    res.json({
      message: 'Successfully followed user',
      isFollowing: true,
      followerCount,
      followingCount,
    });
  } catch (error: any) {
    if (error.message === 'Cannot follow yourself') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Unfollow a user
router.delete('/:id/follow', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const targetUserId = req.params.id;

    // Remove follow relationship
    const deletedFollow = await Follow.findOneAndDelete({
      followerId: userId,
      followingId: targetUserId,
    });

    if (!deletedFollow) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    // Get updated counts
    const followerCount = await Follow.countDocuments({ followingId: targetUserId });
    const followingCount = await Follow.countDocuments({ followerId: userId });

    res.json({
      message: 'Successfully unfollowed user',
      isFollowing: false,
      followerCount,
      followingCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user settings
router.get('/:id/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const targetUserId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Users can only access their own settings
    if (userId !== targetUserId) {
      return res.status(403).json({ error: 'You can only access your own settings' });
    }

    // Find or create default settings
    let settings = await UserSettings.findOne({ userId }).lean();
    if (!settings) {
      // Create default settings
      const defaultSettings = new UserSettings({ userId });
      await defaultSettings.save();
      settings = defaultSettings.toObject() as any;
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
router.put('/:id/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const targetUserId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Users can only update their own settings
    if (userId !== targetUserId) {
      return res.status(403).json({ error: 'You can only update your own settings' });
    }

    const {
      darkMode,
      autoPlayTrailers,
      reviewNotifications,
      newMovieNotifications,
      watchlistNotifications,
      weeklyDigest,
      profilePublic,
      watchlistPublic,
      showEmail,
    } = req.body;

    // Find or create settings
    let settings = await UserSettings.findOne({ userId });
    if (!settings) {
      settings = new UserSettings({ userId });
    }

    // Update fields if provided
    if (typeof darkMode === 'boolean') settings.darkMode = darkMode;
    if (typeof autoPlayTrailers === 'boolean') settings.autoPlayTrailers = autoPlayTrailers;
    if (typeof reviewNotifications === 'boolean') settings.reviewNotifications = reviewNotifications;
    if (typeof newMovieNotifications === 'boolean') settings.newMovieNotifications = newMovieNotifications;
    if (typeof watchlistNotifications === 'boolean') settings.watchlistNotifications = watchlistNotifications;
    if (typeof weeklyDigest === 'boolean') settings.weeklyDigest = weeklyDigest;
    if (typeof profilePublic === 'boolean') settings.profilePublic = profilePublic;
    if (typeof watchlistPublic === 'boolean') settings.watchlistPublic = watchlistPublic;
    if (typeof showEmail === 'boolean') settings.showEmail = showEmail;

    await settings.save();

    res.json({
      message: 'Settings updated successfully',
      settings: settings.toObject(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
