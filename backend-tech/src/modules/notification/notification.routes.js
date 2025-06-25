import notificationController from './notification.controller.js';

export default async function notificationRoutes(fastify) {
    // Create a new notification
    fastify.post('/createNotification', {
        schema: {
            description: 'Create a new notification',
            tags: ['notifications'],
            body: {
                type: 'object',
                required: ['type', 'message', 'priority', 'userId'],
                properties: {
                    type: {
                        type: 'string',
                        description: 'Type of notification (heading, can be anything)'
                    },
                    message: {
                        type: 'string',
                        description: 'Notification message content'
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        description: 'Priority level of the notification'
                    },
                    userId: {
                        type: 'string',
                        description: 'ID of the user to receive the notification'
                    },
                    studentId: {
                        type: 'string',
                        description: 'Optional ID of the associated student'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await notificationController.createNotification(request, reply);
    });

    // Get all notifications
    fastify.get('/getAllNotifications', {
        schema: {
            description: 'Get all notifications',
            tags: ['notifications'],
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', minimum: 1, description: 'Number of notifications to fetch (default 20)' }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string' },
                                    message: { type: 'string' },
                                    priority: { type: 'string' },
                                    userId: { type: 'string' },
                                    studentId: { type: 'string' },
                                    isRead: { type: 'boolean' },
                                    createdAt: { type: 'string', format: 'date-time' },
                                    notificationId: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await notificationController.getAllNotifications(request, reply);
    });

    // Get notifications by user ID
    fastify.get('/user/:userId', {
        schema: {
            description: 'Get notifications for a specific user',
            tags: ['notifications'],
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: {
                        type: 'string',
                        description: 'ID of the user'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string' },
                                    message: { type: 'string' },
                                    priority: { type: 'string' },
                                    userId: { type: 'string' },
                                    studentId: { type: 'string' },
                                    notificationId: { type: 'string' },
                                    isRead: { type: 'boolean' },
                                    createdAt: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await notificationController.getNotificationsByUserId(request, reply);
    });

    // Get unread notifications count
    fastify.get('/unread/count/:userId', {
        schema: {
            description: 'Get count of unread notifications for a user',
            tags: ['notifications'],
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: {
                        type: 'string',
                        description: 'ID of the user'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                count: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await notificationController.getUnreadNotificationsCount(request, reply);
    });

    // Mark notification as read
    fastify.patch('/:notificationId/read', {
        schema: {
            description: 'Mark a notification as read',
            tags: ['notifications'],
            params: {
                type: 'object',
                required: ['notificationId'],
                properties: {
                    notificationId: {
                        type: 'string',
                        description: 'ID of the notification'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                message: { type: 'string' },
                                priority: { type: 'string' },
                                userId: { type: 'string' },
                                studentId: { type: 'string' },
                                notificationId: { type: 'string' }, 
                                isRead: { type: 'boolean' },
                                createdAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await notificationController.markNotificationAsRead(request, reply);
    });

    // Mark all notifications as read for a user
    fastify.patch('/user/:userId/read-all', {
        schema: {
            description: 'Mark all notifications as read for a user',
            tags: ['notifications'],
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: {
                        type: 'string',
                        description: 'ID of the user'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                modifiedCount: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await notificationController.markAllNotificationsAsRead(request, reply);
    });

    // Delete a notification
    fastify.delete('/:notificationId', {
        schema: {
            description: 'Delete a notification',
            tags: ['notifications'],
            params: {
                type: 'object',
                required: ['notificationId'],
                properties: {
                    notificationId: {
                        type: 'string',
                        description: 'ID of the notification'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await notificationController.deleteNotification(request, reply);
    });

    // Delete all notifications for a user
    fastify.delete('/user/:userId', {
        schema: {
            description: 'Delete all notifications for a user',
            tags: ['notifications'],
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: {
                        type: 'string',
                        description: 'ID of the user'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                deletedCount: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await notificationController.deleteAllUserNotifications(request, reply);
    });
}