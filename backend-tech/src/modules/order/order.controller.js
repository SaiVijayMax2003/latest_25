import Order from './order.schema.js';
import Student from '../student/student.schema.js';
import User from '../users/users.model.js';
import { ORDER_STATUSES } from '../../config/status.js';
import { searchbyOrderService, addPaymentToOrder, getOrderPaymentDetails, updateOrderPaymentStatus } from './order.service.js';
import { smsService } from '../sms-template/sms.service.js';
import { emailService } from '../email-template/email.service.js';
import { logger } from '../../utils/logger.js';
import notificationService from '../notification/notification.service.js';
import { getNextAssignee } from '../../utils/roundrobin.js';

export const getOrderStatus = async (request, reply) => {
    try {
        const { student_id } = request.params;

        const order = await Order.findOne( 
            { student_id: Number(student_id) },
            { onboarding_status: 1, payment_status: 1, scheduling_status: 1, _id: 0 }
        );

        if (!order) {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given student ID'
            });
        }

        // Get student's full name
        const student = await Student.findOne({ student_id: Number(student_id) }, { full_name: 1, _id: 0 });
        const full_name = student ? student.full_name : null;

        return {
            success: true,
            message: 'Order status details retrieved successfully',
            data: {
                ...order.toObject(),
                full_name
            }
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while fetching order status details'
        });
    }
};

export const getOrderDetails = async (request, reply) => {
    try {
        const { student_id } = request.params;

        const order = await Order.findOne({ student_id: Number(student_id) });

        if (!order) {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given student ID'
            });
        }

        // Get student's full name
        const student = await Student.findOne({ student_id: Number(student_id) }, { full_name: 1, _id: 0 });
        const full_name = student ? student.full_name : null;

        return {
            success: true,
            message: 'Order details retrieved successfully',
            data: {
                ...order.toObject(),
                full_name
            }
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while fetching order details'
        });
    }
};

export const editOrder = async (request, reply) => {
    try {
        const { student_id } = request.params;
        const updateData = request.body;

        // Validate onboarding_status if provided
        if (updateData.hasOwnProperty('onboarding_status')) {
            const index = ORDER_STATUSES.indexOf(updateData.onboarding_status);
            if (index === -1) {
                return reply.code(400).send({
                    success: false,
                    message: 'Invalid onboarding_status. Must be one of: ' + ORDER_STATUSES.join(', ')
                });
            }
        }

        // Fetch the current order before updating
        const currentOrder = await Order.findOne({ student_id: Number(student_id) });
        if (!currentOrder) {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given student ID'
            });
        }

        // Add modified_at timestamp
        updateData.modified_at = new Date();

        // Find and update the order
        const updatedOrder = await Order.findOneAndUpdate(
            { student_id: Number(student_id) },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        // Prepare log entry
        const user = request.user || {};
        const changedFields = [];
        const fieldsToCheck = ['onboarding_status', 'payment_status', 'scheduling_status', 'assigned_to'];
        for (const field of fieldsToCheck) {
            if (updateData.hasOwnProperty(field) && currentOrder[field] !== updateData[field]) {
                changedFields.push({
                    field,
                    old: currentOrder[field],
                    new: updateData[field]
                });
            }
        }
        
        // Only log if there are actual field changes (excluding c field)
        if (changedFields.length > 0) {
            const logEntry = {
                action: 'edit order',
                performed_by: {
                    user_id: user.user_id || null,
                    role: user.role || null,
                    username: user.username || null,
                    name: user.name || null
                },
                timestamp: new Date(),
                changes: changedFields
            };
            await Order.updateOne(
                { student_id: Number(student_id) },
                { $push: { logs: logEntry } }
            );
        }

        return {
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while updating order'
        });
    }
};

export const editOrderPaymentStatus = async (request, reply) => {
    try {
        const { student_id } = request.params;
        const { payment_status } = request.body;

        if (typeof payment_status !== 'string') {
            return reply.code(400).send({
                success: false,
                message: 'payment_status must be provided as a string.'
            });
        }

        const updatedOrder = await updateOrderPaymentStatus(
            student_id, 
            payment_status, 
            request.user || null, 
            request.id
        );

        return {
            success: true,
            message: 'Order payment_status updated successfully',
            data: updatedOrder
        };
    } catch (error) {
        request.log.error(error);
        
        if (error.message === 'Order not found for the given student ID') {
            return reply.code(404).send({
                success: false,
                message: error.message
            });
        }
        
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while updating payment_status'
        });
    }
};

function isPlainObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

export const getAllOrders = async (request, reply) => {
    try {
        const onboarding_status = request.query.onboarding_status || null;
        const payment_status = request.query.payment_status || null;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 50;
        const sortBy = request.query.sortBy || 'created_date_newest';
        let filter = {};
        
        // Check user role from JWT token
        const userRole = request.user?.role;
        const userId = parseInt(request.user?.user_id, 10);
        
        // Apply role-based filtering
        if (userRole && userRole !== 'admin' && !isNaN(userId)) {
            // Non-admin users can only see orders where their ID is in access_ids
            filter.access_ids = userId;
        }
        // Admin users can see all orders (no additional filter needed)
        
        if (onboarding_status) {
            filter.onboarding_status = onboarding_status;
        }
        
        if (payment_status) {
            filter.payment_status = payment_status;
        }
        
        // Sorting options
        let sortOption = {};
        switch (sortBy) {
            case 'full_name_asc':
                sortOption = { full_name: 1 };
                break;
            case 'full_name_desc':
                sortOption = { full_name: -1 };
                break;
            case 'created_date_newest':
                sortOption = { created_date: -1 };
                break;
            case 'created_date_oldest':
                sortOption = { created_date: 1 };
                break;
            case 'modified_at_asc':
                sortOption = { modified_at: 1 };
                break;
            case 'modified_at_desc':
                sortOption = { modified_at: -1 };
                break;
            default:
                sortOption = { created_date: -1 };
        }
        
        // Pagination
        const skip = (page - 1) * limit;
        const total = await Order.countDocuments(filter);
        let orders = await Order.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
        orders = orders.map(order => {
            let createdBy = order.created_by;
            if (!isPlainObject(createdBy)) {
                createdBy = {
                    user_id: null,
                    role: null,
                    username: null,
                    name: null,
                    created_at: null
                };
            } else {
                // Handle user_id conversion - if it's a string that can be converted to number, do so
                let userId = createdBy.user_id;
                if (typeof userId === 'string' && userId !== 'system') {
                    const parsedUserId = parseInt(userId, 10);
                    userId = isNaN(parsedUserId) ? null : parsedUserId;
                } else if (userId === 'system') {
                    userId = null; // Set to null for system user
                }

                createdBy = {
                    user_id: userId,
                    role: createdBy.role ?? null,
                    username: createdBy.username ?? null,
                    name: createdBy.name ?? null,
                    created_at: createdBy.created_at ?? null
                };
            }

            // Handle assigned_to user_id conversion
            let assignedTo = order.assigned_to;
            if (assignedTo && typeof assignedTo.user_id === 'string') {
                if (assignedTo.user_id === 'system') {
                    assignedTo.user_id = null;
                } else {
                    const parsedAssignedUserId = parseInt(assignedTo.user_id, 10);
                    assignedTo.user_id = isNaN(parsedAssignedUserId) ? null : parsedAssignedUserId;
                }
            }

            // Handle logs user_id conversion
            let logs = order.logs || [];
            if (Array.isArray(logs)) {
                logs = logs.map(log => {
                    if (log.performed_by && typeof log.performed_by.user_id === 'string') {
                        if (log.performed_by.user_id === 'system') {
                            log.performed_by.user_id = null;
                        } else {
                            const parsedLogUserId = parseInt(log.performed_by.user_id, 10);
                            log.performed_by.user_id = isNaN(parsedLogUserId) ? null : parsedLogUserId;
                        }
                    }
                    return log;
                });
            }

            return {
                ...order.toObject(),
                created_by: createdBy,
                assigned_to: assignedTo,
                logs: logs,
                full_name: order.full_name || null
            };
        });
        return {
            success: true,
            message: 'All orders retrieved successfully',
            data: orders,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while fetching all orders'
        });
    }
};

export const searchOrders = async (request, reply) => {
    try {
        const query = request.query;
        
        // Check user role from JWT token
        const userRole = request.user?.role;
        const userId = parseInt(request.user?.user_id, 10);
        
        // Suggestion-only flow for assigned_to and full_name
        if (query.suggestionsOnly === 'true' && (query.assigned_to || query.full_name)) {
            let filter = {};
            let field = '';
            let search = '';
            if (query.assigned_to) {
                field = 'assigned_to';
                search = query.assigned_to;
            } else if (query.full_name) {
                field = 'full_name';
                search = query.full_name;
            }
            if (search) {
                filter[field] = {
                    $regex: search,
                    $options: 'i'
                };
            }
            
            // Apply role-based filtering for suggestions
            if (userRole && userRole !== 'admin' && !isNaN(userId)) {
                filter.access_ids = userId;
            }
            
            // Only fetch unique suggestions for the field
            const suggestions = await Order.aggregate([
                { $match: filter },
                { $group: { _id: `$${field}` } },
                { $sort: { _id: 1 } },
                { $limit: 10 }
            ]);
            // Return as array of strings
            return {
                success: true,
                suggestions: suggestions.map(s => s._id).filter(Boolean)
            };
        }

        // Remove any undefined or null values from the query
        const searchQuery = Object.fromEntries(
            Object.entries(query).filter(([_, value]) => value !== undefined && value !== null)
        );

        // Apply role-based filtering
        if (userRole && userRole !== 'admin' && !isNaN(userId)) {
            // Non-admin users can only see orders where their ID is in access_ids
            searchQuery.access_ids = userId;
        }

        // If no search parameters provided, return all orders (with role-based filtering)
        if (Object.keys(searchQuery).length === 0 || (Object.keys(searchQuery).length === 1 && searchQuery.access_ids)) {
            const orders = await Order.find(searchQuery).sort({ created_date: -1 });
            
            // Get all student IDs
            const studentIds = orders.map(order => order.student_id);
            
            // Fetch all students' full names in one query
            const students = await Student.find(
                { student_id: { $in: studentIds } },
                { student_id: 1, full_name: 1, _id: 0 }
            );
            
            // Create a map of student_id to full_name
            const studentNameMap = students.reduce((map, student) => {
                map[student.student_id] = student.full_name;
                return map;
            }, {});

            // Add full_name to each order
            const ordersWithNames = orders.map(order => {
                // Handle created_by user_id conversion for system users
                let orderData = order.toObject();
                
                // Handle created_by user_id conversion
                if (orderData.created_by && typeof orderData.created_by.user_id === 'string') {
                    if (orderData.created_by.user_id === 'system') {
                        orderData.created_by.user_id = null;
                    } else {
                        const parsedUserId = parseInt(orderData.created_by.user_id, 10);
                        orderData.created_by.user_id = isNaN(parsedUserId) ? null : parsedUserId;
                    }
                }

                // Handle assigned_to user_id conversion
                if (orderData.assigned_to && typeof orderData.assigned_to.user_id === 'string') {
                    if (orderData.assigned_to.user_id === 'system') {
                        orderData.assigned_to.user_id = null;
                    } else {
                        const parsedAssignedUserId = parseInt(orderData.assigned_to.user_id, 10);
                        orderData.assigned_to.user_id = isNaN(parsedAssignedUserId) ? null : parsedAssignedUserId;
                    }
                }

                // Handle logs user_id conversion
                if (orderData.logs && Array.isArray(orderData.logs)) {
                    orderData.logs = orderData.logs.map(log => {
                        if (log.performed_by && typeof log.performed_by.user_id === 'string') {
                            if (log.performed_by.user_id === 'system') {
                                log.performed_by.user_id = null;
                            } else {
                                const parsedLogUserId = parseInt(log.performed_by.user_id, 10);
                                log.performed_by.user_id = isNaN(parsedLogUserId) ? null : parsedLogUserId;
                            }
                        }
                        return log;
                    });
                }
                
                return {
                    ...orderData,
                    full_name: studentNameMap[order.student_id] || null
                };
            });

            return {
                success: true,
                message: 'All orders retrieved successfully',
                data: ordersWithNames
            };
        }

        // Convert string values to appropriate types
        if (searchQuery.student_id) {
            searchQuery.student_id = Number(searchQuery.student_id);
        }

        const orders = await Order.find(searchQuery).sort({ created_date: -1 });

        // Get all student IDs
        const studentIds = orders.map(order => order.student_id);
        
        // Fetch all students' full names in one query
        const students = await Student.find(
            { student_id: { $in: studentIds } },
            { student_id: 1, full_name: 1, _id: 0 }
        );
        
        // Create a map of student_id to full_name
        const studentNameMap = students.reduce((map, student) => {
            map[student.student_id] = student.full_name;
            return map;
        }, {});

        // Add full_name to each order
        const ordersWithNames = orders.map(order => {
            // Handle created_by user_id conversion for system users
            let orderData = order.toObject();
            
            // Handle created_by user_id conversion
            if (orderData.created_by && typeof orderData.created_by.user_id === 'string') {
                if (orderData.created_by.user_id === 'system') {
                    orderData.created_by.user_id = null;
                } else {
                    const parsedUserId = parseInt(orderData.created_by.user_id, 10);
                    orderData.created_by.user_id = isNaN(parsedUserId) ? null : parsedUserId;
                }
            }

            // Handle assigned_to user_id conversion
            if (orderData.assigned_to && typeof orderData.assigned_to.user_id === 'string') {
                if (orderData.assigned_to.user_id === 'system') {
                    orderData.assigned_to.user_id = null;
                } else {
                    const parsedAssignedUserId = parseInt(orderData.assigned_to.user_id, 10);
                    orderData.assigned_to.user_id = isNaN(parsedAssignedUserId) ? null : parsedAssignedUserId;
                }
            }

            // Handle logs user_id conversion
            if (orderData.logs && Array.isArray(orderData.logs)) {
                orderData.logs = orderData.logs.map(log => {
                    if (log.performed_by && typeof log.performed_by.user_id === 'string') {
                        if (log.performed_by.user_id === 'system') {
                            log.performed_by.user_id = null;
                        } else {
                            const parsedLogUserId = parseInt(log.performed_by.user_id, 10);
                            log.performed_by.user_id = isNaN(parsedLogUserId) ? null : parsedLogUserId;
                        }
                    }
                    return log;
                });
            }
            
            return {
                ...orderData,
                full_name: studentNameMap[order.student_id] || null
            };
        });

        return {
            success: true,
            message: 'Orders retrieved successfully based on search criteria',
            data: ordersWithNames
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while searching orders'
        });
    }
};

export const markOrderAsDeleted = async (request, reply) => {
    try {
        const { student_id } = request.params;
        const { order_deleted } = request.body;
        // Fetch the current order before updating
        const currentOrder = await Order.findOne({ student_id: Number(student_id) });
        if (!currentOrder) {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given student ID'
            });
        }
        // Add modified_at timestamp
        const updateData = { order_deleted, modified_at: new Date() };
        const updatedOrder = await Order.findOneAndUpdate(
            { student_id: Number(student_id) },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        // Prepare log entry
        const user = request.user || {};
        const changedFields = [];
        if (currentOrder.order_deleted !== order_deleted) {
            changedFields.push({
                field: 'order_deleted',
                old: currentOrder.order_deleted,
                new: order_deleted
            });
        }
        if (changedFields.length > 0) {
            const logEntry = {
                action: 'mark order as deleted',
                performed_by: {
                    user_id: user.user_id || null,
                    role: user.role || null,
                    username: user.username || null,
                    name: user.name || null
                },
                timestamp: new Date(),
                changes: changedFields
            };
            await Order.updateOne(
                { student_id: Number(student_id) },
                { $push: { logs: logEntry } }
            );
        }
        return {
            success: true,
            message: 'Order deletion status updated successfully',
            data: updatedOrder
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while updating order deletion status'
        });
    }
};
export const addPayment = async (request, reply) => {
    try {
        const { student_id } = request.params;
        const paymentData = request.body;

        // Validate required payment fields
        if (!paymentData.payment_method) {
            return reply.code(400).send({
                success: false,
                message: 'Payment method is required'
            });
        }

        // Validate that at least one amount field is provided
        if (!paymentData.total_amount && !paymentData.amount_paid && !paymentData.amount_pending) {
            return reply.code(400).send({
                success: false,
                message: 'At least one amount field (total_amount, amount_paid, or amount_pending) is required'
            });
        }

        const order = await addPaymentToOrder(student_id, paymentData);

        return {
            success: true,
            message: 'Payment details added successfully',
            data: order
        };
    } catch (error) {
        request.log.error(error);
        if (error.message === 'Order not found') {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given student ID'
            });
        }
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while adding payment details'
        });
    }
};

export const getPaymentDetails = async (request, reply) => {
    try {
        const { student_id } = request.params;
        const paymentDetails = await getOrderPaymentDetails(student_id);

        return {
            success: true,
            message: 'Payment details retrieved successfully',
            data: paymentDetails
        };
    } catch (error) {
        request.log.error(error);
        if (error.message === 'Order not found') {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given student ID'
            });
        }
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while fetching payment details'
        });
    }
};

export const getChatMessages = async (request, reply) => {
    try {
        const { order_id } = request.params;

        const order = await Order.findOne({ order_id }, { chat_messages: 1, _id: 0 });

        if (!order) {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given order ID'
            });
        }

        return {
            success: true,
            message: 'Chat messages retrieved successfully',
            data: order.chat_messages || []
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while fetching chat messages'
        });
    }
};

export const deleteChatMessage = async (request, reply) => {
    try {
        const { order_id, msg_id } = request.params;

        const result = await Order.updateOne(
            { order_id, 'chat_messages.msg_id': msg_id },
            { '$set': { 'chat_messages.$.deleted': true } }
        );

        if (result.nModified === 0) {
            return reply.code(404).send({
                success: false,
                message: 'Chat message not found or already deleted'
            });
        }

        return {
            success: true,
            message: 'Chat message soft deleted successfully'
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while soft deleting chat message'
        });
    }
};

export const postChatMessage = async (request, reply) => {
    try {
        const { order_id } = request.params;
        const { user_id, name, role, message } = request.body;

        const newChatMessage = {
            msg_id: new Date().getTime().toString(), // Simple unique ID
            user_id,
            name,
            role,
            message,
            created_at: new Date(),
            deleted: false
        };

        const updatedOrder = await Order.findOneAndUpdate(
            { order_id },
            { $push: { chat_messages: newChatMessage } },
            { new: true }
        );

        if (!updatedOrder) {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given order ID'
            });
        }

        return {
            success: true,
            message: 'Chat message added successfully',
            data: newChatMessage
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while adding chat message'
        });
    }
};

export const searchbyOrder = async (request, reply) => {
    try {
        const result = await searchbyOrderService(request);
        return reply.code(200).send(result);
    } catch (error) {
        request.log.error(error);
        return reply.code(400).send({ success: false, error: error.message });
    }
};

export const updateAssignedTo = async (request, reply) => {
    try {
        const { student_id } = request.params;
        const { user_id, name, role } = request.body;

        // Validate required fields
        if (!user_id || !name || !role) {
            return reply.code(400).send({
                success: false,
                message: 'user_id, name, and role are required fields'
            });
        }

        // Check if order exists
        const existingOrder = await Order.findOne({ student_id });
        if (!existingOrder) {
            return reply.code(404).send({
                success: false,
                message: 'Order not found for the given student ID'
            });
        }

        // Create new assignment object
        const newAssignment = {
            user_id,
            name,
            role,
            assigned_at: new Date()
        };

        // Update the assigned_to field (treat as object, not array)
        const updatedOrder = await Order.findOneAndUpdate(
            { student_id },
            { 
                $set: { 
                    assigned_to: newAssignment,
                    modified_at: new Date() 
                },
                $addToSet: { access_ids: user_id }
            },
            { new: true, runValidators: true }
        );

        // Prepare log entry
        const user = request.user || {};
        const logEntry = {
            action: 'update assigned_to',
            performed_by: {
                user_id: user.user_id || null,
                role: user.role || null,
                username: user.username || null,
                name: user.name || null
            },
            timestamp: new Date(),
            changes: [{
                field: 'assigned_to',
                old: existingOrder.assigned_to,
                new: updatedOrder.assigned_to
            }]
        };

        // Add log entry
        await Order.updateOne(
            { student_id },
            { $push: { logs: logEntry } }
        );

        // Notification logic: Notify the newly assigned user
        if (newAssignment && newAssignment.user_id) {
            const studentName = updatedOrder.full_name || student_id;
            await notificationService.createNotification({
                type: 'Student Order Assigned',
                userId: newAssignment.user_id.toString(),
                studentId: updatedOrder.student_id,
                full_name: studentName,
                message: `Assigned to has been updated. You are now assigned to student ${studentName} (ID: ${updatedOrder.student_id}).`,
                priority: 'high'
            });
        }

        return {
            success: true,
            message: 'Order assignment updated successfully',
            data: {
                student_id: updatedOrder.student_id,
                assigned_to: updatedOrder.assigned_to,
                added_access_id: user_id
            }
        };
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal server error while updating order assignment'
        });
    }
};
