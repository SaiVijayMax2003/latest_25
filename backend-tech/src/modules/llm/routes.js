import { llmService } from './services/llmService.js';
import { mongoService } from './services/mongoService.js';
import { chatService } from './services/chatService.js';
import TutorService from '../../modules/tutor/tutor.service.js';

export default async function (fastify, opts) {
    // Chat routes
    // Create a new chat thread
    fastify.post('/chat/threads', {
        schema: {
            description: 'Create a new chat thread',
            tags: ['Chat'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        threadId: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const threadId = await chatService.createChatThread();
            return { threadId };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to create chat thread' });
        }
    });

    // Send a message in a chat thread
    fastify.post('/chat/threads/:threadId/messages', {
        schema: {
            description: 'Send a message in a chat thread',
            tags: ['Chat'],
            params: {
                type: 'object',
                required: ['threadId'],
                properties: {
                    threadId: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        response: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    tutor_id: { type: 'number' },
                                    subject: { type: 'string' },
                                    day: { type: 'string' },
                                    time: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const { threadId } = request.params;
        const { message } = request.body;

        try {
            const result = await chatService.sendMessage(threadId, message);
            if (result.success) {
                return result;
            } else {
                return reply.code(400).send(result);
            }
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to process message' });
        }
    });

    // Get chat thread history
    fastify.get('/chat/threads/:threadId', {
        schema: {
            description: 'Get chat thread history',
            tags: ['Chat'],
            params: {
                type: 'object',
                required: ['threadId'],
                properties: {
                    threadId: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        messages: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    role: { type: 'string' },
                                    content: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const { threadId } = request.params;

        try {
            const history = chatService.getThreadHistory(threadId);
            return { messages: history };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to get chat history' });
        }
    });

    // Delete a chat thread
    fastify.delete('/chat/threads/:threadId', {
        schema: {
            description: 'Delete a chat thread',
            tags: ['Chat'],
            params: {
                type: 'object',
                required: ['threadId'],
                properties: {
                    threadId: { type: 'string' }
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
        }
    }, async (request, reply) => {
        const { threadId } = request.params;

        try {
            chatService.deleteThread(threadId);
            return { success: true };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to delete chat thread' });
        }
    });

    // Test OpenAI connection
    fastify.get('/test-connection', {
        schema: {
            description: 'Test the connection to OpenAI API',
            tags: ['LLM'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const result = await llmService.testOpenAIConnection();
            if (result.success) {
                return { success: true, message: result.message };
            } else {
                return reply.code(500).send({ error: result.error });
            }
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to test OpenAI connection' });
        }
    });

    // Find schedule matches
    fastify.post('/generate-student-schedule', {
        schema: {
            description: 'Find matching schedules based on student requirements',
            tags: ['LLM'],
            body: {
                type: 'object',
                required: ['student_id', 'grade', 'subjects', 'availability', 'specializations'],
                properties: {
                    student_id: { type: 'number' },
                    grade: { type: 'string' },
                    subjects: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['subject', 'classes'],
                            properties: {
                                subject: { type: 'string' },
                                classes: { type: 'string' }
                            }
                        }
                    },
                    availability: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['day', 'slots'],
                            properties: {
                                day: { type: 'string' },
                                slots: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },
                    specializations: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    rules: { type: 'string' },
                    extra: { type: 'string' },
                    previous_schedule: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                tutor_id: { type: 'number' },
                                tutor_name: { type: 'string' },
                                subject: { type: 'string' },
                                day: { type: 'string' },
                                time: { type: 'string' }
                            }
                        }
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        response: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    tutor_id: { type: 'number' },
                                    tutor_name: { type: 'string' },
                                    subject: { type: 'string' },
                                    day: { type: 'string' },
                                    time: { type: 'string' }
                                }
                            }
                        }
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
        }
    }, async (request, reply) => {
        const studentRequirements = request.body;
        const tutorService = new TutorService();
        try {
            // Extract user_id and role from request.user if available
            const userContext = {
                user_id: request.user ? request.user.user_id : undefined,
                role: request.user ? request.user.role : undefined
            };
            const response = await llmService.findScheduleMatches(studentRequirements, studentRequirements.previous_schedule, userContext);
            if (response.success && Array.isArray(response.response)) {
                // Collect all unique tutor_ids from the response
                const tutorIds = [...new Set(response.response.map(entry => entry.tutor_id).filter(Boolean))];
                // Fetch all tutor names in one go
                const tutorNamesMap = await tutorService.getTutorNamesByIds(tutorIds);
                // Add tutor_name to each entry
                for (const entry of response.response) {
                    if (entry.tutor_id) {
                        entry.tutor_name = tutorNamesMap[entry.tutor_id] || undefined;
                    }
                }
                return response;
            } else {
                return reply.code(400).send(response);
            }
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ 
                success: false,
                error: 'llm error in generating, tutor is not updated'
            });
        }
    });

    // Get tutor by ID
    fastify.get('/tutor/:tutorId', {
        schema: {
            description: 'Get tutor information by ID',
            tags: ['LLM'],
            params: {
                type: 'object',
                required: ['tutorId'],
                properties: {
                    tutorId: { type: 'number' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        tutor: {
                            type: 'object',
                            properties: {
                                tutorId: { type: 'number' },
                                subjects: { type: 'array', items: { type: 'string' } },
                                grades: { type: 'array', items: { type: 'number' } },
                                currentClasses: { type: 'number' },
                                freeHours: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            day: { type: 'string' },
                                            hour: { type: 'string' }
                                        }
                                    }
                                },
                                unavailableHours: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            day: { type: 'string' },
                                            hour: { type: 'string' }
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
                        error: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const { tutorId } = request.params;
        
        try {
            const tutor = await mongoService.getTutorById(tutorId);
            if (!tutor) {
                return reply.code(404).send({ error: 'Tutor not found' });
            }
            return { tutor };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to get tutor information' });
        }
    });

    // Get the latest generated schedule for a student
    fastify.get('/getlastgeneratedschedule/:student_id', {
        schema: {
            description: 'Get the latest generated schedule for a student',
            tags: ['LLM'],
            params: {
                type: 'object',
                required: ['student_id'],
                properties: {
                    student_id: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        request_params: { type: 'object' },
                        response: { type: 'array', items: { type: 'object' } }
                    }
                },
                404: {
                    type: 'object',
                    properties: { error: { type: 'string' } }
                }
            }
        }
    }, async (request, reply) => {
        const { student_id } = request.params;
        try {
            const schedule = await mongoService.getLastGeneratedSchedule(student_id);
            if (!schedule) {
                return reply.code(200).send({ request_params: null, response: [] });
            }
            return {
                request_params: schedule.request_params || null,
                response: Array.isArray(schedule.response) ? schedule.response : []
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to get last generated schedule' });
        }
    });

    // Get generated schedules for a user or student within a time range (max 60 days)
    fastify.get('/getgeneratedschedules', {
        schema: {
            description: 'Get generated schedules for a user or student within a time range (max 60 days)',
            tags: ['LLM'],
            querystring: {
                type: 'object',
                properties: {
                    user_id: { type: 'string' },
                    student_id: { type: 'string' },
                    start_time: { type: 'string', format: 'date-time' },
                    end_time: { type: 'string', format: 'date-time' }
                },
                anyOf: [
                    { required: ['user_id'] },
                    { required: ['student_id'] }
                ]
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        schedules: { type: 'array', items: { type: 'object' } }
                    }
                },
                400: {
                    type: 'object',
                    properties: { error: { type: 'string' } }
                }
            }
        }
    }, async (request, reply) => {
        const { user_id, student_id, start_time, end_time } = request.query;
        // Validate 60 days max duration
        if (start_time && end_time) {
            const start = new Date(start_time);
            const end = new Date(end_time);
            const diffDays = Math.abs((end - start) / (1000 * 60 * 60 * 24));
            if (diffDays > 60) {
                return reply.code(400).send({ error: 'Maximum allowed duration is 60 days' });
            }
        }
        try {
            const schedules = await mongoService.getGeneratedSchedules({ user_id, student_id, start_time, end_time });
            return { schedules };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to get generated schedules' });
        }
    });
} 