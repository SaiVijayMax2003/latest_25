import notificationService from './notification.service.js';

class NotificationController {
    async createNotification(request, reply) {
        try {
            const { type,userId,studentId, message, priority, } = request.body;

            const notification = await notificationService.createNotification({
                type,
                userId,
                studentId,
                message,
                priority,
                
            });

            return reply.code(201).send({
                success: true,
                message: "Notification created successfully",
                data: notification
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }

    async getAllNotifications(request, reply) {
        const limit = request.query && request.query.limit ? Number(request.query.limit) : 20;
        const notifications = await notificationService.getAllNotifications(limit);
        return reply.code(201).send({
            success: true,
            message: "Notifications retrieved successfully",
            data: notifications
        });
    }

    async getNotificationsByUserId(request, reply) {
        const { userId } = request.params;

        const notifications = await notificationService.getNotificationsByUserId(userId);

        return reply.code(201).send({
            success: true,
            message: "User notifications retrieved successfully",
            data: notifications
        });
    }

    async getUnreadNotificationsCount(request, reply) {
        const { userId } = request.params;

        const count = await notificationService.getUnreadNotificationsCount(userId);

        return reply.code(201).send({
            success: true,
            message: "Unread notifications count retrieved successfully",
            data: { count }
        });
    }

    async markNotificationAsRead(request, reply) {
        const { notificationId } = request.params;

        const notification = await notificationService.markNotificationAsRead(notificationId);

        return reply.code(201).send({
            success: true,
            message: "Notification marked as read successfully",
            data: notification
        });
    }

    async markAllNotificationsAsRead(request, reply) {
        const { userId } = request.params;

        const result = await notificationService.markAllNotificationsAsRead(userId);

        return reply.code(201).send({
            success: true,
            message: "All notifications marked as read successfully",
            data: result
        });
    }

    async deleteNotification(request, reply) {
        const { notificationId } = request.params;

        await notificationService.deleteNotification(notificationId);

        return reply.code(201).send({
            success: true,
            message: "Notification deleted successfully"
        });
    }

    async deleteAllUserNotifications(request, reply) {
        const { userId } = request.params;

        const result = await notificationService.deleteAllUserNotifications(userId);

        return reply.code(201).send({
            success: true,
            message: "All user notifications deleted successfully",
            data: result
        });
    }
}

export default new NotificationController();