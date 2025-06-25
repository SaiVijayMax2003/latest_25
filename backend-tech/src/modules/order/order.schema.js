import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const orderSchema = new mongoose.Schema({
  student_id: {
    type: Number,
  },
  full_name: {
    type: String
  },
  order_id: {
    type: String,
    unique: true
  },
  onboarding_status: {
    type: String
  },
  payment_status: {
    type: String
  },
  payment_details: [{
    total_amount: { type: Number },
    amount_paid: { type: Number },
    amount_pending: { type: Number },
    payment_method: { type: String },
    transaction_id: { type: String },
    payment_date: { type: Date, default: Date.now },
    payment_url: { type: String },
    invoice_url: { type: String },
    message: { type: String }
  }],
  scheduling_status: {
    type: String
  },
  logs: [{
    type: Object
  }],
  assigned_to: {
    type: Object,
    properties: {
      user_id: { type: Number },
      name: { type: String },
      role: { type: String },
      assigned_at: { type: Date, default: Date.now }
    }
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  created_by: {
    user_id: { type: String },
    role: { type: String },
    username: { type: String },
    name: { type: String },
    created_at: { type: Date, default: Date.now }
  },
  sms_logs: [{
    type: { type: String },
    time: { type: Date, default: Date.now }
  }],
  email_logs: [{
    type: { type: String },
    time: { type: Date, default: Date.now }
  }],
  modified_at: {
    type: Date
  },
  access_ids: [{
    type: Number
  }],
  order_deleted: {
    type: Boolean,
    default: false
  },
  chat_messages: [{
    msg_id: { type: String, default: () => uuidv4() },
    user_id: { type: Number },
    name: { type: String },
    role: { type: String },
    message: { type: String },
    created_at: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false }
  }]
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
