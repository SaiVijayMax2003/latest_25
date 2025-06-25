import { Server } from 'socket.io';
import { logger } from '../../utils/logger.js';
import jwt from 'jsonwebtoken';

let io;

// Initialize socket.io with flexible authentication
export function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info('Client connected to notification socket');
        
        // Handle authentication via event
        socket.on('authenticate', async (data) => {
            try {
                const { token, 'auth-token': authToken } = data;
                const jwtToken = token || authToken; // Accept both formats
                
                if (!jwtToken) {
                    socket.emit('auth_error', { message: 'Authentication token required' });
                    return;
                }

                // Verify JWT token
                const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
                socket.user = decoded;
                socket.userId = decoded.user_id;
                
                // Join user's room
                socket.join(`user_${decoded.user_id}`);
                
                logger.info(`Socket authenticated for user: ${decoded.user_id}`);
                socket.emit('authenticated', { 
                    success: true, 
                    user_id: decoded.user_id,
                    role: decoded.role 
                });
                
            } catch (error) {
                logger.error('Socket authentication failed:', error.message);
                socket.emit('auth_error', { message: 'Invalid authentication token' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            if (socket.userId) {
                logger.info(`User ${socket.userId} disconnected from notification socket`);
            } else {
                logger.info('Unauthenticated client disconnected from notification socket');
            }
        });
    });

    return io;
}

// Send notification to specific user
async function sendNotification(userId, notification) {
    try {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        
        // Get all sockets in the user's room
        const room = io.sockets.adapter.rooms.get(`user_${userId}`);
        if (room) {
            // Send to all authenticated sockets in the room
            room.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.userId === userId) {
                    socket.emit('notification', notification);
                }
            });
        }
    } catch (error) {
        logger.error(`Error sending notification to user ${userId}:`, error);
        throw error;
    }
}

// Notify about status change
async function notifyStatusChange(userId, notificationId, status) {
    try {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        
        const room = io.sockets.adapter.rooms.get(`user_${userId}`);
        if (room) {
            room.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.userId === userId) {
                    socket.emit('notification_status', {
                        notificationId,
                        status
                    });
                }
            });
        }
    } catch (error) {
        logger.error(`Error sending status change for notification ${notificationId}:`, error);
        throw error;
    }
}

// Send unread count
async function sendUnreadCount(userId) {
    try {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        
        const room = io.sockets.adapter.rooms.get(`user_${userId}`);
        if (room) {
            room.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.userId === userId) {
                    socket.emit('unread_count', {
                        userId
                    });
                }
            });
        }
    } catch (error) {
        logger.error(`Error sending unread count to user ${userId}:`, error);
        throw error;
    }
}

export default {
    initializeSocket,
    sendNotification,
    notifyStatusChange,
    sendUnreadCount
};

