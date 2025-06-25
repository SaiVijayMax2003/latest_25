import urlService from './url.service.js';
import TutorService from '../tutor/tutor.service.js';
// import { getStudentById } from '../student/student.service.js';
import { TempUrlStudentOnboarding } from './url.schema.js';

class urlController {
    constructor(fastify) {
      this.fastify = fastify;     
      this.urlService = new urlService(fastify);
      this.tutorService = new TutorService(fastify);
    }

    async generateTemporaryUrl(request, reply) {
        try {
          const tutorId = request.params.tutorId;
          const expiryDays = request.params.expiryDays;
          const expiryHours = expiryDays * 24; // Convert days to hours
          
          // Get tutor details from service
          const tutorResponse = await this.tutorService.getTutorById(tutorId);
          if (!tutorResponse || !tutorResponse.success || !tutorResponse.data) {
            return reply.code(404).send({
              success: false,
              error: `Tutor with ID ${tutorId} not found`
            });
          }

          // Destructure the tutor data
          const { 
            tutor_id,
            tutor_name,
            subjects,
            grades,
            specializations,
            joining_date,
            email,
            phone_number,
            feedback
          } = tutorResponse.data;
      
          // Create profile details object with destructured values
          const tutorProfileDetails = {
            tutor_id,
            tutor_name,
            subjects: subjects || [],
            grades: grades || [],
            specializations: specializations || [],
            joining_date,
            email,
            phone_number,
            feedback: Array.isArray(feedback) ? feedback.map(f => ({
              feedback_id: f.feedback_id || '',
              user_id: f.user_id || 0,
              type: f.type || '',
              text: f.text || ''
            })) : []
          };

          // Log the profile details being saved
          this.fastify.log.info('Saving tutor profile details:', tutorProfileDetails);
      
          // Generate temporary URL via service
          const urlData = await this.urlService.createTemporaryUrl(tutorId, tutorProfileDetails, expiryHours);
          
          return reply.code(201).send({
            success: true,
            data: {
              hash_id: urlData.hash_id,
              url: `/sharedtutorprofile/${urlData.hash_id}`,
              expiry_at: urlData.expiry_at
            }
          });
          
        } catch (error) {
          this.fastify.log.error(error);
          return reply.code(400).send({
            success: false,
            error: error.message || 'Failed to generate temporary URL'
          });
        }
    }

    async getSharedTutorProfile(request, reply) {
        try {
          const hashId = request.params.hashId;
          
          this.fastify.log.info('Getting tutor details for hash:', hashId);
          
          // Validate hash ID
          if (!hashId || typeof hashId !== 'string') {
            return reply.code(400).send({
              success: false,
              error: 'Invalid hash ID format'
            });
          }
          
          // Get temporary URL first to check expiration
          const temporaryUrl = await this.urlService.getTemporaryUrl(hashId);
          
          if (!temporaryUrl) {
            return reply.code(404).send({
              success: false,
              error: 'Temporary URL not found'
            });
          }
          
          // Check if URL has expired
          if (new Date() > new Date(temporaryUrl.expiry_at)) {
            return reply.code(410).send({
              success: false,
              error: 'This temporary URL has expired'
            });
          }
          
          // Get tutor details from temporary URL via service
          const tutorDetails = await this.urlService.getTutorByTemporaryUrl(hashId);
          
          this.fastify.log.info('Received tutor details from service:', tutorDetails);
          
          if (!tutorDetails) {
            return reply.code(404).send({
              success: false,
              error: 'Tutor details not found'
            });
          }
      
          // Log the tutor details for debugging
          this.fastify.log.info('Processing tutor details:', tutorDetails);
      
          // Create the response object with all fields
          const responseData = {
            tutor_profile: {
              ...tutorDetails,
              experience: temporaryUrl.experience || [],
              skills: temporaryUrl.skills || [],
              unique_qualities: temporaryUrl.unique_qualities || '',
              student_testimonials: temporaryUrl.student_testimonials || [],
              ranks_awards: temporaryUrl.ranks_awards || [],
              research_papers: temporaryUrl.research_papers || [],
              expiry_at: temporaryUrl.expiry_at
            }
          };
      
          // Return the response with the tutor_profile object
          return reply.code(200).send({
            success: true,
            data: responseData
          });
            
        } catch (error) {
          this.fastify.log.error('Error in getSharedTutorProfile:', error);
          return reply.code(400).send({
            success: false,
            error: error.message || 'Failed to retrieve tutor data'
          });
        }
    }

    async generateTempStudentOnboardingSchedule(request, reply) {
      try {
        const studentId = request.params.studentId;

        const result = await this.urlService.tempurlgerator_studentOnboarding(studentId);

        return reply.code(200).send({
          success: true,
          data: {
            hash_id: result.url_id,
            created_at: result.created_at,
            expiry_at: result.expiry_at,
            message: result.message
          }
        });

      } catch (error) {
        this.fastify.log.error('Error in generateTempStudentOnboardingSchedule:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to generate temporary student onboarding schedule'
        });
      }
    }

    async updateTemporaryUrlFields(request, reply) {
      try {
        const { hashId } = request.params;
        const updateData = request.body;

        // Validate hashId
        if (!hashId) {
          return reply.code(400).send({
            success: false,
            error: 'Hash ID is required'
          });
        }

        // Check if temporary URL exists and is not expired
        const temporaryUrl = await this.urlService.getTemporaryUrl(hashId);
        if (!temporaryUrl) {
          return reply.code(404).send({
            success: false,
            error: 'Temporary URL not found'
          });
        }

        if (new Date() > new Date(temporaryUrl.expiry_at)) {
          return reply.code(400).send({
            success: false,
            error: 'This temporary URL has expired'
          });
        }

        // Update the fields
        const result = await this.urlService.updateTemporaryUrlFields(hashId, updateData);

        return reply.code(200).send(result);
      } catch (error) {
        this.fastify.log.error('Error updating temporary URL fields:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to update temporary URL fields'
        });
      }
    }

    async getTempStudentOnboardingSchedule(request, reply) {
      try {
        const { urlId } = request.params;

        if (!urlId) {
          return reply.code(400).send({
            success: false,
            error: 'URL ID is required'
          });
        }

        const tempUrlData = await this.urlService.getTempStudentOnboardingUrl(urlId);

        if (!tempUrlData) {
          return reply.code(404).send({
            success: false,
            error: 'Temporary student onboarding URL not found'
          });
        }

        // Check if URL has expired
        if (new Date() > new Date(tempUrlData.expired_at)) {
          return reply.code(410).send({
            success: false,
            error: 'This temporary student onboarding URL has expired'
          });
        }

        // Debug: Log all available fields
        this.fastify.log.info('All tempUrlData fields:', Object.keys(tempUrlData));
        this.fastify.log.info('tempUrlData values:', {
          hash_id: tempUrlData.hash_id,
          created_at: tempUrlData.created_at,
          expired_at: tempUrlData.expired_at,
          order_id: tempUrlData.order_id,
          data: tempUrlData.data,
          status: tempUrlData.status,
          confirm_schedule: tempUrlData.confirm_schedule,
          requested_changes: tempUrlData.requested_changes,
          previous_status: tempUrlData.previous_status
        });

        // Debug confirm_schedule specifically
        console.log('=== CONFIRM_SCHEDULE DEBUG ===');
        console.log('tempUrlData.confirm_schedule:', tempUrlData.confirm_schedule);
        console.log('tempUrlData.confirm_schedule type:', typeof tempUrlData.confirm_schedule);
        console.log('tempUrlData.confirm_schedule === undefined:', tempUrlData.confirm_schedule === undefined);
        console.log('tempUrlData.confirm_schedule === null:', tempUrlData.confirm_schedule === null);
        console.log('tempUrlData.confirm_schedule === "":', tempUrlData.confirm_schedule === "");
        console.log('================================');

        const responseData = {
          Url_id: tempUrlData.hash_id || null,
          Created_at: tempUrlData.created_at ? tempUrlData.created_at.toISOString() : null,
          Expired_at: tempUrlData.expired_at ? tempUrlData.expired_at.toISOString() : null,
          Order_id: tempUrlData.order_id || null,
          Data: {
            ...tempUrlData.data,
            confirm_schedule: tempUrlData.confirm_schedule || 'no',
            requested_changes: tempUrlData.requested_changes || ''
          },
          status: tempUrlData.status || 'order_created',
          Previous_status: tempUrlData.previous_status || []
        };

        console.log('Final response Data object:', JSON.stringify(responseData.Data, null, 2));
        console.log('confirm_schedule in response:', responseData.Data.confirm_schedule);

        return reply
          .code(200)
          .header('Content-Type', 'application/json')
          .send({
            success: true,
            data: responseData
          });

      } catch (error) {
        this.fastify.log.error('Error in getTempStudentOnboardingSchedule:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to retrieve temporary student onboarding schedule'
        });
      }
    }

    async confirmTempStudentOnboardingSchedule(request, reply) {
      try {
        const { urlId } = request.params;
        const { confirm_schedule, requested_changes } = request.body;

        if (!urlId) {
          return reply.code(400).send({
            success: false,
            error: 'URL ID is required'
          });
        }

        if (!confirm_schedule || !['yes', 'requested_changes', 'no'].includes(confirm_schedule)) {
          return reply.code(400).send({
            success: false,
            error: 'confirm_schedule is required and must be one of: yes, requested_changes, no'
          });
        }

        // Validate requested_changes is provided when confirm_schedule is 'requested_changes'
        if (confirm_schedule === 'requested_changes' && (!requested_changes || requested_changes.trim() === '')) {
          return reply.code(400).send({
            success: false,
            error: 'requested_changes is required when confirm_schedule is "requested_changes"'
          });
        }

        const result = await this.urlService.confirmTempStudentOnboardingSchedule(urlId, confirm_schedule, requested_changes);

        if (!result.success) {
          return reply.code(result.statusCode || 400).send({
            success: false,
            error: result.error
          });
        }

        return reply.code(200).send({
          success: true,
          message: result.message
        });

      } catch (error) {
        this.fastify.log.error('Error in confirmTempStudentOnboardingSchedule:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to confirm temporary student onboarding schedule'
        });
      }
    }
}

export default urlController;