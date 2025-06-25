import Notification from './notification.schema.js';
import mongoose from 'mongoose';
import notificationSocket from './notification.websocket.js';
import { logger } from '../../utils/logger.js';

class NotificationService {
    // Create a new notification
    async createNotification(notificationData) {
        try {
           
            const validPriorities = ['low', 'medium', 'high'];
            if (!validPriorities.includes(notificationData.priority)) {
                throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
            }

            const notification = await Notification.create(notificationData);
            
            // Send real-time notification to the user
            if (notification.userId) {
                try {
                    await notificationSocket.sendNotification(notification.userId, {
                        id: notification._id,
                        type: notification.type,
                        priority: notification.priority,
                        message: notification.message,
                        isRead: notification.isRead,
                        createdAt: notification.createdAt,
                    });
                    logger.info(`Real-time notification sent to user ${notification.userId}`);
                } catch (socketError) {
                    logger.error(`Failed to send real-time notification to user ${notification.userId}:`, socketError);
                    // Don't throw the error, just log it - we still want to return the created notification
                }
            }

            return notification;
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new Error(`Validation error: ${error.message}`);
            }
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    // Create notifications for different user types
    async createUserTypeNotifications(data) {
        try {
            const { studentId, studentName, userId, notificationType, createdBy } = data;
            const notifications = [];

            // Create notification for operation team
            if (userId) {
                const operationTeamNotification = {
                    userId: userId,
                    studentId: studentId,
                    type: 'alert',
                    priority: 'medium',
                    message: `New student ${studentName} has been enrolled by ${createdBy || 'admin'}.`,
                    notificationId: `op_${Date.now()}_${userId}`
                };
                notifications.push(await this.createNotification(operationTeamNotification));
            }

            // Create notification for student
            if (studentId) {
                const studentNotification = {
                    userId: studentId,
                    studentId: studentId,
                    type: 'message',
                    priority: 'high',
                    message: `Congratulations ${studentName}! You have been successfully enrolled. Welcome to our platform!`,
                    notificationId: `student_${Date.now()}_${studentId}`
                };
                notifications.push(await this.createNotification(studentNotification));
            }

            return notifications;
        } catch (error) {
            throw new Error(`Failed to create user type notifications: ${error.message}`);
        }
    }

    // Get all notifications for a user
    async getUserNotifications(userId) {
        try {
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 });
            return notifications;
        } catch (error) {
            logger.error(`Error fetching notifications for user ${userId}:`, error);
            throw new Error(`Failed to fetch notifications: ${error.message}`);
        }
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            if (!notificationId) {
                throw new Error("Notification ID is required");
            }

            const notification = await Notification.findOneAndUpdate(
                { notificationId: notificationId },
                { isRead: true },
                { new: true }
            );

            if (!notification) {
                throw new Error("Notification not found");
            }

            // Notify client about status change
            if (notification.userId) {
                try {
                    await notificationSocket.notifyStatusChange(notification.userId, notification._id, 'read');
                    await notificationSocket.sendUnreadCount(notification.userId);
                    logger.info(`Notification ${notificationId} marked as read for user ${notification.userId}`);
                } catch (socketError) {
                    logger.error(`Failed to send status update for notification ${notificationId}:`, socketError);
                    // Don't throw the error, just log it
                }
            }

            return notification;
        } catch (error) {
            logger.error(`Error marking notification ${notificationId} as read:`, error);
            throw new Error(`Failed to mark notification as read: ${error.message}`);
        }
    }

    // Delete a notification
    async deleteNotification(notificationId) {
        try {
            if (!notificationId) {
                throw new Error("Notification ID is required");
            }

            const notification = await Notification.findOneAndDelete({ notificationId: notificationId });

            if (!notification) {
                throw new Error("Notification not found");
            }

            // Notify client about deletion
            if (notification.userId) {
                try {
                    await notificationSocket.notifyStatusChange(notification.userId, notification._id, 'deleted');
                    await notificationSocket.sendUnreadCount(notification.userId);
                    logger.info(`Notification ${notificationId} deleted for user ${notification.userId}`);
                } catch (socketError) {
                    logger.error(`Failed to send deletion update for notification ${notificationId}:`, socketError);
                    // Don't throw the error, just log it
                }
            }

            return notification;
        } catch (error) {
            logger.error(`Error deleting notification ${notificationId}:`, error);
            throw new Error(`Failed to delete notification: ${error.message}`);
        }
    }

    // Get unread notifications count
    async getUnreadNotificationsCount(userId) {
        try {
            const count = await Notification.countDocuments({
                userId,
                isRead: false
            });
            return count;
        } catch (error) {
            logger.error(`Error getting unread count for user ${userId}:`, error);
            throw new Error(`Failed to get unread notifications count: ${error.message}`);
        }
    }

    // Mark all notifications as read for a user
    async markAllNotificationsAsRead(userId) {
        try {
            const result = await Notification.updateMany(
                { userId, isRead: false },
                { isRead: true }
            );

            // Notify client about status change
            try {
                await notificationSocket.notifyStatusChange(userId, 'all', 'read');
                await notificationSocket.sendUnreadCount(userId);
                logger.info(`All notifications marked as read for user ${userId}`);
            } catch (socketError) {
                logger.error(`Failed to send status update for all notifications:`, socketError);
                // Don't throw the error, just log it
            }

            return result;
        } catch (error) {
            logger.error(`Error marking all notifications as read for user ${userId}:`, error);
            throw new Error(`Failed to mark all notifications as read: ${error.message}`);
        }
    }

    // Get notifications by type
    async getNotificationsByType(userId, type) {
        try {
            const notifications = await Notification.find({
                userId,
                type: type
            })
            .sort({ createdAt: -1 });
            return notifications;
        } catch (error) {
            logger.error(`Error fetching notifications of type ${type} for user ${userId}:`, error);
            throw new Error(`Failed to get notifications by type: ${error.message}`);
        }
    }

    // Get notifications by priority
    async getNotificationsByPriority(userId, priority) {
        try {
            const notifications = await Notification.find({
                userId,
                priority: priority
            })
            .sort({ createdAt: -1 });
            return notifications;
        } catch (error) {
            logger.error(`Error fetching notifications of priority ${priority} for user ${userId}:`, error);
            throw new Error(`Failed to get notifications by priority: ${error.message}`);
        }
    }

    // Delete old notifications
    async deleteOldNotifications(days) {
        try {
            const date = new Date();
            date.setDate(date.getDate() - days);

            const result = await Notification.deleteMany({
                createdAt: { $lt: date }
            });
            logger.info(`Deleted ${result.deletedCount} old notifications`);
            return result.deletedCount;
        } catch (error) {
            logger.error('Error deleting old notifications:', error);
            throw new Error(`Failed to delete old notifications: ${error.message}`);
        }
    }

    // Get all notifications
    /**
     * Get all notifications, with optional limit (default 20)
     * @param {number} [limit=20] - Number of notifications to fetch
     */
    async getAllNotifications(limit = 20) {
        try {
            const notifications = await Notification.find()
                .sort({ createdAt: -1 })
                .limit(Number(limit) || 20);
            return notifications;
        } catch (error) {
            logger.error('Error fetching all notifications:', error);
            throw new Error(`Failed to get all notifications: ${error.message}`);
        }
    }

    // Get notifications by user ID
    async getNotificationsByUserId(userId) {
        try {
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 });
            return notifications;
        } catch (error) {
            logger.error(`Error fetching notifications for user ${userId}:`, error);
            throw new Error(`Failed to get notifications by user ID: ${error.message}`);
        }
    }

    // Delete all notifications for a user
    async deleteAllUserNotifications(userId) {
        try {
            const result = await Notification.deleteMany({ userId });
            
            // Notify client about deletion
            try {
                await notificationSocket.notifyStatusChange(userId, 'all', 'deleted');
                await notificationSocket.sendUnreadCount(userId);
                logger.info(`All notifications deleted for user ${userId}`);
            } catch (socketError) {
                logger.error(`Failed to send deletion update for all notifications:`, socketError);
                // Don't throw the error, just log it
            }

            return result;
        } catch (error) {
            logger.error(`Error deleting all notifications for user ${userId}:`, error);
            throw new Error(`Failed to delete all notifications: ${error.message}`);
        }
    }
}

export default new NotificationService(); 
