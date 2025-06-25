import FormField from './studentForm.schema.js';


export default async function studentFormRoutes(fastify) {
    // GET /questions - Get all questions
    fastify.get('/questions', {
        schema: {
            tags: ['student-form'],
            description: 'Get all questions for the student form',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: { type: 'object' }
                        }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                // Get all questions from all form documents (flattened)
                const forms = await FormField.find();
                const allQuestions = forms.flatMap(form => form.questions);
                return reply.code(200).send({ success: true, data: allQuestions });
            } catch (error) {
                fastify.log.error(error);
                return reply.code(500).send({ success: false, error: error.message });
            }
        }
    });

    // POST /responses - Save a form response
    fastify.post('/responses', {
        schema: {
            tags: ['student-form'],
            description: 'Save a student form response',
            body: {
                type: 'object',
                required: ['student_id', 'responses'],
                properties: {
                    student_id: { type: 'string' },
                    responses: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['question_id', 'value'],
                            properties: {
                                question_id: { type: 'number' },
                                value: { type: ['string', 'number', 'boolean', 'object'] }
                            }
                        }
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { student_id, responses } = request.body;
                const formResponse = new FormResponse({ student_id, responses, status: 'submitted', submitted_at: new Date() });
                await formResponse.save();
                return reply.code(201).send({ success: true, data: formResponse });
            } catch (error) {
                fastify.log.error(error);
                return reply.code(400).send({ success: false, error: error.message });
            }
        }
    });

    // GET /responses - Get all responses
    fastify.get('/responses', {
        schema: {
            tags: ['student-form'],
            description: 'Get all student form responses',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: { type: 'object' }
                        }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const responses = await FormResponse.find();
                return reply.code(200).send({ success: true, data: responses });
            } catch (error) {
                fastify.log.error(error);
                return reply.code(500).send({ success: false, error: error.message });
            }
        }
    });
}
