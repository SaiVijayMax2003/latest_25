import User from './users.model.js';
import { logger } from '../../utils/logger.js';
import mongoose from 'mongoose';
import Order from '../order/order.schema.js';

class UserService {
    constructor() {
        this.fastify = null;
        this.logger = logger;
    }

    setFastify(fastify) {
        if (!fastify) {
            throw new Error('Fastify instance is required');
        }
        this.fastify = fastify;
        this.logger = fastify.log;
    }

    async createUser(userData) {
        try {
            // Log MongoDB connection details
            this.logger.info('MongoDB Connection State:', mongoose.connection.readyState);
            this.logger.info('MongoDB Database Name:', mongoose.connection.db?.databaseName);
            this.logger.info('MongoDB Collections:', await mongoose.connection.db?.listCollections().toArray());

            // Generate user_id
            const user_id = await User.generateUserId();
            if (!user_id || isNaN(parseInt(user_id))) {
                throw new Error('Failed to generate user ID');
            }

            // Create user with generated ID
            const user = new User({
                ...userData,
                user_id
            });

            // Save user and verify user_id was set
            await user.save();
            if (!user.user_id) {
                throw new Error('Failed to set user ID');
            }

            this.logger.info(`User created successfully: ${user.user_id}`);

            // Generate JWT token
            const token = this.fastify.jwt.sign({ 
                id: user._id,
                user_id: user.user_id,
                role: user.role 
            });

            return {
                user: {
                    name: user.name,
                    user_id: user.user_id,
                    role: user.role,
                    no_of_assignees: user.no_of_assignees,
                    is_order_eligible: user.is_order_eligible
                },
                token
            };
        } catch (error) {
            this.logger.error('Error creating user:', error);
            if (error.message === 'MongoDB connection is not established') {
                throw new Error('Database connection error. Please try again later.');
            }
            throw error;
        }
    }

    async modifyUser(user_id, updates) {
        try {
            const user = await User.findOne({ user_id });
            if (!user) {
                throw new Error('User not found');
            }

            // Don't allow updating user_id
            delete updates.user_id;
            
            // Add current timestamp to modified_at array
            updates.modified_at = [...user.modified_at, new Date()];
            
            Object.assign(user, updates);
            await user.save();
            this.logger.info(`User modified successfully: ${user_id}`);

            return {
                user: {
                    name: user.name,
                    user_id: user.user_id,
                    role: user.role,
                    no_of_assignees: user.no_of_assignees,
                    is_order_eligible: user.is_order_eligible
                }
            };
        } catch (error) {
            this.logger.error('Error modifying user:', error);
            if (error.message === 'MongoDB connection is not established') {
                throw new Error('Database connection error. Please try again later.');
            }
            throw error;
        }
    }

    async deleteUser(user_id) {
        try {
            const user = await User.findOneAndDelete({ user_id });
            if (!user) {
                throw new Error('User not found');
            }

            this.logger.info(`User deleted successfully: ${user_id}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Error deleting user:', error);
            if (error.message === 'MongoDB connection is not established') {
                throw new Error('Database connection error. Please try again later.');
            }
            throw error;
        }
    }

    async login(username, password) {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('Invalid credentials');
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Generate JWT token
            const token = this.fastify.jwt.sign({ 
                id: user._id,
                user_id: user.user_id,
                role: user.role 
            });

            this.logger.info(`User logged in successfully: ${username}`);
            return {
                user: {
                    name: user.name,
                    user_id: user.user_id,
                    role: user.role
                },
                token
            };
        } catch (error) {
            this.logger.error('Error during login:', error);
            if (error.message === 'MongoDB connection is not established') {
                throw new Error('Database connection error. Please try again later.');
            }
            throw error;
        }
    }

    async findUserByUsername(username) {
        try {
            const user = await User.findOne({ username: username.toLowerCase() });
            return user;
        } catch (error) {
            this.logger.error('Error finding user by username:', error);
            if (error.message === 'MongoDB connection is not established') {
                throw new Error('Database connection error. Please try again later.');
            }
            throw error;
        }
    }

    async findUserByUserId(user_id) {
        try {
            const user = await User.findOne({ user_id });
            return user;
        } catch (error) {
            this.logger.error('Error finding user by user_id:', error);
            if (error.message === 'MongoDB connection is not established') {
                throw new Error('Database connection error. Please try again later.');
            }
            throw error;
        }
    }

    async getAllUsers() {
        try {
            // Fetch only the required fields
            const users = await User.find({}, { name: 1, role: 1, created_at: 1, user_id: 1, username: 1, _id: 0 });
            
            this.logger.info(`Retrieved ${users.length} users`);
            return {
                success: true,
                users
            };
        } catch (error) {
            this.logger.error('Error getting all users:', error);
            if (error.message === 'MongoDB connection is not established') {
                throw new Error('Database connection error. Please try again later.');
            }
            throw error;
        }
    }

    async getAllUsersBySearch(request) {
        try {
            const search = request.query.search || null;
            let limit = parseInt(request.query.limit) || 10;
            let roles = request.query.roles; 

            // Parse roles if provided as a comma-separated string
            if (typeof roles === 'string') {
                roles = roles.split(',').map(role => role.trim()).filter(role => role.length > 0);
            }
            
            // Validate limit
            if (isNaN(limit) || limit <= 0) {
                throw new Error('Limit must be a positive number');
            }
            
            // Enforce maximum limit
            limit = Math.min(limit, 25);
            
            let filter = {};
            if (search) {
                // Split search string into parts if it contains spaces
                const searchParts = search.trim().split(/\s+/);
                
                // Create an array of search conditions
                const searchConditions = [];
                
                // Add conditions for the full name
                searchConditions.push(
                    { name: { $regex: `^${search}$`, $options: 'i' } },      // exact match
                    { name: { $regex: `^${search}`, $options: 'i' } },       // starts with
                    { name: { $regex: `${search}$`, $options: 'i' } },       // ends with
                    { name: { $regex: search, $options: 'i' } },             // contains anywhere
                    { name: { $regex: `(^|\\s)${search}`, $options: 'i' } } // word boundary
                );

                // If search has multiple parts (first name and surname)
                if (searchParts.length > 1) {
                    // Add conditions for each part individually
                    searchParts.forEach(part => {
                        searchConditions.push(
                            { name: { $regex: `^${part}$`, $options: 'i' } },      // exact match for part
                            { name: { $regex: `^${part}`, $options: 'i' } },       // starts with part
                            { name: { $regex: `${part}$`, $options: 'i' } },       // ends with part
                            { name: { $regex: part, $options: 'i' } },             // contains part
                            { name: { $regex: `(^|\\s)${part}`, $options: 'i' } } // word boundary for part
                        );
                    });
                }

                filter = {
                    $or: searchConditions
                };
            }

            // Add role filter if roles are provided and is an array
            if (roles && Array.isArray(roles) && roles.length > 0) {
                filter.role = { $in: roles };
            }

            // Return user_id, name, and role with limit and sort by name
            const users = await User.find(filter)
                .select('user_id name role')
                .sort({ name: 1 }) // Sort alphabetically by name
                .limit(limit);
                
            // Map to array of objects with user_id, name, and role
            const result = users.map(u => ({ 
                user_id: u.user_id, 
                name: u.name,
                role: u.role 
            }));
            return result;
        } catch (error) {
            this.logger.error('Error in getAllUsersBySearch:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserStatistics(request) {
        try {
            const userRole = request?.user?.role;
            const userId = request?.user?.user_id ? parseInt(request.user.user_id, 10) : null;
            let query = { order_deleted: { $ne: true } };
            if (userRole && userRole !== 'admin' && !isNaN(userId)) {
                query.access_ids = userId;
            }
            const orders = await Order.find(query).lean();
            const stats = {
                open_orders: 0,
                schedules_to_be_created: 0,
                redflags: 0,
                avg_time_completion: 0,
                failed_orders: 0,
                completedorders_monthly: 0
            };
            let totalCompletionTime = 0;
            let completedOrders = 0;
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            for (const order of orders) {
                if (order.onboarding_status !== 'Completed') {
                    stats.open_orders++;
                }
                if (order.onboarding_status === 'Needs Schedule') {
                    stats.schedules_to_be_created++;
                }
                if (order.payment_status === 'rejected') {
                    stats.redflags++;
                }
                if (order.payment_status === 'rejected') {
                    stats.failed_orders++;
                }
                if (order.onboarding_status === 'completed' && order.payment_status === 'verified' && order.scheduling_status === 'completed') {
                    const orderCompletionDate = new Date(order.updatedAt || order.created_date);
                    if (orderCompletionDate.getMonth() === currentMonth && orderCompletionDate.getFullYear() === currentYear) {
                        stats.completedorders_monthly++;
                    }
                    const completionTime = (order.logs || []).reduce((total, log) => {
                        if (log.status === 'completed') {
                            return total + (new Date(log.timestamp) - new Date(order.created_date));
                        }
                        return total;
                    }, 0);
                    if (completionTime > 0) {
                        totalCompletionTime += completionTime;
                        completedOrders++;
                    }
                }
            }
            stats.avg_time_completion = completedOrders > 0 ? Math.round((totalCompletionTime / completedOrders) / (1000 * 60 * 60)) : 0;
            return {
                success: true,
                data: [stats]
            };
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async getRedflags(request) {
        try {
            const userRole = request?.user?.role;
            const userId = request?.user?.user_id ? parseInt(request.user.user_id, 10) : null;
            let query = { order_deleted: { $ne: true } };
            if (userRole && userRole !== 'admin' && !isNaN(userId)) {
                query.access_ids = userId;
            }
            const orders = await Order.find(query).lean();
            const redflags = [];
            const currentTime = new Date();
            const DELAY_THRESHOLD_HOURS = 48;
            for (const order of orders) {
                try {
                    let redflagReason = '';
                    let isDelayed = false;
                    let lastStatusChange = order.created_date;
                    let hoursSinceLastChange = 0;
                    const isCompleted = order.onboarding_status === 'completed' && order.payment_status === 'verified' && order.scheduling_status === 'completed';
                    if (isCompleted) {
                        continue;
                    }
                    if (order.logs && order.logs.length > 0) {
                        try {
                            const sortedLogs = order.logs.sort((a, b) => {
                                const dateA = new Date(b.timestamp || b.created_at || 0);
                                const dateB = new Date(a.timestamp || a.created_at || 0);
                                return dateA - dateB;
                            });
                            if (sortedLogs[0] && (sortedLogs[0].timestamp || sortedLogs[0].created_at)) {
                                lastStatusChange = new Date(sortedLogs[0].timestamp || sortedLogs[0].created_at);
                            }
                        } catch (logError) {
                            lastStatusChange = new Date(order.created_date);
                        }
                    } else {
                        lastStatusChange = new Date(order.created_date);
                    }
                    hoursSinceLastChange = (currentTime - lastStatusChange) / (1000 * 60 * 60);
                    if (order.payment_status === 'rejected') {
                        redflagReason = 'Payment rejected - requires immediate attention';
                        isDelayed = true;
                    } else if (order.onboarding_status === 'pending' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Onboarding pending for ${Math.floor(hoursSinceLastChange)} hours - student needs to be contacted`;
                        isDelayed = true;
                    } else if (order.onboarding_status === 'Needs Schedule' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Schedule creation pending for ${Math.floor(hoursSinceLastChange)} hours - tutor assignment needed`;
                        isDelayed = true;
                    } else if (order.payment_status === 'pending' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Payment pending for ${Math.floor(hoursSinceLastChange)} hours - payment verification needed`;
                        isDelayed = true;
                    } else if (order.scheduling_status === 'pending' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Scheduling pending for ${Math.floor(hoursSinceLastChange)} hours - session scheduling needed`;
                        isDelayed = true;
                    } else if (order.onboarding_status === 'in_progress' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Onboarding in progress for ${Math.floor(hoursSinceLastChange)} hours - follow up needed`;
                        isDelayed = true;
                    } else if (order.scheduling_status === 'in_progress' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Scheduling in progress for ${Math.floor(hoursSinceLastChange)} hours - follow up needed`;
                        isDelayed = true;
                    } else {
                        if (order.payment_status === 'pending') {
                            redflagReason = 'Payment pending - awaiting verification';
                        } else if (order.onboarding_status === 'pending') {
                            redflagReason = 'Onboarding pending - student needs to complete process';
                        }
                    }
                    redflags.push({
                        order_id: order.order_id,
                        student_id: order.student_id,
                        student_name: order.student_name,
                        created_date: order.created_date,
                        last_status_change: lastStatusChange,
                        hours_since_last_change: hoursSinceLastChange,
                        onboarding_status: order.onboarding_status,
                        payment_status: order.payment_status,
                        scheduling_status: order.scheduling_status,
                        redflag_reason: redflagReason,
                        is_delayed: isDelayed,
                        assigned_to: order.assigned_to || null
                    });
                } catch (flagError) {
                    this.logger.error('Error processing redflag:', flagError);
                }
            }
            return {
                success: true,
                data: redflags
            };
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}

// Create and export a singleton instance
export const userService = new UserService(); 