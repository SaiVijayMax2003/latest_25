import QuestionController from './question.controller.js';

// Validation schemas
const createQuestionSchema = {
  type: 'object',
  required: ['question', 'options', 'ans', 'type', 'topic'],
  properties: {
    question: {
      type: 'string',
      minLength: 1,
      description: 'The question text'
    },
    options: {
      type: 'array',
      minItems: 2,
      items: {
        type: 'string',
        minLength: 1
      },
      description: 'Array of answer options (minimum 2)'
    },
    ans: {
      type: 'string',
      minLength: 1,
      description: 'The correct answer (must be one of the options)'
    },
    type: {
      type: 'string',
      enum: ['maths', 'physics', 'chemistry', 'biology'],
      description: 'Subject type of the question'
    },
    topic: {
      type: 'string',
      minLength: 1,
      description: 'Topic within the subject'
    }
  }
};

const updateQuestionSchema = {
  type: 'object',
  properties: {
    question: {
      type: 'string',
      minLength: 1,
      description: 'The question text'
    },
    options: {
      type: 'array',
      minItems: 2,
      items: {
        type: 'string',
        minLength: 1
      },
      description: 'Array of answer options (minimum 2)'
    },
    ans: {
      type: 'string',
      minLength: 1,
      description: 'The correct answer (must be one of the options)'
    },
    type: {
      type: 'string',
      enum: ['maths', 'physics', 'chemistry', 'biology'],
      description: 'Subject type of the question'
    },
    topic: {
      type: 'string',
      minLength: 1,
      description: 'Topic within the subject'
    }
  }
};

const questionResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        question_id: { type: 'string' },
        question: { type: 'string' },
        options: { 
          type: 'array',
          items: { type: 'string' }
        },
        ans: { type: 'string' },
        type: { type: 'string' },
        topic: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

const questionsListResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              question_id: { type: 'string' },
              question: { type: 'string' },
              options: { 
                type: 'array',
                items: { type: 'string' }
              },
              ans: { type: 'string' },
              type: { type: 'string' },
              topic: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' }
          }
        }
      }
    }
  }
};

async function questionRoutes(fastify, options) {
  // Create a new question
  fastify.post('/', {
    schema: {
      description: 'Create a new question (question_id will be auto-generated based on type)',
      tags: ['Questions'],
      body: createQuestionSchema,
      response: {
        201: questionResponseSchema,
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, QuestionController.createQuestion);

  // Get all questions with optional filters
  fastify.get('/', {
    schema: {
      description: 'Get all questions with optional filters and pagination',
      tags: ['Questions'],
      querystring: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['maths', 'physics', 'chemistry', 'biology'],
            description: 'Filter by question type'
          },
          topic: {
            type: 'string',
            description: 'Filter by topic (case-insensitive search)'
          },
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Page number for pagination'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            description: 'Number of questions per page'
          }
        }
      },
      response: {
        200: questionsListResponseSchema
      }
    }
  }, QuestionController.getQuestions);

  // Get question by ID
  fastify.get('/:question_id', {
    schema: {
      description: 'Get a specific question by its ID',
      tags: ['Questions'],
      params: {
        type: 'object',
        required: ['question_id'],
        properties: {
          question_id: {
            type: 'string',
            pattern: '^[MPCB]\\d{3}$',
            description: 'Question ID in format M001, P001, C001, B001'
          }
        }
      },
      response: {
        200: questionResponseSchema,
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, QuestionController.getQuestionById);

  // Update question
  fastify.put('/:question_id', {
    schema: {
      description: 'Update an existing question',
      tags: ['Questions'],
      params: {
        type: 'object',
        required: ['question_id'],
        properties: {
          question_id: {
            type: 'string',
            pattern: '^[MPCB]\\d{3}$',
            description: 'Question ID in format M001, P001, C001, B001'
          }
        }
      },
      body: updateQuestionSchema,
      response: {
        200: questionResponseSchema,
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
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
  }, QuestionController.updateQuestion);

  // Delete question
  fastify.delete('/:question_id', {
    schema: {
      description: 'Delete a question',
      tags: ['Questions'],
      params: {
        type: 'object',
        required: ['question_id'],
        properties: {
          question_id: {
            type: 'string',
            pattern: '^[MPCB]\\d{3}$',
            description: 'Question ID in format M001, P001, C001, B001'
          }
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
        }
      }
    }
  }, QuestionController.deleteQuestion);
}

export default questionRoutes;
