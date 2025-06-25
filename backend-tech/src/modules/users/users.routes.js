import { userService } from './users.service.js';
import { createUserSchema, modifyUserSchema, deleteUserSchema, loginSchema } from './users.schema.js';
import { UserController } from './users.controller.js';

export default async function routes(fastify) {
    // Set fastify instance in userService
    userService.setFastify(fastify);
    
    // Initialize controller
    const controller = new UserController(fastify);

    // Login route
    fastify.post('/login', {
        schema: {
            description: 'User login endpoint',
            tags: ['users'],
            body: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: {
                        type: 'string',
                        description: 'Username for login'
                    },
                    password: {
                        type: 'string',
                        description: 'Password for login'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                user_id: { type: 'string' },
                                role: { type: 'string' }
                            }
                        },
                        token: { type: 'string' }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { username, password } = request.body;
                const result = await userService.login(username, password);
                reply.code(200).send(result);
            } catch (error) {
                reply.code(401).send({
                    error: 'Authentication failed',
                    message: error.message
                });
            }
        }
    });

    // Create user route
    fastify.post('/', {
        schema: {
            description: 'Create a new user',
            tags: ['users'],
            body: {
                type: 'object',
                required: ['name', 'username', 'role', 'password'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'Full name of the user'
                    },
                    username: {
                        type: 'string',
                        description: 'Username (email) for login'
                    },
                    role: {
                        type: 'string',
                        enum: ['admin', 'operation', 'sales', 'student', 'tutor', 'operations_lead', 'sales_lead', 'accounts'],
                        description: 'User role'
                    },
                    password: {
                        type: 'string',
                        description: 'User password'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                user_id: { type: 'string' },
                                role: { type: 'string' }
                            }
                        },
                        token: { type: 'string' }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const result = await userService.createUser(request.body);
                reply.code(201).send(result);
            } catch (error) {
                reply.code(400).send({
                    error: 'Failed to create user',
                    message: error.message
                });
            }
        }
    });

    // Modify user route
    fastify.put('/:user_id', {
        schema: {
            description: 'Modify an existing user',
            tags: ['users'],
            params: {
                type: 'object',
                required: ['user_id'],
                properties: {
                    user_id: {
                        type: 'string',
                        description: 'ID of the user to modify'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Updated name of the user'
                    },
                    username: {
                        type: 'string',
                        description: 'Updated username (email) for login'
                    },
                    role: {
                        type: 'string',
                        enum: ['admin', 'operation', 'sales', 'student', 'tutor', 'operations_lead', 'sales_lead', 'accounts'],
                        description: 'Updated role of the user'
                    },
                    password: {
                        type: 'string',
                        description: 'Updated password for the user'
                    },
                    is_assignee: {
                        type: 'boolean',
                        description: 'Updated whether the user is an assignee'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                user_id: { type: 'string' },
                                role: { type: 'string' },
                                no_of_assignees: { type: 'number' },
                                is_assignee: { type: 'boolean' }
                            }
                        }
                    }
                }
            }
        },
        preHandler: fastify.authenticate,
        handler: async (request, reply) => {
            try {
                const { user_id } = request.params;
                const result = await userService.modifyUser(user_id, request.body);
                reply.code(200).send(result);
            } catch (error) {
                reply.code(400).send({
                    error: 'Failed to modify user',
                    message: error.message
                });
            }
        }
    });

    // Delete user route
    fastify.delete('/:user_id', {
        schema: {
            description: 'Delete an existing user',
            tags: ['users'],
            params: {
                type: 'object',
                required: ['user_id'],
                properties: {
                    user_id: {
                        type: 'string',
                        description: 'ID of the user to delete'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' }
                    }
                }
            }
        },
        preHandler: fastify.authenticate,
        handler: async (request, reply) => {
            try {
                const { user_id } = request.params;
                const result = await userService.deleteUser(user_id);
                reply.code(200).send(result);
            } catch (error) {
                reply.code(400).send({
                    error: 'Failed to delete user',
                    message: error.message
                });
            }
        }
    });

    // Get all users route
    fastify.get('/getallusers', {
        schema: {
            description: 'Get all users with basic information',
            tags: ['users'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        users: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    role: { type: 'string' },
                                    created_at: { type: 'string', format: 'date-time' },
                                    user_id: { type: 'string' },
                                    username: { type: 'string' },
                                    no_of_assignees: { type: 'number' },
                                    is_assignee: { type: 'boolean' }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: controller.getAllUsers.bind(controller)
    });

    fastify.get('/searchusername', {
        schema: {
            description: 'Get all users by search(returing only user_id and name)',
            tags: ['users'],
            querystring: {
                type: 'object',
                properties: {
                    search: {
                        type: 'string',
                    },
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 25,
                        default: 10,
                        description: 'Optional parameter to limit the number of results (default: 10, max: 25)'
                    }
                },
                required: ['search']
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            user_id: { type: 'string' },
                            name: { type: 'string' },
                            role: { type: 'string' }
                        },
                        required: ['user_id', 'name', 'role']
                    }
                }
            }
        },
        handler: controller.getAllUsersBySearch.bind(controller)
    });

    // Get all users by search route
    fastify.get('/getallusersbysearch', {
        schema: {
            description: 'Search users by name with optional limit and role filtering',
            tags: ['users'],
            querystring: {
                type: 'object',
                properties: {
                    search: {
                        type: 'string',
                        description: 'Search string for user names'
                    },
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 25,
                        default: 10,
                        description: 'Limit the number of results, default to 10, max 25'
                    },
                    roles: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of roles to filter by (e.g., admin, tutor)'
                    }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            user_id: { type: 'string' },
                            name: { type: 'string' },
                            role: { type: 'string' }
                        }
                    }
                }
            }
        },
        preHandler: fastify.authenticate,
        handler: async (request, reply) => {
            try {
                const result = await userService.getAllUsersBySearch(request);
                reply.code(200).send(result);
            } catch (error) {
                fastify.log.error('Error in getallusersbysearch route:', error);
                reply.code(400).send({
                    success: false,
                    error: error.message
                });
            }
        }
    });

    fastify.get('/user-statistics', {
        schema: {
            tags: ['users'],
            description: 'Get comprehensive order statistics including open orders, schedules, and completion metrics',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    open_orders: { type: 'number', description: 'Number of orders pending onboarding, scheduling, or payment' },
                                    schedules_to_be_created: { type: 'number', description: 'Number of orders that need scheduling after onboarding' },
                                    redflags: { type: 'number', description: 'Number of orders with rejected payment status' },
                                    avg_time_completion: { type: 'number', description: 'Average time in hours to complete an order' },
                                    failed_orders: { type: 'number', description: 'Number of orders rejected in any category' },
                                    completedorders_monthly: { type: 'number', description: 'Number of completed orders month wise' }
                                }
                            }
                        }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: controller.getUserStatistics.bind(controller)
    });

    fastify.get('/redflags', {
        schema: {
            tags: ['users'],
            description: 'Get all redflags with detailed descriptions of why orders are delayed',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    order_id: { type: 'string' },
                                    student_id: { type: 'string' },
                                    student_name: { type: 'string' },
                                    created_date: { type: 'string', format: 'date-time' },
                                    last_status_change: { type: 'string', format: 'date-time' },
                                    hours_since_last_change: { type: 'number' },
                                    onboarding_status: { type: 'string' },
                                    payment_status: { type: 'string' },
                                    scheduling_status: { type: 'string' },
                                    redflag_reason: { type: 'string' },
                                    is_delayed: { type: 'boolean' },
                                    assigned_to: {
                                        type: 'object',
                                        properties: {
                                            user_id: { type: 'string' },
                                            role: { type: 'string' },
                                            name: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: controller.getRedflags.bind(controller)
    });
} 

