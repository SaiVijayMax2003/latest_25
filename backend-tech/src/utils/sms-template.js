import axios from 'axios';
import { logger } from './logger.js';
import { smsConfig, getTemplateId } from '../config/sms-template.js';

export async function sendSmsViaMsg91(templateName, params) {
    try {
        // Get template ID for the given template name
        const templateId = getTemplateId(templateName);
        
        // Remove any existing country code or + from the phone number
        const fullPhoneNumber = `${smsConfig.msg91.countryCode}${params.phone}`;
        
        // Prepare variables based on template using the same pattern as email
        const variables = prepareTemplateVariables(templateName, params);
        
        const options = {
            method: 'POST',
            url: smsConfig.msg91.baseUrl,
            headers: {
                authkey: smsConfig.msg91.apiKey,
                accept: 'application/json',
                'content-type': 'application/json'
            },
            data: {
                template_id: templateId,
                short_url: smsConfig.msg91.shortUrl,
                recipients: [
                    {
                        mobiles: fullPhoneNumber,
                        ...variables
                    }
                ]
            }
        };

        logger.debug('Sending SMS with options:', {
            url: options.url,
            mobile: fullPhoneNumber,   
            template_id: options.data.template_id,
            template_name: templateName,
            variables: variables
        });

        const response = await axios(options);
        
        // Log successful response
        logger.info('SMS API response:', {
            phoneNumber: params.phone,
            templateName,
            response: response.data
        });

        return {
            success: true,
            messageId: response.data?.request_id || 'unknown',
            response: response.data
        };
    } catch (error) {
        // Log detailed error information
        logger.error('SMS API error:', {
            error: error.message,
            phoneNumber: params?.phone,
            templateName,
            status: error.response?.status,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method
            }
        });

        // Check for specific error cases
        if (error.response) {
            if (error.response.status === 401) {
                throw new Error('Invalid MSG91 API key');
            } else if (error.response.status === 404) {
                throw new Error('Invalid MSG91 API endpoint');
            } else if (error.response.status === 429) {
                throw new Error('Rate limit exceeded');
            }
        } else if (error.request) {
            throw new Error('No response from SMS service');
        }

        throw new Error('MSG91 API error: Failed to send SMS');
    }
}

// Helper function to prepare template variables based on template type
function prepareTemplateVariables(templateName, params) {
    const variables = {};
    
    switch (templateName) {
        case 'WELCOME':
            variables.var = params.student_name;
            break;
        case 'SCHEDULE_GENERATED':
            variables.var= params.student_name;
            break;
        case 'OTP':
            variables.var= params.otp;
            break;
        case 'ONBOARDING_COMPLETED':
            variables.var= params.student_name;
            break;
        default:
            // For custom templates, use all provided params except phone
            Object.keys(params).forEach(key => {
                if (key !== 'phone') {
                    const varIndex = Object.keys(variables).length + 1;
                    variables[`var${varIndex}`] = params[key];
                }
            });
    }
    
    return variables;
} 