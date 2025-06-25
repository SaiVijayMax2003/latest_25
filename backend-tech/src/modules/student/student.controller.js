import { getStudentById, createStudent, deleteStudent,getAllStudents, updateStudent, getStudentStatus, getStudentPayment, updateStudentPayment, updateStudentStatus,searchStudents,getStudentAllottedHours, getStudentSchedule, getAllStudentsBySearch, getStudentNameById, createFeedback, createStudentAvailability, deleteStudentSchedule } from './student.service.js';
import entityLogger from '../../utils/entityLogger.js';
import Student from './student.schema.js';
import { logger } from '../../utils/logger.js';

// GET /student/:student_id
export async function getStudentHandler(request, reply) {
    try {
        const { student_id } = request.params;
        if (!student_id) {
            logger.warn('Student ID not provided in request', { requestId: request.id });
            return reply.code(400).send({ message: 'student id not found' });
        }

        const student = await getStudentById(student_id);
        if (!student) {
            logger.warn('Student not found', { student_id, requestId: request.id });
            return reply.code(400).send({ message: 'student id not found' });
        }

        // Ensure 'subjects' is always an array of objects with both 'subject' and 'classes'
        let studentObj = student.toObject ? student.toObject() : student;
        if (!Array.isArray(studentObj.subjects)) {
            studentObj.subjects = [];
        } else {
            studentObj.subjects = studentObj.subjects.filter(
                s => s && typeof s.subject === 'string' && typeof s.classes === 'number'
            );
        }

        logger.info('Student retrieved successfully', { student_id, requestId: request.id });
        return reply.send(studentObj);
    } catch (error) {
        logger.error('Error in getStudentHandler', { error, requestId: request.id });
        return reply.code(500).send({ message: 'Internal server error' });
    }
}

export async function searchStudentsHandler(request,reply){
  if (!request.query.search?.trim()) {
    return reply.code(400).send({
      success: false,
      error: 'Search term is required'
    });
  }
  
  const result = await searchStudents(request);
  if (!result.success) {
    return reply.code(500).send(result);
  }
  return reply.send(result);
}

export async function getAllStudentsHandler(request, reply) {
    try {
        logger.info('Retrieving all students', { requestId: request.id });
        const students = await getAllStudents(request);
        
        if (!students || students.length === 0) {
            logger.info('No students found', { requestId: request.id });
            return reply.code(404).send({ message: "No students found" });
        }
        
        logger.info('Students retrieved successfully', { count: students.length, requestId: request.id });
        return reply.code(200).send(students);
    } catch (error) {
        logger.error('Error in getAllStudentsHandler', { error, requestId: request.id });
        return reply.code(500).send({ success: false, error: error.message });
    }
}

export async function getStudentAllottedHoursHandler(request,reply){
  
  const student = await getStudentAllottedHours(request); // ✅ direct call
  if (!student) {
    return reply.code(400).send({ message: 'Student not found' });
  }
  return reply.send(student);

}

// POST /student
export async function createStudentHandler(request, reply) {
  try {
      const data = request.body;
      logger.info('Creating new student', { requestId: request.id });
      
      const result = await createStudent(data, request);
      
      if (result.success) {
          entityLogger.logEntityCreation('student', data, request.user?.id || 'system', request);
          logger.info('Student created successfully', { student_id: result.data.student_id, requestId: request.id });
      }
      
      return reply.code(201).send(result);
  } catch (error) {
      logger.error('Error in createStudentHandler', { error, requestId: request.id });
      return reply.code(400).send({ 
          success: false, 
          error: error.message 
      });
  }
}
// PUT /student/:student_id
export async function updateStudentHandler(request, reply) {
    try {
        const { student_id } = request.params;
        const updateData = request.body;

        // Check if any restricted fields are being updated
        const restrictedFields = ['total_amount', 'amount_paid', 'amount_pending', 'student_status', 'verification_status'];
        const hasRestrictedFields = restrictedFields.some(field => updateData.hasOwnProperty(field));
        
        if (hasRestrictedFields) {
            await entityLogger.logEntityUpdate('student', 
                { restricted_fields_attempt: restrictedFields.filter(f => updateData.hasOwnProperty(f)) },
                { error: 'Restricted fields update attempt' },
                request.user?.id || 'system',
                request
            );
            return reply.code(403).send({
                success: false,
                error: `Cannot update restricted fields: ${restrictedFields.join(', ')}. Use dedicated endpoints instead.`
            });
        }
        
        // Find the student
        const student = await getStudentById(student_id);
        
        if (!student) {
            await entityLogger.logEntityUpdate('student',
                { student_id },
                { error: 'Student not found' },
                request.user?.id || 'system',
                request
            );
            return reply.code(404).send({
                success: false,
                error: `Student with ID ${student_id} not found`
            });
        }

        // Store old data for logging
        const oldData = student.toObject();
        
        // Add timestamp to updatedAt array
        const now = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const updateAction = `Updated student information`;
        
        if (!student.updatedAt) {
            student.updatedAt = [];
        }
        
        student.updatedAt.push({
            date: now,
            action: updateAction
        });
        
        // Update fields
        Object.keys(updateData).forEach(key => {
            // Special handling for arrays - completely replace them
            if (Array.isArray(updateData[key])) {
                student[key] = updateData[key];
            } else {
                student[key] = updateData[key];
            }
        });
        
        // Save the updated student
        await student.save();

        // Log the update
        await entityLogger.logEntityUpdate('student',
            oldData,
            student.toObject(),
            request.user?.id || 'system',
            request
        );
        
        // Return the updated student data
        return reply.code(200).send({
            success: true,
            data: {
                full_name: student.full_name,
                phone_number: student.phone_number,
                student_grade: student.student_grade,
                course_start_date: student.course_start_date,
                course_end_date: student.course_end_date,
                classes_per_week: student.classes_per_week,
                course_months: student.course_months,
                total_no_of_classes_should_be_given: student.total_no_of_classes_should_be_given,
                remarks: student.remarks,
                subjects: student.subjects,
                allotted_hours: student.allotted_hours,
                specializations: student.specializations,
                updatedAt: student.updatedAt
            }
        });
    } catch (error) {
        await entityLogger.logEntityUpdate('student',
            { student_id: request.params.student_id },
            { error: error.message },
            request.user?.id || 'system',
            request
        );
        request.log.error(error);
        return reply.code(400).send({
            success: false,
            error: error.message
        });
    }
}

// DELETE /student/:student_id
export async function deleteStudentHandler(request, reply) {
    try {
        const { student_id } = request.params;
        logger.info('Attempting to delete student', { student_id, requestId: request.id });
        
        const student = await getStudentById(student_id);
        if (!student) {
            logger.warn('Student not found for deletion', { student_id, requestId: request.id });
            return reply.code(404).send({ message: 'Student not found' });
        }

        await deleteStudent(student_id);
        
        entityLogger.logEntityDeletion('student', student, request.user?.id || 'system', request);
        logger.info('Student deleted successfully', { student_id, requestId: request.id });
        
        return reply.send({ message: 'Student deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteStudentHandler', { error, requestId: request.id });
        return reply.code(500).send({ message: 'Internal server error' });
    }
}

export async function getStudentStatusHandler(request, reply) {
  const { student_id } = request.params;

  try {
    const result = await getStudentStatus(student_id);

    if (!result) {
      return reply.code(404).send({ message: 'Student not found' });
    }

    return reply.code(200).send({
      student_status: result.student_status || '',
      verification_status: result.verification_status || '',
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getStudentPaymentHandler(request, reply) {
  const { student_id } = request.params;

  try {
    const result = await getStudentPayment(student_id);

    if (!result) {
      return reply.code(404).send({ message: 'Student not found' });
    }

    return reply.code(200).send({
      total_amount: result.total_amount || 0,
      amount_pending: result.amount_pending || 0,
      amount_paid: result.amount_paid || 0,
      student_grade: result.student_grade || '',
      payment_transaction_id: result.payment_transaction_id || '',
      payment_type: result.payment_type || '',
      payment_slip_url: result.payment_slip_url || '',
      enrollment_form_url: result.enrollment_form_url || ''
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function updateStudentPaymentHandler(request, reply) {
    try {
        const { student_id } = request.params;
        const { amount_paid, amount_pending, total_amount } = request.body;

        logger.info('Updating student payment', { 
            student_id, 
            amount_paid, 
            amount_pending, 
            total_amount,
            requestId: request.id 
        });

        if (total_amount !== amount_paid + amount_pending) {
            logger.warn('Invalid payment amounts', { 
                student_id, 
                total_amount, 
                amount_paid, 
                amount_pending,
                requestId: request.id 
            });
            return reply.code(400).send({ 
                message: 'No proper values: total_amount must equal amount_paid + amount_pending' 
            });
        }

        const existingStudent = await Student.findOne({ student_id }).lean();
        if (!existingStudent) {
            logger.warn('Student not found for payment update', { student_id, requestId: request.id });
            return reply.code(404).send({ message: 'Student not found' });
        }

        const updateData = { amount_paid, amount_pending, total_amount };
        const updated = await updateStudentPayment(student_id, updateData);

        if (!updated) {
            logger.error('Failed to update payment', { student_id, requestId: request.id });
            return reply.code(500).send({ message: 'Failed to update payment' });
        }

        entityLogger.logEntityUpdate(
            'student_payment',
            {
                amount_paid: existingStudent.amount_paid,
                amount_pending: existingStudent.amount_pending,
                total_amount: existingStudent.total_amount
            },
            updateData,
            request.user?.id || 'system',
            request
        );

        logger.info('Student payment updated successfully', { student_id, requestId: request.id });
        return reply.code(200).send({ message: 'Payment updated successfully' });
    } catch (error) {
        logger.error('Error in updateStudentPaymentHandler', { error, requestId: request.id });
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}

export async function updateStudentStatusHandler(request, reply) {
    try {
        const { student_id } = request.params;
        const { student_status, verification_status, payment_status } = request.body;

        logger.info('Updating student status', { 
            student_id, 
            student_status, 
            verification_status, 
            payment_status,
            requestId: request.id 
        });

        const existingStudent = await Student.findOne({ student_id }).lean();
        if (!existingStudent) {
            logger.warn('Student not found for status update', { student_id, requestId: request.id });
            return reply.code(404).send({ message: 'Student not found' });
        }

        const updateData = { student_status, verification_status };
        if (payment_status) {
            updateData.payment_status = payment_status;
        }

        const updated = await updateStudentStatus(student_id, updateData);
        if (!updated) {
            logger.error('Failed to update student status', { student_id, requestId: request.id });
            return reply.code(500).send({ message: 'Failed to update status' });
        }

        entityLogger.logEntityStatusChange(
            'student',
            {
                student_status: existingStudent.student_status,
                verification_status: existingStudent.verification_status,
                payment_status: existingStudent.payment_status
            },
            updateData,
            request.user?.id || 'system',
            request
        );

        logger.info('Student status updated successfully', { student_id, requestId: request.id });
        return reply.code(200).send({ message: 'Status updated successfully' });
    } catch (error) {
        logger.error('Error in updateStudentStatusHandler', { error, requestId: request.id });
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}

export async function updateStudentFieldsHandler(request, reply) {
  const { student_id } = request.params;
  const updateData = request.body;
  
  try {
    const result = await updateStudentFields(student_id, updateData, request.user?.id || 'system');
    return reply.code(200).send(result);
  } catch (error) {
    if (error.message === 'Student not found') {
      return reply.code(404).send({ 
        success: false, 
        error: error.message 
      });
    }
    // Handle restricted fields error with 403 Forbidden
    if (error.message.includes('do not have update permission')) {
      return reply.code(403).send({ 
        success: false, 
        error: error.message 
      });
    }
    return reply.code(400).send({ 
      success: false, 
      error: error.message 
    });
  }
}

export async function getStudentScheduleHandler(request, reply) {
  const { student_id } = request.params;
  
  try {
    const result = await getStudentSchedule(student_id);
    if (!result) {
      return reply.code(404).send({ message: 'Student not found' });
    }
    return reply.code(200).send(result);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      error: error.message 
    });
  }
}

export async function getAllStudentsBySearchHandler(request, reply) {
  try {
    const result = await getAllStudentsBySearch(request);
    return reply.code(200).send(result);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send([]);
  }
}

export async function getStudentNameByIdHandler(request, reply) {
  const { student_id } = request.params;
  if (!student_id) {
    return reply.code(400).send({ message: 'student id not found' });
  }
  const result = await getStudentNameById(student_id);
  if (!result) {
    return reply.code(404).send({ message: 'Student not found' });
  }
  return reply.send(result);
}
export async function createFeedbackHandler(request, reply) {
    try {
        const {
            user_id,
            type,
            text
        } = request.body;
        
        const studentId = parseInt(request.params.studentId);
        
        if (isNaN(studentId)) {
            await entityLogger.logEntityUpdate('student_feedback',
                { student_id: request.params.studentId },
                { error: 'Invalid student ID format' },
                request.user?.id || 'system',
                request
            );
            return reply.code(400).send({
                success: false,
                error: 'Invalid student ID format'
            });
        }
        
        if (!user_id || !type || !text) {
            await entityLogger.logEntityUpdate('student_feedback',
                { student_id: studentId, provided_fields: { user_id, type, text } },
                { error: 'Missing required fields' },
                request.user?.id || 'system',
                request
            );
            return reply.code(400).send({
                success: false,
                error: 'Missing required fields: user_id, type, and text are required'
            });
        }
        
        const feedbackData = {
            student_id: studentId,
            user_id,
            type: type?.toLowerCase(),
            text: text?.toLowerCase()
        };
        
        const result = await createFeedback(feedbackData);
        
        // Log successful feedback creation
        await entityLogger.logEntityUpdate('student_feedback',
            { student_id: studentId },
            { feedback_id: result.feedback_id, type, text },
            request.user?.id || 'system',
            request
        );
        
        return reply.code(201).send({
            success: true,
            data: {
                feedback_id: result.feedback_id
            }
        });
    } catch (error) {
        await entityLogger.logEntityUpdate('student_feedback',
            { student_id: request.params.studentId },
            { error: error.message },
            request.user?.id || 'system',
            request
        );
        logger.error('Error in createFeedbackHandler:', error);
        return reply.code(400).send({
            success: false,
            error: error.message || 'Failed to create feedback'
        });
    }
}

export async function StudentAvailabilityHandler(request, reply) {
    try {
        const { student_id } = request.params;
        
        logger.info('Creating student availability', { 
            student_id, 
            availability: request.body,
            requestId: request.id 
        });
        
        const result = await createStudentAvailability(student_id, request.body);
        
        logger.info('Student availability created successfully', { 
            student_id,
            requestId: request.id 
        });
        
        return reply.code(201).send(result);
    } catch (error) {
        logger.error('Error in StudentAvailabilityHandler', { error, requestId: request.id });
        return reply.code(400).send({
            success: false,
            error: error.message || 'Failed to create student availability'
        });
    }
}

export async function deleteStudentScheduleHandler(request, reply) {
    try {
        const { student_id, tutor_id, subject, time_slots, delete_token } = request.body;
        const user_role = request.user?.role;

        // Validate required parameters
        if (!student_id || !tutor_id || !subject || !Array.isArray(time_slots)) {
            await entityLogger.logEntityUpdate('student_schedule',
                { student_id, tutor_id, subject, time_slots },
                { error: 'Missing required parameters' },
                request.user?.id || 'system',
                request
            );
            return reply.code(400).send({ success: false, error: 'Missing required parameters' });
        }

        // If user is not admin, delete_token is required
        if (user_role !== 'admin' && !delete_token) {
            await entityLogger.logEntityUpdate('student_schedule',
                { student_id, tutor_id, user_role },
                { error: 'Delete token required for non-admin' },
                request.user?.id || 'system',
                request
            );
            return reply.code(400).send({ success: false, error: 'Delete token is required for non-admin users' });
        }

        const result = await deleteStudentSchedule({ 
            student_id, 
            tutor_id, 
            subject, 
            time_slots,
            delete_token,
            user_role 
        });

        // Log successful schedule deletion
        if (result.success) {
            await entityLogger.logEntityUpdate('student_schedule',
                { student_id, tutor_id, subject, time_slots },
                { status: 'deleted' },
                request.user?.id || 'system',
                request
            );
        }

        return reply.code(200).send(result);
    } catch (error) {
        await entityLogger.logEntityUpdate('student_schedule',
            { student_id: request.body.student_id, tutor_id: request.body.tutor_id },
            { error: error.message },
            request.user?.id || 'system',
            request
        );
        return reply.code(400).send({ success: false, error: error.message });
    }
}


export async function previewStudentDeleteEffectHandler(request, reply) {
  try{
  const { student_id} = request.params;
  if (!student_id ) {
    return reply.code(400).send({ message: 'student id or delete token not found' });
  }
  const affected = await previewStudentDeleteEffect(student_id);
  return reply.send({ success: true, affected });
  }catch(error){
    return reply.code(400).send({ success: false, error: error.message });
  }
}


export async function confirmStudentDeleteHandler(request, reply) {
  try{
  const { student_id} = request.params;
     
    if (!student_id) {
    return reply.code(400).send({ message: 'student id or delete token not found' });
  }
  const updated = await confirmStudentDelete(student_id);
  return reply.send({ success: true, updated });
  }catch(error){
    return reply.code(400).send({ success: false, error: error.message });
  }
}
