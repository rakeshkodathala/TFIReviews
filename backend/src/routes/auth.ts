import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types';

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
      },
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
