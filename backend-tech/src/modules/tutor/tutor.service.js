import { TutorSchedule, TutorAttendance } from './tutor.schema.js';
import mongoose from 'mongoose';
import entityLogger from '../../utils/entityLogger.js';
import Student from '../student/student.schema.js';
import { writeAllTutorsScheduleFile } from '../llm/utils/tutorTextGenerator.js';
import { logger } from '../../utils/logger.js';
import { getUserDetailsFromJWT } from '../../utils/getUserDetails.js';

class TutorService {
    constructor(fastify) {
        this.fastify = fastify;
    }

    // Helper method to update schedule file
    async updateScheduleFile() {
        try {
            await writeAllTutorsScheduleFile();
            logger.info('Successfully updated tutor schedules file');
        } catch (err) {
            logger.error('Error updating tutor schedules file:', { error: err.message, stack: err.stack });
        }
    }

    async findTutorByEmail(email) {
        try {
            this.fastify.log.info(`Checking for existing tutor with email: ${email}`);
            const tutor = await TutorSchedule.findOne({ email: email.toLowerCase() });
            return tutor;
        } catch (error) {
            this.fastify.log.error(`Error finding tutor by email ${email}:`, error);
            throw error;
        }
    }

    async findTutorByPhone(phoneNumber) {
        try {
            this.fastify.log.info(`Checking for existing tutor with phone: ${phoneNumber}`);
            
            // Remove any spaces or special characters first
            let cleanPhone = phoneNumber.replace(/\s+/g, '');
            
            // Check for valid country codes and remove them
            const countryCodes = ['+91', '+1', '+44'];
            for (const code of countryCodes) {
                if (cleanPhone.startsWith(code)) {
                    cleanPhone = cleanPhone.substring(code.length);
                    break;
                }
            }
            // Remove any remaining non-digit characters
            cleanPhone = cleanPhone.replace(/\D/g, '');

            // Search for the phone number with or without country codes
            const tutor = await TutorSchedule.findOne({
                $or: [
                    { phone_number: cleanPhone },
                    { phone_number: `+91${cleanPhone}` },
                    { phone_number: `+1${cleanPhone}` },
                    { phone_number: `+44${cleanPhone}` }
                ]
            });
            
            return tutor;
        } catch (error) {
            this.fastify.log.error(`Error finding tutor by phone ${phoneNumber}:`, error);
            throw error;
        }
    }

    async createTutor(data, request) {
        try {
            // Find the last created tutor to get the highest tutor_id
            const lastTutor = await TutorSchedule.findOne().sort({ tutor_id: -1 });

            // Generate the next tutor_id
            let nextTutorId = lastTutor ? lastTutor.tutor_id + 1 : 20001; // Start from 30001 if no tutors exist
            
            // Check if the next ID already exists and find the next available ID
            let isIdAvailable = false;
            while (!isIdAvailable) {
                const existingTutor = await TutorSchedule.findOne({ tutor_id: nextTutorId });
                if (!existingTutor) {
                    isIdAvailable = true;
                } else {
                    nextTutorId++;
                }
            }
            
            // Calculate total slots from total_available_hours
            const totalSlots = data.total_available_hours.reduce((total, day) => {
                return total + (day.slots ? day.slots.length : 0);
            }, 0);
            
            // Create new tutor with the generated tutor_id and use it as user_id
            const tutor = new TutorSchedule({
                ...data,
                tutor_id: nextTutorId,
                user_id: nextTutorId,
                total_slots: totalSlots,
                created_at: new Date()
            });
            
            await tutor.save();
            
            // Try to add created_by as the last step
            try {
                const created_by = await getUserDetailsFromJWT(request);
                if (created_by) {
                    tutor.created_by = created_by;
                    await tutor.save();
                }
            } catch (error) {
                // Log the error but don't fail the request
                console.error('Error adding created_by:', error);
            }
            
            // Log the creation with user details from the API request
            entityLogger.logEntityCreation('tutor', data, data.user_type);
            
            this.fastify.log.info(`Tutor created successfully with ID: ${nextTutorId}`);
            
            // Non-blocking schedule file update
            this.updateScheduleFile();
            
            return { 
                success: true, 
                data: { 
                    tutor_id: nextTutorId,
                    name: tutor.tutor_name,
                    created_by: tutor.created_by
                } 
            };
        } catch (error) {
            this.fastify.log.error('Error creating tutor:', error);
            throw error;
        }
    }

    
    async createFeedback(data) {
        const { tutor_id, student_id, user_id, type, rating, text, created_at } = data;

        try {
            this.fastify.log.info(`Creating feedback for tutor ID: ${tutor_id}`);

            // Find the tutor by ID
            const tutor = await TutorSchedule.findOne({ tutor_id });

            if (!tutor) {
                this.fastify.log.warn(`Tutor not found for feedback with ID: ${tutor_id}`);
                throw new Error('Tutor not found');
            }

            // Generate unique feedback ID
            const feedback_id = `${tutor_id}_${user_id || student_id}_${Date.now()}`;

            // Create feedback object
            const newFeedback = {
                feedback_id,
                type: type?.toLowerCase(),
                rating,
                text: text?.toLowerCase(),
                created_at: created_at ? new Date(created_at) : new Date()
            };

            // Add optional user or student ID
            if (student_id) newFeedback.student_id = student_id;
            if (user_id) newFeedback.user_id = user_id;

            // Append feedback to tutor
            tutor.feedback = [...(tutor.feedback || []), newFeedback];

            // Save updated tutor document
            await tutor.save();

            // Log the feedback creation
            entityLogger.logEntityUpdate('feedback', newFeedback, tutor, 'system');

            this.fastify.log.info(`Feedback added to tutor ID: ${tutor_id}`);

            return { success: true, feedback_id };
        } catch (error) {
            this.fastify.log.error(`Error creating feedback for tutor ID ${tutor_id}:`, error);
            throw error;
        }
    }

    async changeFreeSlotsService(tutorId, data) {
        try {
            const tutor = await TutorSchedule.findOne({ tutor_id: tutorId });
            if (!tutor) {
                await entityLogger.logEntityUpdate('tutor_schedule',
                    { tutor_id: tutorId },
                    { error: 'Tutor not found' },
                    this.fastify.user?.id || 'system',
                    this.fastify.request
                );
                throw new Error('Tutor not found');
            }

            // Store old data for logging
            const oldData = tutor.toObject();

            // Validate the data structure
            if (!data.type_of_req || !data.day || !data.slot) {
                await entityLogger.logEntityUpdate('tutor_schedule',
                    { tutor_id: tutorId, data },
                    { error: 'Invalid data format' },
                    this.fastify.user?.id || 'system',
                    this.fastify.request
                );
                throw new Error('Invalid data format. type_of_req, day, and slot are required');
            }

            const { type_of_req, day, slot } = data;
            const dayLower = day.toLowerCase();
            // Find the day in total_available_hours
            let daySchedule = tutor.total_available_hours.find(d => d.day.toLowerCase() === dayLower);
            if (type_of_req === 'add') {
                if (!daySchedule) {
                    // If day doesn't exist, create new day schedule
                    tutor.total_available_hours.push({
                        day: dayLower,
                        slots: [slot]
                    });
                } else {
                    // If day exists, add slot if not already present
                    if (!daySchedule.slots.includes(slot)) {
                        daySchedule.slots.push(slot);
                    }
                }
            } else if (type_of_req === 'delete') {
                if (!daySchedule) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id: tutorId, day },
                        { error: 'No schedule found for day' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`No schedule found for ${day}`);
                }
                // Remove the slot
                daySchedule.slots = daySchedule.slots.filter(s => s !== slot);
                
                // If no slots left for this day, remove the day entry
                if (daySchedule.slots.length === 0) {
                    tutor.total_available_hours = tutor.total_available_hours.filter(
                        d => d.day.toLowerCase() !== dayLower
                    );
                }
            } else {
                await entityLogger.logEntityUpdate('tutor_schedule',
                    { tutor_id: tutorId, type_of_req },
                    { error: 'Invalid type_of_req' },
                    this.fastify.user?.id || 'system',
                    this.fastify.request
                );
                throw new Error('Invalid type_of_req. Must be either "add" or "delete"');
            }

            // Calculate total slots
            const totalSlots = tutor.total_available_hours.reduce((total, day) => {
                return total + (day.slots ? day.slots.length : 0);
            }, 0);
            tutor.total_slots = totalSlots;

            await tutor.save();

            // Log the update
            await entityLogger.logEntityUpdate('tutor_schedule',
                oldData,
                tutor.toObject(),
                this.fastify.user?.id || 'system',
                this.fastify.request
            );

            // Non-blocking schedule file update
            this.updateScheduleFile();

            return { 
                success: true, 
                data: {
                    tutor_id: tutor.tutor_id,
                    total_available_hours: tutor.total_available_hours
                }
            };
        } catch (error) {
            this.fastify.log.error('Error updating tutor availability:', error);
            throw error;
        }
    }


    async getAllTutors(request) {
        try {
            const sortBy = request.query.sortBy || 'date_added_newest';
            const subject = request.query.subject || null;
            const search = request.query.search || null;
            const suggestionsOnly = request.query.suggestionsOnly === 'true';
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 50;
            
            let filter = {};
            let sortOption = {};
            
            // Apply filters based on subject
            if (subject) {
                filter.subjects = subject;
            }
            
            // Apply filter based on search term
           
            
            // Sorting options
            switch (sortBy) {
                case 'name_asc': sortOption = { tutor_name: 1 }; break;
                case 'name_desc': sortOption = { tutor_name: -1 }; break;
                case 'date_added_newest': sortOption = { createdAt: -1 }; break;
                case 'date_added_oldest': sortOption = { createdAt: 1 }; break;
                case 'last_modified_newest': sortOption = { updatedAt: -1 }; break;
                case 'last_modified_oldest': sortOption = { updatedAt: 1 }; break;
                default: sortOption = { createdAt: -1 };
            }
            
            // Handle suggestions query
        
            // Pagination for regular search queries
            const skip = (page - 1) * limit;
            const total = await TutorSchedule.countDocuments(filter);
            
            const tutors = await TutorSchedule.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limit);
            
            // Return a properly formatted response
            return {
                success: true,
                tutors,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
            
        } catch (error) {
            this.fastify.log.error('Error in getAllTutors:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAllTutorsBySearch(request) {
        try {
            const search = request.query.search ? request.query.search.replace(/\s+/g, '') : null;
            let filter = {};
            if (search) {
                // Split search string into parts if it contains spaces
                const searchParts = search.trim().split(/\s+/);
                
                // Create search conditions array
                const searchConditions = [
                    { tutor_name: { $regex: `^${search}$`, $options: 'i' } },      // exact match
                    { tutor_name: { $regex: `^${search}`, $options: 'i' } },       // starts with
                    { tutor_name: { $regex: `${search}$`, $options: 'i' } },       // ends with
                    { tutor_name: { $regex: search, $options: 'i' } },             // contains anywhere
                    { tutor_name: { $regex: `(^|\\s)${search}`, $options: 'i' } } // word boundary
                ];

                // If search has multiple parts (e.g., "pranjal k")
                if (searchParts.length > 1) {
                    const firstName = searchParts[0];
                    const lastNameInitial = searchParts[1];
                    
                    // Add condition for first name + last name initial
                    searchConditions.push(
                        { tutor_name: { $regex: `^${firstName}\\s+${lastNameInitial}`, $options: 'i' } }  // matches "pranjal k" for "pranjal kanwar"
                    );
                }

                filter = {
                    $or: searchConditions
                };
            }
            // Always return only tutor_id and tutor_name
            const tutors = await TutorSchedule.find(filter).select('tutor_id tutor_name');
            // Map to array of objects with only tutor_id and tutor_name
            const result = tutors.map(t => ({ 
                tutor_id: t.tutor_id, 
                tutor_name: t.tutor_name,
                tutor_name_no_spaces: t.tutor_name.replace(/\s+/g, '')
            }));
            return result;
        } catch (error) {
            this.fastify.log.error('Error in getAllTutors:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    

    async getTutorById(tutorId) {
        try {
            this.fastify.log.info(`Fetching tutor with ID: ${tutorId}`);
            const tutor = await TutorSchedule.findOne({ tutor_id: tutorId });
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            return {
                success: true,
                data: tutor
            };
        } catch (error) {
            this.fastify.log.error(error);
            throw error;
        }
    }

    async updateTutor(tutorId, updateData, user) {
        try {
            this.fastify.log.info(`Updating tutor with ID: ${tutorId}`);
            
            // If total_available_hours is being updated, merge with existing hours
            if (updateData.total_available_hours) {
                const existingTutor = await TutorSchedule.findOne({ tutor_id: tutorId });
                if (existingTutor) {
                    // Create a map of existing hours by day
                    const existingHoursMap = new Map();
                    existingTutor.total_available_hours.forEach(day => {
                        existingHoursMap.set(day.day.toLowerCase(), new Set(day.slots));
                    });

                    // Merge new hours with existing ones
                    updateData.total_available_hours.forEach(newDay => {
                        const dayKey = newDay.day.toLowerCase();
                        if (existingHoursMap.has(dayKey)) {
                            // If day exists, merge slots
                            newDay.slots.forEach(slot => existingHoursMap.get(dayKey).add(slot));
                            newDay.slots = Array.from(existingHoursMap.get(dayKey));
                        }
                    });

                    // Calculate total slots after merging
                    const totalSlots = updateData.total_available_hours.reduce((total, day) => {
                        return total + (day.slots ? day.slots.length : 0);
                    }, 0);
                    updateData.total_slots = totalSlots;
                }
            }

            // If feedback is being updated, append it to existing feedback
            if (updateData.feedback) {
                const tutor = await TutorSchedule.findOne({ tutor_id: tutorId });
                if (tutor) {
                    updateData.feedback = [...(tutor.feedback || []), ...updateData.feedback];
                }
            }
            
            const tutor = await TutorSchedule.findOneAndUpdate(
                { tutor_id: tutorId },
                { $set: updateData }, // Only update the fields that are provided
                { 
                    new: true, // Return the updated document
                    runValidators: true // Run validators on update
                }
            );
            
            if (!tutor) {
                this.fastify.log.warn(`Tutor not found for update with ID: ${tutorId}`);
                throw new Error('Tutor not found');
            }
            
            // Log the update with user details from JWT token
            entityLogger.logEntityUpdate('tutor', tutor, tutor, user);
            
            this.fastify.log.info(`Tutor updated successfully with ID: ${tutorId}`);

            // Non-blocking schedule file update
            this.updateScheduleFile();

            return { success: true, data: tutor };
        } catch (error) {
            this.fastify.log.error(`Error updating tutor with ID ${tutorId}:`, error);
            throw error;
        }
    }

    async deleteTutor(tutorId) {
        try {
            this.fastify.log.info(`Deleting tutor with ID: ${tutorId}`);
            const tutor = await TutorSchedule.findOneAndDelete({ tutor_id: tutorId });
            if (!tutor) {
                this.fastify.log.warn(`Tutor not found for deletion with ID: ${tutorId}`);
                throw new Error('Tutor not found');
            }
            this.fastify.log.info(`Tutor deleted successfully with ID: ${tutorId}`);

            // Log the deletion
            entityLogger.logEntityDeletion('tutor', tutor, 'system');

            // Non-blocking schedule file update
            this.updateScheduleFile();

            return { success: true, message: 'Tutor deleted successfully' };
        } catch (error) {
            this.fastify.log.error(`Error deleting tutor with ID ${tutorId}:`, error);
            throw error;
        }
    }

    async getAvailableTutors() {
        try {
            this.fastify.log.info('Fetching available tutors');
            const tutors = await TutorSchedule.find({
                'available_hours.0': { $exists: true }
            });
            this.fastify.log.info(`Found ${tutors.length} available tutors`);
            return { success: true, data: tutors };
        } catch (error) {
            this.fastify.log.error('Error fetching available tutors:', error);
            throw error;
        }
    }

    async getAvailableHoursByTeacherId(tutorId) {
        try {
            this.fastify.log.info(`Fetching available hours for tutor ID: ${tutorId}`);
            const tutor = await TutorSchedule.findOne(
                { tutor_id: tutorId },
                'total_available_hours allotted_hours' // Select both total and allotted hours
            );
            
            if (!tutor) {
                this.fastify.log.warn(`Tutor not found with ID: ${tutorId}`);
                throw new Error('Tutor not found');
            }

            // Create a map of allotted hours for quick lookup
            const allottedHoursMap = new Map();
            tutor.allotted_hours.forEach(allotted => {
                const key = `${allotted.day.toLowerCase()}_${allotted.time}`;
                allottedHoursMap.set(key, true);
            });

            // Find available hours by comparing total and allotted hours
            const availableHours = [];
            tutor.total_available_hours.forEach(daySchedule => {
                const day = daySchedule.day.toLowerCase();
                daySchedule.slots.forEach(time => {
                    const key = `${day}_${time}`;
                    if (!allottedHoursMap.has(key)) {
                        availableHours.push({
                            day: day,
                            time: time
                        });
                    }
                });
            });
            
            this.fastify.log.info(`Found ${availableHours.length} available hours for tutor ID: ${tutorId}`);
            return { 
                success: true, 
                data: availableHours 
            };
        } catch (error) {
            this.fastify.log.error(`Error fetching available hours for tutor ID ${tutorId}:`, error);
            throw error;
        }
    }

    async getTotalAvailableHoursByTeacherId(tutorId) {
        try {
            this.fastify.log.info(`Fetching total available hours for tutor ID: ${tutorId}`);
            const tutor = await TutorSchedule.findOne(
                { tutor_id: tutorId },
                'total_available_hours' // Only select the total_available_hours field
            );
            
            if (!tutor) {
                this.fastify.log.warn(`Tutor not found with ID: ${tutorId}`);
                throw new Error('Tutor not found');
            }
            
            this.fastify.log.info(`Found total available hours for tutor ID: ${tutorId}`);
            return { 
                success: true, 
                data: tutor.total_available_hours 
            };
        } catch (error) {
            this.fastify.log.error(`Error fetching total available hours for tutor ID ${tutorId}:`, error);
            throw error;
        }
    }

    async getTutorProfile(tutorId) {
        try {
            const tutor = await TutorSchedule.findOne(
                { tutor_id: tutorId },
                'tutor_id tutor_name grades subject' // Select only these fields
            );
            
            if (!tutor) {
                throw new Error('Tutor not found');
            }
            
            return {
                success: true,
                data: {
                    tutor_id: tutor.tutor_id,
                    tutor_name: tutor.tutor_name,
                    grades: tutor.grades,
                    subject: tutor.subject
                }
            };
        } catch (error) {
            this.fastify.log.error('Error fetching tutor profile:', error);
            throw error;
        }
    }

    async updateTutorProfile(tutorId, updateData) {
        try {
            // Find the existing tutor
            const existingTutor = await TutorSchedule.findOne({ tutor_id: tutorId });
            if (!existingTutor) {
                throw new Error('Tutor not found');
            }

            // Prepare update object
            const updateObject = {};

            // 1. Override tutor_name if provided
            if (updateData.tutor_name) {
                updateObject.tutor_name = updateData.tutor_name;
            }
            if (updateData.email) {
                updateObject.email = updateData.email;
            }
            if (updateData.phone_number) {
                updateObject.phone_number = updateData.phone_number;
            }
            if (updateData.specialization) {
                updateObject.specialization = updateData.specialization;
            }

            // 2. Override subjects if provided
            if (updateData.subjects) {
                updateObject.subjects = updateData.subjects;
            }

            // 3. Append grades if provided
            if (updateData.grades) {
                // Combine existing and new grades, remove duplicates
                const combinedGrades = [...new Set([...existingTutor.grades, ...updateData.grades])];
                updateObject.grades = combinedGrades;
            }

            // 4. Append feedback if provided
            if (updateData.feedback) {
                // Combine existing and new feedback
                const combinedFeedback = [...existingTutor.feedback, ...updateData.feedback];
                updateObject.feedback = combinedFeedback;
            }

            // 5. Append status if provided
            if (updateData.status) {
                updateObject.status = updateData.status;
            }

            // 5. Append total_available_hours if provided
            if (updateData.total_available_hours) {
                // Merge existing and new available hours
                const existingHours = existingTutor.total_available_hours || [];
                const newHours = updateData.total_available_hours;

                // Create a map of existing hours by day
                const hoursMap = new Map();
                existingHours.forEach(hour => {
                    hoursMap.set(hour.day.toLowerCase(), hour);
                });

                // Merge new hours with existing ones
                newHours.forEach(hour => {
                    const day = hour.day.toLowerCase();
                    if (hoursMap.has(day)) {
                        // If day exists, merge slots
                        const existingSlots = new Set(hoursMap.get(day).slots);
                        hour.slots.forEach(slot => existingSlots.add(slot));
                        hoursMap.set(day, { day, slots: Array.from(existingSlots) });
                    } else {
                        // If day doesn't exist, add new entry
                        hoursMap.set(day, hour);
                    }
                });

                updateObject.total_available_hours = Array.from(hoursMap.values());
            }

            // 6. Handle allotted_hours - only allow new allotments if slot is not already allotted
            if (updateData.allotted_hours) {
                const existingAllottedHours = existingTutor.allotted_hours || [];
                const newAllottedHours = updateData.allotted_hours;

                // Check for conflicts
                for (const newAllotment of newAllottedHours) {
                    const isSlotAllotted = existingAllottedHours.some(
                        existing => 
                            existing.day.toLowerCase() === newAllotment.day.toLowerCase() && 
                            existing.time === newAllotment.time
                    );

                    if (isSlotAllotted) {
                        throw new Error(`Time slot ${newAllotment.time} on ${newAllotment.day} is already allotted to another student`);
                    }
                }

                // If no conflicts, append new allotments
                updateObject.allotted_hours = [...existingAllottedHours, ...newAllottedHours];
            }

            // Update the tutor with the prepared update object
            const updatedTutor = await TutorSchedule.findOneAndUpdate(
                { tutor_id: tutorId },
                { $set: updateObject },
                { 
                    new: true,
                    runValidators: true
                }
            );

            // Non-blocking schedule file update
            this.updateScheduleFile();

            return {
                success: true,
                data: updatedTutor
            };
        } catch (error) {
            this.fastify.log.error('Error updating tutor profile:', error);
            throw error;
        }
    }

    async modifyTutorSchedule(data) {
        try {
            // Handle both single object and array of objects
            const scheduleModifications = Array.isArray(data) ? data : [data];
            const results = [];
            const conflicts = [];

            // Time format validation regex
            const timeRegex = /^([1-9]|1[0-2]):[0-5][0-9](AM|PM)$/;

            // First check all modifications for conflicts and time format
            for (const modification of scheduleModifications) {
                const { student_id, day, time, tutor_id } = modification;
                
                // Validate required fields
                if (!day || !time || !tutor_id || !student_id || !modification.subject) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { modification },
                        { error: 'Missing required fields' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    conflicts.push({
                        student_id: student_id,
                        student_name: null,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Missing required fields. Required: student_id, day, time, tutor_id, subject`
                    });
                    continue;
                }
                
                // Validate time format
                if (!timeRegex.test(time)) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { modification, time },
                        { error: 'Invalid time format' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    conflicts.push({
                        student_id: student_id,
                        student_name: null,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Invalid time format. Time must be in format HH:MMAM or HH:MMPM (e.g., 7:00AM, 6:30PM)`
                    });
                    continue;
                }
                
                // Find the tutor
                const tutor = await TutorSchedule.findOne({ tutor_id });
                if (!tutor) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id },
                        { error: 'Tutor not found' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    conflicts.push({
                        student_id: student_id,
                        student_name: null,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Tutor not found with ID: ${tutor_id}`
                    });
                    continue;
                }

                // Store old data for logging
                const oldData = tutor.toObject();

                // Validate if the requested subject exists in tutor's subjects
                if (!tutor.subjects.includes(modification.subject)) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id, subject: modification.subject },
                        { error: 'Subject not found in tutor subjects' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    conflicts.push({
                        student_id: student_id,
                        student_name: null,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Tutor ${tutor_id} does not have the subject: ${modification.subject}`
                    });
                    continue;
                }

                // Find the student to get their name
                const student = await Student.findOne({ student_id: Number(student_id) });
                if (!student) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { student_id },
                        { error: 'Student not found' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    conflicts.push({
                        student_id: student_id,
                        student_name: null,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Student not found with ID: ${student_id}`
                    });
                    continue;
                }

                // Check if the slot exists in total_available_hours
                const daySchedule = tutor.total_available_hours.find(d => d.day.toLowerCase() === day.toLowerCase());
                if (!daySchedule || !daySchedule.slots.includes(time)) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id, day, time },
                        { error: 'Slot not available' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    conflicts.push({
                        student_id: student_id,
                        student_name: student.full_name,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Requested time slot ${time} on ${day} is not available in tutor's schedule`
                    });
                    continue;
                }

                // Check if the slot is already allotted to any student
                const isSlotAllotted = tutor.allotted_hours.some(
                    slot => slot.day.toLowerCase() === day.toLowerCase() && slot.time === time
                );
                if (isSlotAllotted) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id, day, time },
                        { error: 'Slot already allotted' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    conflicts.push({
                        student_id: student_id,
                        student_name: student.full_name,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Time slot ${time} on ${day} is already allotted to another student`
                    });
                    continue;
                }

                // If no conflicts, add to results with student name
                results.push({
                    ...modification,
                    student_name: student.full_name
                });
            }

            // If there are any conflicts, return them without making any database changes
            if (conflicts.length > 0) {
                return {
                    success: false,
                    error: conflicts[0].error,
                    data: scheduleModifications.map(mod => ({
                        ...mod,
                        student_name: null
                    })),
                    conflicts: conflicts
                };
            }

            // If no conflicts, proceed with all updates
            const updatedResults = [];
            for (const modification of results) {
                const { student_id, student_name, day, time, tutor_id } = modification;
                
                // Create the new allotted hour entry
                const newAllottedHour = {
                    day: day.toLowerCase(),
                    time,
                    student_name,
                    student_id: Number(student_id),
                    subject: modification.subject,
                    slot_id: `${tutor_id}_${day}_${time}`.replace(/:/g, '')
                };

                // Update the tutor's allotted_hours
                const updatedTutor = await TutorSchedule.findOneAndUpdate(
                    { tutor_id },
                    { $push: { allotted_hours: newAllottedHour } },
                    { new: true }
                );

                if (!updatedTutor) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id, modification },
                        { error: 'Failed to update tutor' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Failed to update tutor ${tutor_id}`);
                }

                // Log the update
                await entityLogger.logEntityUpdate('tutor_schedule',
                    { tutor_id, allotted_hours: updatedTutor.allotted_hours.filter(h => h.slot_id !== newAllottedHour.slot_id) },
                    { tutor_id, allotted_hours: updatedTutor.allotted_hours },
                    this.fastify.user?.id || 'system',
                    this.fastify.request
                );

                // Add the updated data to results
                updatedResults.push({
                    tutor_id: updatedTutor.tutor_id,
                    tutor_name: updatedTutor.tutor_name,
                    student_id: student_id,
                    student_name: student_name,
                    day: day.toLowerCase(),
                    time: time,
                    slot_id: newAllottedHour.slot_id,
                    allotted_hour: newAllottedHour
                });
            }

            // Non-blocking schedule file update
            this.updateScheduleFile();

            return {
                success: true,
                data: updatedResults
            };
        } catch (error) {
            this.fastify.log.error('Error modifying tutor schedule:', error);
            throw error;
        }
    }

    async validateTutorSchedule(data) {
        try {
            // Handle both single object and array of objects
            const scheduleModifications = Array.isArray(data) ? data : [data];
            const conflicts = [];
            const results = [];

            // Helper to normalize time (remove spaces)
            const normalizeTime = t => t.replace(/\s+/g, '');

            // Check all modifications for conflicts
            for (const modification of scheduleModifications) {
                const { student_id, day, time, tutor_id } = modification;
                const normTime = normalizeTime(time);
                // Find the tutor
                const tutor = await TutorSchedule.findOne({ tutor_id });
                if (!tutor) {
                    conflicts.push({
                        student_id: student_id,
                        student_name: null,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Tutor not found with ID: ${tutor_id}`
                    });
                    continue;
                }

                // Find the student to get their name
                const student = await Student.findOne({ student_id: Number(student_id) });
                if (!student) {
                    conflicts.push({
                        student_id: student_id,
                        student_name: null,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Student not found with ID: ${student_id}`
                    });
                    continue;
                }

                // Check if the slot exists in total_available_hours
                const daySchedule = tutor.total_available_hours.find(d => d.day.toLowerCase() === day.toLowerCase());
                const slotExists = daySchedule && daySchedule.slots.some(slot => normalizeTime(slot) === normTime);
                if (!slotExists) {
                    conflicts.push({
                        student_id: student_id,
                        student_name: student.full_name,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Requested time slot ${time} on ${day} is not available in tutor's schedule`
                    });
                    continue;
                }

                // Check if the slot is already allotted to a different student
                const isSlotAllotted = tutor.allotted_hours.some(
                    slot => slot.day.toLowerCase() === day.toLowerCase() && 
                           slot.time === time && 
                           slot.student_id !== Number(student_id)
                );
                if (isSlotAllotted) {
                    conflicts.push({
                        student_id: student_id,
                        student_name: student.full_name,
                        day: day,
                        time: time,
                        tutor_id: tutor_id,
                        subject: modification.subject,
                        error: `Time slot ${time} on ${day} is already allotted to another student`
                    });
                    continue;
                }

                // If no conflicts for this modification, add to results
                results.push({
                    ...modification,
                    student_name: student.full_name
                });
            }

            // If there are any conflicts, return them with success: false and is_valid: false
            if (conflicts.length > 0) {
                return {
                    success: false,
                    is_valid: false,
                    data: scheduleModifications.map(mod => {
                        const student = results.find(r => r.student_id === mod.student_id);
                        return {
                            ...mod,
                            student_name: student ? student.student_name : null
                        };
                    }),
                    conflicts: conflicts
                };
            }

            // If no conflicts, return true
            return {
                success: true,
                is_valid: true
            };
        } catch (error) {
            this.fastify.log.error('Error validating tutor schedule:', error);
            // Return as a validation error (handled as 400 in controller)
            return {
                success: false,
                is_valid: false,
                error: error.message
            };
        }
    }

    async swapTutor(data) {
        try {
            const results = [];
            
            for (const swap of data) {
                const { source, destination } = swap;
                
                // Validate source student
                const sourceStudent = await Student.findOne({ student_id: source.student_id });
                if (!sourceStudent) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { student_id: source.student_id },
                        { error: 'Source student not found' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Source student with ID ${source.student_id} not found`);
                }
                if (sourceStudent.full_name !== source.student_name) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { student_id: source.student_id, provided_name: source.student_name, actual_name: sourceStudent.full_name },
                        { error: 'Invalid student name' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Invalid student name for source student ID ${source.student_id}`);
                }

                // Validate destination student
                const destStudent = await Student.findOne({ student_id: destination.student_id });
                if (!destStudent) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { student_id: destination.student_id },
                        { error: 'Destination student not found' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Destination student with ID ${destination.student_id} not found`);
                }
                if (destStudent.full_name !== destination.student_name) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { student_id: destination.student_id, provided_name: destination.student_name, actual_name: destStudent.full_name },
                        { error: 'Invalid student name' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Invalid student name for destination student ID ${destination.student_id}`);
                }
                
                // Find the source tutor
                const sourceTutor = await TutorSchedule.findOne({ tutor_id: source.tutor_id });
                if (!sourceTutor) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id: source.tutor_id },
                        { error: 'Source tutor not found' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Source tutor not found with ID ${source.tutor_id}`);
                }

                // Find the destination tutor
                const destTutor = await TutorSchedule.findOne({ tutor_id: destination.tutor_id });
                if (!destTutor) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id: destination.tutor_id },
                        { error: 'Destination tutor not found' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Destination tutor not found with ID ${destination.tutor_id}`);
                }

                // Store old data for logging
                const oldSourceData = sourceTutor.toObject();
                const oldDestData = destTutor.toObject();

                // Check if the slot exists in source tutor's total_available_hours
                const sourceDaySchedule = sourceTutor.total_available_hours.find(d => d.day.toLowerCase() === source.day.toLowerCase());
                if (!sourceDaySchedule || !sourceDaySchedule.slots.includes(source.time)) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id: source.tutor_id, day: source.day, time: source.time },
                        { error: 'Slot not available in source tutor' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Time slot ${source.time} on ${source.day} is not available in source tutor's schedule`);
                }

                // Check if the slot exists in destination tutor's total_available_hours
                const destDaySchedule = destTutor.total_available_hours.find(d => d.day.toLowerCase() === destination.day.toLowerCase());
                if (!destDaySchedule || !destDaySchedule.slots.includes(destination.time)) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id: destination.tutor_id, day: destination.day, time: destination.time },
                        { error: 'Slot not available in destination tutor' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Time slot ${destination.time} on ${destination.day} is not available in destination tutor's schedule`);
                }

                // First verify source slot exists in source tutor's allotted hours
                const sourceSlotExists = await TutorSchedule.findOne({
                    tutor_id: source.tutor_id,
                    'allotted_hours': {
                        $elemMatch: {
                            day: source.day.toLowerCase(),
                            time: source.time,
                            student_id: source.student_id,
                            subject: source.subject
                        }
                    }
                });

                if (!sourceSlotExists) {
                    await entityLogger.logEntityUpdate('tutor_schedule',
                        { tutor_id: source.tutor_id, student_id: source.student_id, day: source.day, time: source.time },
                        { error: 'Source slot not found' },
                        this.fastify.user?.id || 'system',
                        this.fastify.request
                    );
                    throw new Error(`Source slot not found for student ${source.student_name} with tutor ${source.tutor_id}`);
                }

                // Remove source slot from source tutor's allotted hours
                await TutorSchedule.updateOne(
                    { tutor_id: source.tutor_id },
                    { 
                        $pull: { 
                            allotted_hours: { 
                                day: source.day.toLowerCase(),
                                time: source.time,
                                student_id: source.student_id,
                                subject: source.subject
                            } 
                        } 
                    }
                );

                // Create new allotted hour for the destination tutor
                const newAllottedHour = {
                    day: destination.day.toLowerCase(),
                    time: destination.time,
                    student_id: destination.student_id,
                    student_name: destination.student_name,
                    slot_id: `${destination.tutor_id}_${destination.day}_${destination.time}`.replace(/:/g, ''),
                    tutor_id: destination.tutor_id,
                    subject: destination.subject
                };

                // Add the new slot to destination tutor's allotted hours
                await TutorSchedule.updateOne(
                    { tutor_id: destination.tutor_id },
                    { $push: { allotted_hours: newAllottedHour } }
                );

                // Log the updates
                await entityLogger.logEntityUpdate('tutor_schedule',
                    oldSourceData,
                    await TutorSchedule.findOne({ tutor_id: source.tutor_id }),
                    this.fastify.user?.id || 'system',
                    this.fastify.request
                );

                await entityLogger.logEntityUpdate('tutor_schedule',
                    oldDestData,
                    await TutorSchedule.findOne({ tutor_id: destination.tutor_id }),
                    this.fastify.user?.id || 'system',
                    this.fastify.request
                );

                results.push({
                    source: {
                        student_id: source.student_id,
                        tutor_id: source.tutor_id,
                        time: source.time,
                        day: source.day,
                        student_name: source.student_name,
                        subject: source.subject
                    },
                    destination: {
                        student_id: destination.student_id,
                        tutor_id: destination.tutor_id,
                        time: destination.time,
                        day: destination.day,
                        student_name: destination.student_name,
                        subject: destination.subject
                    }
                });
            }

            // Non-blocking schedule file update
            this.updateScheduleFile();

            return {
                success: true,
                data: results
            };
        } catch (error) {
            this.fastify.log.error('Error swapping tutor:', error);
            throw error;
        }
    }

    async getTutorNameById(tutorId) {
        const tutor = await TutorSchedule.findOne({ tutor_id: Number(tutorId) }).select('tutor_id tutor_name subjects');
        if (!tutor) return null;
        return {
            tutor_id: tutor.tutor_id,
            tutor_name: tutor.tutor_name,
            tutor_subjects: tutor.subjects || []
        };
    }

    async deleteFeedback(feedback_id) {
        try {
            this.fastify.log.info(`Attempting to delete feedback with ID: ${feedback_id}`);
            
            // Extract tutor_id from feedback_id (format: tutorId_userId_timestamp)
            const tutor_id = parseInt(feedback_id.split('_')[0]);
            
            if (isNaN(tutor_id)) {
                throw new Error('Invalid feedback ID format');
            }

            // Find the tutor
            const tutor = await TutorSchedule.findOne({ tutor_id });
            
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            // Find the feedback index
            const feedbackIndex = tutor.feedback.findIndex(f => f.feedback_id === feedback_id);
            
            if (feedbackIndex === -1) {
                throw new Error('Feedback not found');
            }

            // Remove the feedback
            tutor.feedback.splice(feedbackIndex, 1);

            // Save the updated tutor document
            await tutor.save();

            // Log the deletion
            entityLogger.logEntityUpdate('feedback', { feedback_id }, tutor, 'system');

            this.fastify.log.info(`Successfully deleted feedback with ID: ${feedback_id}`);
            
            return { success: true, message: 'Feedback deleted successfully' };
        } catch (error) {
            this.fastify.log.error(`Error deleting feedback with ID ${feedback_id}:`, error);
            throw error;
        }
    }

    async searchTutorsByAvailability(searchData) {
        try {
            const { days, subject, match, total_no_of_slots } = searchData;
            
            // Validate match array has only one value
            if (!Array.isArray(match) || match.length !== 1 || !['strict', 'day-only'].includes(match[0])) {
                throw new Error('match array must contain exactly one value: either "strict" or "day-only"');
            }

            const matchType = match[0];
            
            const tutors = await TutorSchedule.find({
                subjects: { $regex: new RegExp(subject, 'i') }
            });

            const matchingTutors = [];

            for (const tutor of tutors) {
                const freeHours = [];
                let allDaysHaveMatchingSlots = true;
                let hasAtLeastOneSlotPerDay = true;
                let totalFreeSlots = 0;

                // Calculate total available slots and allotted slots
                const totalAvailableSlots = tutor.total_available_hours.reduce((total, day) => 
                    total + (day.slots ? day.slots.length : 0), 0);
                const allottedSlots = tutor.allotted_hours.length;
                
                // Calculate utilization rate
                const utilizationRate = totalAvailableSlots > 0 
                    ? (allottedSlots / totalAvailableSlots) * 100 
                    : 0;

                // Process each requested day
                for (const requestedDay of days) {
                    const dayFreeSlots = [];
                    
                    // Find the tutor's available hours for this day
                    const tutorDaySchedule = tutor.total_available_hours.find(
                        d => d?.day?.toLowerCase() === requestedDay.day.toLowerCase()
                    );
                    
                    if (tutorDaySchedule) {
                        // Get allotted hours for this day
                        const allottedHoursForDay = tutor.allotted_hours.filter(
                            h => h?.day?.toLowerCase() === requestedDay.day.toLowerCase()
                        ).map(h => h.time);
                        
                        // Find free slots that are both in available and not in allotted
                        const freeSlots = tutorDaySchedule.slots.filter(slot => 
                            !allottedHoursForDay.includes(slot) && 
                            requestedDay.slots.includes(slot)
                        );
                     
                        if (freeSlots.length > 0) {
                            dayFreeSlots.push(...freeSlots);
                            totalFreeSlots += freeSlots.length;
                        }
                    }
                    
                    if (dayFreeSlots.length > 0) {
                        freeHours.push({
                            day: requestedDay.day,
                            slots: dayFreeSlots
                        });
                    }

                    // For strict matching, check if all requested slots are available
                    if (matchType === 'strict') {
                        const allRequestedSlotsAvailable = requestedDay.slots.every(slot => 
                            dayFreeSlots.includes(slot)
                        );
                        if (!allRequestedSlotsAvailable) {
                            allDaysHaveMatchingSlots = false;
                            break;
                        }
                    }
                    // For day-only matching, check if at least one slot is available
                    else if (matchType === 'day-only') {
                        if (dayFreeSlots.length === 0) {
                            hasAtLeastOneSlotPerDay = false;
                        }
                    }
                }
                
                // Add tutor to results based on matching criteria
                if (freeHours.length > 0) {
                    if (matchType === 'strict' && allDaysHaveMatchingSlots) {
                        matchingTutors.push({      
                            tutor_id: tutor.tutor_id,
                            tutor_name: tutor.tutor_name,
                            free_hours: freeHours,
                            utilization_rate: utilizationRate.toFixed(2),
                            total_available_slots: totalAvailableSlots,
                            allotted_slots: allottedSlots,
                            status: tutor.status,
                            grades: tutor.grades || [],
                            specializations: tutor.specializations || []
                        });
                    } else if (matchType === 'day-only' && (hasAtLeastOneSlotPerDay || totalFreeSlots >= total_no_of_slots)) {
                        matchingTutors.push({
                            tutor_id: tutor.tutor_id,
                            tutor_name: tutor.tutor_name, 
                            free_hours: freeHours,
                            utilization_rate: utilizationRate.toFixed(2),
                            total_available_slots: totalAvailableSlots,
                            allotted_slots: allottedSlots,
                            status: tutor.status,
                            grades: tutor.grades || [],
                            specializations: tutor.specializations || []
                        });
                    }
                }
            }
            
            return {
                tutor_data: matchingTutors
            };
        } catch (error) {
            this.fastify.log.error('Error in searchTutorsByAvailability:', error);
            throw error;
        }
    }

    /**
     * Utility to get tutor names for a list of tutor IDs
     * @param {number[]} ids - Array of tutor IDs
     * @returns {Promise<Object>} - Map of tutor_id to tutor_name
     */
    async getTutorNamesByIds(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return {};
        const tutors = await TutorSchedule.find({ tutor_id: { $in: ids } }).select('tutor_id tutor_name');
        const map = {};
        for (const t of tutors) {
            map[t.tutor_id] = t.tutor_name;
        }
        return map;
    }
    async searchDemoTutorsByAvailability(searchData) {
        try {
            const { days, subject} = searchData;
            
            // Validate match array has only one value
            
            
            // Find tutors with the specified subject
            const tutors = await TutorSchedule.find({
                subjects: { $regex: new RegExp(subject, 'i')  },
                demo_eligibility: true
            });

            const matchingTutors = [];

            for (const tutor of tutors) {
                const freeHours = [];
                let allDaysHaveMatchingSlots = true;
                let hasAtLeastOneSlotPerDay = true;
                
                // Process each requested day
                for (const requestedDay of days) {
                    const dayFreeSlots = [];
                    
                    // Find the tutor's available hours for this day
                    const tutorDaySchedule = tutor.total_available_hours.find(
                        d => d?.day?.toLowerCase() === requestedDay.day.toLowerCase()
                    );
                    
                    if (tutorDaySchedule) {
                        // Get allotted hours for this day
                        const allottedHoursForDay = tutor.allotted_hours.filter(
                            h => h?.day?.toLowerCase() === requestedDay.day.toLowerCase()
                        ).map(h => h.time);
                        
                        // Find free slots that are both in available and not in allotted
                        const freeSlots = tutorDaySchedule.slots.filter(slot => 
                            !allottedHoursForDay.includes(slot) && 
                            requestedDay.slots.includes(slot)
                        );
                        
                        if (freeSlots.length > 0) {
                            dayFreeSlots.push(...freeSlots);
                        }
                    }
                    
                    if (dayFreeSlots.length > 0) {
                        freeHours.push({
                            day: requestedDay.day,
                            slots: dayFreeSlots
                        });
                    }

                   
                }
                
                // Add tutor to results based on matching criteria
                if (freeHours.length > 0) {
                    if ( allDaysHaveMatchingSlots) {
                        matchingTutors.push({
                            tutor_id: tutor.tutor_id,
                            tutor_name: tutor.tutor_name,
                            free_hours: freeHours
                        });
                    } else if ( hasAtLeastOneSlotPerDay) {
                        matchingTutors.push({
                            tutor_id: tutor.tutor_id,
                            tutor_name: tutor.tutor_name,
                            free_hours: freeHours
                        });
                    }
                }
            }
            
            return {
                
                tutor_data: matchingTutors,
                requested_data: searchData
            };
        } catch (error) {
            this.fastify.log.error('Error searching tutors by availability:', error);
            throw error;
        }




    }
    async getHourUtilization() {
        try {
            // Get all tutors
            const tutors = await TutorSchedule.find({});
            this.fastify.log.info(`Found ${tutors.length} tutors in database`);
            
            // Build utilization map using utility function
            const utilizationMap = buildHourUtilizationMap(tutors);
            
            // Format data using utility function
            const result = formatHourUtilizationData(utilizationMap);
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            this.fastify.log.error(`Error in getHourUtilization: ${error.message}`);
            
            // Convert to 400 error
            const customError = new Error(error.message);
            customError.statusCode = 400;
            throw customError;
        }
    }

    async getTutorAdditionalDetails(tutorId) {
        try {
            const tutor = await TutorSchedule.findOne({ tutor_id: Number(tutorId) });
            if (!tutor) {
                this.fastify && this.fastify.log && this.fastify.log.warn && this.fastify.log.warn(`Tutor not found for additional details with ID: ${tutorId}`);
                return { success: false, additional_details: null, error: 'Tutor not found' };
            }
            return { success: true, additional_details: tutor.additional_details || {} };
        } catch (error) {
            this.fastify && this.fastify.log && this.fastify.log.error && this.fastify.log.error('Error fetching tutor additional details:', error);
            return { success: false, additional_details: null, error: error.message };
        }
    }

    // Preview which students and slots will be affected if a tutor is deactivated
    async previewTutorDeleteEffect(tutorId) {
        // Find the tutor
        const tutor = await TutorSchedule.findOne({ tutor_id: Number(tutorId) });
        if (!tutor) throw new Error('Tutor not found');
        // Find all students who have this tutor in their allotted_hours
        const affectedStudentIds = tutor.allotted_hours.map(h => h.student_id).filter(Boolean);
        const students = await Student.find({ student_id: { $in: affectedStudentIds } }, { student_id: 1, full_name: 1, allotted_hours: 1 });
        return {
            tutor_id: tutor.tutor_id,
            tutor_name: tutor.tutor_name,
            allotted_hours: tutor.allotted_hours,
            affected_students: students.map(s => ({
                student_id: s.student_id,
                full_name: s.full_name,
                affected_slots: s.allotted_hours.filter(h => h.tutor_id == tutor.tutor_id)
            }))
        };
    }

    // Confirm deletion: set status to 'inactive' and remove all allotted_hours
    async confirmTutorDelete(tutorId) {
        // Set status to 'inactive' and remove all allotted_hours
        const tutor = await TutorSchedule.findOne({ tutor_id: Number(tutorId) });
        if (!tutor) throw new Error('Tutor not found');
        tutor.status = 'inactive';
        tutor.allotted_hours = [];
        await tutor.save();
        // Find all students who had this tutor in their allotted_hours
        const students = await Student.find({ 'allotted_hours.tutor_id': tutor.tutor_id });
        // Remove this tutor's slots from each student
        for (const student of students) {
            student.allotted_hours = student.allotted_hours.filter(h => h.tutor_id != tutor.tutor_id);
            await student.save();
        }
        return {
            tutor_id: tutor.tutor_id,
            tutor_name: tutor.tutor_name,
            status: tutor.status,
            allotted_hours: tutor.allotted_hours,
            affected_students: students.map(s => ({
                student_id: s.student_id,
                full_name: s.full_name
            }))
        };
    }

       //record attendance
       async createTutorAttendance(inputData) {
        try {
            // Validate location data if provided
            if (inputData.location?.coordinates) {
                const [longitude, latitude] = inputData.location.coordinates;
                if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
                    throw new Error('Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90');
                }
            }

            const locationData = inputData.location ? {
                type: 'Point',
                coordinates: inputData.location.coordinates,
                address: inputData.location.address || ''
            } : null;

            const deviceInfo = inputData.device_info ? {
                deviceId: inputData.device_info.device_id
            } : null;

            const timestamp = new Date();

            if (inputData.attendance_type === 'checkout_Attributes') {
                const existingAttendance = await TutorAttendance.findOne({
                    tutor_id: inputData.tutor_id,
                    session_id: inputData.session_id,
                    'checkin_Attributes.timestamp': { $exists: true }
                });

                if (!existingAttendance) {
                    throw new Error('No check-in record found for this session');
                }

                // Update the existing record with checkout data
                existingAttendance.type = 'checkout_Attributes';
                existingAttendance.checkout_Attributes = {
                    timestamp,
                    location: locationData,
                    batteryLevel: inputData.battery_level,
                    deviceInfo
                };

                return await existingAttendance.save();
            }

            const newAttendance = new TutorAttendance({
                tutor_id: inputData.tutor_id,
                session_id: inputData.session_id,
                type: 'checkin_Attributes',
                checkin_Attributes: {
                    timestamp,
                    location: locationData,
                    batteryLevel: inputData.battery_level,
                    deviceInfo
                },
                checkout_Attributes: {
                    location: {
                        type: 'Point',
                        coordinates: [0, 0],  // Initialize with default coordinates
                        address: ''
                    }
                }
            });

            return await newAttendance.save();
        } catch (error) {
            throw new Error(`Error creating attendance: ${error.message}`);
        }
    }

    //calculate attendance duration
    async calculateAttendanceDuration(tutorId, sessionId) {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        // Find all attendance records for the session
        const attendances = await TutorAttendance.find({
            tutor_id: tutorId,
            session_id: sessionId
        }).sort({ 'checkin_Attributes.timestamp': 1 });

        console.log('Found attendances for session:', JSON.stringify(attendances, null, 2));

        if (!attendances || attendances.length === 0) {
            return {
                duration: 0,
                firstCheckin: null,
                lastCheckout: null,
                totalDuration: 0,
                totalCheckinDuration: 0
            };
        }

        let totalCheckinDuration = 0;
        let currentCheckin = null;
        let lastCheckout = null;
        let firstCheckin = null;

        // Process each attendance record
        for (const attendance of attendances) {
            console.log('Processing attendance:', {
                type: attendance.type,
                checkinTime: attendance.checkin_Attributes?.timestamp,
                checkoutTime: attendance.checkout_Attributes?.timestamp
            });

            // Track first check-in
            if (!firstCheckin && attendance.checkin_Attributes?.timestamp) {
                firstCheckin = attendance.checkin_Attributes;
            }
            console.log("firstCheckin",firstCheckin);
            // Update lastCheckout if this record has checkout data
            if (attendance.checkout_Attributes?.timestamp) {
                lastCheckout = attendance.checkout_Attributes;
            }

            // Calculate check-in duration
            if (attendance.type === 'checkin_Attributes' && attendance.checkin_Attributes?.timestamp) {
                // If there's a previous check-in, calculate its duration
                if (currentCheckin) {
                    const duration = Math.round((attendance.checkin_Attributes.timestamp - currentCheckin) / (1000 * 60));
                    totalCheckinDuration += duration;
                }
                currentCheckin = attendance.checkin_Attributes.timestamp;
            } else if (attendance.type === 'checkout_Attributes' && currentCheckin) {
                // Calculate duration only when user checks out
                const checkoutTime = attendance.checkout_Attributes.timestamp;
                const duration = Math.round((checkoutTime - currentCheckin) / (1000 * 60));
                totalCheckinDuration += duration;
                currentCheckin = null; // Reset check-in time after checkout
            }
            console.log("totalCheckinDuration",totalCheckinDuration);
        }

        // If there's an ongoing session (checked in but not checked out)
        if (currentCheckin) {
            const currentDuration = Math.round((new Date() - currentCheckin) / (1000 * 60));
            totalCheckinDuration += currentDuration;
        }

        console.log('Final calculations:', {
            totalCheckinDuration,
            firstCheckin: firstCheckin?.timestamp,
            lastCheckout: lastCheckout?.timestamp
        });

        return {
            duration: totalCheckinDuration,
            checkin: firstCheckin,
            checkout: lastCheckout,
        };
    }

}

// Utility function to build hour utilization map
function buildHourUtilizationMap(tutors) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const utilizationMap = {};
    
    // Initialize map for all days
    days.forEach(day => {
        utilizationMap[day] = {};
        // Initialize slots for each day (9 AM to 9 PM)
        for (let hour = 9; hour <= 21; hour++) {
            const timeSlot = `${hour}:00`;
            utilizationMap[day][timeSlot] = {
                total_hours: 0,
                allotted_hours: 0
            };
        }
    });

    // Process each tutor's schedule
    tutors.forEach(tutor => {
        if (tutor.availability && Array.isArray(tutor.availability)) {
            tutor.availability.forEach(slot => {
                const startTime = new Date(slot.start_time);
                const endTime = new Date(slot.end_time);
                const day = days[startTime.getDay()];
                const startHour = startTime.getHours();
                const endHour = endTime.getHours();

                for (let hour = startHour; hour <= endHour; hour++) {
                    if (hour >= 9 && hour <= 21) {
                        const timeSlot = `${hour}:00`;
                        if (utilizationMap[day] && utilizationMap[day][timeSlot]) {
                            utilizationMap[day][timeSlot].total_hours++;
                            if (slot.status === 'booked') {
                                utilizationMap[day][timeSlot].allotted_hours++;
                            }
                        }
                    }
                }
            });
        }
    });

    return utilizationMap;
}

// Utility function to format hour utilization data
function formatHourUtilizationData(utilizationMap) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map(day => ({
        day,
        slots: Object.entries(utilizationMap[day]).map(([time, data]) => ({
            time,
            total_hours: data.total_hours,
            allotted_hours: data.allotted_hours,
            utilization_rate: data.total_hours > 0 
                ? Math.round((data.allotted_hours / data.total_hours) * 100) 
                : 0
        }))
    }));
}

export default TutorService;



