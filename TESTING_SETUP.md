# 🚀 Quick Testing Setup Guide

Follow these steps to set up testing for your TFI Reviews project.

## 📋 Prerequisites

- Node.js v18 or higher
- npm or yarn

---

## 🔧 Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server @types/mongodb-memory-server
```

### Step 2: Configuration Files

✅ **Already created:**
- `jest.config.js` - Jest configuration
- `tests/setup/test-setup.ts` - Test setup with MongoDB Memory Server

### Step 3: Create Your First Test

Create `tests/integration/routes/auth.test.ts`:

```typescript
import request from 'supertest';
import app from '../../src/server';

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
  });
});
```

### Step 4: Run Tests

```bash
npm test
```

---

## 📱 Mobile Setup

### Step 1: Install Dependencies

```bash
cd mobile
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest
```

### Step 2: Configuration Files

✅ **Already created:**
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test setup with mocks

### Step 3: Create Your First Test

Create `__tests__/components/Typography.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { AppText } from '../../src/components/Typography';

describe('AppText', () => {
  it('should render text correctly', () => {
    const { getByText } = render(<AppText>Hello World</AppText>);
    expect(getByText('Hello World')).toBeTruthy();
  });
});
```

### Step 4: Run Tests

```bash
npm test
```

---

## 🌐 Web Setup

### Good News! ✅

Your web app already has Jest and React Testing Library configured via `react-scripts`.

### Optional: Add MSW for Better API Mocking

```bash
cd web
npm install --save-dev msw
```

See `TESTING_FRAMEWORK_RECOMMENDATIONS.md` for MSW setup instructions.

### Run Tests

```bash
npm test
```

---

## ✅ Verification

### Backend
```bash
cd backend
npm test
# Should see: "No tests found" (until you add tests)
```

### Mobile
```bash
cd mobile
npm test
# Should see: "No tests found" (until you add tests)
```

### Web
```bash
cd web
npm test
# Should see Jest test runner
```

---

## 📚 Next Steps

1. Read `TESTING_FRAMEWORK_RECOMMENDATIONS.md` for detailed framework info
2. Read `TESTING_GUIDE.md` for test case examples
3. Start writing tests for your components/routes
4. Set up CI/CD to run tests automatically

---

## 🆘 Troubleshooting

### Backend: "Cannot find module 'mongodb-memory-server'"
```bash
cd backend
npm install --save-dev mongodb-memory-server
```

### Mobile: "Cannot find module 'jest-expo'"
```bash
cd mobile
npm install --save-dev jest-expo
```

### Mobile: Transform errors
Make sure `transformIgnorePatterns` in `jest.config.js` includes all Expo modules.

---

**You're all set! Start writing tests! 🧪**
