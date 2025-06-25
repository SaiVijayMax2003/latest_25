import mongoose from 'mongoose';
import { transactions_collection } from '../../config/collection.js';

const transactionSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        index: true
    },
    student_id: {
        type: Number,
        required: true,
        index: true
    },
    merchant_id: {
        type: String
    },
    transaction_id: {
        type: String,
        unique: true,
        index: true
    },
    transaction_amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    payment_mode: {
        type: String
    },
    transaction_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['PENDING', 'TXN_SUCCESS', 'TXN_FAILURE', 'TXN_PENDING'],
        default: 'PENDING'
    },
    response_code: {
        type: String
    },
    response_message: {
        type: String
    },
    gateway_name: {
        type: String
    },
    bank_transaction_id: {
        type: String
    },
    checksum_hash: {
        type: String
    },
    link_description: {
        type: String
    },
    payment_email: {
        type: String
    },
    payment_mobile: {
        type: String
    },
    customer_id: {
        type: String
    },
    merchant_unique_ref: {
        type: String
    },
    transaction_datetime: {
        type: Date
    },
    link_notes: {
        type: String
    },
    payment_form_data: {
        type: mongoose.Schema.Types.Mixed
    },
    webhook_received: {
        type: Boolean,
        default: false
    },
    webhook_received_at: {
        type: Date
    },
    payment_provider: {
        type: String,
        default: 'paytm'
    },
    raw_webhook_data: {
        type: mongoose.Schema.Types.Mixed
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: transactions_collection
});

// Index for better query performance
transactionSchema.index({ order_id: 1 });
transactionSchema.index({ student_id: 1 });
transactionSchema.index({ transaction_id: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ created_at: -1 });
transactionSchema.index({ payment_provider: 1 });

export default mongoose.model('Transaction', transactionSchema); 