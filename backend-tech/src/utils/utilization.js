/**
 * Process tutor availability data and build utilization map
 * @param {Array} tutors - Array of tutor documents
 * @returns {Object} Utilization map by day and time
 */
export const buildHourUtilizationMap = (tutors) => {
    const utilizationMap = {};
    
    for (const tutor of tutors) {
        // Process available hours
        if (tutor.total_available_hours && Array.isArray(tutor.total_available_hours)) {
            for (const dayObj of tutor.total_available_hours) {
                if (dayObj && dayObj.day && Array.isArray(dayObj.slots)) {
                    const day = dayObj.day.toString().toLowerCase();
                    
                    if (!utilizationMap[day]) {
                        utilizationMap[day] = {};
                    }
                    
                    for (const timeSlot of dayObj.slots) {
                        if (!utilizationMap[day][timeSlot]) {
                            utilizationMap[day][timeSlot] = { total_hours: 0, allotted_hours: 0 };
                        }
                        
                        // Increment total hours count
                        utilizationMap[day][timeSlot].total_hours++;
                    }
                }
            }
        }
        
        // Process allotted hours
        if (tutor.allotted_hours && Array.isArray(tutor.allotted_hours)) {
            for (const slot of tutor.allotted_hours) {
                if (slot && slot.day && slot.time) {
                    const day = slot.day.toString().toLowerCase();
                    const time = slot.time;
                    
                    if (!utilizationMap[day]) {
                        utilizationMap[day] = {};
                    }
                    
                    if (!utilizationMap[day][time]) {
                        utilizationMap[day][time] = { total_hours: 0, allotted_hours: 0 };
                    }
                    
                    // Increment allotted hours count
                    utilizationMap[day][time].allotted_hours++;
                }
            }
        }
    }
    
    return utilizationMap;
};

/**
 * Format utilization map into required structure
 * @param {Object} utilizationMap - Utilization map by day and time
 * @returns {Array} Formatted utilization data
 */
export const formatHourUtilizationData = (utilizationMap) => {
    const result = [];
    
    for (const day in utilizationMap) {
        const dayData = {
            day: day,
            slots: []
        };
        
        for (const time in utilizationMap[day]) {
            const data = utilizationMap[day][time];
            const utilizationRate = data.total_hours > 0 
                ? Math.round((data.allotted_hours / data.total_hours) * 100)
                : 0;
            
            dayData.slots.push({
                time: time,
                total_hours: data.total_hours,
                allotted_hours: data.allotted_hours,
                utilization_rate: utilizationRate
            });
        }
        
        result.push(dayData);
    }
    
    return result;
};