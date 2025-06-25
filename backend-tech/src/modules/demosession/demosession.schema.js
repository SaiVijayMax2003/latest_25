import mongoose from 'mongoose';

// Counter schema for ID generation
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
}, {
    collection: 'counters1'
});

const Counter = mongoose.model('Counter1', counterSchema);

const demoSessionSchema = new mongoose.Schema({
  demosession_id: {
    type: Number,
    required: true,
    unique: true
  },
  student_name: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  preferred_date: {
    type: Date,
    required: true
  },
  preferred_time: {
    type: String,
    required: true
  },
  assigned_tutor: {
    type: String,
    required: true
  },
  selected_demo_slots: {
    type: String,
    required: true
  },
  tutor_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  expired: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'demosessions',
  timestamps: true
});

// Add a static method to get the next demo session ID
demoSessionSchema.statics.getNextDemoSessionId = async function() {
    const counter = await Counter.findByIdAndUpdate(
        'demosession_id',
        { $inc: { seq: 1 } },
        { 
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
    return counter.seq;
};

// Method to check and update expiration status
demoSessionSchema.methods.checkExpiration = function() {
  const currentDate = new Date();
  this.expired = this.preferred_date < currentDate;
  return this.expired;
};

// Pre-save middleware to automatically check expiration before saving
demoSessionSchema.pre('save', function(next) {
  this.checkExpiration();
  next();
});

export default mongoose.model('DemoSession', demoSessionSchema); 
