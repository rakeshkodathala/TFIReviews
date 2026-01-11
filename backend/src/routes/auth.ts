import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Review from '../models/Review';
import { IUser, AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

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
    const existingUser: IUser | null = await User.findOne({
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
    const { name, avatar, location } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (location !== undefined) updateData.location = location;

    const user: IUser | null = await User.findByIdAndUpdate(
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

export default router;
