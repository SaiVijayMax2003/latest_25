import UrlController from './url.controller.js';

export default async function urlRoutes(fastify, options) {
  const urlController = new UrlController(fastify);

  fastify.post('/generateTempUrl/:tutorId/:expiryDays', {
    preHandler: [fastify.authenticate, fastify.authorize(['operation', 'operations_lead', 'sales', 'sales_lead', 'admin'])],
    schema: {
      tags: ['url'],
      summary: 'Generate temporary URL for tutor',
      params: {
        type: 'object',
        required: ['tutorId', 'expiryDays'],
        properties: {
          tutorId: { type: 'number', minimum: 1 },
          expiryDays: { type: 'number', minimum: 1 }
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
                hash_id: { type: 'string' },
                url: { type: 'string' },
                expiry_at: { type: 'string', format: 'date-time' },
                experience: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['company', 'role', 'description'],
                    properties: {
                      company: { type: 'string' },
                      role: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                },
                skills: {
                  type: 'array',
                  items: { type: 'string' }
                },
                unique_qualities: { type: 'string' },
                student_testimonials: {
                  type: 'array',
                  items: { type: 'string' }
                },
                ranks_awards: {
                  type: 'array',
                  items: { type: 'string' }
                },
                research_papers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['name', 'subtext'],
                    properties: {
                      name: { type: 'string' },
                      subtext: { type: 'string' }
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
    handler: urlController.generateTemporaryUrl.bind(urlController)
  });

  fastify.get('/sharedtutorprofile/:hashId', {
    schema: {
      tags: ['urls'],
      summary: 'Get shared tutor profile by hash ID',
      params: {
        type: 'object',
        required: ['hashId'],
        properties: {
          hashId: { type: 'string' }
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
                tutor_profile: {
                  type: 'object',
                  properties: {
                    tutor_id: { type: 'number' },
                    tutor_name: { type: 'string' },
                    subjects: { 
                      type: 'array',
                      items: { type: 'string' }
                    },
                    grades: { 
                      type: 'array',
                      items: { type: 'string' }
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
                          feedback_id: { type: 'string' },
                          user_id: { type: 'number' },
                          type: { type: 'string' },
                          text: { type: 'string' }
                        }
                      }
                    },
                    experience: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          company: { type: 'string' },
                          role: { type: 'string' },
                          description: { type: 'string' }
                        }
                      }
                    },
                    skills: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    unique_qualities: { type: 'string' },
                    student_testimonials: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    ranks_awards: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    research_papers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          subtext: { type: 'string' }
                        }
                      }
                    },
                    expiry_at: { type: 'string', format: 'date-time' }
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
        },
        410: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: urlController.getSharedTutorProfile.bind(urlController)
  });

  fastify.post('/temp_schedule/generation/:studentId', {
    preHandler: [fastify.authenticate, fastify.authorize(['operation', 'operations_lead', 'sales', 'sales_lead', 'admin'])],
    schema: {
      tags: ['url'],
      summary: 'Generate temporary schedule for student onboarding',
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'number' }
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
                hash_id: { type: 'string' },
                message: { type: 'string' }
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
    handler: urlController.generateTempStudentOnboardingSchedule.bind(urlController)
  });

  fastify.get('/temp_schedule/:urlId', {
    schema: {
      tags: ['url'],
      summary: 'Get temporary student onboarding schedule by URL ID',
      params: {
        type: 'object',
        required: ['urlId'],
        properties: {
          urlId: { type: 'string' }
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
                Url_id: { type: 'string' },
                Created_at: { type: 'string', format: 'date-time' },
                Expired_at: { type: 'string', format: 'date-time' },
                Order_id: { type: 'string' },
                Data: {
                  type: 'object',
                  properties: {
                    student_name: { type: 'string' },
                    course_subject: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          classes: { type: 'number' }
                        }
                      }
                    },
                    schedule: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          day: { type: 'string' },
                          time: { type: 'string' },
                          subject: { type: 'string' }
                        }
                      }
                    },
                    confirm_schedule: {
                      type: 'string',
                      enum: ['yes', 'requested_changes', 'no'],
                      description: 'Confirmation status for the schedule'
                    },
                    requested_changes: {
                      type: 'string',
                      description: 'Details of changes requested by student'
                    }
                  }
                },
                status: { type: 'string' },
                Previous_status: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' }
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
        },
        410: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: urlController.getTempStudentOnboardingSchedule.bind(urlController)
  });

  fastify.put('/temp-schedule/:urlId/confirm', {
    schema: {
      tags: ['url'],
      summary: 'Confirm temporary student onboarding schedule',
      params: {
        type: 'object',
        required: ['urlId'],
        properties: {
          urlId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['confirm_schedule'],
        properties: {
          confirm_schedule: { 
            type: 'string',
            enum: ['yes', 'requested_changes', 'no'],
            description: 'Confirmation status for the schedule'
          },
          requested_changes: {
            type: 'string',
            description: 'Details of changes requested by student (required when confirm_schedule is "requested_changes")'
          }
        },
        allOf: [
          {
            if: {
              properties: { confirm_schedule: { const: 'requested_changes' } }
            },
            then: {
              required: ['requested_changes']
            }
          }
        ]
      },
      response: {
        200: {
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
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: urlController.confirmTempStudentOnboardingSchedule.bind(urlController)
  });

  fastify.put('/temporary-url/:hashId/fields', {
    schema: {
      tags: ['urls'],
      summary: 'Update fields for a temporary URL',
      params: {
        type: 'object',
        required: ['hashId'],
        properties: {
          hashId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          experience: {
            type: 'array',
            items: {
              type: 'object',
              required: ['company', 'role', 'description'],
              properties: {
                company: { type: 'string' },
                role: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          skills: {
            type: 'array',
            items: { type: 'string' }
          },
          unique_qualities: { type: 'string' },
          student_testimonials: {
            type: 'array',
            items: { type: 'string' }
          },
          ranks_awards: {
            type: 'array',
            items: { type: 'string' }
          },
          research_papers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'subtext'],
              properties: {
                name: { type: 'string' },
                subtext: { type: 'string' }
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
                hash_id: { type: 'string' },
                experience: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      company: { type: 'string' },
                      role: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                },
                skills: {
                  type: 'array',
                  items: { type: 'string' }
                },
                unique_qualities: { type: 'string' },
                student_testimonials: {
                  type: 'array',
                  items: { type: 'string' }
                },
                ranks_awards: {
                  type: 'array',
                  items: { type: 'string' }
                },
                research_papers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      subtext: { type: 'string' }
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
    handler: urlController.updateTemporaryUrlFields.bind(urlController)
  });
}