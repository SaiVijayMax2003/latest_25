import axios from 'axios';
import { logger } from './logger.js';
import { emailConfig, validateTemplateParams, getTemplateId } from '../config/email.js';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function sendEmailViaMsg91(templateName, params) {
    try {
        // Validate template parameters first
        validateTemplateParams(templateName, params);
        
        // Get template ID
        const templateId = getTemplateId(templateName);
        
        // Validate email format
        if (!EMAIL_REGEX.test(params.email)) {
            throw new Error('Invalid email address format');
        }

        // Prepare email data
        const emailData = {
            domain: emailConfig.msg91.domain,
            from: {
                email: "noreply@operations.nniit.com",
                name: "NNIIT",
            },
            to: [
                {
                    email: params.email,
                    name: params.name || params.email.split('@')[0] // Use name if provided, otherwise use email username
                }
            ],
            template_id: templateId,
            variables: prepareTemplateVariables(templateName, params)
        };

        const response = await axios.post(
            emailConfig.msg91.baseUrl,
            emailData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    authkey: emailConfig.msg91.apiKey
                },
                timeout: 10000
            }
        );

        logger.info('Email sent via MSG91:', {
            templateName,
            email: params.email,
            templateId,
            responseStatus: response.status,
            messageId: response.data?.message_id
        });

        return {
            success: true,
            messageId: response.data?.message_id,
            response: response.data
        };

    } catch (error) {
        logger.error('Failed to send email via MSG91:', {
            error: error.message,
            templateName,
            email: params?.email,
            status: error.response?.status,
            data: error.response?.data
        });

        // Handle different types of errors
        if (error.response) {
            const { status, data } = error.response;
            
            switch (status) {
                case 401:
                    throw new Error('Invalid MSG91 API key');
                case 404:
                    throw new Error('Invalid MSG91 API endpoint');
                case 429:
                    throw new Error('MSG91 rate limit exceeded');
                case 400:
                    if (data.message?.includes('Invalid Recipient Email')) {
                        throw new Error('Invalid email address format');
                    }
                    if (data.message?.includes('template')) {
                        throw new Error(`Template error: ${data.message}`);
                    }
                    throw new Error(`MSG91 API error: ${data.message || 'Bad request'}`);
                default:
                    throw new Error(`MSG91 API error: ${data.message || 'Unknown error'}`);
            }
        } else if (error.request) {
            throw new Error('No response from MSG91 service - network error');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout - MSG91 service is taking too long to respond');
        }

        throw new Error(`Failed to send email: ${error.message}`);
    }
}

// Helper function to prepare template variables based on template type
function prepareTemplateVariables(templateName, params) {
    const variables = {};
    
    switch (templateName) {
        case 'WELCOME':
            variables.student_name = params.student_name;
            break;
        case 'LOGIN_CREDENTIALS':
            variables.student_name = params.student_name;
            variables.username = params.username;
            variables.password = params.password;
            variables.login_link = params.login_link;
            break;
        case 'SCHEDULE_GENERATED':  
            variables.student_name = params.student_name;
            variables.schedule_link = params.schedule_link;
            break;
        case 'INVOICE_GENERATED':
            variables.student_name = params.student_name;
            variables.invoice_link = params.invoice_link;
            break;
        case 'OPERATION_ASSIGNED':
            variables.ops_member_name = params.ops_member_name;
            variables.student_name = params.student_name;
            variables.student_id = params.student_id;
            variables.order_id = params.order_id;
            variables.assigned_date = params.assigned_date;
            break;
        case 'OPERATION_MENTIONED':
            variables.ops_member_name = params.ops_member_name;
            break;
        case 'OTP':
            variables.otp = params.otp;
            break;
            
        default:
            // For custom templates, use all provided params except email
            Object.keys(params).forEach(key => {
                if (key !== 'email') {
                    variables[key] = params[key];
                }
            });
    }
    
    return variables;
}