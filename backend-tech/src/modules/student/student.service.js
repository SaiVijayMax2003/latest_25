import Student from './student.schema.js';
import entityLogger from '../../utils/entityLogger.js';
import { logger } from '../../utils/logger.js';
import { getUserDetailsFromJWT } from '../../utils/getUserDetails.js';
import { createOrder } from '../order/order.service.js';
import { smsService } from '../sms-template/sms.service.js';
import { emailService } from '../email-template/email.service.js';

// Validate phone number format
function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }
  
  // Check if phone number starts with +91 and has exactly 10 digits after that
  const phoneRegex = /^\+91\d{10}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new Error('Phone number must start with +91 followed by exactly 10 digits');
  }
}

// Check if phone number already exists
async function checkDuplicatePhoneNumber(phoneNumber) {
  const existingStudent = await Student.findOne({ phone_number: phoneNumber });
  if (existingStudent) {
    throw new Error('A student with this phone number already exists');
  }
}

// Check if email already exists
async function checkDuplicateEmail(email) {
  if (!email) return; // Email is optional
  const existingStudent = await Student.findOne({ email: email.toLowerCase() });
  if (existingStudent) {
    throw new Error('A student with this email already exists');
  }
}

// Validate time slot format
function validateTimeSlot(timeSlot) {
  if (!timeSlot) {
    throw new Error('Time slot is required');
  }

  // Time slot should be in format: HH:MMAM or HH:MMPM (uppercase only)
  const timeRegex = /^([1-9]|1[0-2]):[0-5][0-9](AM|PM)$/;
  if (!timeRegex.test(timeSlot)) {
    throw new Error('Time slot must be in format: HH:MMAM or HH:MMPM (e.g., 7:00AM, 6:30PM)');
  }
}

// Validate course dates
function validateCourseDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format for course dates');
  }
  
  if (end < start) {
    throw new Error('Course end date cannot be before course start date');
  }
  
}

// Validate student grade and specializations
function validateGradeAndSpecializations(grade, specializations) {
  if (!grade && (!specializations || specializations.length === 0)) {
    throw new Error('Either student grade or at least one specialization must be provided');
  }
}

// Get student by student_id
export async function getStudentById(student_id) {
  return Student.findOne({ student_id: Number(student_id) });
}


// Create a new student
export async function createStudent(studentData, request) {
  try {
    // Handle remarks if provided
    if (studentData.remarks) {
      try {
        // Convert remarks to array if it's a string
        const remarksArray = Array.isArray(studentData.remarks) ? studentData.remarks : [studentData.remarks];
        
        // Create feedback entries from remarks
        studentData.feedback = remarksArray.map(remark => ({
          feedback_id: `remark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: request.user?.user_id || null,
          type: 'student',
          text: typeof remark === 'string' ? remark : JSON.stringify(remark),
          created_at: new Date()
        }));
      } catch (error) {
        // Log error but continue with student creation
        console.error('Error processing remarks:', error);
        // Clear remarks if there was an error
        delete studentData.remarks;
      }
    }

    // Generate student_id
    const student_id = await Student.getNextStudentId();
    if (!student_id || isNaN(parseInt(student_id))) {
      throw new Error('Failed to generate student ID');
    }

    // Create student with generated ID
    const student = new Student({
      ...studentData,
      student_id,
      created_at: new Date()
    });

    // Save student and verify student_id was set
    await student.save();
    if (!student.student_id) {
      throw new Error('Failed to set student ID');
    }

    // Try to add created_by as the last step
    let created_by = null;
    try {
      created_by = await getUserDetailsFromJWT(request);
      if (created_by) {
        student.created_by = created_by;
        await student.save();
      }
    } catch (error) {
      // Log the error but don't fail the request
      console.error('Error adding created_by:', error);
    }

     //Create an order for the new student, passing created_by and request
    const order = await createOrder({ student_id: student.student_id, created_by }, request);
    
    // Save the order_id to the student's orders array
    student.orders.push(order.order_id);
    await student.save();

    // Send welcome SMS and email if payment_status is "verified"
    if (student.payment_status === "verified") {
      // Send welcome SMS to student
      try {
        await smsService.sendSms("WELCOME", {
          phone: student.phone_number,
          student_name: student.full_name
        });
        logger.info('Welcome SMS sent successfully', { 
          student_id: student.student_id, 
          phone: student.phone_number,
          requestId: request.id 
        });
      } catch (smsError) {
        // Log SMS error but don't fail the student creation
        logger.error('Failed to send welcome SMS', { 
          student_id: student.student_id, 
          phone: student.phone_number,
          error: smsError.message,
          requestId: request.id 
        });
      }

      // Send welcome SMS to parent phone numbers
      if (student.parent_phone_number && student.parent_phone_number.length > 0) {
        for (const parentPhone of student.parent_phone_number) {
          if (parentPhone.phone_number) {
            try {
              await smsService.sendSms("WELCOME", {
                phone: parentPhone.phone_number,
                student_name: student.full_name
              });
              logger.info('Welcome SMS sent successfully to parent', { 
                student_id: student.student_id, 
                parent_phone: parentPhone.phone_number,
                relation: parentPhone.relation,
                requestId: request.id 
              });
            } catch (parentSmsError) {
              // Log SMS error but don't fail the student creation
              logger.error('Failed to send welcome SMS to parent', { 
                student_id: student.student_id, 
                parent_phone: parentPhone.phone_number,
                relation: parentPhone.relation,
                error: parentSmsError.message,
                requestId: request.id 
              });
            }
          }
        }
      } else {
        logger.warn('No parent phone numbers found for SMS', { 
          student_id: student.student_id,
          requestId: request.id 
        });
      }

      // Send welcome email
      if (student.email) {
        try {
          await emailService.sendEmail("WELCOME", {
            student_name: student.full_name,
            email: student.email
          });
          logger.info('Welcome email sent successfully', { 
            student_id: student.student_id, 
            email: student.email,
            requestId: request.id 
          });
        } catch (emailError) {
          // Log email error but don't fail the student creation
          logger.error('Failed to send welcome email', { 
            student_id: student.student_id, 
            email: student.email,
            error: emailError.message,
            requestId: request.id 
          });
        }
      } else {
        logger.warn('No email address found for student, skipping welcome email', { 
          student_id: student.student_id,
          requestId: request.id 
        });
      }
    }
    
    return {
      success: true,
      message: 'Student created successfully',
      data: {
        student_id: student.student_id,
        order_id: order.order_id,
        name: student.full_name,
        created_by: student.created_by
      }
    };
  } catch (error) {
    throw error;
  }
}

export async function getAllStudents(request) {
  try {
    const sortBy = request.query.sortBy || 'date_added_newest';
    const subject = request.query.subject || null;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 50;
    const status = request.query.status || null;
    const payment_status = request.query.payment_status || null;
    
    let filter = {};
    let sortOption = {};
    
    // Filter by subject if provided
    if (subject) {
      filter.subject = subject;
    }
    
    // Filter by status if provided
    if (status) {
      filter.student_status = status;
    }
    
    // Filter by payment_status if provided
    if (payment_status) {
      filter.payment_status = payment_status;
    }
    
    // Sorting logic
    switch (sortBy) {
      case 'name_asc': sortOption = { full_name: 1 }; break;
      case 'name_desc': sortOption = { full_name: -1 }; break;
      case 'date_added_newest': sortOption = { createdAt: -1 }; break;
      case 'date_added_oldest': sortOption = { createdAt: 1 }; break;
      case 'last_modified_newest': sortOption = { updatedAt: -1 }; break;
      case 'last_modified_oldest': sortOption = { updatedAt: 1 }; break;
      default: sortOption = { createdAt: -1 };
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    const total = await Student.countDocuments(filter);
    
    const students = await Student.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    return {
      success: true,
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    return {
      success: false,
      error: error.message,
      status: error.status || 500
    };
  }
}


export async function searchStudents(request) {
  try {
    
    const search = request.query.search?.trim() || '';
    const suggestionsOnly = request.query.suggestionsOnly === 'true';
      
    
    let filter = {};
    
    
    // Filter by subject if provided
    
    // Validate search is provided
    if (!search) {
      return {
        success: false,
        error: 'Search term is required'
      };
    }
    
    const regexes = [
      { full_name: { $regex: `^${search}$`, $options: 'i' } },      // exact match
      { full_name: { $regex: `^${search}`, $options: 'i' } },       // starts with
      { full_name: { $regex: `${search}$`, $options: 'i' } },       // ends with
      { full_name: { $regex: search, $options: 'i' } },             // contains anywhere
      { full_name: { $regex: `(^|\\s)${search}`, $options: 'i' } }  // word boundary (your original)
    ];

    filter = { $or: regexes };
    
    
    // Suggestion-only flow
    if (suggestionsOnly) {
      const suggestions = await Student.find(filter)
        .limit(10)
        .select('_id full_name');
        
      const totalMatches = await Student.countDocuments(filter);
      
      if (suggestions.length > 0) {
        return {
          success: true,
          suggestions,
          totalMatches
        };
      } else {
        // Fallback to fuzzy character match
        const fallbackFilter = {
          full_name: {
            $regex: search.split('').join('.*'),
            $options: 'i'
          }
        };
        
        const fallbackSuggestions = await Student.find(fallbackFilter)
          .limit(10)
          .select('_id full_name');
          
        return {
          success: true,
          suggestions: fallbackSuggestions,
          totalMatches: fallbackSuggestions.length
        };
      }
    }
    
    // Pagination for full search results
    const skip = (page - 1) * limit;
    const total = await Student.countDocuments(filter);
    
    const students = await Student.find(filter)
      .skip(skip);
    
    // Fallback fuzzy match if no results
    if (students.length === 0) {
      const fallbackFilter = {
        full_name: {
          $regex: search.split('').join('.*'),
          $options: 'i'
        }
      };
      
      const fallbackStudents = await Student.find(fallbackFilter)
        .skip(skip);
        
      const fallbackTotal = await Student.countDocuments(fallbackFilter);
      
      return {
        success: true,
        students: fallbackStudents,
        total: fallbackTotal
      };
    }
    
    return {
      success: true,
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    console.error('Error in searchStudents:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getAllStudentsBySearch(request) {
  
  try {
    const search = request.query.search || null;
    let filter = {};
    if (search) {
        filter.full_name = { $regex: `(^|\\s)${search}`, $options: 'i' };
       
    
    // Always return only tutor_id and tutor_name
    const students = await Student.find(filter).select('student_id full_name');
    // Map to array of objects with only tutor_id and tutor_name
    const result = students.map(s => ({ student_id: s.student_id, full_name: s.full_name }));
    return result;
    }
} catch (error) {
    this.fastify.log.error('Error in getting students:', error);
    return {
        success: false,
        error: error.message
    };
}
}
      
    


export async function getStudentAllottedHours(request) {
  try {
    const { student_id } = request.params;
    
    // Find the student
    const student = await Student.findOne({ student_id: Number(student_id) });
    if (!student) {
      return null;
    }

    // Return the allotted hours
    return {
      success: true,
      allotted_hours: student.allotted_hours || []
    };
  } catch (error) {
    console.error('Error in getStudentAllottedHours:', error);
    return null;
  }
}



// Update a student
export async function updateStudent(student_id, updateData, userId) {
  try {
    // Get the current student data
    const currentStudent = await getStudentById(student_id);
    if (!currentStudent) {
      throw new Error('Student not found');
    }

    // Update the student
    const updatedStudent = await Student.findOneAndUpdate(
      { student_id: Number(student_id) },
      { $set: updateData },
      { new: true }
    );

    // Log the update - convert to plain objects to avoid circular references
    entityLogger.logEntityUpdate('student', 
      currentStudent.toObject ? currentStudent.toObject() : currentStudent, 
      updatedStudent.toObject ? updatedStudent.toObject() : updatedStudent, 
      userId
    );

    return {
      success: true,
      data: updatedStudent
    };
  } catch (error) {
    throw error;
  }
}

// Delete a student by student_id
export async function deleteStudent(student_id) {
  return Student.deleteOne({ student_id: Number(student_id) });
}

export async function getStudentStatus(student_id) {
  try {
    const student = await Student.findOne(
      { student_id },
      { student_status: 1, verification_status: 1, _id: 0 }
    ).lean();

    return student;
  } catch (error) {
    throw error;
  }
}

export async function getStudentPayment(student_id) {
  try {
    const student = await Student.findOne(
      { student_id },
      { total_amount: 1, amount_pending: 1, amount_paid: 1, student_grade: 1, payment_transaction_id: 1, payment_type: 1, payment_slip_url: 1, enrollment_form_url: 1, _id: 0 }
    ).lean();

    return student;
  } catch (error) {
    throw error;
  }
}

export async function updateStudentPayment(student_id, paymentData) {
  try {
    const result = await Student.updateOne(
      { student_id },
      {
        $set: {
          total_amount: paymentData.total_amount,
          amount_paid: paymentData.amount_paid,
          amount_pending: paymentData.amount_pending,
        },
      }
    );

    return result.matchedCount > 0; // true if student existed and update attempted
  } catch (error) {
    throw error;
  }
}

export async function updateStudentStatus(student_id, statusData) {
  try {
    const result = await Student.updateOne(
      { student_id },
      {
        $set: {
          student_status: statusData.student_status,
          verification_status: statusData.verification_status,
          payment_status: statusData.payment_status
        },
      }
    );

    // If payment_status is being updated to "verified", also update the corresponding order
    if (statusData.payment_status === 'verified') {
      try {
        const Order = (await import('../order/order.schema.js')).default;
        await Order.updateOne(
          { student_id: Number(student_id) },
          {
            $set: {
              payment_status: 'verified',
              onboarding_status: 'Needs Schedule',
              modified_at: new Date()
            }
          }
        );
      } catch (orderUpdateError) {
        // Log the error but don't fail the student update
        console.error('Failed to update order payment status:', orderUpdateError);
      }
    }

    return result.matchedCount > 0;
  } catch (error) {
    throw error;
  }
}

export async function updateStudentFields(student_id, updateData, userId) {
  try {
    // Get the current student data
    const currentStudent = await getStudentById(student_id);
    if (!currentStudent) {
      throw new Error('Student not found');
    }

    // Check for restricted fields
    const restrictedFields = ['total_amount', 'amount_paid', 'amount_pending', 'student_status', 'verification_status'];
    const restrictedFieldsFound = Object.keys(updateData).filter(field => restrictedFields.includes(field));
    
    if (restrictedFieldsFound.length > 0) {
      throw new Error(`Fields [${restrictedFieldsFound.join(', ')}] do not have update permission. Please use their specific update endpoints.`);
    }

    // Validate phone number if it's being updated
    if (updateData.phone_number) {
      validatePhoneNumber(updateData.phone_number);
    }

    // Create an update object with only the fields that are provided
    const updateObject = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        // For allotted_hours, ensure day is lowercase
        if (key === 'allotted_hours' && Array.isArray(value)) {
          updateObject[key] = value.map(hour => ({
            ...hour,
            day: hour.day.toLowerCase()
          }));
        } else {
          updateObject[key] = value;
        }
      }
    }

    // Update the student with only the provided fields
    const updatedStudent = await Student.findOneAndUpdate(
      { student_id: Number(student_id) },
      { $set: updateObject },
      { new: true }
    );

    // Log the update with detailed change tracking
    const changes = {};
    for (const [key, newValue] of Object.entries(updateObject)) {
      if (currentStudent[key] !== newValue) {
        changes[key] = {
          oldValue: currentStudent[key],
          newValue: newValue
        };
      }
    }

    // Add to updatedAt array
    const updateLog = {
      date: new Date(),
      action: 'field_update',
      changes: changes,
      updatedBy: userId
    };

    await Student.findOneAndUpdate(
      { student_id: Number(student_id) },
      { $push: { updatedAt: updateLog } }
    );

    return {
      success: true,
      data: updatedStudent
    };
  } catch (error) {
    throw error;
  }
}

export async function getStudentSchedule(student_id) {
  try {
    // Import TutorSchedule model with correct named import
    const { TutorSchedule } = await import('../tutor/tutor.schema.js');

    // First get the student details
    const student = await Student.findOne({ student_id: Number(student_id) });
    
    if (!student) {
      throw new Error('Student not found');
    }

    // Find all tutors who have this student in their allotted_hours
    const tutors = await TutorSchedule.find({
      'allotted_hours.student_id': student_id
    });

    // Extract and format the schedule
    const schedule = tutors.flatMap(tutor => {
      return tutor.allotted_hours
        .filter(hour => hour.student_id == student_id) // Use == for type coercion since student_id can be string or number
        .map(hour => ({
          day: hour.day,
          time: hour.time,
          tutor_id: tutor.tutor_id,
          tutor_name: tutor.tutor_name,
          subject: hour.subject // Get the specific subject from allotted_hours
        }));
    });

    // Convert student document to plain object and include all fields
    const studentData = student.toObject();

    return {
      success: true,
      data: {
        ...studentData,
        schedule: schedule
      }
    };
  } catch (error) {
    throw error;
  }
}

export async function getStudentNameById(student_id) {
  try {
    const student = await Student.findOne(
      { student_id: Number(student_id) },
      { full_name: 1, _id: 0 }
    ).lean();

    if (!student) {
      return null;
    }

    return {
      success: true,
      data: {
        full_name: student.full_name
      }
    };
  } catch (error) {
    console.error('Error in getStudentNameById:', error);
    throw error;
  }
}

export async function createFeedback(data) {
  const { student_id, user_id, type, text, created_at } = data;

  try {
      logger.info(`Creating feedback for student ID: ${student_id}`);

      // Find the student by ID
      const student = await Student.findOne({ student_id });

      if (!student) {
          logger.warn(`Student not found for feedback with ID: ${student_id}`);
          throw new Error('Student not found');
      }

      // Generate unique feedback ID
      const feedback_id = `${student_id}_${user_id || student_id}_${Date.now()}`;

      // Create feedback object
      const newFeedback = {
          feedback_id,
          type: type?.toLowerCase(),
          text: text?.toLowerCase(),
          created_at: created_at ? new Date(created_at) : new Date()
      };

      // Add optional user or student ID
      if (student_id) newFeedback.student_id = student_id;
      if (user_id) newFeedback.user_id = user_id;

      // Append feedback to student
      student.feedback = [...(student.feedback || []), newFeedback];

      // Save updated student document
      await student.save();

      // Log the feedback creation - convert to plain objects to avoid circular references
      entityLogger.logEntityUpdate('feedback', 
        newFeedback, 
        student.toObject ? student.toObject() : student, 
        'system'
      );

      logger.info(`Feedback added to student ID: ${student_id}`);

      return { success: true, feedback_id };
  } catch (error) {
      logger.error(`Error creating feedback for student ID ${student_id}:`, error);
      throw error;
  }
}

export async function createStudentAvailability(student_id, total_available_hours) {
  try {
    const student = await Student.findOne({ student_id: student_id });
    if (!student) {
        throw new Error('Student not found');
    }

    // Validate the data structure
    if (!total_available_hours.type_of_req || !total_available_hours.day || !total_available_hours.slot) {
        throw new Error('Invalid data format. type_of_req, day, and slot are required');
    }

    const { type_of_req, day, slot } = total_available_hours;
    const dayLower = day.toLowerCase();

    // Find the day in total_available_hours
    let daySchedule = student.total_available_hours.find(d => d.day.toLowerCase() === dayLower);

    if (type_of_req === 'add') {
        if (!daySchedule) {
            // If day doesn't exist, create new day schedule
            student.total_available_hours.push({
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
            throw new Error(`No schedule found for ${day}`);
        }
        // Remove the slot
        daySchedule.slots = daySchedule.slots.filter(s => s !== slot);
        
        // If no slots left for this day, remove the day entry
        if (daySchedule.slots.length === 0) {
            student.total_available_hours = student.total_available_hours.filter(
                d => d.day.toLowerCase() !== dayLower
            );
        }
    } else {
        throw new Error('Invalid type_of_req. Must be either "add" or "delete"');
    }

    // Calculate total slots
    const totalSlots = student.total_available_hours.reduce((total, day) => {
        return total + (day.slots ? day.slots.length : 0);
    }, 0);
    student.total_slots = totalSlots;

    await student.save();

    // Non-blocking schedule file update
    

    return { 
        success: true, 
        data: {
            student_id: student.student_id,
            total_available_hours: student.total_available_hours
        }
    };
} catch (error) {
    logger.error('Error updating student availability:', error);
    throw error;
}
}   

/**
 * Delete a student schedule from a tutor's allotted_hours
 * @param {Object} params - { student_id, tutor_id, subject, time_slots, delete_token, user_role }
 * @returns {Promise<{success: boolean, deletedCount: number}>}
 */
export async function deleteStudentSchedule({ student_id, tutor_id, subject, time_slots, delete_token, user_role }) {
  // If user is not admin, validate delete_token
  if (user_role !== 'admin') {
    const BACKEND_DELETE_TOKEN = process.env.DELETE_SCHEDULE_TOKEN;
    if (!delete_token || delete_token !== BACKEND_DELETE_TOKEN) {
      throw new Error('Invalid delete token');
    }
  }

  // Find the tutor
  const tutor = await TutorSchedule.findOne({ tutor_id });
  if (!tutor) throw new Error('Tutor not found');
  if (!Array.isArray(tutor.allotted_hours)) tutor.allotted_hours = [];
  const beforeCount = tutor.allotted_hours.length;
  
  // Remove allotted_hours matching student_id, subject, and time_slots
  tutor.allotted_hours = tutor.allotted_hours.filter(hour => {
    return !(
      hour.student_id == student_id &&
      hour.subject === subject &&
      time_slots.includes(hour.time)
    );
  });
  
  const deletedCount = beforeCount - tutor.allotted_hours.length;
  await tutor.save();
  return { 
    success: true, 
    message: `Successfully deleted ${deletedCount} schedule slot(s)`,
    deletedCount 
  };
}   

export async function changeFreeSlotsService(studentId, data) {
    try {
        const student = await Student.findOne({ student_id: studentId });
        if (!student) {
            await entityLogger.logEntityUpdate('student_schedule',
                { student_id: studentId },
                { error: 'Student not found' },
                this.fastify.user?.id || 'system',
                this.fastify.request
            );
            throw new Error('Student not found');
        }

        // Store old data for logging
        const oldData = student.toObject();

        // Validate the data structure
        if (!data.type_of_req || !data.day || !data.slot) {
            await entityLogger.logEntityUpdate('student_schedule',
                { student_id: studentId, data },
                { error: 'Invalid data format' },
                this.fastify.user?.id || 'system',
                this.fastify.request
            );
            throw new Error('Invalid data format. type_of_req, day, and slot are required');
        }

        const { type_of_req, day, slot } = data;
        const dayLower = day.toLowerCase();
        // Find the day in total_available_hours
        let daySchedule = student.total_available_hours.find(d => d.day.toLowerCase() === dayLower);
        if (type_of_req === 'add') {
            if (!daySchedule) {
                // If day doesn't exist, create new day schedule
                student.total_available_hours.push({
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
                await entityLogger.logEntityUpdate('student_schedule',
                    { student_id: studentId, day },
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
                student.total_available_hours = student.total_available_hours.filter(
                    d => d.day.toLowerCase() !== dayLower
                );
            }
        } else {
            await entityLogger.logEntityUpdate('student_schedule',
                { student_id: studentId, type_of_req },
                { error: 'Invalid type_of_req' },
                this.fastify.user?.id || 'system',
                this.fastify.request
            );
            throw new Error('Invalid type_of_req. Must be either "add" or "delete"');
        }

        // Calculate total slots
        const totalSlots = student.total_available_hours.reduce((total, day) => {
            return total + (day.slots ? day.slots.length : 0);
        }, 0);
        student.total_slots = totalSlots;

        await student.save();

        // Log the update
        await entityLogger.logEntityUpdate('student_schedule',
            oldData,
            student.toObject(),
            this.fastify.user?.id || 'system',
            this.fastify.request
        );

        return { 
            success: true, 
            data: {
                student_id: student.student_id,
                total_available_hours: student.total_available_hours
            }
        };
    } catch (error) {
        this.fastify.log.error('Error updating student availability:', error);
        throw error;
    }
}   

export async function previewStudentDeleteEffect(student_id) {

 try{
  const tutors = await TutorSchedule.find({
    'allotted_hours.student_id': Number(student_id)
  });
  // For each tutor, filter only the affected allotted_hours
  const affected = tutors.map(tutor => ({
    tutor_id: tutor.tutor_id,
    tutor_name: tutor.tutor_name,
    affected_hours: tutor.allotted_hours.filter(h => h.student_id == student_id)
  }));
  return affected;
 }catch(error){
  throw error;
 }
}

// Confirm deletion: set student_status to 'inactive' and remove from all tutor schedules
export async function confirmStudentDelete(student_id) {

  try{
  await Student.updateOne(
    { student_id: Number(student_id) },
    { $set: { student_status: 'inactive' } }
  );
  
  const tutors = await TutorSchedule.find({ 'allotted_hours.student_id': Number(student_id) });
  for (const tutor of tutors) {
    tutor.allotted_hours = tutor.allotted_hours.filter(h => h.student_id != student_id);
    await tutor.save();
  }
  // Return updated affected tutors
  const updated = tutors.map(tutor => ({
    tutor_id: tutor.tutor_id,
    tutor_name: tutor.tutor_name,
    allotted_hours: tutor.allotted_hours
  }));
  return updated;
 }catch(error){
  throw error;
 }
}   