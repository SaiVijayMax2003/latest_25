import crypto from 'crypto';
import { getRedisClient } from '../../db/redis.js';
import { sendSmsViaMsg91 } from '../../utils/sms-template.js';
import { logger } from '../../utils/logger.js';

// In-memory store for OTPs when Redis is disabled
const inMemoryStore = new Map();

// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of inMemoryStore.entries()) {
        if (now > value.expiry) {
            inMemoryStore.delete(key);
            logger.debug('Cleaned up expired OTP:', { key });
        }
    }
}, 5 * 60 * 1000);

class OTPService {
    constructor() {
        this.OTP_EXPIRY = 5 * 60; // 5 minutes in seconds
    }

    generateOTP() {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        logger.debug('Generated OTP:', { otp });
        return otp;
    }

    generateUniqueHash(phoneNumber) {
        const timestamp = Date.now();
        const data = `${phoneNumber}:${timestamp}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        const uniqueHash = `otp:${hash}`;
        logger.debug('Generated unique hash:', { phoneNumber, timestamp, uniqueHash });
        return uniqueHash;
    }

    async sendOTP(phoneNumber) {
        try {
            logger.debug('Starting OTP send process:', { phoneNumber });
            if (!phoneNumber) {
                throw new Error('Phone number is required');
            }
            if (phoneNumber.length !== 10) {
                throw new Error('Invalid phone number format. Must be 10 digits.');
            }
            if (!/^\d{10}$/.test(phoneNumber)) {
                throw new Error('Invalid phone number format. Must be 10 digits.');
            }   
            
            const otp = this.generateOTP();
            const uniqueHash = this.generateUniqueHash(phoneNumber);
            
            const redisClient = getRedisClient();
            if (redisClient) {
                logger.debug('Storing OTP in Redis:', { uniqueHash, otp, expiry: this.OTP_EXPIRY });
                await redisClient.set(uniqueHash, otp, 'EX', this.OTP_EXPIRY);
            } else {
                logger.debug('Storing OTP in memory:', { uniqueHash, otp });
                inMemoryStore.set(uniqueHash, { otp, phoneNumber, expiry: Date.now() + (this.OTP_EXPIRY * 1000) });
            }
            
            logger.debug('Sending OTP via SMS:', { phoneNumber, otp });
            await sendSmsViaMsg91('OTP', { phone: phoneNumber, otp });
            
            logger.info('OTP sent successfully:', { phoneNumber, uniqueHash });
            return {
                success: true,
                uniqueHash
            };
        } catch (error) {
            logger.error('Failed to send OTP:', { 
                phoneNumber, 
                error: error.message,
                stack: error.stack 
            });
            throw new Error('Failed to send OTP');
        }
    }

    async verifyOTP(uniqueHash, otp) {
        try {
            logger.debug('Starting OTP verification:', { uniqueHash, otp });
            
            let storedOTP;
            let phoneNumber;
            const redisClient = getRedisClient();
            
            if (redisClient) {
                storedOTP = await redisClient.get(uniqueHash);
                phoneNumber = uniqueHash.split(':')[2]; // Extract phone number from hash
            } else {
                const storedData = inMemoryStore.get(uniqueHash);
                if (!storedData) {
                    logger.warn('OTP not found in memory store:', { uniqueHash });
                    throw new Error('OTP expired or invalid');
                }
                
                if (Date.now() > storedData.expiry) {
                    inMemoryStore.delete(uniqueHash);
                    logger.warn('OTP expired in memory store:', { uniqueHash });
                    throw new Error('OTP expired or invalid');
                }
                
                storedOTP = storedData.otp;
                phoneNumber = storedData.phoneNumber;
            }
            
            logger.debug('Retrieved stored OTP:', { uniqueHash, storedOTP });
            
            if (!storedOTP) {
                logger.warn('OTP expired or not found:', { uniqueHash });
                throw new Error('OTP expired or invalid');
            }
            
            if (storedOTP !== otp) {
                logger.warn('Invalid OTP provided:', { uniqueHash, providedOTP: otp, storedOTP });
                throw new Error('Invalid OTP');
            }
            
            logger.debug('OTP verified successfully:', { uniqueHash, phoneNumber });
            
            // Delete the OTP
            if (redisClient) {
                await redisClient.del(uniqueHash);
            } else {
                inMemoryStore.delete(uniqueHash);
            }
            
            logger.debug('Deleted OTP after verification:', { uniqueHash });
            
            return {
                success: true,
                phoneNumber
            };
        } catch (error) {
            logger.error('Failed to verify OTP:', { 
                uniqueHash, 
                otp,
                error: error.message,
                stack: error.stack 
            });
            throw new Error('Failed to verify OTP');
        }
    }
}

// Create and export a singleton instance
export const otpService = new OTPService(); 