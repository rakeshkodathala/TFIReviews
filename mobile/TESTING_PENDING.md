# Mobile App Testing - Pending Tests

## ✅ Completed Tests

### Components (5/5 - 100%)

- ✅ OptimizedImage
- ✅ Typography (AppText, AppTextInput, H1-H4, Body, Button)
- ✅ ErrorView
- ✅ SkeletonLoader
- ✅ OfflineBanner

### Services (1/1 - 100%)

- ✅ API Service Layer (authService, watchlistService, moviesService, reviewsService, movieSearchService)

### Hooks (1/1 - 100%)

- ✅ useNetworkStatus

### Context (1/1 - 100%)

- ✅ AuthContext

### Screens (2/15 - 13%)

- ✅ LoginScreen (6 tests - 4 passing, 2 failing due to React version mismatch)
- ✅ RegisterScreen (6 tests - 4 passing, 2 failing due to React version mismatch)

---

## 📋 Pending Tests

### High Priority Screens (Core Functionality)

#### 1. MoviesScreen (`src/screens/__tests__/MoviesScreen.test.tsx`)

**Priority: HIGH**

- [ ] Render movie grid/list
- [ ] Switch between tabs (For You, Trending, My Reviews)
- [ ] Load movies on mount
- [ ] Handle pull-to-refresh
- [ ] Navigate to movie details on card press
- [ ] Show loading state
- [ ] Show error state
- [ ] Display "Your Taste This Month" section
- [ ] Load more movies on scroll (pagination)
- [ ] Filter movies by genre
- [ ] Handle empty state (no movies)
- [ ] Handle network errors gracefully

#### 2. MovieDetailsScreen (`src/screens/__tests__/MovieDetailsScreen.test.tsx`)

**Priority: HIGH**

- [ ] Render movie details
- [ ] Display movie poster with gradient overlay
- [ ] Show cast and crew information
- [ ] Display user rating if reviewed
- [ ] Display community rating
- [ ] Navigate to create review screen
- [ ] Add/remove from watchlist
- [ ] Play trailer (YouTube integration)
- [ ] Handle missing data gracefully
- [ ] Show loading state
- [ ] Show error state
- [ ] Navigate to cast details on cast member press
- [ ] Handle scroll behavior with header

#### 3. SearchScreen (`src/screens/__tests__/SearchScreen.test.tsx`)

**Priority: HIGH**

- [ ] Render search bar
- [ ] Auto-focus search input on mount
- [ ] Debounce search input
- [ ] Show recent searches
- [ ] Filter by genre
- [ ] Show popular movies when no query
- [ ] Clear search functionality
- [ ] Save recent searches to AsyncStorage
- [ ] Navigate to movie details on result press
- [ ] Handle empty search results
- [ ] Handle search errors
- [ ] Show loading state during search

#### 4. CreateReviewScreen (`src/screens/__tests__/CreateReviewScreen.test.tsx`)

**Priority: HIGH**

- [ ] Render review form
- [ ] Allow rating selection (1-10 stars)
- [ ] Require review text validation
- [ ] Submit review successfully
- [ ] Update existing review
- [ ] Navigate back on cancel
- [ ] Disable submit while loading
- [ ] Show error on submission failure
- [ ] Pre-fill form when editing existing review
- [ ] Handle movie data loading
- [ ] Validate minimum review length

#### 5. ActivityScreen (`src/screens/__tests__/ActivityScreen.test.tsx`)

**Priority: MEDIUM**

- [ ] Render activity list
- [ ] Display user activity items
- [ ] Show loading state
- [ ] Show error state
- [ ] Handle pull-to-refresh
- [ ] Navigate to movie details on activity item press
- [ ] Handle empty state (no activity)
- [ ] Filter activity by type (reviews, watchlist, etc.)

#### 6. AccountScreen (`src/screens/__tests__/AccountScreen.test.tsx`)

**Priority: MEDIUM**

- [ ] Render account information
- [ ] Display user profile
- [ ] Show user stats (reviews, watchlist count)
- [ ] Navigate to settings
- [ ] Navigate to my reviews
- [ ] Navigate to watchlist
- [ ] Logout functionality
- [ ] Update profile picture
- [ ] Handle profile update errors

### Medium Priority Screens

#### 7. WatchlistScreen (`src/screens/__tests__/WatchlistScreen.test.tsx`)

**Priority: MEDIUM**

- [ ] Render watchlist items
- [ ] Remove item from watchlist
- [ ] Navigate to movie details
- [ ] Show empty state
- [ ] Handle pull-to-refresh
- [ ] Show loading state
- [ ] Handle errors

#### 8. MyReviewsScreen (`src/screens/__tests__/MyReviewsScreen.test.tsx`)

**Priority: MEDIUM**

- [ ] Render user reviews
- [ ] Edit review
- [ ] Delete review
- [ ] Navigate to movie details
- [ ] Show empty state
- [ ] Handle pull-to-refresh
- [ ] Show loading state
- [ ] Handle errors

#### 9. TrendingTab (`src/screens/__tests__/TrendingTab.test.tsx`)

**Priority: LOW**

- [ ] Render trending movies
- [ ] Load trending movies
- [ ] Navigate to movie details
- [ ] Show loading state
- [ ] Handle errors

#### 10. CastDetailsScreen (`src/screens/__tests__/CastDetailsScreen.test.tsx`)

**Priority: LOW**

- [ ] Render cast member details
- [ ] Display cast member movies
- [ ] Navigate to movie details
- [ ] Show loading state
- [ ] Handle errors

### Low Priority Screens

#### 11. SettingsScreen (`src/screens/__tests__/SettingsScreen.test.tsx`)

**Priority: LOW**

- [ ] Render settings options
- [ ] Update settings
- [ ] Handle settings errors

#### 12. NotificationsScreen (`src/screens/__tests__/NotificationsScreen.test.tsx`)

**Priority: LOW**

- [ ] Render notifications
- [ ] Mark notification as read
- [ ] Handle empty state

#### 13. AboutScreen (`src/screens/__tests__/AboutScreen.test.tsx`)

**Priority: LOW**

- [ ] Render about information
- [ ] Display app version
- [ ] Display credits

---

## 🧭 Navigation Tests

### AppNavigator Tests (`src/navigation/__tests__/AppNavigator.test.tsx`)

**Priority: HIGH**

- [ ] Render authenticated navigation (MainStack)
- [ ] Render unauthenticated navigation (AuthStack)
- [ ] Show splash screen while loading
- [ ] Navigate to correct stack based on auth state
- [ ] Tab navigation works correctly
- [ ] Stack navigation works correctly
- [ ] Protected routes require authentication
- [ ] Navigation state persists correctly
- [ ] Deep linking support (if implemented)
- [ ] Back button behavior

---

## 🔧 Integration Tests

### User Flow Tests

**Priority: HIGH**

- [ ] Complete registration → login → browse movies flow
- [ ] Search → view details → create review flow
- [ ] Add to watchlist → view watchlist → remove flow
- [ ] View movie → rate → edit review flow
- [ ] Offline → online state transitions

### API Integration Tests

**Priority: MEDIUM**

- [ ] API error handling across all screens
- [ ] Network timeout handling
- [ ] Token expiration handling
- [ ] Retry logic for failed requests

---

## 📊 Test Coverage Goals

### Current Status

- **Components**: 100% (5/5)
- **Services**: 100% (1/1)
- **Hooks**: 100% (1/1)
- **Context**: 100% (1/1)
- **Screens**: 13% (2/15)
- **Navigation**: 0% (0/1)
- **Overall**: ~40% estimated

### Target Coverage

- **Components**: 100% ✅
- **Services**: 100% ✅
- **Hooks**: 100% ✅
- **Context**: 100% ✅
- **Screens**: 80%+ (12/15)
- **Navigation**: 80%+
- **Overall**: 75%+

---

## 🎯 Recommended Testing Order

### Phase 1: Core Functionality (Week 1)

1. MoviesScreen
2. MovieDetailsScreen
3. SearchScreen
4. CreateReviewScreen

### Phase 2: User Features (Week 2)

1. ActivityScreen
2. AccountScreen
3. WatchlistScreen
4. MyReviewsScreen

### Phase 3: Navigation & Integration (Week 3)

1. AppNavigator
2. Integration tests
3. Edge case testing

### Phase 4: Polish (Week 4)

1. Remaining screens (TrendingTab, CastDetailsScreen, etc.)
2. Performance tests
3. Accessibility tests

---

## 📝 Test Template

Use this template for new screen tests:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { YourScreen } from '../YourScreen';
import { renderWithProviders } from '../../test-utils/render';

// Mock dependencies
jest.mock('../../services/api', () => ({
  // Mock services
}));

describe('YourScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    renderWithProviders(<YourScreen />);
    // Assertions
  });

  it('should handle user interactions', async () => {
    // Test interactions
  });

  it('should show loading state', () => {
    // Test loading
  });

  it('should handle errors gracefully', () => {
    // Test error handling
  });
});
```

---

## 🚨 Known Issues

1. **React Version Mismatch**: 4 tests fail due to React 19.2.3 vs react-native-renderer 19.1.0
   - See `TESTING_VERSION_MISMATCH.md` for details
   - Affects: LoginScreen (2 tests), RegisterScreen (2 tests)
   - Workaround: Tests functionally work, just fail due to version check

---

## 📈 Progress Tracking

- **Total Test Files**: 10/22 (45%)
- **Total Tests**: 93 tests (89 passing, 4 failing)
- **Components**: 5/5 ✅
- **Services**: 1/1 ✅
- **Hooks**: 1/1 ✅
- **Context**: 1/1 ✅
- **Screens**: 2/15 (13%)
- **Navigation**: 0/1 (0%)

**Next Steps**: Focus on high-priority screen tests (MoviesScreen, MovieDetailsScreen, SearchScreen, CreateReviewScreen)
