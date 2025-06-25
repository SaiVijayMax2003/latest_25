import mongoose from 'mongoose';
import { AdminService } from './admin.service.js';
import { getRedisClient } from '../../db/redis.js';
import { utilizationdata_collection } from '../../config/collection.js';

// Schema for storing utilization data
const utilizationSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['daily', 'hourly'],
        required: true,
        index: true
    },
    data: [{
        filters: {
            subject: { type: String, required: true },
            grade: { type: String, required: true },
            specialization: { type: String, required: true }
        },
        overall_utilization_rate: { type: Number, required: true },
        total_allotted_hours: { type: Number, required: true },
        total_available_slots: { type: Number, required: true }
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Create model
const UtilizationData = mongoose.model('UtilizationData', utilizationSchema, utilizationdata_collection);

// Function to store utilization data
async function storeUtilizationData(fastify, type = 'daily') {
    try {
        const adminService = new AdminService(fastify);
        
        // Get data for all possible filter combinations
        const filterCombinations = [
            { subject: 'ALL', grade: 'ALL', specialization: 'ALL' },
            { subject: 'Physics', grade: 'ALL', specialization: 'ALL' },
            { subject: 'Maths', grade: 'ALL', specialization: 'ALL' },
            { subject: 'Biology', grade: 'ALL', specialization: 'ALL' },
            { subject: 'ALL', grade: '8', specialization: 'ALL' },
            { subject: 'ALL', grade: '9', specialization: 'ALL' },
            { subject: 'ALL', grade: '10', specialization: 'ALL' },
            { subject: 'ALL', grade: 'ALL', specialization: 'jee' },
            { subject: 'ALL', grade: 'ALL', specialization: 'neet' },
            { subject: 'ALL', grade: 'ALL', specialization: 'olympiad' }
        ];

        const now = new Date();
        const utilizationData = [];

        // Collect data for each filter combination
        for (const filters of filterCombinations) {
            const request = { query: filters };
            const result = await adminService.getOverallUtilization(request);

            if (result.success) {
                utilizationData.push({
                    filters: {
                        subject: filters.subject,
                        grade: filters.grade,
                        specialization: filters.specialization
                    },
                    overall_utilization_rate: result.data.overall_utilization_rate,
                    total_allotted_hours: result.data.total_allotted_hours,
                    total_available_slots: result.data.total_available_slots
                });
            }
        }

        // Store all data in a single record
        const record = new UtilizationData({
            timestamp: now,
            type: type,
            data: utilizationData
        });

        await record.save();
        fastify.log.info(`Successfully stored ${type} utilization data for all filter combinations`);

        // Store the data in Redis for quick access
        const redisClient = await getRedisClient();
        if (redisClient) {
            // Store the new data
            const key = `utilization:${type}:${now.toISOString()}`;
            await redisClient.set(key, JSON.stringify(record));

            // Get all existing keys for this type
            const keys = await redisClient.keys(`utilization:${type}:*`);
            
            // Calculate timestamp for retention period
            const retentionPeriod = type === 'daily' ? 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 24 hours for both
            const retentionTimeAgo = new Date(now.getTime() - retentionPeriod);
            
            // Remove data older than retention period
            for (const oldKey of keys) {
                const keyTimestamp = oldKey.split(':')[2];
                const keyDate = new Date(keyTimestamp);
                
                if (keyDate < retentionTimeAgo) {
                    await redisClient.del(oldKey);
                }
            }
        }

    } catch (error) {
        fastify.log.error(`Error storing ${type} utilization data:`, error);
        throw error;
    }
}

// Function to get historical utilization data
async function getHistoricalUtilizationData(fastify, startDate, endDate, filters = {}, type = 'daily') {
    try {
        const query = {
            timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            type: type
        };

        const data = await UtilizationData.find(query).sort({ timestamp: 1 });

        // Filter the data based on the provided filters
        const filteredData = data.map(record => {
            const filteredUtilizations = record.data.filter(util => {
                let matches = true;
                if (filters.subjects && filters.subjects.length > 0) {
                    matches = matches && filters.subjects.includes(util.filters.subject);
                }
                if (filters.grades && filters.grades.length > 0) {
                    matches = matches && filters.grades.includes(util.filters.grade);
                }
                if (filters.specializations && filters.specializations.length > 0) {
                    matches = matches && filters.specializations.includes(util.filters.specialization);
                }
                return matches;
            });

            return {
                timestamp: record.timestamp,
                type: record.type,
                data: filteredUtilizations
            };
        });

        return {
            success: true,
            data: filteredData
        };
    } catch (error) {
        fastify.log.error('Error getting historical utilization data:', error);
        throw error;
    }
}

export {
    storeUtilizationData,
    getHistoricalUtilizationData,
    UtilizationData
};
