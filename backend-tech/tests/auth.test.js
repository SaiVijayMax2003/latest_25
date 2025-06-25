const { test } = require('tap');
const build = require('../src/app');

test('Authentication routes', async (t) => {
  const app = await build();

  t.test('Register new user', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      payload: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    });

    t.equal(response.statusCode, 201, 'returns status code 201');
    const data = JSON.parse(response.payload);
    t.ok(data.data.token, 'returns a token');
    t.ok(data.data.user, 'returns user data');
    t.equal(data.data.user.email, 'test@example.com', 'returns correct email');
  });

  t.test('Login with valid credentials', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    t.equal(response.statusCode, 200, 'returns status code 200');
    const data = JSON.parse(response.payload);
    t.ok(data.data.token, 'returns a token');
    t.ok(data.data.user, 'returns user data');
  });

  t.test('Login with invalid credentials', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    });

    t.equal(response.statusCode, 401, 'returns status code 401');
  });

  t.teardown(async () => {
    await app.close();
  });
}); 