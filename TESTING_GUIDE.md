# 🧪 TFI Reviews - Testing Guide

Comprehensive testing strategy and test cases for TFI Reviews application.

## 📋 Table of Contents

- [Testing Strategy](#testing-strategy)
- [Backend Tests](#backend-tests)
- [Mobile App Tests](#mobile-app-tests)
- [Web App Tests](#web-app-tests)
- [Test Setup](#test-setup)
- [Running Tests](#running-tests)

## 🎯 Testing Strategy

### Test Pyramid

```
        /\
       /  \
      / E2E \        (Few, high-level)
     /--------\
    /          \
   / Integration \   (Some, medium-level)
  /--------------\
 /                \
/   Unit Tests     \  (Many, low-level)
/------------------\
```

### Test Types

1. **Unit Tests** - Test individual functions/components in isolation
2. **Integration Tests** - Test interactions between components/services
3. **E2E Tests** - Test complete user flows
4. **API Tests** - Test backend endpoints
5. **Component Tests** - Test React/React Native components

---

## 🔧 Backend Tests

### Testing Framework Setup

**Recommended Stack:**
- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library for API testing
- **MongoDB Memory Server** - In-memory MongoDB for testing
- **@types/jest** - TypeScript types for Jest

### Test Structure

```
backend/
├── src/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── services/
└── tests/
    ├── unit/
    │   ├── models/
    │   ├── middleware/
    │   └── services/
    ├── integration/
    │   └── routes/
    └── setup/
        └── test-setup.ts
```

### Unit Tests

#### 1. User Model Tests (`tests/unit/models/User.test.ts`)

```typescript
describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      // Test user creation
    });

    it('should require username', async () => {
      // Test username is required
    });

    it('should require unique username', async () => {
      // Test username uniqueness
    });

    it('should require email', async () => {
      // Test email is required
    });

    it('should require unique email', async () => {
      // Test email uniqueness
    });

    it('should require password with min length 6', async () => {
      // Test password validation
    });

    it('should trim username and email', async () => {
      // Test trimming
    });

    it('should lowercase email', async () => {
      // Test email lowercasing
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      // Test password is hashed
    });

    it('should not hash password if not modified', async () => {
      // Test password not re-hashed on update
    });

    it('should compare password correctly', async () => {
      // Test comparePassword method
    });
  });
});
```

#### 2. Review Model Tests (`tests/unit/models/Review.test.ts`)

```typescript
describe('Review Model', () => {
  describe('Schema Validation', () => {
    it('should create a review with valid data', async () => {
      // Test review creation
    });

    it('should require movieId', async () => {
      // Test movieId is required
    });

    it('should require userId', async () => {
      // Test userId is required
    });

    it('should require rating between 1 and 10', async () => {
      // Test rating validation
    });

    it('should require review text', async () => {
      // Test review text is required
    });

    it('should have default likes of 0', async () => {
      // Test default likes
    });
  });

  describe('Indexes', () => {
    it('should have compound index on movieId and userId', async () => {
      // Test unique review per user per movie
    });

    it('should have index on createdAt', async () => {
      // Test sorting by date
    });
  });
});
```

#### 3. Authentication Middleware Tests (`tests/unit/middleware/auth.test.ts`)

```typescript
describe('Authentication Middleware', () => {
  it('should authenticate valid token', async () => {
    // Test valid JWT token
  });

  it('should reject request without Authorization header', async () => {
    // Test missing header
  });

  it('should reject request without Bearer prefix', async () => {
    // Test invalid format
  });

  it('should reject expired token', async () => {
    // Test token expiration
  });

  it('should reject invalid token', async () => {
    // Test malformed token
  });

  it('should extract userId from token', async () => {
    // Test userId extraction
  });

  it('should reject token without userId', async () => {
    // Test missing userId in payload
  });
});
```

#### 4. Movie API Service Tests (`tests/unit/services/movieApi.test.ts`)

```typescript
describe('Movie API Service', () => {
  describe('searchMovies', () => {
    it('should search movies with query', async () => {
      // Test movie search
    });

    it('should handle empty results', async () => {
      // Test no results
    });

    it('should handle API errors', async () => {
      // Test error handling
    });

    it('should filter by year if provided', async () => {
      // Test year filter
    });

    it('should use Telugu language by default', async () => {
      // Test default language
    });
  });

  describe('getMovieById', () => {
    it('should fetch movie by TMDB ID', async () => {
      // Test movie fetch
    });

    it('should handle invalid movie ID', async () => {
      // Test error handling
    });

    it('should return formatted movie data', async () => {
      // Test data formatting
    });
  });

  describe('getPopularMovies', () => {
    it('should fetch popular movies', async () => {
      // Test popular movies
    });

    it('should support pagination', async () => {
      // Test pagination
    });
  });
});
```

### Integration Tests

#### 1. Authentication Routes Tests (`tests/integration/routes/auth.test.ts`)

```typescript
describe('Authentication Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Test successful registration
      // - Check user is created
      // - Check password is hashed
      // - Check JWT token is returned
      // - Check user data in response
    });

    it('should reject duplicate username', async () => {
      // Test username uniqueness
    });

    it('should reject duplicate email', async () => {
      // Test email uniqueness
    });

    it('should validate password length', async () => {
      // Test password validation
    });

    it('should validate email format', async () => {
      // Test email format
    });

    it('should trim and lowercase email', async () => {
      // Test email normalization
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Test successful login
      // - Check JWT token is returned
      // - Check user data in response
    });

    it('should reject invalid email', async () => {
      // Test wrong email
    });

    it('should reject invalid password', async () => {
      // Test wrong password
    });

    it('should reject non-existent user', async () => {
      // Test user doesn't exist
    });
  });

  describe('GET /api/auth/stats', () => {
    it('should return user statistics', async () => {
      // Test stats endpoint
      // - Check review count
      // - Check average rating
      // - Check watchlist count
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });
  });
});
```

#### 2. Movies Routes Tests (`tests/integration/routes/movies.test.ts`)

```typescript
describe('Movies Routes', () => {
  describe('GET /api/movies', () => {
    it('should return paginated movies', async () => {
      // Test pagination
      // - Check page, limit, total, pages
    });

    it('should filter by search query', async () => {
      // Test search functionality
    });

    it('should filter by genre', async () => {
      // Test genre filter
    });

    it('should sort by releaseDate by default', async () => {
      // Test default sorting
    });

    it('should support custom sorting', async () => {
      // Test custom sortBy
    });

    it('should return empty array if no movies', async () => {
      // Test empty results
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should return movie by ID', async () => {
      // Test get movie
    });

    it('should return 404 for non-existent movie', async () => {
      // Test not found
    });

    it('should return 400 for invalid ID format', async () => {
      // Test invalid ID
    });
  });

  describe('POST /api/movies', () => {
    it('should create a new movie', async () => {
      // Test movie creation
      // - Check authentication required
      // - Check movie is saved
      // - Check response data
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });

    it('should validate required fields', async () => {
      // Test validation
    });
  });
});
```

#### 3. Reviews Routes Tests (`tests/integration/routes/reviews.test.ts`)

```typescript
describe('Reviews Routes', () => {
  describe('GET /api/reviews', () => {
    it('should return paginated reviews', async () => {
      // Test activity feed
      // - Check pagination
      // - Check populated user and movie data
      // - Check sorting by createdAt
    });

    it('should return empty array if no reviews', async () => {
      // Test empty state
    });
  });

  describe('GET /api/reviews/movie/:movieId', () => {
    it('should return reviews for a movie', async () => {
      // Test movie reviews
      // - Check populated user data
      // - Check sorting
    });

    it('should return empty array if no reviews', async () => {
      // Test empty state
    });
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      // Test review creation
      // - Check authentication required
      // - Check review is saved
      // - Check movie auto-import if tmdbId provided
      // - Check rating validation (1-10)
    });

    it('should auto-import movie from TMDB if not exists', async () => {
      // Test movie auto-import
    });

    it('should update movie rating after review', async () => {
      // Test rating calculation
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });

    it('should validate rating range', async () => {
      // Test rating validation (1-10)
    });

    it('should prevent duplicate reviews', async () => {
      // Test one review per user per movie
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update own review', async () => {
      // Test review update
      // - Check owner can update
      // - Check data is updated
    });

    it('should prevent updating others reviews', async () => {
      // Test authorization
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete own review', async () => {
      // Test review deletion
      // - Check owner can delete
      // - Check review is removed
    });

    it('should prevent deleting others reviews', async () => {
      // Test authorization
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });
  });
});
```

#### 4. Watchlist Routes Tests (`tests/integration/routes/watchlist.test.ts`)

```typescript
describe('Watchlist Routes', () => {
  describe('GET /api/watchlist', () => {
    it('should return user watchlist', async () => {
      // Test get watchlist
      // - Check authentication required
      // - Check pagination
      // - Check populated movie data
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });
  });

  describe('POST /api/watchlist', () => {
    it('should add movie to watchlist', async () => {
      // Test add to watchlist
      // - Check authentication required
      // - Check movie is added
      // - Check duplicate prevention
    });

    it('should prevent duplicate entries', async () => {
      // Test duplicate prevention
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });
  });

  describe('DELETE /api/watchlist/:movieId', () => {
    it('should remove movie from watchlist', async () => {
      // Test remove from watchlist
      // - Check authentication required
      // - Check movie is removed
    });

    it('should handle non-existent movie', async () => {
      // Test error handling
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });
  });

  describe('GET /api/watchlist/count', () => {
    it('should return watchlist count', async () => {
      // Test count endpoint
    });

    it('should require authentication', async () => {
      // Test auth requirement
    });
  });
});
```

---

## 📱 Mobile App Tests

### Testing Framework Setup

**Recommended Stack:**
- **Jest** - Test runner
- **React Native Testing Library** - Component testing
- **@testing-library/react-native** - React Native testing utilities
- **@testing-library/jest-native** - Custom matchers
- **Mock Service Worker (MSW)** - API mocking

### Test Structure

```
mobile/
├── src/
│   ├── components/
│   ├── screens/
│   ├── services/
│   └── context/
└── __tests__/
    ├── components/
    ├── screens/
    ├── services/
    ├── context/
    └── utils/
```

### Component Tests

#### 1. Typography Component Tests (`__tests__/components/Typography.test.tsx`)

```typescript
describe('Typography Component', () => {
  it('should render text correctly', () => {
    // Test text rendering
  });

  it('should apply custom styles', () => {
    // Test style prop
  });

  it('should render different variants', () => {
    // Test h1, h2, body, etc.
  });

  it('should handle numberOfLines prop', () => {
    // Test text truncation
  });
});
```

#### 2. OptimizedImage Component Tests (`__tests__/components/OptimizedImage.test.tsx`)

```typescript
describe('OptimizedImage Component', () => {
  it('should render image with source', () => {
    // Test image rendering
  });

  it('should show placeholder while loading', () => {
    // Test placeholder
  });

  it('should handle image load error', () => {
    // Test error handling
  });

  it('should apply custom styles', () => {
    // Test style prop
  });

  it('should handle missing source gracefully', () => {
    // Test fallback
  });
});
```

#### 3. SkeletonLoader Component Tests (`__tests__/components/SkeletonLoader.test.tsx`)

```typescript
describe('SkeletonLoader Component', () => {
  it('should render skeleton loader', () => {
    // Test skeleton rendering
  });

  it('should render movie card skeleton', () => {
    // Test MovieCardSkeleton
  });

  it('should render review card skeleton', () => {
    // Test ReviewCardSkeleton
  });
});
```

### Screen Tests

#### 1. LoginScreen Tests (`__tests__/screens/LoginScreen.test.tsx`)

```typescript
describe('LoginScreen', () => {
  it('should render login form', () => {
    // Test form rendering
  });

  it('should show error on invalid credentials', async () => {
    // Test error handling
  });

  it('should navigate to home on successful login', async () => {
    // Test navigation
  });

  it('should navigate to register screen', () => {
    // Test navigation to register
  });

  it('should disable submit button while loading', () => {
    // Test loading state
  });

  it('should validate email format', () => {
    // Test email validation
  });

  it('should require password', () => {
    // Test password validation
  });
});
```

#### 2. MoviesScreen Tests (`__tests__/screens/MoviesScreen.test.tsx`)

```typescript
describe('MoviesScreen', () => {
  it('should render movie grid', () => {
    // Test grid rendering
  });

  it('should switch between tabs', () => {
    // Test tab switching
  });

  it('should load movies on mount', async () => {
    // Test data loading
  });

  it('should handle pull-to-refresh', async () => {
    // Test refresh functionality
  });

  it('should navigate to movie details on card press', () => {
    // Test navigation
  });

  it('should show loading state', () => {
    // Test loading indicator
  });

  it('should show error state', () => {
    // Test error handling
  });

  it('should display "Your Taste This Month" section', () => {
    // Test taste snapshot
  });

  it('should load more movies on scroll', async () => {
    // Test pagination
  });
});
```

#### 3. SearchScreen Tests (`__tests__/screens/SearchScreen.test.tsx`)

```typescript
describe('SearchScreen', () => {
  it('should render search bar', () => {
    // Test search input
  });

  it('should auto-focus search on mount', () => {
    // Test auto-focus
  });

  it('should debounce search input', async () => {
    // Test debouncing
  });

  it('should show recent searches', () => {
    // Test recent searches
  });

  it('should filter by genre', () => {
    // Test genre filter
  });

  it('should show popular movies when no query', () => {
    // Test default state
  });

  it('should clear search', () => {
    // Test clear functionality
  });

  it('should save recent searches', () => {
    // Test AsyncStorage
  });
});
```

#### 4. MovieDetailsScreen Tests (`__tests__/screens/MovieDetailsScreen.test.tsx`)

```typescript
describe('MovieDetailsScreen', () => {
  it('should render movie details', () => {
    // Test details rendering
  });

  it('should display movie poster', () => {
    // Test poster display
  });

  it('should show cast and crew', () => {
    // Test cast section
  });

  it('should show user rating if reviewed', () => {
    // Test user rating display
  });

  it('should show community rating', () => {
    // Test community rating
  });

  it('should navigate to create review', () => {
    // Test navigation
  });

  it('should add/remove from watchlist', async () => {
    // Test watchlist functionality
  });

  it('should play trailer', () => {
    // Test trailer functionality
  });

  it('should handle missing data gracefully', () => {
    // Test error handling
  });
});
```

#### 5. CreateReviewScreen Tests (`__tests__/screens/CreateReviewScreen.test.tsx`)

```typescript
describe('CreateReviewScreen', () => {
  it('should render review form', () => {
    // Test form rendering
  });

  it('should allow rating selection (1-10 stars)', () => {
    // Test star rating
  });

  it('should require review text', () => {
    // Test validation
  });

  it('should submit review', async () => {
    // Test submission
  });

  it('should update existing review', async () => {
    // Test edit functionality
  });

  it('should navigate back on cancel', () => {
    // Test navigation
  });

  it('should disable submit while loading', () => {
    // Test loading state
  });
});
```

### Context Tests

#### 1. AuthContext Tests (`__tests__/context/AuthContext.test.tsx`)

```typescript
describe('AuthContext', () => {
  it('should provide auth state', () => {
    // Test context provider
  });

  it('should handle login', async () => {
    // Test login function
  });

  it('should handle register', async () => {
    // Test register function
  });

  it('should handle logout', async () => {
    // Test logout function
  });

  it('should persist auth state', async () => {
    // Test AsyncStorage persistence
  });

  it('should verify token on load', async () => {
    // Test token verification
  });

  it('should update user profile', async () => {
    // Test updateUser function
  });
});
```

### Service Tests

#### 1. API Service Tests (`__tests__/services/api.test.ts`)

```typescript
describe('API Services', () => {
  describe('authService', () => {
    it('should login user', async () => {
      // Test login API call
    });

    it('should register user', async () => {
      // Test register API call
    });

    it('should handle API errors', async () => {
      // Test error handling
    });
  });

  describe('moviesService', () => {
    it('should fetch movies', async () => {
      // Test movies API call
    });

    it('should handle pagination', async () => {
      // Test pagination
    });
  });

  describe('reviewsService', () => {
    it('should create review', async () => {
      // Test create review API call
    });

    it('should fetch reviews', async () => {
      // Test fetch reviews API call
    });
  });
});
```

---

## 🌐 Web App Tests

### Testing Framework Setup

**Recommended Stack:**
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **MSW** - API mocking

### Component Tests

#### 1. Login Component Tests (`src/components/auth/__tests__/Login.test.tsx`)

```typescript
describe('Login Component', () => {
  it('should render login form', () => {
    // Test form rendering
  });

  it('should submit login credentials', async () => {
    // Test form submission
  });

  it('should show error on invalid credentials', async () => {
    // Test error handling
  });

  it('should navigate to movies on success', async () => {
    // Test navigation
  });
});
```

#### 2. Movies Component Tests (`src/components/movies/__tests__/Movies.test.tsx`)

```typescript
describe('Movies Component', () => {
  it('should render movie list', () => {
    // Test list rendering
  });

  it('should filter movies', () => {
    // Test filtering
  });

  it('should navigate to movie details', () => {
    // Test navigation
  });
});
```

---

## 🛠️ Test Setup

### Backend Test Setup

**Install dependencies:**

```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server
```

**Create `jest.config.js`:**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.ts'],
};
```

**Create `tests/setup/test-setup.ts`:**

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

### Mobile Test Setup

**Install dependencies:**

```bash
cd mobile
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest
```

**Create `jest.config.js`:**

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@expo|expo|@react-navigation)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

### Web Test Setup

**Install dependencies (usually included with Create React App):**

```bash
cd web
npm install --save-dev @testing-library/jest-dom @testing-library/user-event
```

---

## 🚀 Running Tests

### Backend

```bash
cd backend
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage
npm test -- auth.test.ts    # Run specific test file
```

### Mobile

```bash
cd mobile
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage
```

### Web

```bash
cd web
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage
```

---

## 📊 Coverage Goals

### Minimum Coverage Targets

- **Backend**: 80%+ coverage
  - Routes: 90%+
  - Models: 85%+
  - Middleware: 90%+
  - Services: 80%+

- **Mobile**: 70%+ coverage
  - Components: 75%+
  - Screens: 70%+
  - Services: 80%+
  - Context: 85%+

- **Web**: 70%+ coverage
  - Components: 75%+
  - Services: 80%+

---

## ✅ Test Checklist

### Before Committing

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage meets minimum thresholds
- [ ] No console.logs in test files
- [ ] Tests are properly documented
- [ ] Edge cases are covered
- [ ] Error cases are tested

### Test Categories

- [ ] **Happy Path** - Normal user flows work
- [ ] **Error Handling** - Errors are handled gracefully
- [ ] **Edge Cases** - Boundary conditions
- [ ] **Validation** - Input validation works
- [ ] **Authentication** - Auth flows work correctly
- [ ] **Authorization** - Permissions are enforced
- [ ] **Data Integrity** - Data is saved correctly
- [ ] **Performance** - No obvious performance issues

---

## 🎯 Priority Test Cases

### High Priority (Must Have)

1. **Authentication Flow**
   - User registration
   - User login
   - Token validation
   - Logout

2. **Review Creation**
   - Create review
   - Update review
   - Delete review
   - Rating validation

3. **Movie Operations**
   - Fetch movies
   - Search movies
   - Movie details
   - Auto-import from TMDB

4. **Watchlist Operations**
   - Add to watchlist
   - Remove from watchlist
   - Get watchlist

### Medium Priority (Should Have)

1. **UI Components**
   - Component rendering
   - User interactions
   - Navigation flows

2. **Data Validation**
   - Input validation
   - Error messages
   - Form submissions

### Low Priority (Nice to Have)

1. **Performance Tests**
   - Load testing
   - Stress testing
   - Response time testing

2. **E2E Tests**
   - Complete user journeys
   - Cross-browser testing
   - Mobile device testing

---

## 📝 Test Examples

### Example: Backend Integration Test

```typescript
// tests/integration/routes/auth.test.ts
import request from 'supertest';
import app from '../../src/server';
import User from '../../src/models/User';

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.email).toBe(userData.email);

    // Verify user is in database
    const user = await User.findOne({ email: userData.email });
    expect(user).toBeTruthy();
    expect(user?.username).toBe(userData.username);
  });
});
```

### Example: Mobile Component Test

```typescript
// __tests__/components/Typography.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { AppText } from '../../src/components/Typography';

describe('AppText', () => {
  it('should render text correctly', () => {
    const { getByText } = render(<AppText>Hello World</AppText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const customStyle = { color: 'red' };
    const { getByText } = render(
      <AppText style={customStyle}>Styled Text</AppText>
    );
    const text = getByText('Styled Text');
    expect(text.props.style).toContainEqual(customStyle);
  });
});
```

---

## 🔍 Testing Best Practices

1. **Test Isolation** - Each test should be independent
2. **Clear Test Names** - Describe what is being tested
3. **Arrange-Act-Assert** - Structure tests clearly
4. **Mock External Dependencies** - Don't hit real APIs/DBs
5. **Test Edge Cases** - Don't just test happy paths
6. **Keep Tests Fast** - Use mocks and in-memory databases
7. **Maintain Test Data** - Use factories/fixtures
8. **Clean Up** - Reset state between tests

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MSW Documentation](https://mswjs.io/)

---

**Happy Testing! 🧪**
