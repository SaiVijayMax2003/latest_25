import { logger } from '../utils/logger.js';

// Template mapping configuration
export const smsTemplates = {
    WELCOME: {
        template_id: process.env.MSG91_WELCOME_SMS_TEMPLATE_ID,
        requiredParams: ['phone', 'student_name'],
        message: "Hello ##var##, Welcome to NNIIT Family. Every great achievement begins with the first step - and you've just taken yours. Let's conquer your goals together one session at a time! GSNA Education Private Limited"
    },
    SCHEDULE_GENERATED: {
        template_id: process.env.MSG91_SCHEDULE_GENERATED_SMS_TEMPLATE_ID,
        requiredParams: ['phone', 'student_name'],
        message: "Hello ##var##, We have shared your learning schedule link on the email provided. Please confirm the schedule on the link to proceed with the on-boarding. - GSNA EDUCATION PRIVATE LIMITED"
    },
    ONBOARDING_COMPLETED: {
        template_id: process.env.MSG91_ONBOARDING_COMPLETED_SMS_TEMPLATE_ID,
        requiredParams: ['phone', 'student_name'],
        message: "Hello ##var##, Your on-boarding is completed. Please login to the portal to continue with your learning. - GSNA EDUCATION PRIVATE LIMITED"
    }
};

// Debug environment variables
logger.debug('Environment variables:', {
    MSG91_API_KEY: process.env.MSG91_API_KEY ? '***' : 'not set',
    MSG91_WELCOME_SMS_TEMPLATE_ID: process.env.MSG91_WELCOME_SMS_TEMPLATE_ID || 'not set',
    MSG91_SCHEDULE_GENERATED_SMS_TEMPLATE_ID: process.env.MSG91_SCHEDULE_GENERATED_SMS_TEMPLATE_ID || 'not set',
    MSG91_ONBOARDING_COMPLETED_SMS_TEMPLATE_ID: process.env.MSG91_ONBOARDING_COMPLETED_SMS_TEMPLATE_ID || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set'
});

export const smsConfig = {
    msg91: {
        apiKey: process.env.MSG91_API_KEY,
        baseUrl: 'https://control.msg91.com/api/v5/flow',
        countryCode: '+91',
        shortUrl: '0'
    }
};

// Debug logging for template IDs
logger.info('SMS template configuration:', {
    WELCOME: smsTemplates.WELCOME.template_id,
    SCHEDULE_GENERATED: smsTemplates.SCHEDULE_GENERATED.template_id,
    ONBOARDING_COMPLETED: smsTemplates.ONBOARDING_COMPLETED.template_id
});

// Validate required configuration
if (!smsConfig.msg91.apiKey) {
    logger.error('MSG91_API_KEY is not set in environment variables');
    throw new Error('MSG91_API_KEY is required');
}

// Function to validate template parameters
export function validateTemplateParams(templateName, params) {
    const template = smsTemplates[templateName];
    if (!template) {
        throw new Error(`Invalid template name: ${templateName}`);
    }

    const missingParams = template.requiredParams.filter(param => !params[param]);
    if (missingParams.length > 0) {
        throw new Error(`Missing required parameters for template ${templateName}: ${missingParams.join(', ')}`);
    }

    return true;
}

// Function to get template ID
export function getTemplateId(templateName) {
    const template = smsTemplates[templateName];
    if (!template) {
        throw new Error(`Invalid template name: ${templateName}`);
    }
    if (!template.template_id) {
        logger.error(`Template ID not configured for template: ${templateName}`);
        throw new Error(`Template ID not configured for template: ${templateName}`);
    }
    return template.template_id;
} 