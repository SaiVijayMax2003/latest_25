import mongoose from 'mongoose';

// Import the TutorSchedule model from tutor module
import TutorSchedule from '../tutor/tutor.schema.js';

// Import the Student model from student module
import Student from '../student/student.schema.js';

// Import the schedule_collection from config/collection.js
import { schedule_collection } from '../../config/collection.js';

// Create a schema for schedule
const scheduleSchema = new mongoose.Schema({
    tutor_id: {
        type: Number,
        required: true
    },
    student_id: {
        type: Number,
        required: true
    },
    day: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    time: {
        type: String,
        required: true
    }
}, {
    collection: schedule_collection,
    timestamps: true
});

export const Schedule = mongoose.model('Schedule', scheduleSchema); 