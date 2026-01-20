import request from 'supertest';
import app from '../../../src/server';

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('message', 'TFI Reviews API is running');
  });

  it('should return JSON format', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(typeof response.body).toBe('object');
  });
});
