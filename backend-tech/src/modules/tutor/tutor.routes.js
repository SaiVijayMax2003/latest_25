import TutorController from './tutor.controller.js';
import TutorService from './tutor.service.js';
import { writeAllTutorsScheduleFile } from '../llm/utils/tutorTextGenerator.js';

export default async function routes(fastify) {
    const tutorController = new TutorController(fastify);
    const tutorService = new TutorService();

    // Create tutor
    fastify.post('/', {
        schema: {
            tags: ['tutors'],
            summary: 'Create a new tutor',
            body: {
                type: 'object',
                required: ['tutor_name', 'subjects', 'grades', 'phone_number', 'email', 'total_available_hours'],
                properties: {
                    tutor_name: { type: 'string' },
                    subjects: { 
                        type: 'array',
                        items: { type: 'string' }
                    },
                    grades: { 
                        type: 'array',
                        items: { type: 'string' }
                    },
                    feedback: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                feedback_id: { type: 'string' },
                                user_id: { type: 'number' },
                                type: { type: 'string' },
                                text: { type: 'string' }
                            }
                        }
                    },
                    total_available_hours: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                                slots: { 
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },
                    total_slots: { type: 'number' },
                    allotted_hours: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                                time: { type: 'string' },
                                student_name: { type: 'string' },
                                student_id: { type: ['number', 'string'] },
                                slot_id: { type: 'string' }
                            }
                        }
                    },
                    phone_number: { type: 'string' },
                    email: { type: 'string' },
                    specializations: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    joining_date: { type: 'string' },
                    created_by : {
                        type: 'object',
                        properties: {
                            user_id: { type: 'number' },
                            user_name: { type: 'string' },
                            user_role: { type: 'string' }
                        }
                    }
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
                                tutor_id: { type: 'number' }
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
        handler: tutorController.createTutor.bind(tutorController)
    });

   // Text feedback for tutor
   fastify.put('/textfeedback/:tutorId', {
    schema: {
      tags: ['feedback'],
      summary: 'Create new feedback',
      params: {
        type: 'object',
        required: ['tutorId'],
        properties: {
          tutorId: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        required: ['user_id', 'type', 'text'],
        properties: {
          user_id: { type: 'number' },
          type: { type: 'string' },
          text: { type: 'string' }
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
                feedback_id: { type: 'string' }
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
    handler: tutorController.createFeedback.bind(tutorController)
  });


    fastify.get('/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Get tutor by ID',
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
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                _id: { type: 'string' },
                                tutor_id: { type: 'number' },
                                user_id: { type: 'number' },
                                tutor_name: { type: 'string' },
                                subjects: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                grades: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                feedback: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            feedback_id: { type: 'string' },
                                            user_id: { type: 'number' },
                                            type: { type: 'string' },
                                            text: { type: 'string' }
                                        }
                                    }
                                },
                                total_available_hours: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            day: { type: 'string' },
                                            slots: {
                                                type: 'array',
                                                items: { type: 'string' }
                                            }
                                        }
                                    }
                                },
                                status: { type: 'string' },
                                total_slots: { type: 'number' },
                                allotted_hours: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            day: { type: 'string' },
                                            time: { type: 'string' },
                                            student_name: { type: 'string' },
                                            student_id: { type: 'string' },
                                            slot_id: { type: 'string' },
                                            _id: { type: 'string' }
                                        }
                                    }
                                },
                                phone_number: { type: 'string' },
                                email: { type: 'string' },
                                specializations: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                joining_date: { type: 'string' },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' },
                                __v: { type: 'number' }
                            }
                        }
                    }
                }
            }            
        },
        handler: tutorController.getTutorById.bind(tutorController)
    });
    

    // Get all tutors
    fastify.get('/getalltutors', {
        schema: {
          tags: ['tutors'],
          summary: 'Get all tutors with filters, search, and pagination',
          querystring: {
            type: 'object',
            properties: {
              sortBy: {
                type: 'string',
                enum: [
                  'name_asc',
                  'name_desc',
                  'date_added_newest',
                  'date_added_oldest',
                  'last_modified_newest',
                  'last_modified_oldest'
                ]
              },
              subject: { type: 'string' },
              page: { type: 'integer', minimum: 1, default: 1 },
              limit: { type: 'integer', minimum: 1, default: 50 }
            }
          },
          response: {
            200: {
              type: 'object',
              properties: {
                tutors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      tutor_id: { type: 'number' },
                      user_id: { type: 'number' },
                      tutor_name: { type: 'string' },
                      subjects: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      grades: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      feedback: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            user_id: { type: 'number' },
                            type: { type: 'string' },
                            text: { type: 'string' }
                          }
                        }
                      },
                      total_available_hours: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            day: { type: 'string' },
                            slots: {
                              type: 'array',
                              items: { type: 'string' }
                            }
                          }
                        }
                      },
                      total_slots: { type: 'number' },
                      allotted_hours: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            day: { type: 'string' },
                            time: { type: 'string' },
                            student_name: { type: 'string' },
                            student_id: { type: 'string' },
                            slot_id: { type: 'string' },
                            _id: { type: 'string' }
                          }
                        }
                      },
                      phone_number: { type: 'string' },
                      email: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      __v: { type: 'number' }
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
        handler: tutorController.getAllTutors.bind(tutorController)
      });



      fastify.get('/searchtutors', {
        schema: { 
          tags: ['tutors'],
          summary: 'Get all tutors by search (returns only tutor_id and tutor_name)',
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
                  tutor_id: { type: 'number' },
                  tutor_name: { type: 'string' }
                },
                required: ['tutor_id', 'tutor_name']
              }
            }
          }
        },
        handler: tutorController.getAllTutorsBySearch.bind(tutorController)
      });

    // Update tutor
    fastify.put('/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Update tutor',
            params: {
                type: 'object',
                required: ['tutorId'],
                properties: {
                    tutorId: { type: 'number' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    tutor_name: { type: 'string' },
                    subjects: { 
                        type: 'array',
                        items: { type: 'string' }
                    },
                    grades: { 
                        type: 'array',
                        items: { type: 'string' }
                    },
                    feedback: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                user_id: { type: 'number' },
                                type: { type: 'string' },
                                text: { type: 'string' }
                            }
                        }
                    },
                    total_available_hours: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                                slots: { 
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },
                    allotted_hours: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                                time: { type: 'string' },
                                student_name: { type: 'string' },
                                student_id: { type: ['number', 'string'] },
                                slot_id: { type: 'string' }
                            }
                        }
                    },
                    phone_number: { type: 'string' },
                    email: { type: 'string' }
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
                                tutor_id: { type: 'number' },
                                tutor_name: { type: 'string' },
                                subjects: { type: 'array', items: { type: 'string' } },
                                grades: { type: 'array', items: { type: 'string' } },
                                feedback: { type: 'array' },
                                total_available_hours: { type: 'array' },
                                allotted_hours: { type: 'array' },
                                phone_number: { type: 'string' },
                                email: { type: 'string' },
                                joining_date: { type: 'string' },
                                specialization: { type: 'array', items: { type: 'string' } }
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
        handler: tutorController.updateTutor.bind(tutorController)
    });

    // Delete tutor
    fastify.delete('/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Delete tutor',
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
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: tutorController.deleteTutor.bind(tutorController)
    });

   

    // Get available hours for specific teacher
    fastify.get('/available/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Get available hours for specific teacher',
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
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    day: { type: 'string' },
                                    time: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: tutorController.getAvailableHoursByTeacherId.bind(tutorController)
    });

    // Get total available hours for specific teacher
    fastify.get('/available/total_hours/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Get total available hours for specific teacher',
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
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                                    slots: {
                                        type: 'array',
                                        items: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: tutorController.getTotalAvailableHoursByTeacherId.bind(tutorController)
    });

    // Get tutor profile
    fastify.get('/profile/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Get total Profile',
            params: {
                type: 'object',
                required: ['tutorId'],
                properties: {
                    tutorId: { type: 'string' }
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
                                tutor_id: { type: 'string' },
                                tutor_name: { type: 'string' },
                                grades: { type: 'array', items: { type: 'string' } },
                                subject: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const result = await tutorService.getTutorProfile(request.params.tutorId);
                reply.code(200).send(result);
            } catch (error) {
                reply.code(404).send({
                    success: false,
                    error: error.message
                });
            }
        }
    });

    // Update tutor profile
    fastify.put('/profile/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Update tutor Profile',
            params: {
                type: 'object',
                required: ['tutorId'],
                properties: {
                    tutorId: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    tutor_name: { type: 'string' },
                    email: { type: 'string' },
                    phone_number: { type: 'string' },
                    specialization: { type: 'array', items: { type: 'string' } },
                    subjects: { 
                        type: 'array',
                        items: { type: 'string' }
                    },
                    grades: { 
                        type: 'array',
                        items: { type: 'string' }
                    },
                    feedback: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                user_id: { type: 'number' },
                                type: { type: 'string' },
                                text: { type: 'string' }
                            }
                        }
                    },
                    total_available_hours: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                                slots: { 
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },
                    status: { type: 'string' },
                    allotted_hours: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                                time: { type: 'string' },
                                student_name: { type: 'string' },
                                student_id: { type: ['number', 'string'] },
                                slot_id: { type: 'string' }
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
                        data: {
                            type: 'object',
                            properties: {
                                tutor_id: { type: 'string' },
                                tutor_name: { type: 'string' },
                                subjects: { type: 'array', items: { type: 'string' } },
                                grades: { type: 'array', items: { type: 'string' } },
                                feedback: { type: 'array' },
                                total_available_hours: { type: 'array' },
                                allotted_hours: { type: 'array' },
                                status: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const result = await tutorService.updateTutorProfile(
                    request.params.tutorId,
                    request.body
                );
                reply.code(200).send(result);
            } catch (error) {
                reply.code(404).send({
                    success: false,
                    error: error.message
                });
            }
        }
    });

    // Modify tutor schedule
    fastify.post('/schedule/modify', {
        schema: {
            tags: ['tutors'],
            summary: 'Modify tutor schedule by adding student to a specific slot',
            body: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['student_id', 'day', 'time', 'tutor_id', 'subject'],
                    properties: {
                        student_id: { type: 'number' },
                        day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                        time: { type: 'string' },
                        tutor_id: { type: 'number' },
                        subject: { type: 'string' }
                    }
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
                                    tutor_id: { type: 'number' },
                                    tutor_name: { type: 'string' },
                                    student_id: { type: 'number' },
                                    student_name: { type: 'string' },
                                    day: { type: 'string' },
                                    time: { type: 'string' },
                                    subject: { type: 'string' },
                                    slot_id: { type: 'string' },
                                    allotted_hour: {
                                        type: 'object',
                                        properties: {
                                            day: { type: 'string' },
                                            time: { type: 'string' },
                                            student_name: { type: 'string' },
                                            student_id: { type: 'number' },
                                            subject: { type: 'string' },
                                            slot_id: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        data: { 
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    student_id: { type: ['number', 'string'] },
                                    student_name: { type: 'string' },
                                    day: { type: 'string' },
                                    time: { type: 'string' },
                                    tutor_id: { type: 'number' },
                                    subject: { type: 'string' },
                                    error: { type: 'string' }
                                }
                            }
                        },
                        conflicts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    student_id: { type: ['number', 'string'] },
                                    student_name: { type: 'string' },
                                    day: { type: 'string' },
                                    time: { type: 'string' },
                                    tutor_id: { type: 'number' },
                                    subject: { type: 'string' },
                                    error: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: tutorController.modifyTutorSchedule.bind(tutorController)
    });

    // Validate tutor schedule
    fastify.post('/schedule/validate', {
        schema: {
            tags: ['tutors'],
            summary: 'Validate if a schedule modification is possible',
            body: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['student_id', 'day', 'time', 'tutor_id'],
                    properties: {
                        student_id: { type: 'integer' },
                        day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
                        time: { type: 'string' },
                        tutor_id: { type: 'number' }
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        is_valid: { type: 'boolean' },
                        data: { 
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    student_id: { type: 'integer' },
                                    student_name: { type: 'string' },
                                    day: { type: 'string' },
                                    time: { type: 'string' },
                                    tutor_id: { type: 'number' }
                                }
                            }
                        },
                        conflicts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    student_id: { type: ['number', 'string'] },
                                    student_name: { type: 'string' },
                                    day: { type: 'string' },
                                    time: { type: 'string' },
                                    tutor_id: { type: 'number' },
                                    subject: { type: 'string' },
                                    error: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: tutorController.validateTutorSchedule.bind(tutorController)
    });

    // Swap tutor
    fastify.post('/schedule/swap', {
    schema: {
        tags: ['tutors'],
        summary: 'Swap tutors for multiple time slots',
        body: {
            type: 'array',
            items: {
                type: 'object',
                required: ['source', 'destination'],
                properties: {
                    source: {
                        type: 'object',
                        required: ['student_id', 'tutor_id', 'time', 'day', 'student_name', 'subject'],
                        properties: {
                            student_id: { type: 'number' },
                            tutor_id: { type: 'number' },
                            time: { type: 'string' },
                            student_name: { type: 'string' },
                            subject: { type: 'string' },
                            day: {
                                type: 'string',
                                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                            }
                        }
                    },
                    destination: {
                        type: 'object',
                        required: ['student_id', 'tutor_id', 'time', 'day', 'student_name', 'subject'],
                        properties: {
                            student_id: { type: 'number' },
                            tutor_id: { type: 'number' },
                            time: { type: 'string' },
                            student_name: { type: 'string' },
                            subject: { type: 'string' },
                            day: {
                                type: 'string',
                                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                            }
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
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                source: {
                                    type: 'object',
                                    properties: {
                                        student_id: { type: 'number' },
                                        tutor_id: { type: 'number' },
                                        time: { type: 'string' },
                                        day: { type: 'string' },
                                        student_name: { type: 'string' },
                                        subject: { type: 'string' }
                                    }
                                },
                                destination: {
                                    type: 'object',
                                    properties: {
                                        student_id: { type: 'number' },
                                        tutor_id: { type: 'number' },
                                        time: { type: 'string' },
                                        day: { type: 'string' },
                                        student_name: { type: 'string' },
                                        subject: { type: 'string' }
                                    }
                                }
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
    },
    handler: tutorController.swapTutor.bind(tutorController)
});


    fastify.get('/tutorname/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Get tutor name, id, and subjects by tutorId',
            params: {
                type: 'object',
                properties: {
                    tutorId: { type: 'number' }
                },
                required: ['tutorId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        tutor_id: { type: 'number' },
                        tutor_name: { type: 'string' },
                        tutor_subjects: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    },
                    required: ['tutor_id', 'tutor_name', 'tutor_subjects']
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
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
        handler: tutorController.getTutorNameByIdHandler.bind(tutorController)
    });

    // Delete feedback by feedback_id
    fastify.delete('/textfeedback/:feedback_id', {
        schema: {
            tags: ['feedback'],
            summary: 'Delete feedback by feedback ID',
            params: {
                type: 'object',
                required: ['feedback_id'],
                properties: {
                    feedback_id: { type: 'string' }
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
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: tutorController.deleteFeedback.bind(tutorController)
    });

    // Search tutors by availability and subject
    fastify.post('/searchbyavailability', {
        schema: {
            tags: ['tutors'],
            summary: 'Search tutors by availability and subject',
            body: {
                type: 'object',
                required: ['days', 'subject', 'match', 'total_no_of_slots'],
                properties: {
                    days: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['day', 'slots'],
                            properties: {
                                day: { 
                                    type: 'string',
                                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                },
                                slots: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },
                    subject: { type: 'string' },
                    match: {
                        type: 'array',
                        items: { 
                            type: 'string',
                            enum: ['strict', 'day-only']
                        }
                    },
                    total_no_of_slots: { type: 'number' }
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
                                tutor_data: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            tutor_id: { type: 'number' },
                                            tutor_name: { type: 'string' },
                                            free_hours: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        day: { type: 'string' },
                                                        slots: {
                                                            type: 'array',
                                                            items: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            },
                                            utilization_rate: { type: 'string' },
                                            total_available_slots: { type: 'number' },
                                            allotted_slots: { type: 'number' },
                                            status: { type: 'string' },
                                            grades: { 
                                                type: 'array',
                                                items: { type: 'string' }
                                            },
                                            specializations: {
                                                type: 'array',
                                                items: { type: 'string' }
                                            }
                                        }
                                    }
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
        },
        handler: tutorController.searchTutorsByAvailability.bind(tutorController)
    });


    fastify.post('/refresh-llm-vector', {
        schema: {
            tags: ['tutors'],
            summary: 'Refresh LLM vector (tutor schedule file and vector store)',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        file: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                500: {
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
                const file = await writeAllTutorsScheduleFile();
                return reply.send({ success: true, file, message: 'LLM vector refreshed successfully.' });
            } catch (error) {
                request.log.error('Error refreshing LLM vector:', error);
                return reply.code(500).send({ success: false, error: error.message });
            }
        }
    });

    fastify.put('/changefreeslots/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Add or delete tutor availability slot by tutor ID',
            params: {
                type: 'object',
                required: ['tutorId'],
                properties: {
                    tutorId: { type: 'number' }
                }
            },
            body: {
                type: 'object',
                required: ['type_of_req', 'day', 'slot'],
                properties: {
                    type_of_req: { 
                        type: 'string',
                        enum: ['add', 'delete']
                    },
                    day: { type: 'string' },
                    slot: { type: 'string' }
                },
                additionalProperties: false
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                tutor_id: { type: 'number' },
                                total_available_hours: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            day: { type: 'string' },
                                            slots: {
                                                type: 'array',
                                                items: { type: 'string' }
                                            }
                                        }
                                    }
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
        handler: tutorController.changeFreeSlotsHandler.bind(tutorController)
    });

    fastify.post('/demotutoravailability', {
        schema: {
            tags: ['tutors'],
            summary: 'Search demo tutors by availability and subject',
            body: {
                type: 'object',
                required: ['days', 'subject'],
                properties: {
                    days: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['day', 'slots'],
                            properties: {
                                day: { 
                                    type: 'string',
                                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                },
                                slots: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },
                    subject:{type:'string'}
                }
            },
            response: {
                200:{
                    type: 'object',
                    properties: {
                        tutor_data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    tutor_id: { type: 'number' },
                                    tutor_name: { type: 'string' },
                                    free_hours: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                day: { type: 'string' },
                                                slots: {
                                                    type: 'array',
                                                    items: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        requested_data: {
                            type: 'object',
                            properties: {
                                days: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            day: { type: 'string' },
                                            slots: {
                                                type: 'array',
                                                items: { type: 'string' }
                                            }
                                        }
                                    }
                                },
                                subject: { type: 'string' }
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
        handler: tutorController.searchDemoTutorsByAvailability.bind(tutorController)
    });
    fastify.get('/hour-utilization', {
        schema: {
            tags: ['tutors'],
            description: 'Get tutors utilization data for all days',
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
                                    day: { type: 'string' },
                                    slots: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                time: { type: 'string' },
                                                total_hours: { type: 'number' },
                                                allotted_hours: { type: 'number' },
                                                utilization_rate: { type: 'number' }
                                            }
                                        }
                                    }
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
        },
        handler: tutorController.getHourUtilization.bind(tutorController)
    });

    fastify.get('/additional-details/:tutorId', {
        schema: {
            tags: ['tutors'],
            summary: 'Get additional details for a tutor by tutorId',
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
                        success: { type: 'boolean' },
                        additional_details: {
                            type: 'object',
                            properties: {
                                email: { type: 'string' },
                                phone_number: { type: 'string' },
                                regular_slots: { type: 'array', items: { type: 'string' } },
                                flexible_slots: { type: 'array', items: { type: 'string' } },
                                highest_graduation: { type: 'string' },
                                college_name: { type: 'string' },
                                year_of_graduation: { type: 'number' },
                                spoken_languages: { type: 'array', items: { type: 'string' } },
                                grades_taught: { type: 'array', items: { type: 'number' } },
                                subjects_taught: { type: 'array', items: { type: 'string' } },
                                specializations: { type: 'array', items: { type: 'string' } },
                                state_board: { type: 'array', items: { type: 'string' } },
                                resumelink: { type: 'string' },
                                years_of_experience: { type: 'number' }
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
        handler: tutorController.getTutorAdditionalDetails.bind(tutorController)
    });

    // Preview affected students and slots before deleting a tutor
    fastify.get('/delete-preview/:tutorId', {
        preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
        schema: {
            tags: ['tutors'],
            description: 'Preview which students and slots will be affected if this tutor is deactivated',
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
                        success: { type: 'boolean' },
                        tutor_id: { type: 'number' },
                        tutor_name: { type: 'string' },
                        allotted_hours: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    day: { type: 'string' },
                                    time: { type: 'string' },
                                    student_name: { type: 'string' },
                                    student_id: {},
                                    subject: { type: 'string' },
                                    slot_id: { type: 'string' }
                                }
                            }
                        },
                        affected_students: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    student_id: { type: 'number' },
                                    full_name: { type: 'string' },
                                    affected_slots: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                day: { type: 'string' },
                                                time: { type: 'string' },
                                                tutor_name: { type: 'string' },
                                                tutor_id: { type: 'number' }
                                            }
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
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: tutorController.previewTutorDeleteEffectHandler.bind(tutorController)
    });

    // Confirm deletion: set status to inactive and remove all allotted_hours
    fastify.post('/delete-confirm/:tutorId', {
        preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
        schema: {
            tags: ['tutors'],
            description: 'Confirm deletion: set status to inactive and remove all allotted_hours',
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
                        success: { type: 'boolean' },
                        tutor_id: { type: 'number' },
                        tutor_name: { type: 'string' },
                        status: { type: 'string' },
                        allotted_hours: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    day: { type: 'string' },
                                    time: { type: 'string' },
                                    student_name: { type: 'string' },
                                    student_id: {},
                                    subject: { type: 'string' },
                                    slot_id: { type: 'string' }
                                }
                            }
                        },
                        affected_students: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    student_id: { type: 'number' },
                                    full_name: { type: 'string' }
                                }
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
        handler: tutorController.confirmTutorDeleteHandler.bind(tutorController)
    });

    //record attendance
    fastify.post('/record-attendance', {
        schema: {
            tags: ['tutors'],
            summary: 'Create a new tutor attendance',
            body: {
                type: 'object',
                required: ['tutor_id'],
                properties: {
                    tutor_id: { type: 'number' },
                    session_id: { type: 'number' },
                    attendance_type: { 
                        type: 'string',
                        enum: ['checkin_Attributes', 'checkout_Attributes']
                    },
                    battery_level: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100
                    },
                    location: {
                        type: 'object',              
                        properties: {
                            coordinates: {
                                type: 'array',
                                items: { type: 'number' },
                                minItems: 2,
                                maxItems: 2
                            },
                            address: { type: 'string' }
                        }
                    },
                    battery_level: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100
                    },
                    device_info: {
                        type: 'object',
                        properties: {
                            device_id: { type: 'string' }
                        }
                    }
                }
            }, 
            response: {
                201: {
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
                        error: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: tutorController.createTutorAttendance.bind(tutorController)            
    });

}
