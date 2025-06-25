const { test } = require('tap');
const build = require('../src/app');

test('OTP routes', async (t) => {
  const app = await build();

  t.test('Generate OTP for valid Indian number', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/generate-otp',
      payload: {
        phoneNumber: '919876543210',
      },
    });

    t.equal(response.statusCode, 200, 'returns status code 200');
    const data = JSON.parse(response.payload);
    t.ok(data.data.unique_id, 'returns unique identifier');
    t.ok(data.data.expiry, 'returns OTP expiry time');
  });

  t.test('Generate OTP for valid US number', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/generate-otp',
      payload: {
        phoneNumber: '12345678901',
      },
    });

    t.equal(response.statusCode, 200, 'returns status code 200');
    const data = JSON.parse(response.payload);
    t.ok(data.data.unique_id, 'returns unique identifier');
    t.ok(data.data.expiry, 'returns OTP expiry time');
  });

  t.test('Generate OTP for invalid number', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/generate-otp',
      payload: {
        phoneNumber: '12345',
      },
    });

    t.equal(response.statusCode, 400, 'returns status code 400');
  });

  t.test('Generate OTP for number with invalid country code', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/generate-otp',
      payload: {
        phoneNumber: '441234567890', // UK number (unsupported)
      },
    });

    t.equal(response.statusCode, 400, 'returns status code 400');
  });

  t.test('Verify OTP flow', async (t) => {
    // First generate OTP
    const generateResponse = await app.inject({
      method: 'POST',
      url: '/generate-otp',
      payload: {
        phoneNumber: '919876543210',
      },
    });

    const generateData = JSON.parse(generateResponse.payload);
    const uniqueId = generateData.data.unique_id;

    // Then verify with invalid OTP
    const verifyResponse = await app.inject({
      method: 'POST',
      url: '/verify-otp',
      payload: {
        unique_id: uniqueId,
        otp: '123456', // This will fail as it's not the actual OTP
      },
    });

    t.equal(verifyResponse.statusCode, 400, 'returns status code 400 for invalid OTP');

    // Try with invalid unique ID
    const invalidIdResponse = await app.inject({
      method: 'POST',
      url: '/verify-otp',
      payload: {
        unique_id: 'invalid-hash',
        otp: '123456',
      },
    });

    t.equal(invalidIdResponse.statusCode, 400, 'returns status code 400 for invalid unique ID');
  });

  t.teardown(async () => {
    await app.close();
  });
}); 