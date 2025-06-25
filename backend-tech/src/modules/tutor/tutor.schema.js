import mongoose from 'mongoose';
import { tutor_collection } from '../../config/collection.js';

// Counter schema for ID generation
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
}, {
    collection: 'counters'
});

const Counter = mongoose.model('Counter', counterSchema);

const tutorScheduleSchema = new mongoose.Schema({
  tutor_id: {
    type: Number,
    required: true
  },
  user_id: {
    type: Number
  },
  tutor_name: {
    type: String,
    required: true
  },
  subjects: {
    type: [String],
    required: true
  },
  grades: {
    type: [String],
    required: true
  },
  feedback: [{
    feedback_id:String,
    user_id:Number,
    type: {
      type: String,
    },
    text: {
      type: String,
    }
  }],
  total_available_hours: [{
    day: {
      type: String,
      required: true,
      lowercase: true
    },
    slots: [String]
  }],
  total_slots: Number,
  allotted_hours: [{
    day: {
      type: String,
      required: true,
      lowercase: true
    },
    time: {
      type: String,
      required: true
    },      
    student_name: {
      type: String,
      required: true
    },
    student_id: mongoose.Schema.Types.Mixed,
    subject: {
      type: String,
      required: true
    },
    slot_id: String
  }],
  phone_number: String,
  demo_eligibility:{
    type: Boolean,
    required: false
  },
  employment_end_date:{
    type: Date,
    required: false
  },
  gender: {
    type: String,
    required: false
  },
  notice_period:{
    type: Boolean,
    required: false
  },
  status: {
    type: String,
    default: 'active',
    required: false
  },
  email: String,
  joining_date: {
    type: String
  },
  specializations: {
    type: [String]
  }
}, {
  timestamps: true,
  collection: tutor_collection,
  strict: false
});

// Add a static method to get the next tutor ID
tutorScheduleSchema.statics.getNextTutorId = async function() {
    const counter = await Counter.findByIdAndUpdate(
        'tutor_id',
        { $inc: { seq: 1 } },
        { 
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
    return counter.seq;
};

// Add attendance schema
const tutorAttendanceSchema = new mongoose.Schema({
  tutor_id: {
      type: Number,
      required: [true, 'Tutor ID is required']
  },
  session_id: {
      type: Number
  },
  type:{
      type: String,
      enum: ['checkin_Attributes', 'checkout_Attributes'],
      required: [true, 'Attendance type is required']
  },
  checkin_Attributes: {
      timestamp: {
          type: Date
      },
      location: {
          type: {
              type: String,
              enum: ['Point'],
              default: 'Point'
          },
          coordinates: {
              type: [Number],
              required: false
          },
          address: {
              type: String,
              default: ''
          }
      },
      batteryLevel: {
          type: Number,
          min: [0, 'Battery level cannot be negative'],
          max: [100, 'Battery level cannot exceed 100']
      },
      deviceInfo: {
          deviceId: {
              type: String,
              trim: true
          }
      }
  },
  checkout_Attributes: {
      timestamp: {
          type: Date
      },
      location: {
          type: {
              type: String,
              enum: ['Point'],
              default: 'Point'
          },
          coordinates: {
              type: [Number],
              required: false
          },
          address: {
              type: String,
              default: ''
          }
      },
      batteryLevel: {
          type: Number,
          min: [0, 'Battery level cannot be negative'],
          max: [100, 'Battery level cannot exceed 100']
      },
      deviceInfo: {
          deviceId: {
              type: String,
              trim: true
          }
      }
  },
  duration: {
      type: Number,
      default: 0,
      min: [0, 'Duration cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'attendance'
});

// Create and export models
export const TutorSchedule = mongoose.model('TutorSchedule', tutorScheduleSchema);
export const TutorAttendance = mongoose.model('TutorAttendance', tutorAttendanceSchema);
