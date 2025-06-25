import { OTPController } from './otp.controller.js';
import { sendOtpSchema, verifyOtpSchema } from './otp.schema.js';

export default async function otpRoutes(fastify) {
    const otpController = new OTPController(fastify);

    fastify.post('/send', {
        schema: {
            description: 'Send OTP to a phone number',
            tags: ['OTP'],
            body: {
                type: 'object',
                required: ['phoneNumber'],
                properties: {
                    phoneNumber: {
                        type: 'string',
                        pattern: '^[0-9]{10}$',
                        description: '10-digit phone number'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        uniqueHash: { type: 'string' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        details: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        details: { type: 'string' }
                    }
                }
            }
        }
    }, otpController.sendOTP.bind(otpController));

    fastify.post('/verify', {
        schema: {
            description: 'Verify OTP for a phone number',
            tags: ['OTP'],
            body: {
                type: 'object',
                required: ['uniqueHash', 'otp'],
                properties: {
                    uniqueHash: {
                        type: 'string',
                        pattern: '^otp:[a-f0-9]{64}$',
                        description: 'Unique hash received from send OTP endpoint'
                    },
                    otp: {
                        type: 'string',
                        pattern: '^[1-9][0-9]{3}$',
                        description: '4-digit OTP starting with 1-9'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        phoneNumber: { type: 'string' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        details: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        details: { type: 'string' }
                    }
                }
            }
        }
    }, otpController.verifyOTP.bind(otpController));
} 