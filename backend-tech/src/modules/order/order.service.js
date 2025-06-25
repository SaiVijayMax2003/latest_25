import Order from './order.schema.js';
import Student from '../student/student.schema.js';
import User from '../users/users.model.js';
import { getNextAssignee } from '../../utils/roundrobin.js';
import { emailService } from '../email-template/email.service.js';
import { smsService } from '../sms-template/sms.service.js';
import { logger } from '../../utils/logger.js';
import notificationService from '../notification/notification.service.js';

function generateOrderId(studentName) {
    // Get current date in DDMMYYYY format
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const dateString = day + month + year;
    
    // Get complete student name (uppercase) without spaces
    const namePrefix = (studentName || '').replace(/\s+/g, '').toUpperCase();
    
    return dateString + namePrefix;
}

async function createOrder({ student_id = '', logs = [], assigned_to = null, created_date = new Date(), created_by = '', sms = '', email = '' }, request = null) {
    // Fetch student's full name, payment_status, and payment details
    console.log('Looking up student with student_id:', student_id);
    const student = await Student.findOne({ student_id }, { 
        full_name: 1, 
        payment_status: 1, 
        total_amount: 1,
        amount_paid: 1,
        amount_pending: 1,
        payment_transaction_id: 1,
        payment_type: 1,
        payment_slip_url: 1,
        _id: 0 
    });
    
    console.log('Student lookup result:', student ? 'Found' : 'Not found');
    const full_name = student ? student.full_name : '';
    const payment_status = student ? student.payment_status : '';

    // Initialize access_ids as empty array
    let access_ids = [];

    // Check JWT token and add user ID if not admin
    if (request && request.user) {
        const userRole = request.user.role;
        const userId = parseInt(request.user.user_id, 10);
        
        // If user is not admin and has a valid user_id, add to access_ids
        if (userRole !== 'admin' && !isNaN(userId)) {
            access_ids.push(userId);
        }
    }

    // Check payment status before proceeding with round-robin assignment
    if (payment_status === 'verified') {
        // Only proceed with round-robin assignment if payment is verified
        const assignee = await getNextAssignee();
        if(assignee){
            // Create assignment object
            assigned_to = {
                user_id: assignee.user_id,
                role: assignee.role,
                name: assignee.name,
                assigned_at: new Date()
            };
        }
        
        // Add logging to track the process
        console.log('Assignee assigned:', assigned_to);
        
        try {
            const user = await User.findOne({user_id: assignee.user_id});
            if (!user) {
                console.error(`User not found with user_id: ${assignee.user_id}`);
                throw new Error(`User not found with user_id: ${assignee.user_id}`);
            }
            
            console.log('User found:', user.name, 'Current assignees:', user.no_of_assignees);
            user.no_of_assignees++;
            await user.save();
            console.log('User assignee count updated successfully');
        } catch (error) {
            console.error('Error updating user assignee count:', error);
            // Continue with order creation even if user update fails
        }

        // Append the assigned user's role ID to access_ids when payment is verified
        if (assignee && assignee.user_id) {
            access_ids.push(parseInt(assignee.user_id, 10));
        }
    } else {
        console.log('Payment status is not verified, skipping round-robin assignment');
        // Ensure assigned_to remains null when payment is not verified
        assigned_to = null;
    }

    console.log('Generating unique order_id...');
    let order_id;
    let isUnique = false;
    // Ensure unique order_id
    
    while (!isUnique) {
        order_id = generateOrderId(full_name);
        const existing = await Order.findOne({ order_id });
        if (!existing) isUnique = true;
    }
    console.log('Order ID generated:', order_id);

    // Send email notification to operations team member after successful assignment and order_id generation
    if (payment_status === 'verified' && assigned_to) {
        try {
            // Fetch assigned user's email from users collection
            const assignedUser = await User.findOne({ user_id: assigned_to.user_id }, { username: 1, _id: 0 });
            
            if (assignedUser && assignedUser.username) {
                const emailParams = {
                    ops_member_name: assigned_to.name,
                    student_name: full_name,
                    student_id: student_id.toString(),
                    order_id: order_id,
                    assigned_date: new Date().toISOString(),
                    email: assignedUser.username
                };

                await emailService.sendEmail('OPERATION_ASSIGNED', emailParams);
                
                // Log email to email_logs array
                await Order.updateOne(
                    { student_id: Number(student_id) },
                    { 
                        $push: { 
                            email_logs: {
                                type: "OPERATION_ASSIGNED",
                                time: new Date()
                            }
                        }
                    }
                );
                
                console.log('Operation assignment email sent successfully to:', assigned_to.name, 'at:', assignedUser.username);
            } else {
                console.log('Assigned user email not found, skipping operation assignment email');
            }
        } catch (emailError) {
            console.error('Error sending operation assignment email:', emailError);
            // Continue with order creation even if email fails
        }
    }

    // Prepare payment details from student data
    let payment_details = [];
    if (student && (student.total_amount || student.amount_paid || student.amount_pending || student.payment_transaction_id || student.payment_type || student.payment_slip_url)) {
        payment_details.push({
            total_amount: student.total_amount || 0,
            amount_paid: student.amount_paid || 0,
            amount_pending: student.amount_pending || 0,
            payment_method: student.payment_type || '',
            transaction_id: student.payment_transaction_id || '',
            payment_date: new Date(),
            payment_url: student.payment_slip_url || '',
            invoice_url: '',
            message: ''
        });
    }

    console.log('Creating order object...');
    const order = new Order({
        student_id: Number(student_id),
        full_name,
        order_id,
        onboarding_status: payment_status === 'verified' ? 'Needs Schedule' : 'pending',
        payment_status,
        scheduling_status: 'pending',
        payment_details,
        logs,
        assigned_to,
        created_date,
        created_by,
        sms,
        email,
        access_ids // Set access_ids with user ID if applicable
    });
    
    console.log('Saving order to database...');
    await order.save();
    console.log('Order saved successfully:', order.order_id);
    return order;
}

async function addPaymentToOrder(student_id, paymentData) {
    const order = await Order.findOne({ student_id: Number(student_id) });
    if (!order) {
        throw new Error('Order not found');
    }

    // Create new payment detail object matching schema structure
    const newPaymentDetail = {
        total_amount: paymentData.total_amount || 0,
        amount_paid: paymentData.amount_paid || 0,
        amount_pending: paymentData.amount_pending || 0,
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id || '',
        payment_date: new Date(),
        payment_url: paymentData.payment_url || '',
        invoice_url: paymentData.invoice_url || '',
        message: paymentData.message || ''
    };

    // Add to payment_details array (append to existing array)
    if (!order.payment_details) {
        order.payment_details = [];
    }
    order.payment_details.push(newPaymentDetail);

    // Update payment_status if provided
    if (paymentData.payment_status) {
        order.payment_status = paymentData.payment_status;
        
        // If payment_status is "verified", also update onboarding_status to "Needs Schedule"
        if (paymentData.payment_status === 'verified') {
            order.onboarding_status = 'Needs Schedule';
        }
    }

    // Add payment log
    order.logs.push({
        type: 'PAYMENT',
        action: 'PAYMENT_ADDED',
        details: paymentData,
        timestamp: new Date()
    });

    await order.save();
    return order;
}

async function getOrderPaymentDetails(student_id) {
    const order = await Order.findOne(
        { student_id: Number(student_id) },
        { payment_details: 1, payment_status: 1, _id: 0 }
    );

    if (!order) {
        throw new Error('Order not found');
    }

    return {
        payment_status: order.payment_status,
        payment_details: order.payment_details
    };
}

async function searchbyOrderService(request) {
    try {
        const search = request.query.search ? request.query.search.replace(/\s+/g, '') : null;
        let filter = {};
        if (search) {
            // Split search string into parts if it contains spaces
            const searchParts = search.trim().split(/\s+/);
            
            // Create search conditions array for full_name only
            const searchConditions = [
                { full_name: { $regex: `^${search}$`, $options: 'i' } },      // exact match
                { full_name: { $regex: `^${search}`, $options: 'i' } },       // starts with
                { full_name: { $regex: `${search}$`, $options: 'i' } },       // ends with
                { full_name: { $regex: search, $options: 'i' } },             // contains anywhere
                { full_name: { $regex: `(^|\\s)${search}`, $options: 'i' } }  // word boundary
            ];

            // If search has multiple parts (e.g., "pranjal k")
            if (searchParts.length > 1) {
                const firstName = searchParts[0];
                const lastNameInitial = searchParts[1];
                
                // Add condition for first name + last name initial
                searchConditions.push(
                    { full_name: { $regex: `^${firstName}\\s+${lastNameInitial}`, $options: 'i' } }
                );
            }

            // Add search for assigned_to.name field (since assigned_to is an object)
            searchConditions.push(
                { 'assigned_to.name': { $regex: `^${search}$`, $options: 'i' } },
                { 'assigned_to.name': { $regex: `^${search}`, $options: 'i' } },
                { 'assigned_to.name': { $regex: `${search}$`, $options: 'i' } },
                { 'assigned_to.name': { $regex: search, $options: 'i' } },
                { 'assigned_to.name': { $regex: `(^|\\s)${search}`, $options: 'i' } }
            );

            // If search has multiple parts, also search in assigned_to.name
            if (searchParts.length > 1) {
                const firstName = searchParts[0];
                const lastNameInitial = searchParts[1];
                searchConditions.push(
                    { 'assigned_to.name': { $regex: `^${firstName}\\s+${lastNameInitial}`, $options: 'i' } }
                );
            }

            filter = {
                $or: searchConditions
            };
        }
        // Always return only assigned_to and full_name
        const orders = await Order.find(filter).select('assigned_to full_name student_id order_id');
        // Map to array of objects with student_id, order_id, student_name and assigned_to
        const result = orders.map(t => ({ 
            student_id: t.student_id,
            order_id: t.order_id,
            assigned_to: t.assigned_to, 
            student_name: t.full_name
        }));
        return result;
    } catch (error) {
        this.fastify.log.error('Error in searchbyOrderService:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function updateOrderPaymentStatus(student_id, payment_status, user = null, requestId = null) {
    // Fetch the current order before updating
    const currentOrder = await Order.findOne({ student_id: Number(student_id) });
    if (!currentOrder) {
        throw new Error('Order not found for the given student ID');
    }

    // Check if this is a status change from "pending" to "verified"
    const isStatusChangeToVerified = currentOrder.payment_status === 'pending' && payment_status === 'verified';

    // Add modified_at timestamp
    const updateData = { payment_status, modified_at: new Date() };

    // If status is changing to "verified", also update onboarding_status to "Needs Schedule"
    if (payment_status === 'verified') {
        updateData.onboarding_status = 'Needs Schedule';
    }

    const updatedOrder = await Order.findOneAndUpdate(
        { student_id: Number(student_id) },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    // If status changed to "verified", also update the student collection
    if (isStatusChangeToVerified) {
        try {
            await Student.updateOne(
                { student_id: Number(student_id) },
                { $set: { payment_status: payment_status } }
            );
            logger.info('Student payment_status updated to verified', { 
                student_id, 
                requestId 
            });
        } catch (studentUpdateError) {
            logger.error('Failed to update student payment_status', { 
                student_id, 
                error: studentUpdateError.message,
                requestId 
            });
            // Continue with the process even if student update fails
        }

        // Run round-robin assignment and send email notification when status changes to "verified"
        try {
            // Get next assignee using round-robin
            const assignee = await getNextAssignee();
            
            if (assignee) { 
                // Create assignment object
                const assignment = {
                    user_id: assignee.user_id,
                    role: assignee.role,
                    name: assignee.name,
                    assigned_at: new Date()
                };

                // Update the assigned_to field in the order
                await Order.findOneAndUpdate(
                    { student_id: Number(student_id) },
                    { 
                        $set: { 
                            assigned_to: assignment,
                            modified_at: new Date() 
                        }
                    }
                );

                // Update user's assignee count
                try {
                    const user = await User.findOne({ user_id: assignee.user_id });
                    if (user) {
                        user.no_of_assignees++;
                        await user.save();
                        logger.info('User assignee count updated successfully', { 
                            user_id: assignee.user_id,
                            requestId 
                        });
                    }
                } catch (userUpdateError) {
                    logger.error('Error updating user assignee count:', { 
                        user_id: assignee.user_id,
                        error: userUpdateError.message,
                        requestId 
                    });
                    // Continue with the process even if user update fails
                }

                // Send email notification to the assigned operation member
                try {
                    // Fetch assigned user's email from users collection
                    const assignedUser = await User.findOne({ user_id: assignee.user_id }, { username: 1, _id: 0 });
                    
                    if (assignedUser && assignedUser.username) {
                        // Fetch student details for email
                        const student = await Student.findOne(
                            { student_id: Number(student_id) },
                            { full_name: 1, _id: 0 }
                        );
                        
                        const studentName = student ? student.full_name : '';
                        
                        const emailParams = {
                            ops_member_name: assignee.name,
                            student_name: studentName,
                            student_id: student_id.toString(),
                            order_id: currentOrder.order_id || '',
                            assigned_date: new Date().toISOString(),
                            email: assignedUser.username
                        };

                        await emailService.sendEmail('OPERATION_ASSIGNED', emailParams);
                        
                        // Log email to email_logs array
                        await Order.updateOne(
                            { student_id: Number(student_id) },
                            { 
                                $push: { 
                                    email_logs: {
                                        type: "OPERATION_ASSIGNED",
                                        time: new Date()
                                    }
                                }
                            }
                        );
                        
                        logger.info('Operation assignment email sent successfully', { 
                            student_id, 
                            assigned_to: assignee.name,
                            email: assignedUser.username,
                            requestId 
                        });
                    } else {
                        logger.warn('Assigned user email not found for operation assignment email', { 
                            user_id: assignee.user_id,
                            requestId 
                        });
                    }
                } catch (emailError) {
                    logger.error('Error sending operation assignment email:', { 
                        student_id, 
                        error: emailError.message,
                        requestId 
                    });
                    // Continue with the process even if email fails
                }
            } else {
                logger.warn('No assignee available for round-robin assignment', { 
                    student_id,
                    requestId 
                });
            }
        } catch (roundRobinError) {
            logger.error('Error in round-robin assignment:', { 
                student_id, 
                error: roundRobinError.message,
                requestId 
            });
            // Continue with the process even if round-robin fails
        }

        // Send welcome SMS and email when status changes to "verified"
        try {
            // Fetch student details for SMS and email including parent phone numbers
            const student = await Student.findOne(
                { student_id: Number(student_id) },
                { phone_number: 1, full_name: 1, email: 1, parent_phone_number: 1, _id: 0 }
            );

            if (student && student.phone_number && student.full_name) {
                // Send welcome SMS to student
                try {
                    await smsService.sendSms("WELCOME", {
                        phone: student.phone_number,
                        student_name: student.full_name
                    });
                    
                    // Log SMS to sms_logs array
                    await Order.updateOne(
                        { student_id: Number(student_id) },
                        { 
                            $push: { 
                                sms_logs: {
                                    type: "WELCOME",
                                    time: new Date()
                                }
                            }
                        }
                    );
                    
                    logger.info('Welcome SMS sent successfully after payment verification', { 
                        student_id, 
                        phone: student.phone_number,
                        requestId 
                    });
                } catch (smsError) {
                    // Log SMS error but don't fail the payment status update
                    logger.error('Failed to send welcome SMS after payment verification', { 
                        student_id, 
                        error: smsError.message,
                        requestId 
                    });
                }
            } else {
                logger.warn('Student phone details not found for SMS', { 
                    student_id,
                    requestId 
                });
            }

            // Send welcome SMS to parent phone numbers
            if (student && student.parent_phone_number && student.parent_phone_number.length > 0 && student.full_name) {
                for (const parentPhone of student.parent_phone_number) {
                    if (parentPhone.phone_number) {
                        try {
                            await smsService.sendSms("WELCOME", {
                                phone: parentPhone.phone_number,
                                student_name: student.full_name
                            });
                            
                            // Log SMS to sms_logs array for parent
                            await Order.updateOne(
                                { student_id: Number(student_id) },
                                { 
                                    $push: { 
                                        sms_logs: {
                                            type: "WELCOME_PARENT",
                                            time: new Date()
                                        }
                                    }
                                }
                            );
                            
                            logger.info('Welcome SMS sent successfully to parent after payment verification', { 
                                student_id, 
                                parent_phone: parentPhone.phone_number,
                                relation: parentPhone.relation,
                                requestId 
                            });
                        } catch (parentSmsError) {
                            // Log SMS error but don't fail the payment status update
                            logger.error('Failed to send welcome SMS to parent after payment verification', { 
                                student_id, 
                                parent_phone: parentPhone.phone_number,
                                relation: parentPhone.relation,
                                error: parentSmsError.message,
                                requestId 
                            });
                        }
                    }
                }
            } else {
                logger.warn('Parent phone details not found for SMS', { 
                    student_id,
                    requestId 
                });
            }

            // Send welcome email
            if (student && student.email && student.full_name) {
                try {
                    await emailService.sendEmail("WELCOME", {
                        student_name: student.full_name,
                        email: student.email
                    });
                    
                    // Log email to email_logs array
                    await Order.updateOne(
                        { student_id: Number(student_id) },
                        { 
                            $push: { 
                                email_logs: {
                                    type: "WELCOME",
                                    time: new Date()
                                }
                            }
                        }
                    );
                    
                    logger.info('Welcome email sent successfully after payment verification', { 
                        student_id, 
                        email: student.email,
                        requestId 
                    });
                } catch (emailError) {
                    // Log email error but don't fail the payment status update
                    logger.error('Failed to send welcome email after payment verification', { 
                        student_id, 
                        error: emailError.message,
                        requestId 
                    });
                }
            } else {
                logger.warn('Student email details not found for email', { 
                    student_id,
                    requestId 
                });
            }
        } catch (error) {
            // Log any other errors but don't fail the payment status update
            logger.error('Error in sending welcome notifications after payment verification', { 
                student_id, 
                error: error.message,
                requestId 
            });
        }
    }

    // Prepare log entry
    const changedFields = [];
    if (currentOrder.payment_status !== payment_status) {
        changedFields.push({
            field: 'payment_status',
            old: currentOrder.payment_status,
            new: payment_status
        });
    }
    // Log onboarding_status change if it was updated
    if (payment_status === 'verified' && currentOrder.onboarding_status !== 'Needs Schedule') {
        changedFields.push({
            field: 'onboarding_status',
            old: currentOrder.onboarding_status,
            new: 'Needs Schedule'
        });
    }
    if (changedFields.length > 0) {
        const logEntry = {
            action: 'edit payment status',
            performed_by: {
                user_id: user?.user_id || null,
                role: user?.role || null,
                username: user?.username || null,
                name: user?.name || null
            },
            timestamp: new Date(),
            changes: changedFields
        };
        await Order.updateOne(
            { student_id: Number(student_id) },
            { $push: { logs: logEntry } }
        );
    }

    // Notification logic: If payment_status changed from 'Pending' to anything else except 'Verified'
    let assignedUser = null;
    if (currentOrder.assigned_to && currentOrder.assigned_to.user_id) {
        assignedUser = currentOrder.assigned_to;
    }

    if (assignedUser && assignedUser.user_id) {
        // Get student details from Order collection
        const studentName = currentOrder.full_name || student_id;
       
        await notificationService.createNotification({
            type: 'Payment Verified',
            userId: assignedUser.user_id.toString(),
            studentId: student_id,
            full_name: studentName,
            message: `Payment status for student ${studentName} (ID: ${student_id}) changed from Pending to ${payment_status}.`,
            priority: 'high'
        });
    }

    return updatedOrder;
}

export { 
    createOrder, 
    searchbyOrderService, 
    addPaymentToOrder, 
    getOrderPaymentDetails,
    generateOrderId,
    updateOrderPaymentStatus
};
