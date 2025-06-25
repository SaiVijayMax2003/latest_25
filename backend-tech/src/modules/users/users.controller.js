import { userService } from './users.service.js';
import { loginSchema, createUserSchema, modifyUserSchema } from './users.schema.js';
import { logger } from '../../utils/logger.js';

export class UserController {
    constructor(fastify) {
        if (!fastify) {
            throw new Error('Fastify instance is required');
        }
        this.fastify = fastify;
        this.logger = fastify.log;
    }

    async createUser(req, reply) {
        try {
            const { name, username, role, password, unique_token } = req.body;

            // Validate required fields
            const requiredFields = ['name', 'username', 'role', 'password', 'unique_token'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            
            if (missingFields.length > 0) {
                return reply.status(400).send({
                    success: false,
                    error: 'Missing Required Fields',
                    message: `The following fields are required: ${missingFields.join(', ')}`
                });
            }

            // Validate name
            if (name.trim().length < 2) {
                return reply.status(400).send({
                    success: false,
                    error: 'Invalid Name',
                    message: 'Name must be at least 2 characters long'
                });
            }

            // Validate username (email)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(username)) {
                return reply.status(400).send({
                    success: false,
                    error: 'Invalid Email',
                    message: 'Please provide a valid email address'
                });
            }

            // Validate role
            const validRoles = ['admin', 'operation', 'sales', 'student', 'tutor', 'parent'];
            if (!validRoles.includes(role.toLowerCase())) {
                return reply.status(400).send({
                    success: false,
                    error: 'Invalid Role',
                    message: `Role must be one of: ${validRoles.join(', ')}`
                });
            }

            // Validate password
            if (password.length < 8) {
                return reply.status(400).send({
                    success: false,
                    error: 'Invalid Password',
                    message: 'Password must be at least 8 characters long'
                });
            }

            // Validate unique token
            

            // Check if username already exists
            const existingUser = await userService.findUserByUsername(username);
            if (existingUser) {
                return reply.status(400).send({
                    success: false,
                    error: 'Duplicate Username',
                    message: 'A user with this email already exists'
                });
            }

            const result = await userService.createUser(req.body);
            return reply.status(201).send({
                success: true,
                message: 'User created successfully',
                data: {
                    user_id: result.user_id,
                    name: result.name,
                    role: result.role
                }
            });
        } catch (error) {
            this.logger.error('Error in createUser:', error);
            return reply.status(400).send({ 
                success: false,
                error: 'Failed to Create User',
                message: error.message || 'An unexpected error occurred while creating the user'
            });
        }
    }

    async modifyUser(req, reply) {
        try {
            const { user_id } = req.params;
            
            // Validate request body using Joi
            const validationResult = modifyUserSchema.validate(req.body);
            if (validationResult.error) {
                this.logger.error('Validation error:', validationResult.error.details);
                return reply.status(400).send({ 
                    error: 'Validation Error',
                    message: validationResult.error.details[0].message
                });
            }

            const result = await userService.modifyUser(user_id, req.body);
            return reply.send({
                message: 'User updated successfully',
                ...result
            });
        } catch (error) {
            this.logger.error('Error in modifyUser:', error);
            if (error.message === 'User not found') {
                return reply.status(404).send({ 
                    error: 'Not Found',
                    message: error.message
                });
            }
            return reply.status(400).send({ 
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    async deleteUser(req, reply) {
        try {
            const { user_id } = req.params;
            await userService.deleteUser(user_id);
            return reply.send({
                message: 'User deleted successfully'
            });
        } catch (error) {
            this.logger.error('Error in deleteUser:', error);
            if (error.message === 'User not found') {
                return reply.status(404).send({ 
                    error: 'Not Found',
                    message: error.message
                });
            }
            return reply.status(400).send({ 
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    async login(req, reply) {
        try {
            // Validate request body using Joi
            const validationResult = loginSchema.validate(req.body);
            if (validationResult.error) {
                this.logger.error('Validation error:', validationResult.error.details);
                return reply.status(400).send({ 
                    error: 'Validation Error',
                    message: validationResult.error.details[0].message
                });
            }

            const { user_id, password } = req.body;
            const result = await userService.login(user_id, password);
            return reply.send({
                message: 'Login successful',
                ...result
            });
        } catch (error) {
            this.logger.error('Error in login:', error);
            if (error.message === 'Invalid credentials') {
                return reply.status(401).send({ 
                    error: 'Unauthorized',
                    message: error.message
                });
            }
            return reply.status(400).send({ 
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    async getAllUsers(request, reply) {
        try {
            const result = await userService.getAllUsers();
            reply.code(200).send(result);
        } catch (error) {
            reply.code(500).send({
                error: 'Failed to retrieve users',
                message: error.message
            });
        }
    }

    async getAllUsersBySearch(request, reply) {
        try {
            const result = await userService.getAllUsersBySearch(request);
            reply.code(200).send(result);
        } catch (error) {
            reply.code(500).send({
                error: 'Failed to search users',
                message: error.message
            });
        }
    }

    async getUserStatistics(request, reply) {
        try {
            const result = await userService.getUserStatistics(request);
            this.logger.info('User statistics retrieved', {
                user_role: request.user?.role,
                user_id: request.user?.user_id,
                open_orders: result.data[0].open_orders,
                schedules_to_be_created: result.data[0].schedules_to_be_created,
                redflags: result.data[0].redflags,
                avg_time_completion: result.data[0].avg_time_completion,
                failed_orders: result.data[0].failed_orders
            });
            return reply.code(200).send(result);
        } catch (error) {
            this.logger.error('Error in getUserStatistics:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to retrieve user statistics',
                message: error.message
            });
        }
    }

    async getRedflags(request, reply) {
        try {
            const result = await userService.getRedflags(request);
            this.logger.info('Redflags retrieved', {
                user_role: request.user?.role,
                user_id: request.user?.user_id,
                total_redflags: result.data.length,
                delayed_orders: result.data.filter(flag => flag.is_delayed).length
            });
            return reply.code(200).send(result);
        } catch (error) {
            this.logger.error('Error in getRedflags:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to retrieve redflags',
                message: error.message
            });
        }
    }
} 