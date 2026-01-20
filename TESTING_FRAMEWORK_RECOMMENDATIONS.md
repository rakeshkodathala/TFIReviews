# 🧪 Testing Framework Recommendations for TFI Reviews

Based on your project structure (Node.js/Express backend, React Native mobile, React web), here are the recommended testing frameworks with setup instructions.

## 📊 Overview

| Platform | Recommended Framework | Why |
|----------|----------------------|-----|
| **Backend** | **Jest + Supertest** | Industry standard for Node.js, excellent TypeScript support, great for API testing |
| **Mobile** | **Jest + React Native Testing Library** | Official recommendation, works seamlessly with Expo, component-focused testing |
| **Web** | **Jest + React Testing Library** | Already included with Create React App, perfect for React components |

---

## 🔧 Backend Testing Framework

### Recommended Stack: **Jest + Supertest**

**Why Jest?**
- ✅ Industry standard for Node.js/TypeScript
- ✅ Zero configuration needed
- ✅ Built-in mocking and assertions
- ✅ Excellent TypeScript support
- ✅ Fast execution
- ✅ Great coverage reports

**Why Supertest?**
- ✅ Perfect for Express API testing
- ✅ Simple HTTP assertions
- ✅ Works seamlessly with Jest

### Installation

```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server @types/mongodb-memory-server
```

### Configuration

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
    '!src/server.ts', // Exclude server entry point
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
};
```

**Create `tests/setup/test-setup.ts`:**

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear database between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

**Update `package.json` scripts:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

### Example Test

**`tests/integration/routes/auth.test.ts`:**

```typescript
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
    expect(response.body.user.email).toBe(userData.email);

    // Verify user in database
    const user = await User.findOne({ email: userData.email });
    expect(user).toBeTruthy();
  });
});
```

### Alternative: Vitest (Modern Alternative)

If you want a faster, more modern alternative:

```bash
npm install --save-dev vitest @vitest/ui supertest
```

**Pros:**
- ⚡ Faster than Jest
- 🔥 Hot module reload
- 🎨 Better TypeScript support
- 📊 Built-in UI

**Cons:**
- ⚠️ Newer, less ecosystem support
- ⚠️ May need more configuration

---

## 📱 Mobile Testing Framework

### Recommended Stack: **Jest + React Native Testing Library**

**Why Jest?**
- ✅ Default for React Native
- ✅ Works out of the box with Expo
- ✅ Fast and reliable

**Why React Native Testing Library?**
- ✅ Recommended by React Native team
- ✅ Focuses on user behavior, not implementation
- ✅ Better accessibility testing
- ✅ Simpler API than Enzyme

### Installation

```bash
cd mobile
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest
```

### Configuration

**Create `jest.config.js`:**

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@expo|expo|@react-navigation|@react-native-community|@react-native-async-storage)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Create `jest.setup.js`:**

```javascript
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Silence console warnings
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

**Update `package.json` scripts:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage"
  }
}
```

### Example Test

**`__tests__/components/Typography.test.tsx`:**

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { AppText } from '../../src/components/Typography';

describe('AppText', () => {
  it('should render text correctly', () => {
    const { getByText } = render(<AppText>Hello World</AppText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const customStyle = { color: 'red', fontSize: 20 };
    const { getByText } = render(
      <AppText style={customStyle}>Styled Text</AppText>
    );
    const text = getByText('Styled Text');
    expect(text).toHaveStyle(customStyle);
  });
});
```

### Alternative: Detox (E2E Testing)

For end-to-end testing on real devices:

```bash
npm install --save-dev detox
```

**Pros:**
- ✅ Real device testing
- ✅ Native interactions
- ✅ CI/CD integration

**Cons:**
- ⚠️ Slower than unit tests
- ⚠️ More complex setup
- ⚠️ Requires device/simulator

---

## 🌐 Web Testing Framework

### Recommended Stack: **Jest + React Testing Library** (Already Included!)

**Good News:** Your web app already has Jest and React Testing Library configured via `react-scripts`! ✅

### What You Already Have

- ✅ Jest (via react-scripts)
- ✅ React Testing Library
- ✅ @testing-library/user-event
- ✅ @testing-library/jest-dom

### Additional Recommendations

**Install MSW (Mock Service Worker) for API mocking:**

```bash
cd web
npm install --save-dev msw
```

**Why MSW?**
- ✅ Intercepts HTTP requests at network level
- ✅ Works with any testing framework
- ✅ Can be used for development too
- ✅ More realistic than mocking axios

### Setup MSW

**Create `src/mocks/handlers.ts`:**

```typescript
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'mock-token',
        user: { id: '1', email: 'test@example.com' },
      })
    );
  }),
  // Add more handlers...
];
```

**Create `src/mocks/server.ts`:**

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Update `src/setupTests.ts`:**

```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Example Test

**`src/components/auth/__tests__/Login.test.tsx`:**

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';

describe('Login Component', () => {
  it('should submit login form', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🎯 Testing Strategy Summary

### Backend
```
Unit Tests (Jest)
  ├── Models (User, Review, Movie, Watchlist)
  ├── Middleware (auth)
  └── Services (movieApi)

Integration Tests (Jest + Supertest)
  ├── Auth Routes
  ├── Movies Routes
  ├── Reviews Routes
  └── Watchlist Routes
```

### Mobile
```
Unit Tests (Jest + React Native Testing Library)
  ├── Components (Typography, OptimizedImage, etc.)
  ├── Screens (Login, Movies, Search, etc.)
  ├── Context (AuthContext)
  └── Services (API services)

E2E Tests (Detox - Optional)
  └── Complete user flows
```

### Web
```
Unit Tests (Jest + React Testing Library)
  ├── Components
  ├── Pages
  └── Hooks

Integration Tests
  └── User flows with MSW
```

---

## 📦 Quick Setup Commands

### Backend Setup

```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server
# Create jest.config.js and test setup files (see above)
npm test
```

### Mobile Setup

```bash
cd mobile
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
# Create jest.config.js and jest.setup.js (see above)
npm test
```

### Web Setup

```bash
cd web
npm install --save-dev msw  # Optional but recommended
# Already configured! Just run:
npm test
```

---

## 🚀 Running Tests

### Backend
```bash
cd backend
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # With coverage
npm test auth.test.ts # Run specific file
```

### Mobile
```bash
cd mobile
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # With coverage
```

### Web
```bash
cd web
npm test              # Run all tests (interactive)
npm test -- --watch   # Watch mode
npm test -- --coverage # With coverage
CI=true npm test      # Run once (for CI)
```

---

## 📊 Coverage Goals

| Platform | Target Coverage |
|----------|----------------|
| Backend  | 80%+ (Routes: 90%+, Models: 85%+) |
| Mobile   | 70%+ (Components: 75%+, Screens: 70%+) |
| Web      | 70%+ (Components: 75%+) |

---

## 🔄 CI/CD Integration

### GitHub Actions Example

**`.github/workflows/test.yml`:**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install MongoDB
        run: |
          sudo systemctl start mongod
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run tests
        run: cd backend && npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  mobile-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd mobile && npm ci
      - name: Run tests
        run: cd mobile && npm test -- --coverage --ci

  web-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd web && npm ci
      - name: Run tests
        run: cd web && CI=true npm test -- --coverage
```

---

## 🎓 Learning Resources

### Jest
- [Jest Documentation](https://jestjs.io/)
- [Jest with TypeScript](https://jestjs.io/docs/getting-started#using-typescript)

### React Native Testing Library
- [React Native Testing Library Docs](https://callstack.github.io/react-native-testing-library/)
- [Testing Recipes](https://reactnative.dev/docs/testing-overview)

### React Testing Library
- [React Testing Library Docs](https://testing-library.com/react)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Supertest
- [Supertest Documentation](https://github.com/visionmedia/supertest)

### MSW
- [MSW Documentation](https://mswjs.io/)
- [MSW with React](https://mswjs.io/docs/getting-started/integrate/browser)

---

## ✅ Recommended Testing Tools Summary

| Tool | Purpose | Platform | Priority |
|------|---------|----------|----------|
| **Jest** | Test runner | All | ⭐⭐⭐ Essential |
| **Supertest** | API testing | Backend | ⭐⭐⭐ Essential |
| **React Testing Library** | Component testing | Web | ⭐⭐⭐ Essential |
| **React Native Testing Library** | Component testing | Mobile | ⭐⭐⭐ Essential |
| **MongoDB Memory Server** | In-memory DB | Backend | ⭐⭐⭐ Essential |
| **MSW** | API mocking | Web | ⭐⭐ Recommended |
| **Detox** | E2E testing | Mobile | ⭐ Optional |

---

## 🎯 Next Steps

1. **Start with Backend** - Set up Jest + Supertest
2. **Add Mobile Tests** - Set up Jest + React Native Testing Library
3. **Enhance Web Tests** - Add MSW for better API mocking
4. **Set up CI/CD** - Automate test runs
5. **Add Coverage Reports** - Track test coverage

---

**Happy Testing! 🧪**
