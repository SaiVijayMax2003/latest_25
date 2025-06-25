import TutorService from './tutor.service.js';

class TutorController {
    constructor(fastify) {
        this.fastify = fastify;
        this.tutorService = new TutorService(fastify);
    }

    async createTutor(request, reply) {
        try {
            // Validate required fields
            const requiredFields = ['tutor_name', 'email', 'phone_number', 'subjects', 'grades', 'specializations'];
            const missingFields = requiredFields.filter(field => !request.body[field]);
            
            if (missingFields.length > 0) {
                return reply.code(400).send({
                    success: false,
                    error: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(request.body.email)) {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid email format'
                });
            }

            // Validate phone number format (10 digits)
           

            // Validate arrays are not empty
            if (request.body.subjects?.length === 0) {
                return reply.code(400).send({
                    success: false,
                    error: 'At least one subject is required'
                });
            }

            if (request.body.grades?.length === 0) {
                return reply.code(400).send({
                    success: false,
                    error: 'At least one grade is required'
                });
            }

            if (request.body.specializations?.length === 0) {
                return reply.code(400).send({
                    success: false,
                    error: 'At least one specialization is required'
                });
            }

            // Handle phone number with country codes
            let phoneNumber = request.body.phone_number;
            // Remove any spaces or special characters first
            phoneNumber = phoneNumber.replace(/\s+/g, '');
            
            // Check for valid country codes and remove them
            const countryCodes = ['+91', '+1', '+44'];
            let hasValidCountryCode = false;
            let originalCountryCode = '';
            
            for (const code of countryCodes) {
                if (phoneNumber.startsWith(code)) {
                    originalCountryCode = code;
                    phoneNumber = phoneNumber.substring(code.length);
                    hasValidCountryCode = true;
                    break;
                }
            }

            // Remove any remaining non-digit characters
            phoneNumber = phoneNumber.replace(/\D/g, '');

            // Validate phone number format (10 digits)
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phoneNumber)) {
                return reply.code(400).send({
                    success: false,
                    error: 'Phone number must be 10 digits'
                });
            }

            if (!hasValidCountryCode) {
                return reply.code(400).send({
                    success: false,
                    error: 'Phone number must start with a valid country code (+91, +1, or +44)'
                });
            }

            // Check if phone number already exists
            const existingTutorByPhone = await this.tutorService.findTutorByPhone(phoneNumber);
            if (existingTutorByPhone) {
                return reply.code(400).send({
                    success: false,
                    error: `A tutor with phone number ${originalCountryCode}${phoneNumber} already exists`
                });
            }

            // Convert all string values to lowercase
            const tutorData = {
                ...request.body,
                phone_number:`${originalCountryCode}${phoneNumber}`,
                tutor_name: request.body.tutor_name?.toLowerCase(),
                subjects: request.body.subjects?.map(subject => subject.toLowerCase()),
                grades: request.body.grades?.map(grade => grade.toLowerCase()),
                feedback: request.body.feedback?.map(feedback => ({
                    ...feedback,
                    type: feedback.type?.toLowerCase(),
                    text: feedback.text?.toLowerCase()
                })),
                total_available_hours: request.body.total_available_hours?.map(hour => ({
                    ...hour,
                    day: hour.day?.toLowerCase(),
                    slots: hour.slots
                })),
                allotted_hours: request.body.allotted_hours?.map(hour => ({
                    ...hour,
                    day: hour.day?.toLowerCase(),
                    time: hour.time?.toLowerCase(),
                    student_name: hour.student_name?.toLowerCase()
                })),
                email: request.body.email?.toLowerCase(),
                specializations: request.body.specializations?.map(spec => spec.toLowerCase()),
            };
            // Add created_by if user info is available
            if (request.user) {
                tutorData.created_by = {
                    user_id: request.user.user_id || request.user.id || null,
                    user_role: request.user.role || null,
                    created_at: new Date()
                };
            }
            const result = await this.tutorService.createTutor(tutorData);
            return reply.code(201).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            // Provide more specific error messages based on the error type
            if (error.code === 11000) {
                return reply.code(400).send({ 
                    success: false, 
                    error: `A tutor with email ${request.body.email} or phone number ${request.body.phone_number} already exists` 
                });
            }
            return reply.code(400).send({ 
                success: false, 
                error: error.message || 'Failed to create tutor. Please check all required fields and try again.' 
            });
        }
    }


    async searchDemoTutorsByAvailability(request, reply) {
        const searchData = request.body;

    try{ 
        // Validate required fields
        if (!searchData.days || !searchData.subject) {
            return reply.code(400).send({
                success: false,
                error: 'Missing required fields: days, subject are required'
            });
        }

        // Validate days format
        if (!Array.isArray(searchData.days)) {
            return reply.code(400).send({
                success: false,
                error: 'days must be an array'
            });
        }

        // Validate each day object
        for (const day of searchData.days) {
            if (!day.day || !Array.isArray(day.slots)) {
                return reply.code(400).send({
                    success: false,
                    error: 'Each day must have a day string and slots array'
                });
            }

    

        const result = await this.tutorService.searchDemoTutorsByAvailability(searchData);
        return reply.code(200).send(result);
    } 
   }catch (error) {
        this.fastify.log.error('Error in searchDemoTutorsByAvailability:', error);
        return reply.code(400).send({
            success: false,
            error: error.message || 'Failed to search tutors by demo availability'
        });
    }
}
    

    





    
    async getTutorById(request, reply) {
        try {
            const { tutorId } = request.params;
            if (!tutorId) {
                return reply.code(400).send({ success: false, error: 'tutor id not found' });
            }
            const result = await this.tutorService.getTutorById(tutorId);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({ success: false, error: 'tutor id not found' });
        }
    }

    async getAllTutors(request, reply) {
        try {
            const result = await this.tutorService.getAllTutors(request);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(500).send({ success: false, error: error.message });
        }
    }
    async getAllTutorsBySearch(request, reply) {
        try {
            const result = await this.tutorService.getAllTutorsBySearch(request);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    async updateTutor(request, reply) {
        try {
            const { tutorId } = request.params;
            // Get user details from JWT token
            const user = request.user;
            const result = await this.tutorService.updateTutor(tutorId, request.body, user);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    async deleteTutor(request, reply) {
        try {
            const { tutorId } = request.params;
            const result = await this.tutorService.deleteTutor(tutorId);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({ success: false, error: error.message });
        }
    }

    async getAvailableTutors(request, reply) {
        try {
            const result = await this.tutorService.getAvailableTutors();
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(500).send({ success: false, error: error.message });
        }
    }

    async getAvailableHoursByTeacherId(request, reply) {
        try {
            const { tutorId } = request.params;
            const result = await this.tutorService.getAvailableHoursByTeacherId(tutorId);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({ success: false, error: error.message });
        }
    }

    async getTotalAvailableHoursByTeacherId(request, reply) {
        try {
            const { tutorId } = request.params;
            const result = await this.tutorService.getTotalAvailableHoursByTeacherId(tutorId);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({ success: false, error: error.message });
        }
    }

    async getTutorProfile(request, reply) {
        try {
            const { tutorId } = request.params;
            const result = await this.tutorService.getTutorProfile(tutorId);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({ success: false, error: error.message });
        }
    }      

    async updateTutorProfile(request, reply) {
        try {
            const { tutorId } = request.params;
            const result = await this.tutorService.updateTutorProfile(tutorId, request.body);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    async modifyTutorSchedule(request, reply) {
        try {
            const result = await this.tutorService.modifyTutorSchedule(request.body);
            
            if (!result.success) {
                return reply.code(400).send(result);
            }
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    async validateTutorSchedule(request, reply) {
        try {
            // Runtime validation: all student_id must be integers
            const invalid = (Array.isArray(request.body) ? request.body : [request.body])
                .some(item => typeof item.student_id !== 'number' || !Number.isInteger(item.student_id));
            if (invalid) {
                return reply.code(400).send({ success: false, error: 'All student_id values must be integers.' });
            }
            const result = await this.tutorService.validateTutorSchedule(request.body);
            if (!result.success) {
                return reply.code(400).send(result);
            }
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    async swapTutor(request, reply) {
        try {
            const result = await this.tutorService.swapTutor(request.body);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    async getTutorNameByIdHandler(request, reply) {
        const { tutorId } = request.params;
        if (!tutorId) {
            return reply.code(400).send({ success: false, error: 'tutor id not found' });
        }
        const result = await this.tutorService.getTutorNameById(tutorId);
        if (!result) {
            return reply.code(404).send({ success: false, error: 'Tutor not found' });
        }
        return reply.send(result);
    }
    async createFeedback(request, reply) {
        try {
            const {
                user_id,
                type,
                text
            } = request.body;
            
            // Correctly extract the tutorId parameter
            const tutorId = parseInt(request.params.tutorId);
            
            // Validate tutorId
            if (isNaN(tutorId)) {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid tutor ID format'
                });
            }
            
            // Validate required fields
            if (!user_id || !type || !text) {
                return reply.code(400).send({
                    success: false,
                    error: 'Missing required fields: user_id, type, and text are required'
                });
            }
            
            // Prepare feedback data
            const feedbackData = {
                tutor_id: tutorId,
                user_id,
                type: type?.toLowerCase(),
                text: text?.toLowerCase()
            };
            
            // Create feedback entry via service
            const result = await this.tutorService.createFeedback(feedbackData);
            
            // Send success response
            return reply.code(201).send({
                success: true,
                data: {
                    feedback_id: result.feedback_id
                }
            });
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({
                success: false,
                error: error.message || 'Failed to create feedback'
            });
        }
    }

    async changeFreeSlotsHandler(request, reply) {
        try {
            const { tutorId } = request.params;
            const result = await this.tutorService.changeFreeSlotsService(tutorId, request.body);
            return reply.code(201).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({
                success: false,
                error: error.message || 'Failed to create tutor availability'
            });
        }
    }
    



    async deleteFeedback(request, reply) {
        try {
            const { feedback_id } = request.params;
            
            if (!feedback_id) {
                return reply.code(400).send({
                    success: false,
                    error: 'Feedback ID is required'
                });
            }

            const result = await this.tutorService.deleteFeedback(feedback_id);
            
            return reply.code(200).send({
                success: true,
                message: 'Feedback deleted successfully'
            });
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(error.message === 'Feedback not found' ? 404 : 400).send({
                success: false,
                error: error.message || 'Failed to delete feedback'
            });
        }
    }

    async searchTutorsByAvailability(request, reply) {
        try {
            const searchData = request.body;
            
            // Validate required fields
            const requiredFields = ['days', 'subject', 'match', 'total_no_of_slots'];
            const missingFields = requiredFields.filter(field => !searchData[field]);
            
            if (missingFields.length > 0) {
                return reply.code(400).send({
                    success: false,
                    error: `Missing required fields: ${missingFields.join(', ')} are required`
                });
            }

            // Validate days format
            if (!Array.isArray(searchData.days)) {
                return reply.code(400).send({
                    success: false,
                    error: 'days must be an array'
                });
            }

            // Validate each day object
            for (const day of searchData.days) {
                if (!day.day || !Array.isArray(day.slots)) {
                    return reply.code(400).send({
                        success: false,
                        error: 'Each day must have a day string and slots array'
                    });
                }
            }

            // Validate match array
            if (!Array.isArray(searchData.match) || searchData.match.length !== 1 || !['strict', 'day-only'].includes(searchData.match[0])) {
                return reply.code(400).send({
                    success: false,
                    error: 'match must be an array with exactly one value: either "strict" or "day-only"'
                });
            }

            // Validate total_no_of_slots
            if (typeof searchData.total_no_of_slots !== 'number' || searchData.total_no_of_slots <= 0) {
                return reply.code(400).send({
                    success: false,
                    error: 'total_no_of_slots must be a positive number'
                });
            }

            const result = await this.tutorService.searchTutorsByAvailability(searchData);
            return reply.code(200).send({
                success: true,
                data: result
            });
        } catch (error) {
            this.fastify.log.error('Error in searchTutorsByAvailability:', error);
            return reply.code(400).send({
                success: false,
                error: error.message || 'Failed to search tutors by availability'
            });
        }
    }

    async refreshTutorTexts(request, reply) {
        try {
            await this.tutorService.updateScheduleFile();
            return reply.code(200).send({ success: true, message: 'Tutor texts refreshed successfully.' });
        } catch (error) {
            return reply.code(500).send({ success: false, error: error.message });
        }
    }
    async getHourUtilization(request, reply) {
        try {
            const { day, time } = request.query;
            const result = await this.tutorService.getHourUtilization(day, time);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({
                success: false,
                error: error.message
            });
        }
    }

    async getTutorAdditionalDetails(request, reply) {
        try {
            const { tutorId } = request.params;
            const details = await this.tutorService.getTutorAdditionalDetails(tutorId);
            return reply.code(200).send({ success: true, additional_details: details });
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({ success: false, error: error.message });
        }
    }

    // Preview affected students and slots before deleting a tutor
    async previewTutorDeleteEffectHandler(request, reply) {
        try{
        const { tutorId } = request.params;
        if (!tutorId) {
            return reply.code(400).send({ message: 'tutor id not found' });
        }
        try {
            const result = await this.tutorService.previewTutorDeleteEffect(tutorId);
            return reply.send({ success: true, ...result });
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({ success: false, error: error.message });
        }
    }catch(error){
        this.fastify.log.error(error);
        return reply.code(404).send({ success: false, error: error.message });
    }
    }

    // Confirm deletion: set status to inactive and remove all allotted_hours
    async confirmTutorDeleteHandler(request, reply) {
        try{
        const { tutorId } = request.params;
        if (!tutorId) {
            return reply.code(400).send({ message: 'tutor id not found' });
        }
        try {
            const result = await this.tutorService.confirmTutorDelete(tutorId);
            return reply.send({ success: true, ...result });
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({ success: false, error: error.message });
        }
    }catch(error){
        this.fastify.log.error(error);
        return reply.code(404).send({ success: false, error: error.message });
    }
    }

    //record attendance
// Helper function to format date to IST
formatToIST(date) {
    if (!date) return null;
    return new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

async createTutorAttendance(request, reply) {
    try {
        // Validate required fields
        const requiredFields = ['tutor_id'];
        const missingFields = requiredFields.filter(field => !request.body[field]);

        if (missingFields.length > 0) {
            return reply.status(400).send({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate battery level if provided
        if (request.body.battery_level !== undefined && (request.body.battery_level < 0 || request.body.battery_level > 100)) {
            console.log("request.body.battery_level",request.body.battery_level);
            return reply.status(400).send({
                success: false,
                error: 'Battery level must be between 0 and 100'
            });
        }

        // Validate attendance type if provided
        if (request.body.attendance_type && !['checkin_Attributes', 'checkout_Attributes'].includes(request.body.attendance_type)) {
            console.log("request.body.attendance_type",request.body.attendance_type);
            return reply.status(400).send({
                success: false,
                error: 'Invalid attendance type. Must be either checkin_Attributes or checkout_Attributes'
            });
        }

        const attendance = await this.tutorService.createTutorAttendance(request.body);

        // Get duration information
        const { duration, checkin, checkout } = await this.tutorService.calculateAttendanceDuration(
            request.body.tutor_id,
            request.body.session_id
        );

        // Format timestamps to IST
        const formattedCheckinTime = this.formatToIST(attendance.checkin_Attributes?.timestamp);
        const formattedCheckoutTime = this.formatToIST(attendance.checkout_Attributes?.timestamp);
        const formattedFirstCheckinTime = this.formatToIST(checkin?.timestamp);
        const formattedLastCheckoutTime = this.formatToIST(checkout?.timestamp);
        return reply.status(201).send({
            success: true,
            message: 'Attendance recorded successfully'
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
  }
}

export default TutorController;
