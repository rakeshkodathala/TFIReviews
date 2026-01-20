# 🤝 Contributing to TFI Reviews

Thank you for your interest in contributing to TFI Reviews! We're excited to have you on board. This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Areas for Contribution](#areas-for-contribution)
- [Questions & Help](#questions--help)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (running locally or connection string)
- **Git**
- **Expo CLI** (for mobile development)
- **TMDB API Key** (for movie data - get one at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Fork and Clone

> **⚠️ Important**: You **must** fork the repository first. You cannot directly push to the main repository.

1. **Fork the repository** on GitHub:
   - Go to the main repository: `https://github.com/ORIGINAL_OWNER/TFIReviews`
   - Click the "Fork" button in the top right corner
   - This creates a copy of the repository under your GitHub account

2. **Clone your fork** (not the main repository):

   ```bash
   git clone https://github.com/YOUR_USERNAME/TFIReviews.git
   cd TFIReviews
   ```

3. **Add upstream remote** (to sync with the main repository):

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/TFIReviews.git
   ```

4. **Verify your remotes**:

   ```bash
   git remote -v
   ```

   You should see:
   - `origin` - points to your fork (where you push)
   - `upstream` - points to the main repository (where you pull updates from)

## 🛠️ Development Setup

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/tfireviews
   JWT_SECRET=your-secret-key-change-in-production
   TMDB_API_KEY=your-tmdb-api-key
   ```

4. Start MongoDB (if running locally):

   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:3000`

### Mobile App Setup

1. Navigate to the mobile directory:

   ```bash
   cd mobile
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Update API configuration in `src/config/api.ts`:

   ```typescript
   // For iOS Simulator
   export const API_URL = 'http://localhost:3000/api';
   
   // For Android Emulator
   export const API_URL = 'http://10.0.2.2:3000/api';
   
   // For Physical Device
   export const API_URL = 'http://YOUR_IP:3000/api';
   ```

4. Start the Expo development server:

   ```bash
   npm start
   ```

5. Open on your device:
   - Scan QR code with Expo Go app
   - Or press `i` for iOS Simulator / `a` for Android Emulator

### Web App Setup

1. Navigate to the web directory:

   ```bash
   cd web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

   The web app will run on `http://localhost:3001`

## 📁 Project Structure

```
TFIReviews/
├── backend/                 # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── models/         # Mongoose models (User, Movie, Review, Watchlist)
│   │   ├── routes/         # API routes (auth, movies, reviews, watchlist)
│   │   ├── middleware/     # Custom middleware (authentication)
│   │   ├── services/       # External API services (TMDB)
│   │   ├── types/          # TypeScript type definitions
│   │   └── server.ts       # Express server entry point
│   ├── tsconfig.json
│   └── package.json
│
├── mobile/                  # React Native + Expo mobile app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── screens/        # Screen components
│   │   ├── navigation/     # Navigation setup
│   │   ├── services/       # API service layer
│   │   ├── context/        # React Context (Auth)
│   │   ├── config/         # Configuration files
│   │   └── hooks/          # Custom React hooks
│   ├── app.json
│   └── package.json
│
└── web/                     # React web application
    ├── src/
    │   ├── components/     # React components
    │   ├── context/        # React Context
    │   ├── services/       # API services
    │   └── config/         # Configuration
    └── package.json
```

## 📝 Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Define types and interfaces for all data structures
- Avoid `any` type - use proper types or `unknown`
- Use strict mode in `tsconfig.json`

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings (TypeScript/JavaScript)
- **Semicolons**: Use semicolons
- **Line length**: Keep lines under 100 characters when possible
- **Naming conventions**:
  - Components: `PascalCase` (e.g., `MovieCard.tsx`)
  - Functions/Variables: `camelCase` (e.g., `getMovieDetails`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `API_URL`)
  - Types/Interfaces: `PascalCase` (e.g., `MovieDetails`)

### React/React Native Best Practices

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use `useCallback` and `useMemo` for performance optimization
- Handle loading and error states
- Use TypeScript for props and state

### Backend Best Practices

- Use async/await instead of callbacks
- Handle errors properly with try-catch
- Validate input data
- Use middleware for authentication
- Return consistent API response formats
- Add proper error messages

### File Organization

- One component per file
- Group related files in folders
- Use index files for clean imports
- Keep styles close to components (co-location)

### Example Component Structure

```typescript
// imports
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

// types/interfaces
interface Props {
  // props definition
}

// component
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // hooks
  const [state, setState] = useState();
  
  // effects
  useEffect(() => {
    // effect logic
  }, []);
  
  // handlers
  const handleAction = () => {
    // handler logic
  };
  
  // render
  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
};

// styles
const styles = StyleSheet.create({
  container: {
    // styles
  },
});

export default ComponentName;
```

## 🔀 Git Workflow

### ⚠️ Important: Fork First

**You cannot directly push to the main repository.** All contributions must go through the fork workflow:

1. **Fork the repository** on GitHub (if you haven't already)
2. **Work on your fork** - all changes are made in your fork
3. **Create a Pull Request** from your fork to the main repository

### Branch Naming

Use descriptive branch names:

- `feature/add-watchlist-functionality`
- `fix/search-bar-alignment`
- `refactor/movie-card-component`
- `docs/update-readme`

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(mobile): add pull-to-refresh to activity screen
fix(backend): resolve authentication token expiration issue
docs: update contributing guidelines
refactor(web): simplify movie card component
```

### Workflow Steps

> **Remember**: You're working on **your fork**, not the main repository!

1. **Update your fork** with the latest changes from the main repository:

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git push origin main  # Update your fork's main branch
   ```

2. **Create a feature branch in your fork**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit:

   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

4. **Push to your fork** (not the main repository):

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub:
   - Go to the main repository on GitHub
   - You'll see a banner suggesting to create a PR from your recently pushed branch
   - Click "Compare & pull request"
   - Fill out the PR template
   - Submit the PR from **your fork** to the **main repository**

## 🔍 Pull Request Process

### ⚠️ Important: PRs Must Come From Your Fork

**You cannot create a PR directly from the main repository.** All Pull Requests must be created from your fork:

1. Make changes in **your fork**
2. Push to a branch in **your fork**
3. Create a PR from **your fork's branch** → **main repository's main branch**

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass (if applicable)
- [ ] Code is tested on iOS and Android (for mobile)
- [ ] Documentation is updated (if needed)
- [ ] No console.logs or debug code left behind
- [ ] Commit messages follow conventional commits
- [ ] Your fork is up to date with the main repository

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on web
- [ ] Manual testing steps

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Thank you for contributing! 🎉

## 🧪 Testing Guidelines

### Manual Testing

Before submitting a PR, test your changes:

**Backend:**

- Test all API endpoints with Postman or similar
- Test error cases (invalid input, missing auth, etc.)
- Test with different user roles/permissions

**Mobile:**

- Test on iOS Simulator
- Test on Android Emulator
- Test on physical devices (if possible)
- Test different screen sizes
- Test offline scenarios
- Test error states

**Web:**

- Test in Chrome, Firefox, Safari
- Test responsive design (mobile, tablet, desktop)
- Test all user flows

### Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Loading states work correctly
- [ ] Error handling works
- [ ] UI is responsive
- [ ] No performance issues
- [ ] Accessibility considerations (if applicable)

## 🎯 Areas for Contribution

We welcome contributions in all areas! Here are some ideas:

### 🐛 Bug Fixes

- Fix any issues you encounter
- Improve error handling
- Fix UI/UX issues

### ✨ New Features

- Additional movie filters
- Social features (follow users, comments on reviews)
- Push notifications
- Dark/light theme toggle
- Movie recommendations algorithm improvements
- Export reviews feature
- Movie lists/collections

### 📚 Documentation

- Improve README files
- Add code comments
- Create tutorials
- Update API documentation

### 🎨 UI/UX Improvements

- Improve animations
- Better loading states
- Enhanced accessibility
- Responsive design improvements

### ⚡ Performance

- Optimize image loading
- Reduce bundle size
- Improve API response times
- Add caching strategies

### 🧪 Testing

- Add unit tests
- Add integration tests
- Improve test coverage

## 📖 Code Examples

### Adding a New API Endpoint

```typescript
// backend/src/routes/movies.ts
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const featuredMovies = await Movie.find({ featured: true })
      .limit(10)
      .lean();
    res.json({ movies: featuredMovies });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

### Adding a New Screen

```typescript
// mobile/src/screens/NewScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../components/Typography';

const NewScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <AppText>New Screen</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});

export default NewScreen;
```

### Adding a New Component

```typescript
// mobile/src/components/NewComponent.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface NewComponentProps {
  title: string;
  onPress?: () => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      {/* Component JSX */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // styles
  },
});

export default NewComponent;
```

## ❓ Questions & Help

- **GitHub Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the maintainers (if contact info is available)

## 🙏 Thank You

Your contributions make TFI Reviews better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**
