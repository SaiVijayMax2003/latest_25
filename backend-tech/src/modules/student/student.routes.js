import * as controller from './student.controller.js';
import { generateOrderId } from '../order/order.service.js';
export default async function studentRoutes(fastify, options) {


  fastify.get('/getallstudents', {
    schema: {
      tags: ['students'],
      description: 'Get a list of all students',
      querystring: {
        type: 'object',
        properties: {
          sortBy: {
            type: 'string',
            enum: ['name_asc', 'name_desc', 'date_added_newest', 'date_added_oldest',
                    'last_modified_newest', 'last_modified_oldest'],
            default: 'date_added_newest'
          },
          subjects: { type: 'string' },
          limit: { type: 'integer', default: 50 },
          page: { type: 'integer', default: 1 }
        }
      },
      response: {
        200: {
          description: 'List of all students with pagination info',
          type: 'object',
          properties: {
            students: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  student_id: { type: 'integer' },
                  created_at: { type: 'string', format: 'date-time' },
                  full_name: { type: 'string' },
                  phone_number: { type: 'string' },
                  student_grade: { type: 'string' },
                  student_status: { type: 'string' },
                  subjects: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        subject: { type: 'string' },
                        classes: { type: 'number' }
                      }
                    }
                  },
                  total_amount: { type: 'number' },
                  amount_paid: { type: 'number' },
                  amount_pending: { type: 'number' },
                  course_start_date: { type: 'string', format: 'date' },
                  course_end_date: { type: 'string', format: 'date' },
                  classes_per_week: { type: 'integer' },
                  course_months: { type: 'integer' },
                  total_no_of_classes_should_be_given: { type: 'integer' },
                  verification: { type: 'string' },
                  remarks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string', format: 'date' },
                        remark: { type: 'string' }
                      }
                    }
                  },
                  updatedAt: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string', format: 'date' },
                        action: { type: 'string' }
                      }
                    }
                  }
                }
              }
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        },
        404: {
          description: 'No students found',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: controller.getAllStudentsHandler
  });
 


  fastify.get('/searchstudents', {
    schema: {
      tags: ['students'],
      summary: 'Get all students by search (returns only student_id and student_name)',
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
              full_name: { type: 'string' }
            },
            required: ['student_id', 'full_name']
          }
        }
      }
    },
    handler: controller.getAllStudentsBySearchHandler
  });
     // Text feedback for tutor
     fastify.put('/textfeedbackstudent/:studentId', {
      schema: {
        tags: ['feedback'],
        summary: 'Create new feedback',
        params: {
          type: 'object',
          required: ['studentId'],
          properties: {
            studentId: { type: 'number' }
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
      handler: controller.createFeedbackHandler.bind(controller)
    });
    




  fastify.get('/student/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Get student by student_id',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      response: {
        200: {
          description: 'Student found',
          type: 'object',
          properties: {
            student_id: { type: 'integer' },
            total_amount: { type: 'number' },
            classes_per_week: { type: 'integer' },
            course_end_date: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            course_start_date: { type: 'string' },
            remarks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  type: { type: 'string' },
                  text: { type: 'string' }
                }
              }
            },
            course_months: { type: 'integer' },
            full_name: { type: 'string' },
            amount_pending: { type: 'number' },
            amount_paid: { type: 'number' },
            phone_number: { 
              type: 'string',
              description: 'Phone number must start with +91 followed by exactly 10 digits (e.g., +917386136808)'
            },
            student_grade: { type: 'string' },
            student_status: { type: 'string' },
            total_no_of_classes_should_be_given: { type: 'integer' },
            updatedAt: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  type: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            },
            verification_status: { type: 'string' },
            payment_status: { type: 'string' },
            student_status: { type: 'string' },
            email: { type: 'string' },
            date_of_birth: { type: 'string' },
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
            subjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  subject: { type: 'string' },
                  classes: { type: 'number' }
                },
                required: ['subject', 'classes']
              }
            },
            classes_per_week_string: { type: 'string' },
            deal_closed_date: {
              type: 'object',
              properties: {
                demo_class_taken: { type: 'string' },
                demo_class_date: { type: 'string' },
                demo_subject: { type: 'string' },
                demo_tutor: { type: 'string' },
                demo_classes_feedback: { type: 'string' }
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
            allotted_hours: {
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
            },
            specializations: {
              type: 'array',
              items: { type: 'string' }
            },
            payment_transaction_id: { type: 'string' },
            payment_type: { type: 'string' },
            payment_slip_url: { type: 'string' },
            enrollment_form_url: { type: 'string' },
          }
        },
        404: {
          description: 'Student not found',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    handler: controller.getStudentHandler
  });

  fastify.post('/student', {
    schema: {
      tags: ['students'],
      description: 'Create a new student',
      body: {
        type: 'object',
        required: [
          'total_amount',
          'classes_per_week',
          'course_end_date',
          'course_start_date',
          'full_name',
          'phone_number',
          'student_grade'
        ],
        properties: {
          total_amount: { type: 'integer' },
          classes_per_week: { type: 'integer' },
          course_end_date: { type: 'string' },
          course_start_date: { type: 'string' },
          remarks: { type: 'array', items: { type: 'object' } },
          course_months: { type: 'integer' },
          full_name: { type: 'string' },
          amount_pending: { type: 'integer' },
          amount_paid: { type: 'integer' },
          phone_number: { 
            type: 'string',
            description: 'Phone number must start with +91 followed by exactly 10 digits (e.g., +917386136808)'
          },
          student_grade: { type: 'string' },
          student_status: { type: 'string' },
          verification_status: { type: 'string' },
          payment_status: { 
            type: 'string',
            enum: ['verified', 'pending', 'rejected'],
            default: 'pending'
          },
          total_no_of_classes_should_be_given: { type: 'integer' },
          updatedAt: { type: 'array', items: { type: 'object' } },
          email: { type: 'string' },
          parent_phone_number: { type: 'array', items: { type: 'object' } },
          date_of_birth: { type: 'string' },
          subjects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                subject: { type: 'string' },
                classes: { type: 'number' }
              },
              required: ['subject', 'classes']
            }
          },
          classes_per_week_string: { type: 'string' },
          deal_closed_date: {
            type: 'object',
            properties: {
              demo_class_taken: { type: 'string' },
              demo_class_date: { type: 'string' },
              demo_subject: { type: 'string' },
              demo_tutor: { type: 'string' },
              demo_classes_feedback: { type: 'string' }
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
          allotted_hours: {
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
          },
          specializations: {
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
          payment_transaction_id: { type: 'string' },
          payment_type: { type: 'string' },
          payment_slip_url: { type: 'string' },
          enrollment_form_url: { type: 'string' }
        },
      },
      response: {
        201: {
          description: 'Student created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                student_id: { type: 'integer' },
                order_id: { type: 'string' }
              }
            }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      },
    },
    handler: controller.createStudentHandler,
  });
  
  fastify.delete('/student/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Delete a student by student_id',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      response: {
        200: {
          description: 'Student deleted successfully',
          type: 'object',
        },
        404: {
          description: 'Student not found',
          type: 'object',
        },
      },
    },
    handler: controller.deleteStudentHandler,
  });



  fastify.get('/allottedhours/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Get all allotted hours for a student by student_id',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      response: {
        200: {
          description: 'Allotted hours found for the student',
          type: 'object',
          properties: {
            allotted_hours: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  time: { type: 'string' },
                  student_name: { type: 'string' },
                  student_id: { type: ['string', 'integer'] },
                  slot_id: { type: 'string' },
                  _id: { type: 'string' }
                }
              }
            }
          }
        },
        404: {
          description: 'No allotted hours found for the student',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid student_id format',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
    handler: controller.getStudentAllottedHoursHandler
  });

  fastify.get('/status/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Get student status and verification_status by student_id',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      response: {
        200: {
          description: 'Status and verification_status retrieved',
          type: 'object',
          properties: {
            student_status: { type: 'string' },
            verification_status: { type: 'string' },
          },
        },
        404: {
          description: 'Student not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: controller.getStudentStatusHandler,
  });
  fastify.get('/payment/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Get student payment details by student_id',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      response: {
        200: {
          description: 'Payment details retrieved',
          type: 'object',
          properties: {
            total_amount: { type: 'number' },
            amount_pending: { type: 'number' },
            amount_paid: { type: 'number' },
          },
        },
        404: {
          description: 'Student not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: controller.getStudentPaymentHandler,
  });

  fastify.put('/updatepayment/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Update payment details for a student',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      body: {
        type: 'object',
        properties: {
          total_amount: { type: 'number' },
          amount_paid: { type: 'number' },
          amount_pending: { type: 'number' },
        },
        required: ['total_amount', 'amount_paid', 'amount_pending'],
      },
      response: {
        200: {
          description: 'Payment updated successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: {
          description: 'Validation failed',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        404: {
          description: 'Student not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: controller.updateStudentPaymentHandler,
  });

  fastify.put('/updatestatus/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Update status and verification_status of a student',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      body: {
        type: 'object',
        properties: {
          student_status: { 
            type: 'string',
            enum: ['active', 'hold', 'inactive']
          },
          verification_status: { 
            type: 'string',
            enum: ['verified', 'pending', 'rejected']
          },
          payment_status: { 
            type: 'string',
            enum: ['verified', 'pending', 'rejected']
          }
        },
        required: ['student_status', 'verification_status'],
      },
      response: {
        200:{
          description: 'Status updated successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid input values',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        404: {
          description: 'Student not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: controller.updateStudentStatusHandler,
  });

  fastify.put('/studentupdate/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Update specific fields of a student. Note: Fields total_amount, amount_paid, amount_pending, student_status, and verification_status cannot be updated through this endpoint.',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      body: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          phone_number: { type: 'string' },
          student_grade: { type: 'string' },
          course_start_date: { type: 'string', format: 'date' },
          course_end_date: { type: 'string', format: 'date' },
          classes_per_week: { type: 'integer' },
          course_months: { type: 'integer' },
          total_no_of_classes_should_be_given: { type: 'integer' },
          remarks: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                remark: { type: 'string' }
              }
            }
          },
          subjects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                subject: { type: 'string' },
                classes: { type: 'number' }
              },
              required: ['subject', 'classes']
            }
          },
          allotted_hours: {
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
          },
          specializations: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      },
      response: {
        200: {
          description: 'Student updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                full_name: { type: 'string' },
                phone_number: { 
                  type: 'string',
                  description: 'Phone number must start with +91 followed by exactly 10 digits (e.g., +917386136808)'
                },
                student_grade: { type: 'string' },
                course_start_date: { type: 'string', format: 'date' },
                course_end_date: { type: 'string', format: 'date' },
                classes_per_week: { type: 'integer' },
                course_months: { type: 'integer' },
                total_no_of_classes_should_be_given: { type: 'integer' },
                remarks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date' },
                      remark: { type: 'string' }
                    }
                  }
                },
                subjects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      subject: { type: 'string' },
                      classes: { type: 'number' }
                    },
                    required: ['subject', 'classes']
                  }
                },
                allotted_hours: {
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
                },
                specializations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                updatedAt: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date' },
                      action: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid input values',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Attempted to update restricted fields',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Student not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: controller.updateStudentHandler
  });

  fastify.get('/studentschedule/:student_id', {
    schema: {
      tags: ['students'],
      description: 'Get student schedule across all tutors',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' },
        },
        required: ['student_id'],
      },
      response: {
        200: {
          description: 'Student schedule retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                student_id: { type: 'integer' },
                schedule: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      day: { type: 'string' },
                      time: { type: 'string' },
                      tutor_id: { type: 'integer' },
                      tutor_name: { type: 'string' },
                      subject: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Student not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: controller.getStudentScheduleHandler
  });

  fastify.get('/studentname/:student_id', {
    schema: {
      tags: ['students'],
      summary: 'Get student name, id, and subjects by student_id',
      params: {
        type: 'object',
        properties: {
          student_id: { type: 'integer' }
        },
        required: ['student_id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            student_id: { type: 'number' },
            student_name: { type: 'string' },
            student_subjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  subject: { type: 'string' },
                  classes: { type: 'number' }
                },
                required: ['subject', 'classes']
              }
            }
          },
          required: ['student_id', 'student_name', 'student_subjects']
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    handler: controller.getStudentNameByIdHandler
  });
  
  fastify.put('/changefreeslots/:student_id', {
    schema: {
      tags: ['students'],
      summary: 'Add or delete student availability slot by student ID',
      params: {
        type: 'object',
        required: ['student_id'],
        properties: {
          student_id: { type: 'number' }
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
          day: { 
            type: 'string'
          },
          slot: { type: 'string' }
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
                student_id: { type: 'number' },
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
    handler: controller.StudentAvailabilityHandler
  });

  fastify.post('/student/delete-schedule', {
    schema: {
      tags: ['students'],
      summary: 'Delete a student schedule from a tutor',
      body: {
        type: 'object',
        required: ['student_id', 'tutor_id', 'subject', 'time_slots'],
        properties: {
          student_id: { type: 'number' },
          tutor_id: { type: 'number' },
          subject: { type: 'string' },
          time_slots: {
            type: 'array',
            items: { type: 'string' }
          },
          delete_token: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            deletedCount: { type: 'number' }
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
    handler: controller.deleteStudentScheduleHandler
  });


  fastify.get('/student/delete-preview/:student_id', {
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
    schema: {
      tags: ['students'],
      description: 'Preview which tutor schedules will be affected if this student is deleted',
      params: {
        type: 'object',
        required: ['student_id'],
        properties: {
          student_id: { type: 'integer' }
        }
      },
     
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            affected: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tutor_id: { type: 'number' },
                  tutor_name: { type: 'string' },
                  affected_hours: {
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
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: controller.previewStudentDeleteEffectHandler
  });


  fastify.post('/student/delete-confirm/:student_id', {
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
    schema: {
      tags: ['students'],
      description: 'Confirm deletion: set student_status to inactive and remove from all tutor schedules',
    
      params: {
        type: 'object',
        required: ['student_id'],
        properties: {
          student_id: { type: 'integer' },
          delete_token: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            updated: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
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
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: controller.confirmStudentDeleteHandler
  });
}
