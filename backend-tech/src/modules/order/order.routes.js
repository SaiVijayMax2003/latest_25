import fastify from 'fastify';
import { getOrderStatus, getOrderDetails, editOrder, getAllOrders, searchOrders, editOrderPaymentStatus, markOrderAsDeleted, addPayment, getPaymentDetails, getChatMessages, deleteChatMessage, postChatMessage, searchbyOrder, updateAssignedTo } from './order.controller.js';

export default async function orderRoutes(fastify, options) {
    // Get all orders route
    fastify.get('/get-allorders', {
        schema: {
            tags: ['Orders'],
            description: 'Get all orders',
            querystring: {
                type: 'object',
                properties: {
                    onboarding_status: { type: 'string' },
                    payment_status: { 
                        type: 'string',
                        enum: ['pending', 'verified', 'rejected'],
                        description: 'Filter orders by payment status'
                    },
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, default: 50 },
                    sortBy: {
                        type: 'string',
                        enum: [
                            'full_name_asc',
                            'full_name_desc',
                            'created_date_newest',
                            'created_date_oldest',
                            'modified_at_asc',
                            'modified_at_desc'
                        ],
                        description: 'Sort orders by full_name (A-Z, Z-A), created_date (newest, oldest), or modified_at (asc, desc)'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    student_id: { type: 'number' },
                                    order_id: { type: 'string' },
                                    onboarding_status: { type: 'string' },
                                    payment_status: { type: 'string' },
                                    payment_details: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                total_amount: { type: 'number' },
                                                amount_paid: { type: 'number' },
                                                amount_pending: { type: 'number' },
                                                payment_method: { type: 'string' },
                                                transaction_id: { type: 'string' },
                                                payment_date: { type: 'string', format: 'date-time' },
                                                payment_url: { type: 'string' },
                                                invoice_url: { type: 'string' },
                                                message: { type: 'string' }
                                            }
                                        }
                                    },
                                    scheduling_status: { type: 'string' },
                                    full_name: { type: 'string' },
                                    logs: { 
                                        type: 'array',
                                        items: { 
                                            type: 'object',
                                            properties: {
                                                action: { type: 'string' },
                                                performed_by: {
                                                    type: 'object',
                                                    properties: {
                                                        user_id: { type: 'number' },
                                                        role: { type: 'string' },
                                                        username: { type: 'string' },
                                                        name: { type: 'string' }
                                                    }
                                                },
                                                timestamp: { type: 'string', format: 'date-time' },
                                                changes: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            field: { type: 'string' },
                                                            old: { type: 'string' },
                                                            new: { type: 'string' }
                                                        }
                                                    }
                                                },
                                                type: { type: 'string' },
                                                details: { type: 'object' }
                                            }
                                        }
                                    },
                                    assigned_to: { type: 'object',
                                        properties: {
                                            user_id: { type: 'number' },
                                            role: { type: 'string' },
                                            name: { type: 'string' },
                                        
    
                                        } },
                                    created_date: { type: 'string', format: 'date-time' },
                                    created_by: {
                                        type: 'object',
                                        properties: {
                                            user_id: { type: 'number' },
                                            role: { type: 'string' },
                                            username: { type: 'string' },
                                            name: { type: 'string' },
                                            created_at: { type: 'string', format: 'date-time' }
                                        }
                                    },
                                    sms_logs: { 
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: { type: 'string' },
                                                time: { type: 'string', format: 'date-time' }
                                            }
                                        }
                                    },
                                    email_logs: { 
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: { type: 'string' },
                                                time: { type: 'string', format: 'date-time' }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        totalPages: { type: 'number' }
                    }
                }
            }
        },
        handler: getAllOrders
    });

    // Get order status route
    fastify.get('/get-status/:student_id', {
        schema: {
            tags: ['Orders'],
            description: 'Get order status details (onboarding, payment, scheduling) for a student',
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'number' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                onboarding_status: { type: 'string' },
                                payment_status: { type: 'string' },
                                scheduling_status: { type: 'string' },
                                full_name: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        handler: getOrderStatus
    });

    // Get order details route
    fastify.get('/get-order/:student_id', {
        schema: {
            tags: ['Orders'],
            description: 'Get order details for a student',
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'number' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                student_id: { type: 'number' },
                                order_id: { type: 'string' },
                                onboarding_status: { type: 'string' },
                                payment_status: { type: 'string' },
                                scheduling_status: { type: 'string' },
                                full_name: { type: 'string' },
                                logs: { 
                                    type: 'array',
                                    items: { 
                                        type: 'object',
                                        properties: {
                                            action: { type: 'string' },
                                            performed_by: {
                                                type: 'object',
                                                properties: {
                                                    user_id: { type: 'number' },
                                                    role: { type: 'string' },
                                                    username: { type: 'string' },
                                                    name: { type: 'string' }
                                                }
                                            },
                                            timestamp: { type: 'string', format: 'date-time' },
                                            changes: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        field: { type: 'string' },
                                                        old: { type: 'string' },
                                                        new: { type: 'string' }
                                                    }
                                                }
                                            },
                                            type: { type: 'string' },
                                            details: { type: 'object' }
                                        }
                                    }
                                },
                                assigned_to: {  
                                    type: 'object',
                                    properties: {
                                        user_id: { type: 'number' },
                                        role: { type: 'string' },
                                        name: { type: 'string' },
                                        assigned_at: { type: 'string', format: 'date-time' }
                                    }
                                },
                                created_date: { type: 'string', format: 'date-time' },
                                created_by: {
                                    type: 'object',
                                    properties: {
                                        user_id: { type: 'number' },
                                        role: { type: 'string' },
                                        username: { type: 'string' },
                                        name: { type: 'string' },
                                        created_at: { type: 'string', format: 'date-time' }
                                    }
                                },
                                sms_logs: { 
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            type: { type: 'string' },
                                            time: { type: 'string', format: 'date-time' }
                                        }
                                    }
                                },
                                email_logs: { 
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            type: { type: 'string' },
                                            time: { type: 'string', format: 'date-time' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: getOrderDetails
    });

    // Edit order route
    fastify.post('/edit-order/:student_id', {
        schema: {
            tags: ['Orders'],
            description: 'Edit an existing order for a student',
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'number' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    onboarding_status: { type: 'string' },
                    payment_status: { type: 'string' },
                    scheduling_status: { type: 'string' },
                    logs: { type: 'array', items: { type: 'object' } },
                    assigned_to: { type: 'object',
                        properties: {
                            user_id: { type: 'number' },
                            role: { type: 'string' },
                            name: { type: 'string' }
                        }
                    }
                },
                minProperties: 1 // At least one property must be provided
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        },
        handler: editOrder
    });

    // Edit order payment status route
    fastify.put('/edit-payment-status/:student_id', {
        schema: {
            tags: ['Orders'],
            description: 'Edit the payment status of an order',
            description: 'Search orders by any parameter',
            querystring: {
                type: 'object',
                properties: {
                    student_id: { type: 'number' },
                    order_id: { type: 'string' },
                    onboarding_status: { type: 'string' },
                    payment_status: { type: 'string' },
                    scheduling_status: { type: 'string' },
                    assigned_to: { type: 'object',
                        properties: {
                            user_id: { type: 'number' },
                            role: { type: 'string' },
                            name: { type: 'string' }
                        }
                    },
                    created_by: { type: 'string' },
                    email: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    student_id: { type: 'number' },
                                    order_id: { type: 'string' },
                                    onboarding_status: { type: 'string' },
                                    payment_status: { type: 'string' },
                                    scheduling_status: { type: 'string' },
                                    full_name: { type: 'string' },
                                    logs: { 
                                        type: 'array',
                                        items: { 
                                            type: 'object',
                                            properties: {
                                                action: { type: 'string' },
                                                performed_by: {
                                                    type: 'object',
                                                    properties: {
                                                        user_id: { type: 'number' },
                                                        role: { type: 'string' },
                                                        username: { type: 'string' },
                                                        name: { type: 'string' }
                                                    }
                                                },
                                                timestamp: { type: 'string', format: 'date-time' },
                                                changes: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            field: { type: 'string' },
                                                            old: { type: 'string' },
                                                            new: { type: 'string' }
                                                        }
                                                    }
                                                },
                                                type: { type: 'string' },
                                                details: { type: 'object' }
                                            }
                                        }
                                    },
                                    assigned_to: { type: 'object',
                                        properties: {
                                            user_id: { type: 'number' },
                                            role: { type: 'string' },
                                            name: { type: 'string' }
                                        }
                                    },
                                    created_date: { type: 'string', format: 'date-time' },
                                    created_by: {
                                        type: 'object',
                                        properties: {
                                            user_id: { type: 'number' },
                                            role: { type: 'string' },
                                            username: { type: 'string' },
                                            name: { type: 'string' },
                                            created_at: { type: 'string', format: 'date-time' }
                                        }
                                    },
                                    sms_logs: { 
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: { type: 'string' },
                                                time: { type: 'string', format: 'date-time' }
                                            }
                                        }
                                    },
                                    email_logs: { 
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: { type: 'string' },
                                                time: { type: 'string', format: 'date-time' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: searchOrders
    });

    // Add this route for editing payment_status only
    fastify.post('/edit-payment-status/:student_id', {
        schema: {
            tags: ['Orders'],
            description: 'Edit only the payment_status for a student order (Admin only)',
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'number' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    payment_status: { type: 'string' }
                },
                minProperties: 1 // At least one property must be provided
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                },
                403: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        preHandler: async (request, reply) => {
            // Check if user has admin role
            if (request.user.role !== 'admin') {
                return reply.code(403).send({
                    success: false,
                    message: 'Only admin can edit this API'
                });
            }
        },
        handler: editOrderPaymentStatus
    });

    // Add payment route
    fastify.post('/add-payment/:student_id', {
        schema: {
            tags: ['Orders'],
            summary: 'Add a new payment to an order',
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'number' }
                }
            },
            body: {
                type: 'object',
                required: ['payment_method'],
                properties: {
                    total_amount: { type: 'number' },
                    amount_paid: { type: 'number' },
                    amount_pending: { type: 'number' },
                    payment_method: { type: 'string' },
                    transaction_id: { type: 'string' },
                    payment_url: { type: 'string' },
                    invoice_url: { type: 'string' },
                    message: { type: 'string' },
                    payment_status: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: addPayment
    });

    // Get chat messages for an order
    fastify.get('/orders/chat/:order_id', {
        schema: {
            tags: ['Orders'],
            summary: 'Get chat messages for an order',
            params: {
                type: 'object',
                required: ['order_id'],
                properties: {
                    order_id: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    msg_id: { type: 'string' },
                                    user_id: { type: 'number' },
                                    name: { type: 'string' },
                                    role: { type: 'string' },
                                    message: { type: 'string' },
                                    created_at: { type: 'string', format: 'date-time' },
                                    deleted: { type: 'boolean' }
                                }
                            }
                        }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: getChatMessages
    });

    // Soft delete a chat message from an order
    fastify.patch('/orders/chat/:order_id/messages/:msg_id', {
        schema: {
            tags: ['Orders'],
            summary: 'Soft delete a chat message from an order',
            params: {
                type: 'object',
                required: ['order_id', 'msg_id'],
                properties: {
                    order_id: { type: 'string' },
                    msg_id: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: deleteChatMessage
    });

    // Post a chat message to an order
    fastify.post('/orders/chat/:order_id', {
        schema: {
            tags: ['Orders'],
            summary: 'Post a new chat message to an order',
            params: {
                type: 'object',
                required: ['order_id'],
                properties: {
                    order_id: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                required: ['user_id', 'name', 'role', 'message'],
                properties: {
                    user_id: { type: 'number' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    message: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                msg_id: { type: 'string' },
                                user_id: { type: 'number' },
                                name: { type: 'string' },
                                role: { type: 'string' },
                                message: { type: 'string' },
                                created_at: { type: 'string', format: 'date-time' },
                                deleted: { type: 'boolean' }
                            }
                        }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: postChatMessage
    });

    // Get payment details route
    fastify.get('/payment-details/:student_id', {
        schema: {
            tags: ['Orders'],
            summary: 'Get payment details for a student',
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'number' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                payment_status: { type: 'string' },
                                payment_details: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            total_amount: { type: 'number' },
                                            amount_paid: { type: 'number' },
                                            amount_pending: { type: 'number' },
                                            payment_method: { type: 'string' },
                                            transaction_id: { type: 'string' },
                                            payment_date: { type: 'string', format: 'date-time' },
                                            payment_url: { type: 'string' },
                                            invoice_url: { type: 'string' },
                                            message: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: getPaymentDetails
    });

    // Add this route for marking an order as deleted by student_id
    fastify.post('/orders/delete-order/:student_id', {
        schema: {
            tags: ['Orders'],
            description: 'Mark an order as deleted',
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'number' }
                }
            },
            body: {
                type: 'object',
                required: ['order_deleted', 'user'],
                properties: {
                    order_deleted: { type: 'boolean' },
                    user: {
                        type: 'object',
                        properties: {
                            user_id: { type: 'number' },
                            role: { type: 'string' },
                            username: { type: 'string' },
                            name: { type: 'string' }
                        },
                        required: ['user_id', 'role', 'username', 'name']
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: markOrderAsDeleted
    });

    // Get orders by search (returns student_id, order_id, student_name and assigned_to)
    fastify.get('/search-order', {
        schema: {
            tags: ['Orders'],
            summary: 'Get all orders by search (returns student_id, order_id, student_name and assigned_to)',
            description: 'Search orders by student name or assigned user name and return student_id, order_id, student_name and assigned_to',
            querystring: {
                type: 'object',
                properties: {
                    search: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            student_id: { type: 'number' },
                            order_id: { type: 'string' },
                            student_name: { type: 'string' },
                            assigned_to: {
                                type: 'object',
                                properties: {
                                    user_id: { type: 'number' },
                                    name: { type: 'string' },
                                    role: { type: 'string' },
                                    assigned_at: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        required: ['student_id', 'order_id', 'student_name', 'assigned_to']
                    }
                }
            }
        },
        handler: searchbyOrder
    });

    // Update assigned_to for an order
    fastify.post('/update-assigned/:student_id', {
        schema: {
            tags: ['Orders'],
            description: 'Update the assigned_to field for an order',
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'number' }
                }
            },
            body: {
                type: 'object',
                required: ['user_id', 'name', 'role'],
                properties: {
                    user_id: { type: 'number' },
                    name: { type: 'string' },
                    role: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                student_id: { type: 'number' },
                                assigned_to: {
                                    type: 'object',
                                    properties: {
                                        user_id: { type: 'number' },
                                        name: { type: 'string' },
                                        role: { type: 'string' },
                                        assigned_at: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: updateAssignedTo
    });
}
