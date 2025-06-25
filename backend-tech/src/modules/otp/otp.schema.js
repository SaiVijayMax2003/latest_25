import Joi from 'joi';

export const otpRequestSchema = Joi.object({
    phoneNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be 10 digits',
            'any.required': 'Phone number is required'
        })
});

export const otpVerificationSchema = Joi.object({
    phoneNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required(),
    otp: Joi.string()
        .pattern(/^[0-9]{4}$/)
        .required()
        .messages({
            'string.pattern.base': 'OTP must be 4 digits',
            'any.required': 'OTP is required'
        })
});

export const sendOtpSchema = Joi.object({
    phoneNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be 10 digits',
            'any.required': 'Phone number is required'
        })
});

export const verifyOtpSchema = Joi.object({
    uniqueHash: Joi.string()
        .pattern(/^otp:[a-f0-9]{64}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid unique hash format',
            'any.required': 'Unique hash is required'
        }),
    otp: Joi.string()
        .pattern(/^[1-9][0-9]{3}$/)
        .required()
        .messages({
            'string.pattern.base': 'OTP must be a 4-digit number starting with 1-9',
            'any.required': 'OTP is required'
        })
});

// JSON Schema for Swagger documentation
export const swaggerSchemas = {
    sendOtp: {
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
    verifyOtp: {
        type: 'object',
        required: ['uniqueHash', 'otp'],
        properties: {
            uniqueHash: {
                type: 'string',
                description: 'Unique hash received from send OTP endpoint'
            },
            otp: {
                type: 'string',
                pattern: '^[1-9][0-9]{3}$',
                description: '4-digit OTP'
            }
        }
    }
}; 