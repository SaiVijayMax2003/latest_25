import FeedbackController from './feedback.controller.js';


export default async function feedbackRoutes(fastify, options) {
  const feedbackController = new FeedbackController(fastify); // ✅ Instantiate controller

  fastify.post('/createFeedback', {
    schema: {
      tags: ['feedback'],
      description: 'Create feedback for a tutor',
      body: {
        type: 'object',
        required: ['tutor_id', 'type', 'rating'],
        properties: {
          tutor_id: { type: 'number' },
          student_id: { type: 'number' },
          user_id: { type: 'number' },
          type: {
            type: 'string',
            enum: ['communication', 'content_knowledge', 'delivery']
          },
          rating: {
            type: 'number',
            minimum: 1,
            maximum: 10
          },
          text: { type: 'string' }
        }
      },
      response: {
        201: {
          description: 'Feedback created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            feedback: {
              type: 'object',
              properties: {
                _id: { type: 'string'},
                tutor_id: { type: 'number'},
                student_id: { type: 'number'},
                user_id: { type: 'number'},
                type: { type: 'string'},
                rating: { type: 'number'},
                text: { type: 'string'},
                created_at: { type: 'string', format: 'date-time'}
              }
            }
          }
        },
        400: {
          description: 'Validation error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: feedbackController.createFeedback.bind(feedbackController) // ✅ bind controller context
  });
}
