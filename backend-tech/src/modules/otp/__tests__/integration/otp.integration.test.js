import request from 'supertest';
import app from '../../../app';
import { redis } from '../../../db/redis';

jest.mock('../../../db/redis');

describe('OTP Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /otp/send', () => {
        it('should send OTP successfully', async () => {
            const phoneNumber = '1234567890';
            const mockHash = 'mockhash123';

            redis.set.mockResolvedValue('OK');

            const response = await request(app)
                .post('/otp/send')
                .send({ phoneNumber });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.uniqueHash).toBeDefined();
        });

        it('should reject invalid phone number', async () => {
            const response = await request(app)
                .post('/otp/send')
                .send({ phoneNumber: '123' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('POST /otp/verify', () => {
        it('should verify OTP successfully', async () => {
            const uniqueHash = 'mockhash123';
            const otp = '123456';
            const phoneNumber = '1234567890';

            redis.get.mockResolvedValue(JSON.stringify({ otp, phoneNumber }));

            const response = await request(app)
                .post('/otp/verify')
                .send({ uniqueHash, otp });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.phoneNumber).toBe(phoneNumber);
        });

        it('should reject invalid OTP', async () => {
            const uniqueHash = 'mockhash123';
            const otp = '123456';
            const storedOtp = '654321';

            redis.get.mockResolvedValue(JSON.stringify({ otp: storedOtp, phoneNumber: '1234567890' }));

            const response = await request(app)
                .post('/otp/verify')
                .send({ uniqueHash, otp });

            expect(response.status).toBe(500);
            expect(response.body.error).toBeDefined();
        });
    });
}); 