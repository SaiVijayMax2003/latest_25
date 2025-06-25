import mongoose from 'mongoose';
import { student_collection } from '../../config/collection.js';

// Counter schema for ID generation
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
}, {
    collection: 'counters',
    dbName: process.env.MONGODB_DBNAME
});

// Only create the Counter model if it doesn't exist
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const remarkSchema = new mongoose.Schema({
  id: Number,
  type: String,
  text: String,
}, { _id: false });

const updatedAtSchema = new mongoose.Schema({
  id: Number,
  type: String,
  timestamp: String,
}, { _id: false });

const parentPhoneNumberSchema = new mongoose.Schema({
  phone_number: { type: String },
  relation: { type: String }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  student_id: {
    type: Number,
    required: true
  },
  total_amount: {
    type: Number,
    required: true
  },
  classes_per_week: {
    type: Number,
    required: true
  },
  course_end_date: {
    type: String,
    required: true
  },
  created_at: Date,
  course_start_date: {
    type: String,
    required: true
  },
  remarks: [remarkSchema],
  course_months: Number,
  full_name: {
    type: String,
    required: true
  },
  amount_pending: Number,
  amount_paid: Number,
  phone_number: {
    type: String,
    required: true
  },
  student_grade: {
    type: String,
    required: true
  },
  student_status: String,
  total_no_of_classes_should_be_given: Number,
  updatedAt: [updatedAtSchema],
  verification_status: String,
  payment_status: {
    type: String,
    enum: ['verified', 'pending', 'rejected'],
    default: 'pending'
  },
  student_lock: {
    type: Boolean
  },
  email: {
    type: String
  },
  date_of_birth: {
    type: String
  },

  // Updated subjects field to Array of Objects
  subjects: [{
    subject: {
      type: String,
      required: true
    },
    classes: {
      type: Number,
      required: true
    }
  }],

  classes_per_week_string: {
    type: String
  },
  feedback: [{
    feedback_id: { type: String },
    user_id: { type: Number },
    type: { type: String },
    text: { type: String },
    created_at: { type: Date, default: Date.now }
  }],
  parent_phone_number: [
    {phone_number: { type: String,
      required: false
     },
     relation: { type: String,
      required: false
     }}
  ],
   

  deal_closed_date: {
    demo_class_taken: {
      type: String
    },
    demo_class_date: {
      type: String
    },
    demo_subject: {
      type: String
    },
    demo_tutor: {
      type: String
    },
    demo_classes_feedback: {
      type: String
    }
  },

  total_available_hours: [{
    day: {
      type: String,
      required: true,
      lowercase: true
    },
    slots: [String]
  }],

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
    tutor_name: {
      type: String,
      required: true
    },
    tutor_id: {
      type: Number,
      required: true
    }
  }],

  specializations: {
    type: [String]
  },

  payment_transaction_id: {
    type: String
  },
  payment_type: {
    type: String
  },
  payment_slip_url: {
    type: String
  },
  enrollment_form_url: {
    type: String
  },

  parent_phone_number: {
    type: [parentPhoneNumberSchema],
    required: false
  },

  created_by: {
    user_id: { type: Number },
    role: { type: String },
    username: { type: String },
    name: { type: String },
    created_at: { type: Date, default: Date.now }
  },

  orders: {
    type: [String],
    default: []
  }

}, {
  collection: student_collection,
  dbName: process.env.MONGODB_DBNAME,
  timestamps: true
});


// Add a static method to get the next student ID
studentSchema.statics.getNextStudentId = async function() {
    const counter = await Counter.findByIdAndUpdate(
        'student_id',
        { $inc: { seq: 1 } },
        { 
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
    return counter.seq;
};

export default mongoose.model('Student', studentSchema);

