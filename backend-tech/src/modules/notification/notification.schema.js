import mongoose from 'mongoose';
import { notification_collection } from '../../config/collection.js';
const notificationSchema = new mongoose.Schema({

    userId: {
        type: String,
        required: false,
        description: 'ID of the user to receive the notification'
    },
    studentId: {
        type: String,
        description: 'Optional ID of the associated student'
    },
    type: {
        type: String,
        required: false,
        description: 'Type of notification (heading, can be anything)'
    },
    message: {
        type: String,
        required: false,
        description: 'Notification message content'
    },
    priority: {
        type: String,
        required: false,
        enum: ['low', 'medium', 'high'],
        description: 'Priority level of the notification'
    },
    notificationId: {
        type: String,
        required: false,
        description: 'Notification ID'
    },
    isRead: {
        type: Boolean,
        default: false,
        description: 'Whether the notification has been read'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        description: 'When the notification was created'
    }
}, {
    collection: notification_collection,
    timestamps: true
});

// Create indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

