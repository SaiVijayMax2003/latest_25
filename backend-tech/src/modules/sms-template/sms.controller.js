import { logger } from '../../utils/logger.js';
import { smsService } from './sms.service.js';
import { validateTemplateParams } from '../../config/sms-template.js';

class SmsController {
    constructor() {
        this.logger = logger;
    }

    async sendSms(request, reply) {
        try {
            const { template_name, params } = request.body;
            
            // Log the incoming request for debugging
            this.logger.debug('Received SMS request:', {
                template_name,
                params,
                body: request.body
            });

            // Validate template and parameters using sms.js functions
            try {
                validateTemplateParams(template_name, params);
            } catch (error) {
                this.logger.error('Template validation failed:', {
                    error: error.message,
                    template_name,
                    params
                });
                return reply.status(400).send({
                    success: false,
                    error: error.message
                });
            }

            const result = await smsService.sendSms(template_name, params);
            return reply.send(result);
        } catch (error) {
            this.logger.error('Error in sending SMS:', {
                error: error.message,
                stack: error.stack,
                body: request.body
            });
            
            // Handle specific error cases
            if (error.message.includes('Invalid template name')) {
                return reply.status(400).send({
                    success: false,
                    error: error.message
                });
            }
            
            if (error.message.includes('Missing required parameters')) {
                return reply.status(400).send({
                    success: false,
                    error: error.message
                });
            }

            if (error.message.includes('MSG91 API error')) {
                return reply.status(500).send({
                    success: false,
                    error: error.message
                });
            }

            if (error.message.includes('Invalid MSG91 API key')) {
                return reply.status(500).send({
                    success: false,
                    error: 'SMS service configuration error. Please contact support.'
                });
            }

            return reply.status(500).send({
                success: false,
                error: 'Failed to send SMS. Please try again later.'
            });
        }
    }
}

export default SmsController; 