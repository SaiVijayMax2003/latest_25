import { logger } from '../../utils/logger.js';
import { sendSmsViaMsg91 } from '../../utils/sms-template.js';

class SmsService {
    constructor() {
        this.logger = logger;
    }

    async sendSms(templateName, params) {
        try {
            // Validate input parameters
            if (!templateName) {
                throw new Error('Template name is required');
            }
            
            if (!params || typeof params !== 'object') {
                throw new Error('Parameters object is required');
            }
            
            if (!params.phone) {
                throw new Error('Phone number is required in parameters');
            }

            this.logger.info('Sending SMS:', { 
                templateName, 
                phone: params.phone,
                hasRequiredParams: !!params 
            });
            
            const result = await sendSmsViaMsg91(templateName, params);
            
            this.logger.info('SMS sent successfully:', { 
                templateName, 
                phone: params.phone,
                messageId: result.messageId
            });
            
            return {
                success: true,
                message: 'SMS sent successfully',
                messageId: result.messageId,
                data: result.response
            };
            
        } catch (error) {
            this.logger.error('Failed to send SMS:', {
                templateName,
                phone: params?.phone,
                error: error.message,
            });
            
            // Re-throw with more context
            throw new Error(`SMS service error: ${error.message}`);
        }
    }

    // Bulk SMS sending method
    async sendBulkSms(templateName, recipientsList) {
        const results = [];
        const errors = [];
        
        for (const params of recipientsList) {
            try {
                const result = await this.sendSms(templateName, params);
                results.push({ phone: params.phone, success: true, ...result });
            } catch (error) {
                errors.push({ phone: params.phone, success: false, error: error.message });
                this.logger.error('Bulk SMS failed for recipient:', {
                    phone: params.phone,
                    error: error.message
                });
            }
        }
        
        return {
            totalSent: results.length,
            totalFailed: errors.length,
            results,
            errors
        };
    }

    // Method to test SMS configuration
    async testSmsConfig() {
        try {
            const testParams = {
                phone: '9999999999',
                otp: '123456'
            };
            
            // This won't actually send, but will validate config
            await this.sendSms('OTP', testParams);
            return { success: true, message: 'SMS configuration is valid' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

export const smsService = new SmsService(); 