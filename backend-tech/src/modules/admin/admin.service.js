import { TutorSchedule } from '../tutor/tutor.schema.js';
import { buildHourUtilizationMap, formatHourUtilizationData } from '../../utils/utilization.js';
import Order from '../order/order.schema.js';

export class AdminService {
    constructor(fastify) {
        this.fastify = fastify;
    }

    async getTutorUtilization(tutorId) {
        try {
            const tutor = await TutorSchedule.findOne({ tutor_id: parseInt(tutorId) });
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            const totalSlots = tutor.total_slots || 0;
            const allottedHours = tutor.allotted_hours ? Object.keys(tutor.allotted_hours).length : 0;
            const utilizationRate = totalSlots > 0 ? (allottedHours / totalSlots) * 100 : 0;

            return {
                success: true,
                data: {
                    tutor_id: tutor.tutor_id,
                    tutor_name: tutor.tutor_name,
                    utilization_rate: utilizationRate,
                    allotted_hours: allottedHours,
                    total_hours: totalSlots
                }
            };
        } catch (error) {
            this.fastify.log.error(error);
            throw error;
        }
    }

    async getOverallUtilization(request) {
        try {
            const { subject = 'ALL', grade = 'ALL', specialization = 'ALL', day } = request.query;
            let query = {};
            
            // Handle subject filter
            if (subject !== 'ALL') {
                const subjects = subject.split(',').map(s => s.trim());
                query.subjects = { $in: subjects };
            }

            // Handle grade filter
            if (grade !== 'ALL') {
                const grades = grade.split(',').map(g => g.trim());
                query.grades = { $in: grades };
            }

            // Handle specialization filter
            if (specialization !== 'ALL') {
                const specializations = specialization.split(',').map(s => s.trim());
                query.specializations = { $in: specializations };
            }

            // Get all tutors matching the filters
            const tutors = await TutorSchedule.find(query);
            let totalAllottedHours = 0;
            let totalAvailableSlots = 0;
            let filteredTutors = [];

            // If day filter is applied, filter tutors who have availability for that day
            if (day) {
                filteredTutors = tutors.filter(tutor => {
                    const hasDayAvailability = tutor.total_available_hours.some(
                        d => d.day.toLowerCase() === day.toLowerCase()
                    );
                    return hasDayAvailability;
                });

                // If no tutors have availability for the specified day, return empty results
                if (filteredTutors.length === 0) {
                    return {
                        success: true,
                        data: {
                            overall_utilization_rate: 0,
                            total_allotted_hours: 0,
                            total_available_slots: 0,
                            subjects: subject === 'ALL' ? ['ALL'] : subject.split(',').map(s => s.trim()),
                            grades: grade === 'ALL' ? ['ALL'] : grade.split(',').map(g => g.trim()),
                            specializations: specialization === 'ALL' ? ['ALL'] : specialization.split(',').map(s => s.trim()),
                            day: day
                        }
                    };
                }

                // Calculate utilization for the specific day
                for (const tutor of filteredTutors) {
                    // Count allotted hours for the specific day
                    const allottedHoursForDay = tutor.allotted_hours.filter(
                        h => h.day.toLowerCase() === day.toLowerCase()
                    ).length;
                    totalAllottedHours += allottedHoursForDay;

                    // Count available slots for the specific day
                    const daySchedule = tutor.total_available_hours.find(
                        d => d.day.toLowerCase() === day.toLowerCase()
                    );
                    if (daySchedule) {
                        totalAvailableSlots += daySchedule.slots.length;
                    }
                }
            } else {
                // If no day filter, use all tutors and count all slots
                filteredTutors = tutors;
                for (const tutor of filteredTutors) {
                    const allottedHours = tutor.allotted_hours ? tutor.allotted_hours.length : 0;
                    const totalSlots = tutor.total_slots || 0;
                    totalAllottedHours += allottedHours;
                    totalAvailableSlots += totalSlots;
                }
            }

            const overallUtilizationRate = totalAvailableSlots > 0 
                ? (totalAllottedHours / totalAvailableSlots) * 100 
                : 0;

            return {
                success: true,
                data: {
                    overall_utilization_rate: overallUtilizationRate,
                    total_allotted_hours: totalAllottedHours,
                    total_available_slots: totalAvailableSlots,
                    subjects: subject === 'ALL' ? ['ALL'] : subject.split(',').map(s => s.trim()),
                    grades: grade === 'ALL' ? ['ALL'] : grade.split(',').map(g => g.trim()),
                    specializations: specialization === 'ALL' ? ['ALL'] : specialization.split(',').map(s => s.trim()),
                    day: day || 'ALL'
                }
            };
        } catch (error) {
            this.fastify.log.error(error);
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

    async getDetailedTutorUtilization(tutorId) {
        try {
            const tutor = await TutorSchedule.findOne({ tutor_id: parseInt(tutorId) });
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            // Initialize the result structure
            const result = {
                day: [],
                slots: []
            };

            // Process each day's data
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            
            for (const day of days) {
                const dayData = {
                    day: day,
                    slots: []
                };

                // Get total available hours for this day
                const daySchedule = tutor.total_available_hours.find(d => d.day.toLowerCase() === day);
                if (!daySchedule) {
                    continue;
                }

                // Process each time slot
                for (const time of daySchedule.slots) {
                    const slotData = {
                        time: time,
                        total_hours: 0,
                        allotted_hours: 0,
                        utilization_rate: 0
                    };

                    // Count total hours (number of tutors available at this time)
                    slotData.total_hours = 1;

                    // Check if this slot is allotted
                    const isAllotted = tutor.allotted_hours.some(
                        h => h.day.toLowerCase() === day && h.time === time
                    );

                    if (isAllotted) {
                        slotData.allotted_hours = 1;
                        slotData.utilization_rate = 100;
                    }

                    dayData.slots.push(slotData);
                }

                // Sort slots by time
                dayData.slots.sort((a, b) => {
                    const timeA = a.time.replace(/[^0-9]/g, '');
                    const timeB = b.time.replace(/[^0-9]/g, '');
                    return parseInt(timeA) - parseInt(timeB);
                });

                result.day.push(dayData);
            }

            return {
                success: true,
                data: result
            };
        } catch (error) {
            this.fastify.log.error(error);
            throw error;
        }
    }

    async getSubjectWiseUtilization() {
        try {
            // Get all tutors
            const tutors = await TutorSchedule.find({});
            
            // Create a map to store subject-wise data
            const subjectUtilization = new Map();

            // Process each tutor's data
            for (const tutor of tutors) {
                const subjects = tutor.subjects || [];
                const allottedHours = tutor.allotted_hours || [];
                const totalSlots = tutor.total_slots || 0;

                // Process each subject
                for (const subject of subjects) {
                    if (!subjectUtilization.has(subject)) {
                        subjectUtilization.set(subject, {
                            subject: subject,
                            total_tutors: 0,
                            total_slots: 0,
                            allotted_hours: 0,
                            utilization_rate: 0
                        });
                    }

                    const subjectData = subjectUtilization.get(subject);
                    subjectData.total_tutors++;
                    subjectData.total_slots += totalSlots;

                    // Count allotted hours for this subject
                    const subjectAllottedHours = allottedHours.filter(hour => 
                        hour.subject === subject
                    ).length;
                    subjectData.allotted_hours += subjectAllottedHours;
                }
            }

            // Calculate utilization rates and format the response
            const result = Array.from(subjectUtilization.values()).map(data => {
                data.utilization_rate = data.total_slots > 0 
                    ? (data.allotted_hours / data.total_slots) * 100 
                    : 0;
                return data;
            });

            // Sort by utilization rate in descending order
            result.sort((a, b) => b.utilization_rate - a.utilization_rate);

            return {
                success: true,
                data: result
            };
        } catch (error) {
            this.fastify.log.error(error);
            throw error;
        }
    }

    async getUserStatistics() {
        try {
            // Get all orders
            const orders = await Order.find({ order_deleted: { $ne: true } });
            
            // Initialize statistics
            const stats = {
                open_orders: 0,
                schedules_to_be_created: 0,
                redflags: 0,
                avg_time_completion: 0,
                failed_orders: 0,
                completedorders_monthly: 0
            };

            let totalCompletionTime = 0;
            let completedOrders = 0;

            // Get current month and year
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            // Process each order
            for (const order of orders) {
                // Count open orders (pending onboarding or scheduling)
                if (order.onboarding_status !== 'Completed') {
                    stats.open_orders++;
                }

                // Count orders needing schedule creation
                if (order.onboarding_status === 'Needs Schedule') {
                    stats.schedules_to_be_created++;
                }

                // Count red flags (orders with rejected payment status)
                if (order.payment_status === 'rejected') {
                    stats.redflags++;
                }

                // Count failed orders (orders with rejected status in any category)
                if (order.payment_status === 'rejected') {
                    stats.failed_orders++;
                }

                // Calculate average completion time and count completed orders for current month
                if (order.onboarding_status === 'completed' && 
                    order.payment_status === 'verified' && 
                    order.scheduling_status === 'completed') {
                    
                    // Check if order was completed in current month
                    const orderCompletionDate = new Date(order.updatedAt || order.created_date);
                    if (orderCompletionDate.getMonth() === currentMonth && 
                        orderCompletionDate.getFullYear() === currentYear) {
                        stats.completedorders_monthly++;
                    }

                    const completionTime = order.logs.reduce((total, log) => {
                        if (log.status === 'completed') {
                            return total + (new Date(log.timestamp) - new Date(order.created_date));
                        }
                        return total;
                    }, 0);
                    
                    if (completionTime > 0) {
                        totalCompletionTime += completionTime;
                        completedOrders++;
                    }
                }
            }

            // Calculate average completion time in hours
            stats.avg_time_completion = completedOrders > 0 
                ? Math.round((totalCompletionTime / completedOrders) / (1000 * 60 * 60)) 
                : 0;

            return {
                success: true,
                data: [stats]  // Wrap stats in array as per schema
            };
        } catch (error) {
            this.fastify.log.error(error);
            throw error;
        }
    }

    async getRedflags() {
        try {
            // Get all orders that are not deleted
            const orders = await Order.find({ order_deleted: { $ne: true } });
            
            const redflags = [];
            const currentTime = new Date();
            const DELAY_THRESHOLD_HOURS = 48; // 48 hours threshold for delay

            for (const order of orders) {
                try {
                    let redflagReason = '';
                    let isDelayed = false;
                    let lastStatusChange = order.created_date;
                    let hoursSinceLastChange = 0;

                    // Check if order is completed (all statuses are completed/verified)
                    const isCompleted = order.onboarding_status === 'completed' && 
                                       order.payment_status === 'verified' && 
                                       order.scheduling_status === 'completed';

                    if (isCompleted) {
                        // Order is completed, no redflag
                        continue;
                    }

                    // Determine the last status change and calculate hours since then
                    if (order.logs && order.logs.length > 0) {
                        try {
                            // Find the most recent log entry
                            const sortedLogs = order.logs.sort((a, b) => {
                                const dateA = new Date(b.timestamp || b.created_at || 0);
                                const dateB = new Date(a.timestamp || a.created_at || 0);
                                return dateA - dateB;
                            });
                            
                            if (sortedLogs[0] && (sortedLogs[0].timestamp || sortedLogs[0].created_at)) {
                                lastStatusChange = new Date(sortedLogs[0].timestamp || sortedLogs[0].created_at);
                            }
                        } catch (logError) {
                            // Fallback to created_date
                            lastStatusChange = new Date(order.created_date);
                        }
                    } else {
                        // If no logs, use created_date
                        lastStatusChange = new Date(order.created_date);
                    }

                    hoursSinceLastChange = (currentTime - lastStatusChange) / (1000 * 60 * 60);

                    // Check for redflag conditions
                    if (order.payment_status === 'rejected') {
                        redflagReason = 'Payment rejected - requires immediate attention';
                        isDelayed = true;
                    } else if (order.onboarding_status === 'pending' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Onboarding pending for ${Math.floor(hoursSinceLastChange)} hours - student needs to be contacted`;
                        isDelayed = true;
                    } else if (order.onboarding_status === 'Needs Schedule' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Schedule creation pending for ${Math.floor(hoursSinceLastChange)} hours - tutor assignment needed`;
                        isDelayed = true;
                    } else if (order.payment_status === 'pending' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Payment pending for ${Math.floor(hoursSinceLastChange)} hours - payment verification needed`;
                        isDelayed = true;
                    } else if (order.scheduling_status === 'pending' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Scheduling pending for ${Math.floor(hoursSinceLastChange)} hours - session scheduling needed`;
                        isDelayed = true;
                    } else if (order.onboarding_status === 'in_progress' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Onboarding in progress for ${Math.floor(hoursSinceLastChange)} hours - follow up needed`;
                        isDelayed = true;
                    } else if (order.scheduling_status === 'in_progress' && hoursSinceLastChange > DELAY_THRESHOLD_HOURS) {
                        redflagReason = `Scheduling in progress for ${Math.floor(hoursSinceLastChange)} hours - follow up needed`;
                        isDelayed = true;
                    } else {
                        // Order has some issue but not necessarily delayed
                        if (order.payment_status === 'pending') {
                            redflagReason = 'Payment pending - awaiting verification';
                        } else if (order.onboarding_status === 'pending') {
                            redflagReason = 'Onboarding pending - student needs to complete process';
                        } else if (order.onboarding_status === 'Needs Schedule') {
                            redflagReason = 'Schedule creation needed - tutor assignment required';
                        } else if (order.scheduling_status === 'pending') {
                            redflagReason = 'Scheduling pending - session scheduling required';
                        } else if (order.onboarding_status === 'in_progress') {
                            redflagReason = 'Onboarding in progress - follow up recommended';
                        } else if (order.scheduling_status === 'in_progress') {
                            redflagReason = 'Scheduling in progress - follow up recommended';
                        } else {
                            redflagReason = 'Order status unclear - manual review needed';
                        }
                    }

                    // Safely handle assigned_to array
                    let assignedTo = null;
                    if (order.assigned_to && Array.isArray(order.assigned_to) && order.assigned_to.length > 0) {
                        // Get the most recent assignment (last in array)
                        const latestAssignment = order.assigned_to[order.assigned_to.length - 1];
                        assignedTo = {
                            user_id: latestAssignment.user_id || null,
                            role: latestAssignment.role || null,
                            name: latestAssignment.name || null
                        };
                    } else if (order.assigned_to && typeof order.assigned_to === 'object' && !Array.isArray(order.assigned_to)) {
                        // Handle legacy single object format
                        assignedTo = {
                            user_id: order.assigned_to.user_id || null,
                            role: order.assigned_to.role || null,
                            name: order.assigned_to.name || null
                        };
                    }

                    // Add to redflags array
                    redflags.push({
                        order_id: order.order_id || 'Unknown',
                        student_name: order.full_name || 'Unknown',
                        created_date: order.created_date,
                        last_status_change: lastStatusChange,
                        hours_since_last_change: Math.floor(hoursSinceLastChange),
                        onboarding_status: order.onboarding_status || 'unknown',
                        payment_status: order.payment_status || 'unknown',
                        scheduling_status: order.scheduling_status || 'unknown',
                        redflag_reason: redflagReason,
                        is_delayed: isDelayed,
                        assigned_to: assignedTo
                    });
                } catch (orderError) {
                    // Continue processing other orders if one fails
                    continue;
                }
            }

            // Sort by hours since last change (most delayed first)
            redflags.sort((a, b) => b.hours_since_last_change - a.hours_since_last_change);

            return {
                success: true,
                data: redflags
            };
        } catch (error) {
            this.fastify.log.error('Error in getRedflags:', error);
            throw error;
        }
    }
}
