import { processPaytmWebhook } from './externalpayments.service.js';
import { logger } from '../../utils/logger.js';

export const paytmWebhookHandler = async (request, reply) => {
    console.log('🔔 WEBHOOK RECEIVED - Paytm Webhook Handler Started');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Request URL:', request.url);
    console.log('📋 Request Method:', request.method);
    console.log('🔑 Request Headers:', JSON.stringify(request.headers, null, 2));
    
    try {
        const webhookData = request.body;
        
        console.log(' Raw Webhook Data Received:', JSON.stringify(webhookData, null, 2));
        console.log('Webhook Data Type:', typeof webhookData);
        console.log(' Webhook Data Length:', JSON.stringify(webhookData).length);
        
        logger.info('Received Paytm webhook:', webhookData);
        
        // Validate required webhook fields
        console.log(' Validating webhook data...');
        console.log('ORDERID present:', !!webhookData.ORDERID, 'Value:', webhookData.ORDERID);
        console.log('STATUS present:', !!webhookData.STATUS, 'Value:', webhookData.STATUS);
        console.log('TXNID present:', !!webhookData.TXNID, 'Value:', webhookData.TXNID);
        
        if (!webhookData.ORDERID || !webhookData.STATUS) {
            console.log('❌ VALIDATION FAILED - Missing required fields');
            console.log('❌ ORDERID missing:', !webhookData.ORDERID);
            console.log('❌ STATUS missing:', !webhookData.STATUS);
            
            return reply.code(400).send({
                success: false,
                message: 'ORDERID and STATUS are required fields in webhook data'
            });
        }
        
        console.log('VALIDATION PASSED - Required fields present');
        
        // Process the webhook
        console.log('Processing webhook with service...');
        const transaction = await processPaytmWebhook(webhookData);
        console.log('Webhook processed successfully');
        console.log('Transaction saved:', transaction ? 'Yes' : 'No');
        console.log('Transaction ID:', transaction?._id);
        
        // Return success response to Paytm
        const response = {
            success: true,
            message: 'Webhook processed successfully',
            data: {
                order_id: webhookData.ORDERID,
                status: webhookData.STATUS,
                transaction_id: webhookData.TXNID
            }
        };
        
        console.log('📤 Sending success response to Paytm:', JSON.stringify(response, null, 2));
        console.log('🔔 WEBHOOK PROCESSING COMPLETED SUCCESSFULLY');
        
        return reply.code(200).send(response);
        
    } catch (error) {
        console.log('💥 ERROR OCCURRED during webhook processing');
        console.log('Error Type:', error.constructor.name);
        console.log('Error Message:', error.message);
        console.log('Error Stack:', error.stack);
        
        request.log.error('Error processing Paytm webhook:', error);
        
        // Return error response to Paytm
        const errorResponse = {
            success: false,
            message: 'Error processing webhook',
            error: error.message
        };
        
        console.log('📤 Sending error response to Paytm:', JSON.stringify(errorResponse, null, 2));
        console.log('🔔 WEBHOOK PROCESSING FAILED');
        
        return reply.code(500).send(errorResponse);
    }
}; 