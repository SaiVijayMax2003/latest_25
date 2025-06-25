import { AdminController } from './admin.controller.js';
import { getHistoricalUtilizationData } from './admin.storeUtilization.js';

export default async function adminRoutes(fastify) {
    const adminController = new AdminController(fastify);

    fastify.get('/tutor-utilization/:tutorId', {
        schema: {
            tags: ['admin'],
            description: 'Get tutor utilization rate',
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
                                tutor_id: { type: 'number' },
                                tutor_name: { type: 'string' },
                                utilization_rate: { type: 'number' },
                                allotted_hours: { type: 'number' },
                                total_hours: { type: 'number' }
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
        handler: adminController.getTutorUtilization.bind(adminController)
    });

    fastify.get('/overall-utilization', {
        schema: {
            tags: ['admin'],
            description: 'Get overall utilization rate of all tutors',
            querystring: {
                type: 'object',
                properties: {
                    subject: { 
                        type: 'string',
                        description: 'Filter by subjects. Use "ALL" for all subjects, or comma-separated subjects like "Physics,Maths,Biology"'
                    },
                    grade: {
                        type: 'string',
                        description: 'Filter by grades. Use "ALL" for all grades, or comma-separated grades like "8,9,10"'
                    },
                    specialization: {
                        type: 'string',
                        description: 'Filter by specializations. Use "ALL" for all specializations, or comma-separated values like "jee,neet,olympiad"'
                    },
                    day: {
                        type: 'string',
                        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                        description: 'Filter by specific day of the week'
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
                                overall_utilization_rate: { type: 'number' },
                                total_allotted_hours: { type: 'number' },
                                total_available_slots: { type: 'number' },
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
                                day: { 
                                    type: 'string',
                                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: adminController.getOverallUtilization.bind(adminController)
    });

    fastify.get('/hour-utilization', {
        schema: {
            tags: ['admin'],
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
        handler: adminController.getHourUtilization.bind(adminController)
    });

    fastify.get('/detailed-tutor-utilization/:tutorId', {
        schema: {
            tags: ['admin'],
            description: 'Get detailed tutor utilization data',
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
                                day: {
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
        handler: adminController.getDetailedTutorUtilization.bind(adminController)
    });

    fastify.get('/subject-utilization', {
        schema: {
            tags: ['admin'],
            description: 'Get utilization data for each subject',
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
                                    subject: { type: 'string' },
                                    total_tutors: { type: 'number' },
                                    total_slots: { type: 'number' },
                                    allotted_hours: { type: 'number' },
                                    utilization_rate: { type: 'number' },
                                    tutors: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                tutor_id: { type: 'number' },
                                                tutor_name: { type: 'string' },
                                                allotted_hours: { type: 'number' },
                                                total_slots: { type: 'number' },
                                                utilization_rate: { type: 'number' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
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
        handler: adminController.getSubjectWiseUtilization.bind(adminController)
    });
}
