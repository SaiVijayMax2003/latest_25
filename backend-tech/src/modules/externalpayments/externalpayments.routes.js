import { paytmWebhookHandler } from './externalpayments.controller.js';

export default async function externalPaymentsRoutes(fastify, options) {
    // Paytm webhook endpoint - public access
    fastify.post('/paymenthook', {
        schema: {
            description: 'Paytm payment webhook endpoint',
            tags: ['External Payments'],
            summary: 'Process Paytm payment webhook',
            body: {
                type: 'object',
                properties: {
                    ORDERID: { type: 'string', description: 'Order ID from Paytm' },
                    TXNID: { type: 'string', description: 'Transaction ID from Paytm' },
                    STATUS: { type: 'string', description: 'Payment status' },
                    TXNAMOUNT: { type: 'string', description: 'Transaction amount' },
                    CURRENCY: { type: 'string', description: 'Currency code' },
                    RESPCODE: { type: 'string', description: 'Response code' },
                    RESPMSG: { type: 'string', description: 'Response message' },
                    BANKTXNID: { type: 'string', description: 'Bank transaction ID' },
                    GATEWAYNAME: { type: 'string', description: 'Gateway name' },
                    PAYMENTMODE: { type: 'string', description: 'Payment mode' },
                    MID: { type: 'string', description: 'Merchant ID' },
                    TXNDATE: { type: 'string', description: 'Transaction date' },
                    CHECKSUMHASH: { type: 'string', description: 'Checksum hash for verification' }
                },
                required: ['ORDERID', 'STATUS']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                order_id: { type: 'string' },
                                status: { type: 'string' },
                                transaction_id: { type: 'string' }
                            }
                        }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, paytmWebhookHandler);
} 