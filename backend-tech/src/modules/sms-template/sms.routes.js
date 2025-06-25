import SmsController from './sms.controller.js';

export default async function smsRoutes(fastify) {

    const smsController = new SmsController();
    fastify.post('/send-template', {
        schema: {
            description: 'Send an SMS using a template',
            tags: ['sms'],
            body: {
                type: 'object',
                required: ['template_name', 'params'],
                properties: {
                    template_name: {
                        type: 'string',
                        description: 'Name of the SMS template to use'
                    },
                    params: {
                        type: 'object',
                        description: 'Parameters required for the template'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        },handler :smsController.sendSms.bind(smsController)
    });
} 