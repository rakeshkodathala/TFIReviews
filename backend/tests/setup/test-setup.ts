import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set environment variable for tests
  process.env.MONGODB_URI = mongoUri;
  
  // Connect if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
}, 30000); // Increase timeout for MongoDB Memory Server startup

afterAll(async () => {
  // Clean up
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

afterEach(async () => {
  // Clear database between tests
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
