import EmailController from './email.controller.js';

export default async function emailRoutes(fastify) {

    const emailcontroller = new EmailController();
    fastify.post('/send-template', {
        schema: {
            description: 'Send an email using a template',
            tags: ['email'],
            body: {
                type: 'object',
                required: ['template_name', 'params'],
                properties: {
                    template_name: {
                        type: 'string',
                        description: 'Name of the email template to use'
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
        },handler :emailcontroller.sendEmail.bind(emailcontroller)
    });
} 