import Form from './form.schema.js';
import crypto from 'crypto';

export default async function (fastify, opts) {
    // Save new lead
    fastify.post('/savewebleads', {
        schema: {
            description: 'Save a new web lead or update existing lead with feedback',
            tags: ['Forms'],
            body: {
                type: 'object',
                required: ['name', 'phoneNumber', 'state', 'pincode', 'grade'],
                properties: {
                    name: { type: 'string', description: 'Name of the lead' },
                    phoneNumber: { type: 'string', description: 'Phone number of the lead' },
                    state: { type: 'string', description: 'State of the lead' },
                    pincode: { type: 'number', description: 'Pincode (6 digits)', minimum: 100000, maximum: 999999 },
                    grade: { type: 'string', description: 'Grade of the lead' },
                    assigned_to: { type: 'number', description: 'ID of the user assigned to this lead' },
                    feedback: {
                        type: 'object',
                        properties: {
                            user_id: { type: 'string' },
                            type: { type: 'string' },
                            text: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                phoneNumber: { type: 'string' },
                                otp: { type: 'number' },
                                state: { type: 'string' },
                                pincode: { type: 'number' },
                                grade: { type: 'string' },
                                lead_id: { type: 'string' },
                                assigned_to: { type: 'number' },
                                status: { type: 'string' },
                                feedback: { 
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            user_id: { type: 'string' },
                                            type: { type: 'string' },
                                            text: { type: 'string' },
                                            created_at: { type: 'string' }
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
                        message: { type: 'string' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { name, phoneNumber, state, pincode, grade, assigned_to, feedback, otp } = request.body;

            // Create hash for lead_id
            const hashInput = `${name}${phoneNumber}`;
            const lead_id = crypto.createHash('sha256').update(hashInput).digest('hex');

            // Try to find existing lead
            let lead = await Form.findOne({ lead_id });

            if (lead) {
                // If lead exists and feedback is provided, append it
                if (feedback) {
                    lead.feedback.push({
                        ...feedback,
                        created_at: new Date()
                    });
                }
                // Update other fields if provided
                if (assigned_to) lead.assigned_to = assigned_to;
                if (otp) lead.otp = otp;
                await lead.save();
            } else {
                // Create new lead
                lead = new Form({
                    name,
                    phoneNumber,
                    otp,
                    state,
                    pincode,
                    grade,
                    assigned_to,
                    lead_id,
                    status: 'pending',
                    feedback: feedback ? [{
                        ...feedback,
                        created_at: new Date()
                    }] : []
                });
                await lead.save();
            }

            return reply.status(200).send({
                success: true,
                message: 'Successfully saved to leads collection in nniitweb_test database',
                data: lead
            });
        } catch (error) {
            return reply.status(500).send({
                success: false,
                message: 'Error saving lead',
                error: error.message
            });
        }
    });
}
