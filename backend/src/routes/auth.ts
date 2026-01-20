import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Review from '../models/Review';
import PasswordReset from '../models/PasswordReset';
import Follow from '../models/Follow';
import ReviewLike from '../models/ReviewLike';
import Watchlist from '../models/Watchlist';
import { IUser, AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';
import { sendOTPEmail } from '../services/emailService';

const router: Router = express.Router();

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    name?: string;
    avatar?: string;
    location?: string;
  };
}

// Register new user
router.post('/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const { username, email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user: IUser = new User({ username, email, password, name });
    await user.save();

    const token: string = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid: boolean = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token: string = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
      },
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token (for debugging)
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'No Authorization header found'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid authorization format',
        details: 'Authorization header must start with "Bearer "'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'No token found in Authorization header'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    return res.json({
      valid: true,
      userId: decoded.userId,
      message: 'Token is valid'
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        details: error.message
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        details: error.message,
        expiredAt: error.expiredAt
      });
    }
    return res.status(401).json({
      error: 'Token verification failed',
      details: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar, location, bio } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (bio !== undefined && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be less than 500 characters' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
        bio: (user as any).bio,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get user statistics
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get total reviews count
    const totalReviews = await Review.countDocuments({ userId });

    // Get average rating given by user
    const reviews = await Review.find({ userId }).select('rating').lean();
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Get reviews this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const reviewsThisMonth = await Review.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth },
    });

    // Get most common rating
    const ratingCounts: { [key: number]: number } = {};
    reviews.forEach((r) => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    });
    const mostCommonRating = Object.keys(ratingCounts).reduce((a, b) =>
      ratingCounts[parseInt(a)] > ratingCounts[parseInt(b)] ? a : b
      , '0');

    // Get user creation date
    const user = await User.findById(userId).select('createdAt').lean();
    const memberSince = user?.createdAt || new Date();

    res.json({
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewsThisMonth,
      mostCommonRating: parseInt(mostCommonRating),
      memberSince,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's recent reviews
router.get('/reviews', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = '3' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const reviews = await Review.find({ userId })
      .populate('movieId', 'title posterUrl tmdbId releaseDate')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .select('-__v')
      .lean();

    res.json({ reviews });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match' });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    // Prevent reusing the same password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password cannot be the same as the current password' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password - Send OTP
router.post('/forgot-password', async (req: Request<{}, {}, { email: string }>, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate any existing OTPs for this email
    await PasswordReset.updateMany(
      { email: email.toLowerCase(), used: false },
      { used: true }
    );

    // Create new password reset entry
    const passwordReset = new PasswordReset({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
    await passwordReset.save();

    // Send OTP email (will log to console in dev mode if SMTP not configured)
    try {
      await sendOTPEmail(email.toLowerCase(), otp);
    } catch (emailError: any) {
      // Only fail in production if email sending fails
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
      }
      // In development, OTP is already logged by sendOTPEmail
    }

    res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req: Request<{}, {}, { email: string; otp: string }>, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const passwordReset = await PasswordReset.findOne({
      email: email.toLowerCase(),
      otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!passwordReset) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req: Request<{}, {}, { email: string; otp: string; newPassword: string; confirmPassword: string }>, res: Response) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match' });
    }

    // Verify OTP
    const passwordReset = await PasswordReset.findOne({
      email: email.toLowerCase(),
      otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!passwordReset) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark OTP as used
    passwordReset.used = true;
    await passwordReset.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Soft delete user (30-day grace period)
    (user as any).isDeactivated = true;
    (user as any).deletedAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    await user.save();

    // Cascade delete related data
    // 1. Delete all reviews
    await Review.deleteMany({ userId });

    // 2. Delete watchlist items
    await Watchlist.deleteMany({ userId });

    // 3. Delete follow relationships (both as follower and following)
    await Follow.deleteMany({ followerId: userId });
    await Follow.deleteMany({ followingId: userId });

    // 4. Delete review likes
    await ReviewLike.deleteMany({ userId });

    // 5. Delete password reset entries
    await PasswordReset.deleteMany({ email: user.email });

    // Send confirmation email (optional, but good practice)
    try {
      // In production, send email confirmation
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send account deletion confirmation email
        console.log(`Account deletion requested for ${user.email}`);
      }
    } catch (emailError) {
      // Don't fail if email fails
      console.error('Error sending deletion email:', emailError);
    }

    res.json({
      message: 'Account deletion initiated. Your account will be permanently deleted in 30 days. You can contact support to cancel this action.',
      deletedAt: (user as any).deletedAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export user data (GDPR compliance)
router.get('/export', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user profile (excluding password)
    const user = await User.findById(userId)
      .select('-password -__v')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all reviews
    const reviews = await Review.find({ userId })
      .populate('movieId', 'title posterUrl tmdbId releaseDate')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    // Get watchlist
    const watchlist = await Watchlist.find({ userId })
      .populate('movieId', 'title posterUrl tmdbId releaseDate')
      .sort({ addedAt: -1 })
      .select('-__v')
      .lean();

    // Get followers
    const followers = await Follow.find({ followingId: userId })
      .populate('followerId', 'username name avatar')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    // Get following
    const following = await Follow.find({ followerId: userId })
      .populate('followingId', 'username name avatar')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    // Get review likes (reviews liked by user)
    const reviewLikes = await ReviewLike.find({ userId })
      .populate('reviewId', 'rating title review')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    // Get stats
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    // Compile export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: (user as any).updatedAt,
      },
      statistics: {
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        watchlistCount: watchlist.length,
        followersCount: followers.length,
        followingCount: following.length,
        reviewLikesCount: reviewLikes.length,
      },
      reviews: reviews.map((review: any) => ({
        id: review._id.toString(),
        movie: review.movieId ? {
          id: review.movieId._id?.toString(),
          title: review.movieId.title,
          posterUrl: review.movieId.posterUrl,
          tmdbId: review.movieId.tmdbId,
          releaseDate: review.movieId.releaseDate,
        } : null,
        rating: review.rating,
        title: review.title,
        review: review.review,
        likes: review.likes || 0,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      watchlist: watchlist.map((item: any) => ({
        id: item._id.toString(),
        movie: item.movieId ? {
          id: item.movieId._id?.toString(),
          title: item.movieId.title,
          posterUrl: item.movieId.posterUrl,
          tmdbId: item.movieId.tmdbId,
          releaseDate: item.movieId.releaseDate,
        } : {
          tmdbId: item.tmdbId,
        },
        addedAt: item.addedAt,
      })),
      followers: followers.map((follow: any) => ({
        user: {
          id: follow.followerId._id?.toString(),
          username: follow.followerId.username,
          name: follow.followerId.name,
          avatar: follow.followerId.avatar,
        },
        followedAt: follow.createdAt,
      })),
      following: following.map((follow: any) => ({
        user: {
          id: follow.followingId._id?.toString(),
          username: follow.followingId.username,
          name: follow.followingId.name,
          avatar: follow.followingId.avatar,
        },
        followedAt: follow.createdAt,
      })),
      reviewLikes: reviewLikes.map((like: any) => ({
        reviewId: like.reviewId._id?.toString(),
        review: like.reviewId ? {
          rating: like.reviewId.rating,
          title: like.reviewId.title,
          review: like.reviewId.review,
        } : null,
        likedAt: like.createdAt,
      })),
    };

    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tfireviews-export-${user.username}-${Date.now()}.json"`);

    res.json(exportData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
