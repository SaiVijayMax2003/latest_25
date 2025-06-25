import { logger } from '../utils/logger.js';

// Template mapping configuration
export const emailTemplates = {
    WELCOME: {
        template_id: process.env.MSG91_WELCOME_TEMPLATE_ID, // Fixed: was templateId 
        requiredParams: ['student_name', 'email']
    },
    LOGIN_CREDENTIALS:{
        template_id: process.env.MSG91_LOGIN_CREDENTIALS_TEMPLATE_ID,
        requiredParams: ['student_name', 'username', 'password','login_link','email']
    },
    SCHEDULE_GENERATED:{
        template_id: process.env.MSG91_SCHEDULE_GENERATED_TEMPLATE_ID,
        requiredParams: ['student_name', 'schedule_link','email']
    },
    INVOICE_GENERATED:{
        template_id: process.env.MSG91_INVOICE_GENERATED_TEMPLATE_ID,
        requiredParams: ['student_name', 'invoice_link','email']
    },
    OPERATION_ASSIGNED:{
        template_id: process.env.MSG91_OPERATION_ASSIGNED_TEMPLATE_ID,
        requiredParams: ['ops_member_name', 'student_name','student_id','order_id','assigned_date','email']
    },
    OPERATION_MENTIONED:{
        template_id: process.env.MSG91_OPERATION_MENTIONED_TEMPLATE_ID,
        requiredParams: ['ops_member_name','email']
    }
   
};

export const emailConfig = {
    msg91: {
        apiKey: process.env.MSG91_API_KEY,
        baseUrl: 'https://control.msg91.com/api/v5/email/send',
        domain: process.env.MSG91_DOMAIN // Fixed: was MSG_DOMAIN
    }
};

// Debug logging for template IDs
logger.info('Email template configuration:', {
    WELCOME: emailTemplates.WELCOME.template_id,
    LOGIN_CREDENTIALS: emailTemplates.LOGIN_CREDENTIALS.template_id,
    SCHEDULE_GENERATED: emailTemplates.SCHEDULE_GENERATED.template_id,
    INVOICE_GENERATED: emailTemplates.INVOICE_GENERATED.template_id,
    OPERATION_ASSIGNED: emailTemplates.OPERATION_ASSIGNED.template_id,
    OPERATION_MENTIONED: emailTemplates.OPERATION_MENTIONED.template_id
});

// Validate required configuration
if (!emailConfig.msg91.apiKey) {
    logger.error('MSG91_API_KEY is not set in environment variables');
    throw new Error('MSG91_API_KEY is required');
}

if (!emailConfig.msg91.domain) {
    logger.error('MSG91_DOMAIN is not set in environment variables');
    throw new Error('MSG91_DOMAIN is required');
}

// Function to validate template parameters
export function validateTemplateParams(templateName, params) {
    const template = emailTemplates[templateName];
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
    const template = emailTemplates[templateName];
    if (!template) {
        throw new Error(`Invalid template name: ${templateName}`);
    }
    if (!template.template_id) {
        logger.error(`Template ID not configured for template: ${templateName}`);
        logger.error(`Available environment variables:`, {
            MSG91_INVOICE_GENERATED_TEMPLATE_ID: process.env.MSG91_INVOICE_GENERATED_TEMPLATE_ID,
            MSG91_OPERATION_MENTIONED_TEMPLATE_ID: process.env.MSG91_OPERATION_MENTIONED_TEMPLATE_ID,
            MSG91_OPERATION_ASSIGNED_TEMPLATE_ID: process.env.MSG91_OPERATION_ASSIGNED_TEMPLATE_ID,
            MSG91_SCHEDULE_GENERATED_TEMPLATE_ID: process.env.MSG91_SCHEDULE_GENERATED_TEMPLATE_ID,
            MSG91_LOGIN_CREDENTIALS_TEMPLATE_ID: process.env.MSG91_LOGIN_CREDENTIALS_TEMPLATE_ID,
            MSG91_WELCOME_TEMPLATE_ID: process.env.MSG91_WELCOME_TEMPLATE_ID
        });
        throw new Error(`Template ID not configured for template: ${templateName}`);
    }
    return template.template_id;
}
