import mongoose from 'mongoose';
import crypto from 'crypto';
import { leads_collection } from '../../config/collection.js';

const formSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    otp: {
        type: Number,
        required: false
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    pincode: {
        type: Number,
        required: [true, 'Pincode is required'],
        min: [100000, 'Pincode must be 6 digits'],
        max: [999999, 'Pincode must be 6 digits']
    },
    grade: {
        type: String,
        required: [true, 'Grade is required'],
        trim: true
    },
    lead_id: {
        type: String,
        unique: true
    },
    assigned_to: {
        type: Number,
        default: null
    },
    feedback: [{
        user_id: String,
        type: String,
        text: String,
        created_at: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'success', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true,
    collection: leads_collection
});

// Pre-save middleware to generate lead_id
formSchema.pre('save', function(next) {
    if (!this.lead_id) {
        // Create hash from name and phone number
        const hashInput = `${this.name}${this.phoneNumber}`;
        this.lead_id = crypto.createHash('sha256').update(hashInput).digest('hex');
    }
    next();
});

const Form = mongoose.model('Form', formSchema);

export default Form;
