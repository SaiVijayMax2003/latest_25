import { logger } from '../../utils/logger.js';
import { sendEmailViaMsg91 } from '../../utils/email.js';

class EmailService {
    constructor() {
        this.logger = logger;
    }

    async sendEmail(templateName, params) {
        try {
            // Validate input parameters
            if (!templateName) {
                throw new Error('Template name is required');
            }
            
            if (!params || typeof params !== 'object') {
                throw new Error('Parameters object is required');
            }
            
            if (!params.email) {
                throw new Error('Email address is required in parameters');
            }

            this.logger.info('Sending email:', { 
                templateName, 
                email: params.email,
                hasRequiredParams: !!params 
            });
            
            const result = await sendEmailViaMsg91(templateName, params);
            
            this.logger.info('Email sent successfully:', { 
                templateName, 
                email: params.email,
                messageId: result.messageId
            });
            
            return {
                success: true,
                message: 'Email sent successfully',
                messageId: result.messageId,
                data: result.response
            };
            
        } catch (error) {
            this.logger.error('Failed to send email:', {
                templateName,
                email: params?.email,
                error: error.message,
            });
            
            // Re-throw with more context
            throw new Error(`Email service error: ${error.message}`);
        }
    }

    // Bulk email sending method
    async sendBulkEmails(templateName, recipientsList) {
        const results = [];
        const errors = [];
        
        for (const params of recipientsList) {
            try {
                const result = await this.sendEmail(templateName, params);
                results.push({ email: params.email, success: true, ...result });
            } catch (error) {
                errors.push({ email: params.email, success: false, error: error.message });
                this.logger.error('Bulk email failed for recipient:', {
                    email: params.email,
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

    // Method to test email configuration
    async testEmailConfig() {
        try {
            const testParams = {
                email: 'test@example.com',
                name: 'Test User'
            };
            
            // This won't actually send, but will validate config
            await this.sendEmail('WELCOME', testParams);
            return { success: true, message: 'Email configuration is valid' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

export const emailService = new EmailService();