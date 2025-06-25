import axios from 'axios';
import { logger } from './logger.js';
import { smsConfig } from '../config/sms.js';

export async function sendSmsViaMsg91(phoneNumber, otp) {
    try {
        // Remove any existing country code or + from the phone number
        //const cleanPhoneNumber = phoneNumber.replace(/^\+?91?/, '');
        const fullPhoneNumber = `${smsConfig.msg91.countryCode}${phoneNumber}`;
        
        const options = {
            method: 'POST',
            url: smsConfig.msg91.baseUrl,
            headers: {
                authkey: smsConfig.msg91.apiKey,
                accept: 'application/json',
                'content-type': 'application/json'
            },
            data: {
                template_id: smsConfig.msg91.templateId,
                short_url: smsConfig.msg91.shortUrl,
                recipients: [
                    {
                        mobiles: fullPhoneNumber,
                        var1: otp
                    }
                ]
            }
        };

        logger.debug('Sending SMS with options:', {
            url: options.url,
            mobile: fullPhoneNumber,   
            template_id: options.data.template_id,
            otp: otp
        });

        const response = await axios(options);
        
        // Log successful response
        logger.info('SMS API response:', {
            phoneNumber,
            response: response.data
        });

        return true;
    } catch (error) {
        // Log detailed error information
        logger.error('SMS API error:', {
            error: error.message,
            phoneNumber,
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
                throw new Error('Invalid API key');
            } else if (error.response.status === 404) {
                throw new Error('Invalid API endpoint');
            } else if (error.response.status === 429) {
                throw new Error('Rate limit exceeded');
            }
        } else if (error.request) {
            throw new Error('No response from SMS service');
        }

        throw new Error('Failed to send SMS');
    }
} 