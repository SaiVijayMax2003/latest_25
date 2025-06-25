import mongoose from 'mongoose';
import { convertTutorSchedulesToText } from '../utils/scheduleConverter.js';
import { llmService } from './llmService.js';
import { tutor_collection } from '../../../config/collection.js';
import { schedule_collection } from '../../../config/collection.js';
import { generated_schedule_collection } from '../../../config/collection.js';
import entityLogger from '../../../utils/entityLogger.js';

const tutorSchema = new mongoose.Schema({
    tutorId: { type: Number, required: true, unique: true },
    subjects: [{ type: String, required: true }],
    grades: [{ type: Number, required: true }],
    currentClasses: { type: Number, default: 0 },
    freeHours: [{
        day: { type: String, required: true },
        hour: { type: String, required: true }
    }],
    unavailableHours: [{
        day: { type: String, required: true },
        hour: { type: String, required: true }
    }],
}, {
    collection: tutor_collection
});

const Tutor = mongoose.model('Tutor', tutorSchema);

// New schema for generated student schedules
const generatedScheduleSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.Mixed, required: true },
    role: { type: String, required: true },
    student_id: { type: mongoose.Schema.Types.Mixed, required: true },
    thread_id: { type: String, required: true },
    created_time: { type: Date, default: Date.now },
    request_params: { type: Object, required: true },
    response: { type: Object, required: true }
}, {
    collection: generated_schedule_collection
});

const GeneratedSchedule = mongoose.model('GeneratedSchedule', generatedScheduleSchema);

class MongoService {
    constructor() {
        this.connection = null;
    }

    async connect() {
        // Use existing Mongoose connection if available
        if (mongoose.connection.readyState === 1) {
            this.connection = mongoose.connection;
            return this.connection;
        }
        
        // Only create new connection if none exists
        if (!this.connection) {
            this.connection = await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        }
        return this.connection;
    }

    async getAllTutors() {
        await this.connect();
        return await Tutor.find({});
    }

    async getTutorById(tutorId) {
        await this.connect();
        return await Tutor.findOne({ tutorId });
    }

    // Insert a new generated schedule (fire-and-forget)
    async insertGeneratedSchedule(scheduleData) {
        await this.connect();
        const doc = new GeneratedSchedule(scheduleData);
        entityLogger.logEntityUpdate('generated_schedule',
            { student_id: scheduleData.student_id, thread_id: scheduleData.thread_id },
            { action: 'schedule_inserted', user_id: scheduleData.user_id, role: scheduleData.role },
            scheduleData.user_id || 'system',
            null
        );
        return doc.save();
    }

    // Get the latest generated schedule for a student
    async getLastGeneratedSchedule(student_id) {
        await this.connect();
        const id = Number(student_id);
        entityLogger.logEntityUpdate('generated_schedule',
            { student_id: id },
            { action: 'querying_last_schedule' },
            'system',
            null
        );
        const result = await GeneratedSchedule.findOne({ student_id: id }).sort({ created_time: -1 });
        entityLogger.logEntityUpdate('generated_schedule',
            { student_id: id },
            { action: 'query_completed', found: !!result },
            'system',
            null
        );
        if (!result) {
            return { request_params: null, response: [] };
        }
        // Force deep serialization
        let responseArr = [];
        if (Array.isArray(result.response)) {
            responseArr = JSON.parse(JSON.stringify(result.response));
        }
        return {
            request_params: result.request_params || null,
            response: responseArr
        };
    }

    // Get generated schedules by user_id or student_id, with optional time range (max 60 days)
    async getGeneratedSchedules({ user_id, student_id, start_time, end_time }) {
        await this.connect();
        const query = {};
        if (user_id) query.user_id = user_id;
        if (student_id) query.student_id = student_id;
        if (start_time && end_time) {
            query.created_time = { $gte: new Date(start_time), $lte: new Date(end_time) };
        }
        return GeneratedSchedule.find(query).sort({ created_time: -1 });
    }
}

export const mongoService = new MongoService(); 