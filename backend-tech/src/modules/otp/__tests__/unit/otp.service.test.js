import { otpService } from '../otp.service.js';
import { getRedisClient } from '../../../db/redis.js';
import { sendSmsViaMsg91 } from '../../../utils/sms.js';
import { logger } from '../../../utils/logger.js';

// Mock dependencies
jest.mock('../../../db/redis.js');
jest.mock('../../../utils/sms.js');
jest.mock('../../../utils/logger.js');

describe('OTPService', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('generateOTP', () => {
        it('should generate a 4-digit OTP', () => {
            const otp = otpService.generateOTP();
            expect(otp).toMatch(/^[1-9][0-9]{3}$/); // 4 digits, first digit 1-9
        });
    });

    describe('generateUniqueHash', () => {
        it('should generate a unique hash for a phone number', () => {
            const phoneNumber = '1234567890';
            const hash = otpService.generateUniqueHash(phoneNumber);
            expect(hash).toMatch(/^otp:[a-f0-9]{64}$/); // otp: followed by 64 hex chars
        });
    });

    describe('sendOTP', () => {
        it('should send OTP and store it in Redis', async () => {
            const phoneNumber = '1234567890';
            const mockOTP = '1234';
            const mockHash = 'otp:testhash123';

            // Mock the generateOTP and generateUniqueHash methods
            jest.spyOn(otpService, 'generateOTP').mockReturnValue(mockOTP);
            jest.spyOn(otpService, 'generateUniqueHash').mockReturnValue(mockHash);

            // Mock Redis set method
            getRedisClient().set.mockResolvedValue('OK');

            // Mock SMS sending
            sendSmsViaMsg91.mockResolvedValue(true);

            const result = await otpService.sendOTP(phoneNumber);

            expect(result).toEqual({
                success: true,
                uniqueHash: mockHash
            });

            expect(getRedisClient().set).toHaveBeenCalledWith(
                mockHash,
                mockOTP,
                'EX',
                300
            );

            expect(sendSmsViaMsg91).toHaveBeenCalledWith(phoneNumber, mockOTP);
        });

        it('should handle Redis errors', async () => {
            const phoneNumber = '1234567890';
            const mockError = new Error('Redis error');

            // Mock Redis set to throw error
            getRedisClient().set.mockRejectedValue(mockError);

            await expect(otpService.sendOTP(phoneNumber)).rejects.toThrow('Failed to send OTP');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('verifyOTP', () => {
        it('should verify OTP successfully', async () => {
            const uniqueHash = 'otp:testhash123';
            const otp = '1234';
            const phoneNumber = '1234567890';

            // Mock Redis get and del methods
            getRedisClient().get.mockResolvedValue(otp);
            getRedisClient().del.mockResolvedValue(1);

            const result = await otpService.verifyOTP(uniqueHash, otp);

            expect(result).toEqual({
                success: true,
                phoneNumber
            });

            expect(getRedisClient().get).toHaveBeenCalledWith(uniqueHash);
            expect(getRedisClient().del).toHaveBeenCalledWith(uniqueHash);
        });

        it('should handle expired OTP', async () => {
            const uniqueHash = 'otp:testhash123';
            const otp = '1234';

            // Mock Redis get to return null (expired)
            getRedisClient().get.mockResolvedValue(null);

            await expect(otpService.verifyOTP(uniqueHash, otp)).rejects.toThrow('OTP expired or invalid');
        });

        it('should handle invalid OTP', async () => {
            const uniqueHash = 'otp:testhash123';
            const otp = '1234';
            const storedOTP = '5678';

            // Mock Redis get to return different OTP
            getRedisClient().get.mockResolvedValue(storedOTP);

            await expect(otpService.verifyOTP(uniqueHash, otp)).rejects.toThrow('Invalid OTP');
        });

        it('should handle Redis errors during verification', async () => {
            const uniqueHash = 'otp:testhash123';
            const otp = '1234';
            const mockError = new Error('Redis error');

            // Mock Redis get to throw error
            getRedisClient().get.mockRejectedValue(mockError);

            await expect(otpService.verifyOTP(uniqueHash, otp)).rejects.toThrow('Failed to verify OTP');
            expect(logger.error).toHaveBeenCalled();
        });
    });
}); 