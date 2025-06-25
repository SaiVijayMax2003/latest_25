import TemporaryUrl from './url.schema.js';
import { TempUrlStudentOnboarding } from './url.schema.js';
import Student from '../student/student.schema.js';
import Order from '../order/order.schema.js';
import crypto from 'crypto';
import { TutorSchedule } from '../tutor/tutor.schema.js';
import { v4 as uuidv4 } from 'uuid';
import { getRandomFields } from '../../utils/defaultTutorFields.js';
import { getStudentSchedule } from '../student/student.service.js';

class urlService {
    constructor(fastify) {
      this.fastify = fastify;
    }

    // Service method to create a temporary URL for a tutor
    async createTemporaryUrl(tutorId, tutorProfileDetails, expiryHours = 48) {
      try {
        // Validate input
        const numericTutorId = Number(tutorId);
        if (isNaN(numericTutorId)) {
          throw new Error('Invalid tutor ID');
        }
        
        if (!tutorProfileDetails) {
          throw new Error('Tutor details are required');
        }

        // Get tutor's subjects to generate default fields
        const tutor = await TutorSchedule.findOne({ tutor_id: numericTutorId });
        if (!tutor) {
          throw new Error('Tutor not found');
        }

        // Get default fields for each subject
        const subjectsFields = tutor.subjects.map(subject => 
          getRandomFields(subject.toLowerCase())
        );

        // Combine fields from all subjects
        const combinedFields = {
          experience: subjectsFields[0].experience, // Use first subject's experience
          skills: [...new Set(subjectsFields.flatMap(fields => fields.skills))], // Combine unique skills
          unique_qualities: subjectsFields[0].unique_qualities, // Use first subject's unique qualities
          student_testimonials: subjectsFields.flatMap(fields => fields.student_testimonials)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3), // Randomly select 3 testimonials from all subjects
          ranks_awards: [...new Set(subjectsFields.flatMap(fields => fields.ranks_awards))], // Combine unique awards
          research_papers: subjectsFields.flatMap(fields => fields.research_papers)
            .sort(() => 0.5 - Math.random())
            .slice(0, 2) // Randomly select 2 research papers from all subjects
        };
        
        // Generate a hash based on tutor ID and current timestamp
        const timestamp = Date.now();
        const dataToHash = `${numericTutorId}_${timestamp}`;
        const hash_id = crypto
          .createHash('sha256')
          .update(dataToHash)
          .digest('hex')
          .substring(0, 16); // Use first 16 chars for a shorter, but still unique ID
        
        // Calculate expiry time (current time + expiryHours hours)
        const expiry_at = new Date();
        expiry_at.setHours(expiry_at.getHours() + expiryHours);
        
        // Create URL path
        const url = `/sharedtutorprofile/${hash_id}`;
        
        // Create new temporary URL document with default fields
        const temporaryUrl = new TemporaryUrl({
          hash_id,
          url,
          tutor_id: numericTutorId,
          tutor_details: tutorProfileDetails,
          expiry_at,
          experience: combinedFields.experience,
          skills: combinedFields.skills,
          unique_qualities: combinedFields.unique_qualities,
          student_testimonials: combinedFields.student_testimonials,
          ranks_awards: combinedFields.ranks_awards,
          research_papers: combinedFields.research_papers
        });
        
        // Save document to database
        await temporaryUrl.save();
        
        // Log URL creation
        this.fastify?.log?.info(`Temporary URL created for tutor ID: ${numericTutorId}, hash: ${hash_id}`);
        
        // Return the created URL data with default fields
        return {
          hash_id,
          url,
          expiry_at,
          experience: combinedFields.experience,
          skills: combinedFields.skills,
          unique_qualities: combinedFields.unique_qualities,
          student_testimonials: combinedFields.student_testimonials,
          ranks_awards: combinedFields.ranks_awards,
          research_papers: combinedFields.research_papers
        };
      } catch (error) {
        this.fastify?.log?.error('Error creating temporary URL:', error);
        throw error;
      }
    }

    async getTutorByTemporaryUrl(hashId) {
      try {
        // Find temporary URL document by hash ID
        const temporaryUrl = await TemporaryUrl.findOne({ hash_id: hashId });
        
        if (!temporaryUrl) {
          this.fastify?.log?.error('No temporary URL found for hash:', hashId);
          return null;
        }

        this.fastify?.log?.info('Found temporary URL document:', JSON.stringify(temporaryUrl, null, 2));

        // Check if the tutor_details are directly available in the document
        if (temporaryUrl.tutor_details && Object.keys(temporaryUrl.tutor_details).length > 0) {
          this.fastify?.log?.info('Using stored tutor details:', JSON.stringify(temporaryUrl.tutor_details, null, 2));
          
          // Return the stored tutor details
          return temporaryUrl.tutor_details;
        }

        this.fastify?.log?.info('No stored tutor details found, fetching fresh details');

        // If not available, fetch fresh details from the TutorSchedule
        const { tutor_id } = temporaryUrl;
        
        // Convert tutor_id to number if it's not already
        const numericTutorId = Number(tutor_id);
        
        if (isNaN(numericTutorId)) {
          this.fastify?.log?.error('Invalid tutor ID format:', tutor_id);
          return null;
        }

        this.fastify?.log?.info('Fetching fresh profile details for tutor ID:', numericTutorId);
        
        // Use the extractTutorProfileDetails method to get fresh tutor details
        const profileDetails = await this.extractTutorProfileDetails(numericTutorId);
        
        if (!profileDetails) {
          this.fastify?.log?.error('Failed to fetch profile details for tutor ID:', numericTutorId);
          return null;
        }

        this.fastify?.log?.info('Successfully fetched fresh profile details:', JSON.stringify(profileDetails, null, 2));
        
        return profileDetails;
      } catch (error) {
        this.fastify?.log?.error('Error retrieving tutor details from temporary URL:', error);
        throw error;
      }
    }
  
    async getTemporaryUrl(hashId) {
      try {
        return await TemporaryUrl.findOne({ hash_id: hashId });
      } catch (error) {
        this.fastify?.log?.error('Error retrieving temporary URL:', error);
        throw error;
      }
    }

    async extractTutorProfileDetails(tutorId) {
      try {
        this.fastify?.log?.info('Searching for tutor with ID:', tutorId);
        
        // Find tutor in the TutorSchedule collection
        const tutorSchedule = await TutorSchedule.findOne({ tutor_id: tutorId });

        if (!tutorSchedule) {
          this.fastify?.log?.error(`Tutor with ID ${tutorId} not found in TutorSchedule collection`);
          return null;
        }

        this.fastify?.log?.info('Found tutor schedule:', JSON.stringify(tutorSchedule, null, 2));
        
        // Convert to plain object
        const tutorObj = tutorSchedule.toObject();
        
        // Log the object after conversion
        this.fastify?.log?.info('Converted tutor object:', JSON.stringify(tutorObj, null, 2));
        
        // Extract and return the profile-related fields
        const profileDetails = {
          tutor_id: tutorObj.tutor_id,
          tutor_name: tutorObj.tutor_name,
          subjects: tutorObj.subjects || [],
          grades: tutorObj.grades || [],
          specializations: tutorObj.specializations || [],
          joining_date: tutorObj.joining_date,
          email: tutorObj.email,
          phone_number: tutorObj.phone_number,
          feedback: Array.isArray(tutorObj.feedback) ? tutorObj.feedback.map(f => ({
            feedback_id: f.feedback_id || '',
            user_id: f.user_id || 0,
            type: f.type || '',
            text: f.text || ''
          })) : []
        };

        // Log the extracted profile details
        this.fastify?.log?.info('Extracted profile details with feedback:', JSON.stringify(profileDetails, null, 2));
        
        return profileDetails;
      } catch (error) {
        this.fastify?.log?.error(`Error extracting profile details for tutor ID ${tutorId}:`, error);
        throw error;
      }
    }

    async updateTemporaryUrlFields(hashId, updateData) {
      try {
        const allowedFields = [
          'experience',
          'skills',
          'unique_qualities',
          'student_testimonials',
          'ranks_awards',
          'research_papers'
        ];

        // Filter out any fields that are not allowed
        const filteredUpdateData = Object.keys(updateData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = updateData[key];
            return obj;
          }, {});

        const temporaryUrl = await TemporaryUrl.findOneAndUpdate(
          { hash_id: hashId },
          { $set: filteredUpdateData },
          { new: true }
        );

        if (!temporaryUrl) {
          throw new Error('Temporary URL not found');
        }

        return {
          success: true,
          data: temporaryUrl
        };
      } catch (error) {
        this.fastify?.log?.error('Error updating temporary URL fields:', error);
        throw error;
      }
    }

    async generateTemporaryUrl(tutorId, expiryDays) {
      const hashId = uuidv4();
      const expiryAt = new Date();
      expiryAt.setDate(expiryAt.getDate() + expiryDays);

      // Get tutor's subjects
      const tutor = await this.fastify.prisma.tutor.findUnique({
        where: { tutor_id: Number(tutorId) },
        select: { subjects: true }
      });

      if (!tutor) {
        throw new Error('Tutor not found');
      }

      // Get default fields for each subject
      const subjectsFields = tutor.subjects.map(subject => 
        getRandomFields(subject.toLowerCase())
      );

      // Combine fields from all subjects
      const combinedFields = {
        experience: subjectsFields[0].experience, // Use first subject's experience
        skills: [...new Set(subjectsFields.flatMap(fields => fields.skills))], // Combine unique skills
        unique_qualities: subjectsFields[0].unique_qualities, // Use first subject's unique qualities
        student_testimonials: subjectsFields.flatMap(fields => fields.student_testimonials)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3), // Randomly select 3 testimonials from all subjects
        ranks_awards: [...new Set(subjectsFields.flatMap(fields => fields.ranks_awards))], // Combine unique awards
        research_papers: subjectsFields.flatMap(fields => fields.research_papers)
          .sort(() => 0.5 - Math.random())
          .slice(0, 2) // Randomly select 2 research papers from all subjects
      };

      const temporaryUrl = await this.fastify.prisma.temporary_url.create({
        data: {
          hash_id: hashId,
          tutor_id: Number(tutorId),
          expiry_at: expiryAt,
          experience: combinedFields.experience,
          skills: combinedFields.skills,
          unique_qualities: combinedFields.unique_qualities,
          student_testimonials: combinedFields.student_testimonials,
          ranks_awards: combinedFields.ranks_awards,
          research_papers: combinedFields.research_papers
        }
      });

      return {
        hash_id: temporaryUrl.hash_id,
        url: `${process.env.FRONTEND_URL}/sharedtutorprofile/${temporaryUrl.hash_id}`,
        expiry_at: temporaryUrl.expiry_at,
        experience: temporaryUrl.experience,
        skills: temporaryUrl.skills,
        unique_qualities: temporaryUrl.unique_qualities,
        student_testimonials: temporaryUrl.student_testimonials,
        ranks_awards: temporaryUrl.ranks_awards,
        research_papers: temporaryUrl.research_papers
      };
    }

    async tempurlgerator_studentOnboarding(studentId) {
      try {
        // Validate studentId
        const numericStudentId = Number(studentId);
        if (isNaN(numericStudentId) || numericStudentId <= 0) {
          throw new Error('Invalid student ID provided.');
        }

        // Check if a temp URL for this student_id already exists and is not expired
        const existingTempUrl = await TempUrlStudentOnboarding.findOne({
          student_id: numericStudentId,
          expired_at: { $gt: new Date() } // Ensure it's not expired
        });

        if (existingTempUrl) {
          this.fastify?.log?.info(`Existing unexpired temp URL found for student ID ${numericStudentId}: ${existingTempUrl.hash_id}`);
          return {
            url_id: existingTempUrl.hash_id,
            created_at: existingTempUrl.created_at,
            expiry_at: existingTempUrl.expired_at,
            message: 'Existing temporary student onboarding schedule URL returned'
          };
        }

        // 1) Create a unique 6-character ID for the URL
        const hash_id = crypto.randomBytes(3).toString('hex'); // Generates a 6-character hex string

        // 2) Fetch student details directly
        const student = await Student.findOne({ student_id: numericStudentId });

        if (!student) {
          this.fastify?.log?.warn(`Student with ID ${numericStudentId} not found for URL generation.`);
          throw new Error('Student not exist or created yet');
        }

        // Find the latest order for the student
        const order = await Order.findOne({ student_id: numericStudentId }).sort({ created_date: -1 });
        let orderId = null;
        if (order) {
            orderId = order.order_id;
            this.fastify?.log?.info(`Found order ID ${orderId} for student ID ${numericStudentId}`);
        } else {
            this.fastify?.log?.warn(`No order found for student ID ${numericStudentId}`);
        }

        const studentData = student.toObject();

        // Calculate expiry time (1 month from now)
        const expiry_at = new Date();
        expiry_at.setMonth(expiry_at.getMonth() + 1);

        // 3) Map student info according to our schema and save to db
        const courseSubjects = Array.isArray(studentData.subjects) && studentData.subjects.length > 0 ?
          studentData.subjects.map(s => ({
            name: s.subject || 'N/A',
            classes: s.classes || []
          })) : [];

        let studentSchedule = [];
        try {
          const rawSchedule = await getStudentSchedule(numericStudentId);
          studentSchedule = (rawSchedule.data.schedule || []).map(item => ({
            day: item.day || '',
            time: item.time || '',
            subject: item.subject || ''
          }));
        } catch (scheduleError) {
          this.fastify?.log?.error(`Error fetching or mapping student schedule for ID ${numericStudentId}: ${scheduleError.message}`, scheduleError);
          studentSchedule = [];
        }

        const newTempUrl = new TempUrlStudentOnboarding({
            hash_id,
            student_id: numericStudentId,
            order_id: orderId, // Store the retrieved order_id
            expired_at: expiry_at,
            status: 'order_processing', // Set status to order_processing when schedule is generated
            previous_status: [{
                name: 'order_created',
                created_at: new Date()
            }],
            data: {
                student_name: studentData.full_name || studentData.name || 'N/A',
                course_subject: courseSubjects,
                schedule: studentSchedule
            }
        });

        await newTempUrl.save();

        this.fastify?.log?.info(`Temporary student onboarding URL created for student ID: ${numericStudentId}, hash: ${hash_id}, order_id: ${orderId}`);

        return {
            url_id: hash_id,
            created_at: newTempUrl.created_at,
            expiry_at: newTempUrl.expired_at,
            message: 'Temporary student onboarding schedule URL generated successfully'
        };
      } catch (error) {
        this.fastify?.log?.error('Error in tempurlgerator_studentOnboarding:', error);
        throw error;
      }
    }

    async getTempStudentOnboardingUrl(urlId) {
      try {
        let tempUrlData = await TempUrlStudentOnboarding.findOne({ hash_id: urlId });

        if (!tempUrlData) {
          return null;
        }

        // If order_id is missing, find it and update the document
        if (!tempUrlData.order_id && tempUrlData.student_id) {
          this.fastify?.log?.info(`Order ID missing for temp URL ${urlId}. Attempting to find and update.`);
          const order = await Order.findOne({ student_id: tempUrlData.student_id }).sort({ created_date: -1 });
          if (order) {
            tempUrlData.order_id = order.order_id;
            // Update the document in the database
            await TempUrlStudentOnboarding.updateOne(
              { hash_id: urlId },
              { $set: { order_id: order.order_id } }
            );
            this.fastify?.log?.info(`Successfully updated temp URL ${urlId} with order ID ${order.order_id}`);
          } else {
            this.fastify?.log?.warn(`No order found for student ID ${tempUrlData.student_id} associated with temp URL ${urlId}`);
          }
        }

        // If schedule is missing, fetch it and update the document
        if (!tempUrlData.data.schedule || tempUrlData.data.schedule.length === 0) {
          this.fastify?.log?.info(`Schedule missing for temp URL ${urlId}. Attempting to fetch and update.`);
          try {
            const { getStudentSchedule } = await import('../student/student.service.js');
            const rawSchedule = await getStudentSchedule(tempUrlData.student_id);
            
            if (rawSchedule && rawSchedule.data && rawSchedule.data.schedule) {
              const studentSchedule = rawSchedule.data.schedule.map(item => ({
                day: item.day || '',
                time: item.time || '',
                subject: item.subject || ''
              }));

              // Update the document with the fetched schedule
              await TempUrlStudentOnboarding.updateOne(
                { hash_id: urlId },
                { 
                  $set: { 
                    'data.schedule': studentSchedule 
                  }
                }
              );
              
              this.fastify?.log?.info(`Successfully updated temp URL ${urlId} with fetched schedule`);
              tempUrlData.data.schedule = studentSchedule;
            } else {
              this.fastify?.log?.warn(`No schedule found for student ID ${tempUrlData.student_id}`);
            }
          } catch (scheduleError) {
            this.fastify?.log?.error(`Error fetching schedule for student ID ${tempUrlData.student_id}: ${scheduleError.message}`);
          }
        }

        // Update status to confirm_schedule if schedule exists (regardless of current status)
        if (tempUrlData.data && 
            tempUrlData.data.schedule && 
            tempUrlData.data.schedule.length > 0 &&
            tempUrlData.status !== 'congrats') { // Don't change if already in congrats status
          
          // Check if order is completed
          let orderCompleted = false;
          if (tempUrlData.order_id) {
            try {
              const order = await Order.findOne({ order_id: tempUrlData.order_id });
              if (order && order.onboarding_status === 'Completed') {
                orderCompleted = true;
              }
            } catch (orderError) {
              this.fastify?.log?.error(`Error checking order status for order_id ${tempUrlData.order_id}:`, orderError);
            }
          }

          // If order is completed, update status to congrats
          if (orderCompleted) {
            await TempUrlStudentOnboarding.updateOne(
              { hash_id: urlId },
              { 
                $set: { status: 'congrats' },
                $push: {
                  previous_status: {
                    name: 'confirm_schedule',
                    created_at: new Date()
                  }
                }
              }
            );
            
            tempUrlData.status = 'congrats';
          }
          // Otherwise, update to confirm_schedule if not already there
          else if (tempUrlData.status !== 'confirm_schedule') {
            await TempUrlStudentOnboarding.updateOne(
              { hash_id: urlId },
              { 
                $set: { status: 'confirm_schedule' },
                $push: {
                  previous_status: {
                    name: 'order_processing',
                    created_at: new Date()
                  }
                }
              }
            );
            
            
          }
        }


        return tempUrlData;
      } catch (error) {
        this.fastify?.log?.error('Error retrieving temporary student onboarding URL:', error);
        throw error;
      }
    }

    async confirmTempStudentOnboardingSchedule(urlId, confirm_schedule, requested_changes = '') {
      try {
        const tempUrlData = await TempUrlStudentOnboarding.findOne({ hash_id: urlId });

        if (!tempUrlData) {
          return { success: false, error: 'Temporary student onboarding URL not found', statusCode: 404 };
        }

        // 1st check: if schedule exists
        if (!tempUrlData.data || !tempUrlData.data.schedule || tempUrlData.data.schedule.length === 0) {
          return { success: false, error: 'Schedule not generated, cannot confirm', statusCode: 400 };
        }

        // Update the confirm_schedule field and status
        const updateData = {
          confirm_schedule: confirm_schedule,
          schedule_confirmed: confirm_schedule === 'yes',
          status: 'confirm_schedule' // Always keep status as confirm_schedule regardless of confirmation
        };

        // Add requested_changes field if provided
        if (confirm_schedule === 'requested_changes' && requested_changes) {
          updateData.requested_changes = requested_changes;
        }

        const updatedTempUrl = await TempUrlStudentOnboarding.findOneAndUpdate(
          { hash_id: urlId },
          {
            $set: updateData,
            $push: {
              previous_status: {
                name: `Schedule_${confirm_schedule.toUpperCase()}`,
                created_at: new Date()
              }
            }
          },
          { new: true }
        );

        if (!updatedTempUrl) {
          return { success: false, error: 'Failed to update temporary student onboarding URL', statusCode: 500 };
        }

        // Import required modules
        const Order = (await import('../order/order.schema.js')).default;
        const notificationService = (await import('../notification/notification.service.js')).default;

        // Find the order to get assigned_to user
        const order = await Order.findOne({ student_id: tempUrlData.student_id });
        
        if (order && order.assigned_to && order.assigned_to.user_id) {
          const assignedUser = order.assigned_to; // assigned_to is an object, not an array

          if (confirm_schedule === 'yes') {
            // Send notification for schedule confirmation
            await notificationService.createNotification({
              userId: assignedUser.user_id.toString(),
              studentId: tempUrlData.student_id.toString(),
              type: 'Schedule Confirmation',
              priority: 'high',
              message: `Schedule confirmed by student ${tempUrlData.data.student_name} (ID: ${tempUrlData.student_id}). Order status updated to "Upload to Portal".`,
              notificationId: `schedule_confirm_${Date.now()}_${assignedUser.user_id}`
            });

            this.fastify?.log?.info(`Notification sent to assigned user ${assignedUser.user_id} for schedule confirmation`);

            // Update order status from "Needs Student Verification" to "Upload to Portal"
            if (order.onboarding_status === 'Needs Student Verification') {
              await Order.findOneAndUpdate(
                { student_id: tempUrlData.student_id },
                {
                  $set: {
                    onboarding_status: 'Upload to Portal',
                    modified_at: new Date()
                  },
                  $push: {
                    logs: {
                      action: 'schedule_confirmation',
                      performed_by: {
                        user_id: null,
                        role: 'system',
                        username: 'system',
                        name: 'System'
                      },
                      timestamp: new Date(),
                      changes: [{
                        field: 'onboarding_status',
                        old: 'Needs Student Verification',
                        new: 'Upload to Portal'
                      }]
                    }
                  }
                }
              );

              this.fastify?.log?.info(`Order status updated from "Needs Student Verification" to "Upload to Portal" for student ${tempUrlData.student_id}`);
            }

          } else if (confirm_schedule === 'requested_changes') {
            // Send notification for requested changes
            await notificationService.createNotification({
              userId: assignedUser.user_id.toString(),
              studentId: tempUrlData.student_id.toString(),
              type: 'Schedule Changes Requested',
              priority: 'high',
              message: `Student ${tempUrlData.data.student_name} (ID: ${tempUrlData.student_id}) has requested changes to their schedule.`,
              notificationId: `schedule_changes_${Date.now()}_${assignedUser.user_id}`
            });

            this.fastify?.log?.info(`Notification sent to assigned user ${assignedUser.user_id} for requested changes`);

            // Add chat message to order
            await Order.findOneAndUpdate(
              { student_id: tempUrlData.student_id },
              {
                $push: {
                  chat_messages: {
                    msg_id: `schedule_changes_${Date.now()}`,
                    user_id: null,
                    name: tempUrlData.data.student_name,
                    role: 'student',
                    message: `Student requested these changes: ${requested_changes}`,
                    created_at: new Date(),
                    deleted: false
                  }
                }
              }
            );

            this.fastify?.log?.info(`Chat message added to order for student ${tempUrlData.student_id} with requested changes`);
          }
        } else {
          this.fastify?.log?.warn(`No assigned user found for student ${tempUrlData.student_id}, skipping notification and status update`);
        }

        return { success: true, message: 'Temporary student onboarding schedule confirmation processed successfully' };

      } catch (error) {
        this.fastify?.log?.error('Error in confirmTempStudentOnboardingSchedule:', error);
        throw error;
      }
    }
}

export default urlService;