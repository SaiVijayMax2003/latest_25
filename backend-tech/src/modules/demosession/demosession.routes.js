 import {
  postDemoSession,
  getDemoSession,
  getAllSessions,
  updateSession,
  deleteSession,
  getExpiredSessions,
  getUpcomingSessions
} from './demosession.controller.js';

export default async function demoSessionRoutes(fastify, options) {
  // Create demo session
  fastify.post('/demosessions', {
    schema: {
      summary: 'Create a new demo session',
      tags: ['demosessions'],
      body: {
        type: 'object',
        required: [
          'student_name', 'contact', 'specialization', 'subject', 'topic', 
          'preferred_date', 'preferred_time', 'assigned_tutor', 'selected_demo_slots', 'tutor_id'
        ],
        properties: {
          student_name: { type: 'string' },
          contact: { type: 'string' },
          specialization: { type: 'string' },
          subject: { type: 'string' },
          topic: { type: 'string' },
          preferred_date: { type: 'string', format: 'date' },
          preferred_time: { type: 'string' },
          assigned_tutor: { type: 'string' },
          selected_demo_slots: { type: 'string' },
          tutor_id: {type: 'number'}
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { 
              type: 'object',
              properties: {
                demosession_id: { type: 'number' },
                student_name: { type: 'string' },
                contact: { type: 'string' },
                user_id: {},
                specialization: { type: 'string' },
                subject: { type: 'string' },
                topic: { type: 'string' },
                preferred_date: { type: 'string', format: 'date' },
                preferred_time: { type: 'string' },
                assigned_tutor: { type: 'string' },
                selected_demo_slots: { type: 'string' },
                tutor_id: {},
                expired: { type: 'boolean' }
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
    },
    handler: postDemoSession
  });

  // Get single demo session
  fastify.get('/demosessions/:demosession_id', {
    schema: {
      summary: 'Get a demo session by ID',
      tags: ['demosessions'],
      params: {
        type: 'object',
        properties: {
          demosession_id: { type:'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { 
              type: 'object',
              properties: {
                demosession_id: { type: 'number' },
                student_name: { type: 'string' },
                contact: { type: 'string' },
                user_id: {},
                specialization: { type: 'string' },
                subject: { type: 'string' },
                topic: { type: 'string' },
                preferred_date: { type: 'string', format: 'date' },
                preferred_time: { type: 'string' },
                assigned_tutor: { type: 'string' },
                selected_demo_slots: { type: 'string' },
                tutor_id: {},
                expired: { type: 'boolean' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: getDemoSession
  });

  // Get all demo sessions
  fastify.get('/demosessions', {
    schema: {
      summary: 'Get all demo sessions',
      tags: ['demosessions'],
      querystring: {
        type: 'object',
        properties: {
          expired: { type: 'boolean' },
          tutor_id: {},
          user_id: {}
        }
      },
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
                  demosession_id: { type: 'number' },
                  student_name: { type: 'string' },
                  contact: { type: 'string' },
                  user_id: {},
                  specialization: { type: 'string' },
                  subject: { type: 'string' },
                  topic: { type: 'string' },
                  preferred_date: { type: 'string', format: 'date' },
                  preferred_time: { type: 'string' },
                  assigned_tutor: { type: 'string' },
                  selected_demo_slots: { type: 'string' },
                  tutor_id: {},
                  expired: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    },
    handler: getAllSessions
  });

  // Update demo session
  fastify.put('/demosessions/:demosession_id', {
    schema: {
      summary: 'Update a demo session',
      tags: ['demosessions'],
      params: {
        type: 'object',
        properties: {
          demosession_id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          student_name: { type: 'string' },
          contact: { type: 'string' },
          specialization: { type: 'string' },
          subject: { type: 'string' },
          topic: { type: 'string' },
          preferred_date: { type: 'string', format: 'date' },
          preferred_time: { type: 'string' },
          assigned_tutor: { type: 'string' },
          selected_demo_slots: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { 
              type: 'object',
              properties: {
                demosession_id: { type: 'number' },
                student_name: { type: 'string' },
                contact: { type: 'string' },
                user_id: {},
                specialization: { type: 'string' },
                subject: { type: 'string' },
                topic: { type: 'string' },
                preferred_date: { type: 'string', format: 'date' },
                preferred_time: { type: 'string' },
                assigned_tutor: { type: 'string' },
                selected_demo_slots: { type: 'string' },
                tutor_id: {},
                expired: { type: 'boolean' }
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
    },
    handler: updateSession
  });

  // Delete demo session
  fastify.delete('/demosessions/:demosession_id', {
    schema: {
      summary: 'Delete a demo session',
      tags: ['demosessions'],
      params: {
        type: 'object',
        properties: {
          demosession_id: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { 
              type: 'object',
              properties: {
                demosession_id: { type: 'number' },
                student_name: { type: 'string' },
                contact: { type: 'string' },
                user_id: {},
                specialization: { type: 'string' },
                subject: { type: 'string' },
                topic: { type: 'string' },
                preferred_date: { type: 'string', format: 'date' },
                preferred_time: { type: 'string' },
                assigned_tutor: { type: 'string' },
                selected_demo_slots: { type: 'string' },
                tutor_id: {},
                expired: { type: 'boolean' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: deleteSession
  });

  // Get expired demo sessions
  fastify.get('/demosessions/expired', {
    schema: {
      summary: 'Get all expired demo sessions',
      tags: ['demosessions'],
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
                  demosession_id: { type: 'number' },
                  student_name: { type: 'string' },
                  contact: { type: 'string' },
                  user_id: {},
                  specialization: { type: 'string' },
                  subject: { type: 'string' },
                  topic: { type: 'string' },
                  preferred_date: { type: 'string', format: 'date' },
                  preferred_time: { type: 'string' },
                  assigned_tutor: { type: 'string' },
                  selected_demo_slots: { type: 'string' },
                  tutor_id: {},
                  expired: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    },
    handler: getExpiredSessions
  });

  // Get upcoming demo sessions
  fastify.get('/demosessions/upcoming', {
    schema: {
      summary: 'Get all upcoming demo sessions',
      tags: ['demosessions'],
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
                  demosession_id: { type: 'number' },
                  student_name: { type: 'string' },
                  contact: { type: 'string' },
                  user_id: {},
                  specialization: { type: 'string' },
                  subject: { type: 'string' },
                  topic: { type: 'string' },
                  preferred_date: { type: 'string', format: 'date' },
                  preferred_time: { type: 'string' },
                  assigned_tutor: { type: 'string' },
                  selected_demo_slots: { type: 'string' },
                  tutor_id: {},
                  expired: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    },
    handler: getUpcomingSessions
  });

  //get demosessions based on 



}
