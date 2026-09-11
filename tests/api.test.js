// API-level smoke tests via supertest. No DB needed for these: health/404
// are DB-free, and validation-error paths reject before touching a model.
const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  test('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('unknown route', () => {
  test('returns Section-35-safe 404 JSON, not a stack trace', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Route not found/);
  });
});

describe('POST /api/auth/register validation', () => {
  test('rejects mismatched passwords before touching the database', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Asha',
      email: 'asha@example.com',
      password: 'password1',
      confirmPassword: 'password2',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.join(' ')).toMatch(/do not match/);
  });

  test('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Asha',
      email: 'asha@example.com',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(res.status).toBe(400);
  });
});

describe('protected routes require authentication', () => {
  test('GET /api/finance/dashboard without a token is rejected', async () => {
    const res = await request(app).get('/api/finance/dashboard');
    expect(res.status).toBe(401);
  });

  test('GET /api/users/me without a token is rejected', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});
