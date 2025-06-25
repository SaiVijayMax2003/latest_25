import { otpService } from './otp.service.js';
import { sendOtpSchema, verifyOtpSchema } from './otp.schema.js';
import { logger } from '../../utils/logger.js';

export class OTPController {
    constructor(fastify) {
        if (!fastify) {
            throw new Error('Fastify instance is required');
        }
        this.fastify = fastify;
        this.logger = fastify.log;
    }

    async sendOTP(req, reply) {
        try {
            const { phoneNumber } = req.body;
            
            // Validate request body using Joi
            const validationResult = sendOtpSchema.validate(req.body);
            if (validationResult.error) {
                this.logger.error('Validation error:', validationResult.error.details);
                return reply.status(400).send({ 
                    success: false,
                    error: 'Invalid phone number. Must be 10 digits.'
                });
            }

            const result = await otpService.sendOTP(phoneNumber);
            return reply.send(result);
        } catch (error) {
            this.logger.error('Error in sending OTP:', error);
            // Check if it's a phone number validation error
            if (error.message.includes('Invalid phone number') || error.message.includes('Phone number is required')) {
                return reply.status(400).send({ 
                    success: false,
                    error: error.message
                });
            }
            return reply.status(500).send({ 
                success: false,
                error: 'Failed to send OTP. Please try again later.'
            });
        }
    }

    async verifyOTP(req, reply) {
        try {
            const { uniqueHash, otp } = req.body;
            
            // Validate request body using Joi
            const validationResult = verifyOtpSchema.validate(req.body);
            if (validationResult.error) {
                this.logger.error('Validation error:', validationResult.error.details);
                return reply.status(400).send({ 
                    success: false,
                    error: 'Invalid request format'
                });
            }

            const result = await otpService.verifyOTP(uniqueHash, otp);
            return reply.send(result);
        } catch (error) {
            this.logger.error('Error in verifyOTP:', error);
            return reply.status(500).send({ 
                success: false,
                error: 'Unable to verify OTP. Please check your OTP and try again.'
            });
        }
    }
} 