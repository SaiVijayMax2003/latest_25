import Transaction from './externalpayments.schema.js';
import { logger } from '../../utils/logger.js';

export const processPaytmWebhook = async (webhookData) => {
    console.log('🔧 SERVICE: Starting Paytm webhook processing...');
    console.log('📦 SERVICE: Input webhook data:', JSON.stringify(webhookData, null, 2));
    
    try {
        logger.info('Processing Paytm webhook data:', webhookData);
        
        const {
            ORDERID,
            MID,
            TXNID,
            TXNAMOUNT,
            CURRENCY,
            PAYMENTMODE,
            TXNDATE,
            STATUS,
            RESPCODE,
            RESPMSG,
            GATEWAYNAME,
            BANKTXNID,
            CHECKSUMHASH,
            LINKDESCRIPTION,
            PAYMENTEMAILID,
            PAYMENTMOBILENUMBER,
            CUSTID,
            MERC_UNQ_REF,
            TXNDATETIME,
            LINKNOTES,
            PAYMENTFORM
        } = webhookData;
        
        console.log('🔍 SERVICE: Key fields - ORDERID:', ORDERID, 'TXNID:', TXNID, 'STATUS:', STATUS);
        
        // Check if transaction already exists
        let transaction = await Transaction.findOne({ transaction_id: TXNID });
        
        if (transaction) {
            console.log('⚠️ SERVICE: Transaction already exists for TXNID:', TXNID);
            logger.info(`Transaction already exists for TXNID: ${TXNID}`);
            return transaction;
        }
        
        // Create new transaction record - store only webhook data
        const transactionData = {
            order_id: ORDERID,
            student_id: null, // Not validating against orders
            merchant_id: MID,
            transaction_id: TXNID,
            transaction_amount: parseFloat(TXNAMOUNT),
            currency: CURRENCY || 'INR',
            payment_mode: PAYMENTMODE,
            transaction_date: TXNDATE ? new Date(TXNDATE) : new Date(),
            status: STATUS,
            response_code: RESPCODE,
            response_message: RESPMSG,
            gateway_name: GATEWAYNAME,
            bank_transaction_id: BANKTXNID,
            checksum_hash: CHECKSUMHASH,
            link_description: LINKDESCRIPTION,
            payment_email: PAYMENTEMAILID,
            payment_mobile: PAYMENTMOBILENUMBER,
            customer_id: CUSTID,
            merchant_unique_ref: MERC_UNQ_REF,
            transaction_datetime: TXNDATETIME ? new Date(TXNDATETIME) : new Date(),
            link_notes: LINKNOTES,
            payment_form_data: PAYMENTFORM ? JSON.parse(PAYMENTFORM) : null,
            webhook_received: true,
            webhook_received_at: new Date(),
            payment_provider: 'paytm',
            raw_webhook_data: webhookData,
            updated_at: new Date()
        };
        
        transaction = new Transaction(transactionData);
        await transaction.save();
        console.log('SERVICE: Transaction saved, ID:', transaction._id);
        
        console.log('SERVICE: Webhook processed successfully');
        logger.info(`Paytm webhook processed successfully for order_id: ${ORDERID}, TXNID: ${TXNID}`);
        return transaction;
        
    } catch (error) {
        console.log('SERVICE: Error processing webhook:', error.message);
        logger.error('Error processing Paytm webhook:', error);
        throw error;
    }
}; 