import Joi from 'joi';

// Joi validation schemas
export const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

export const createUserSchema = Joi.object({
    name: Joi.string().required(),
    username: Joi.string().required(),
    role: Joi.string().valid('admin', 'operation', 'sales', 'student', 'tutor', 'operations_lead', 'sales_lead', 'accounts').required(),
    password: Joi.string().required(),
    no_of_assignees: Joi.number().default(0),
    is_order_eligible: Joi.boolean().default(false)
});

export const modifyUserSchema = {
    params: Joi.object({
        user_id: Joi.string().required()
    }),
    body: Joi.object({
        name: Joi.string(),
        username: Joi.string(),
        role: Joi.string().valid('admin', 'operation', 'sales', 'student', 'tutor', 'operations_lead', 'sales_lead', 'accountant'),
        password: Joi.string(),
        no_of_assignees: Joi.number(),
        is_order_eligible: Joi.boolean()
    }).min(1)
};

export const deleteUserSchema = Joi.object({
    user_id: Joi.string().required()
});

// Swagger documentation schemas
export const swaggerSchemas = {
    login: {
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
    createUser: {
        type: 'object',
        required: ['name', 'username', 'role', 'password'],
        properties: {
            name: {
                type: 'string',
                description: 'Full name of the user'
            },
            username: {
                type: 'string',
                description: 'Username for login'
            },
            role: {
                type: 'string',
                enum: ['admin', 'operation', 'sales', 'student', 'tutor', 'operations_lead', 'sales_lead', 'accountant'],
                description: 'Role of the user'
            },
            password: {
                type: 'string',
                description: 'Password for login'
            },
            no_of_assignees: {
                type: 'number',
                description: 'Number of assignees'
            },
            is_order_eligible: {
                type: 'boolean',
                description: 'Whether the user is order eligible'
            }
        }
    },
    modifyUser: {
        type: 'object',
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
                enum: ['admin', 'operation', 'sales', 'student', 'tutor', 'operations_lead', 'sales_lead', 'accountant'],
                description: 'Role of the user'
            },
            password: {
                type: 'string',
                description: 'New password for the user'
            },
            no_of_assignees: {
                type: 'number',
                description: 'Number of assignees'
            },
            is_order_eligible: {
                type: 'boolean',
                description: 'Whether the user is order eligible'
            }
        }
    }
};
