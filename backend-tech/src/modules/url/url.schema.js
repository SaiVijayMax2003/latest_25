import mongoose from 'mongoose';
import { temporary_urls_collection } from '../../config/collection.js';

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

const researchPaperSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subtext: { type: String, required: true }
}, { _id: false });

const temporaryUrlSchema = new mongoose.Schema({
  hash_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  tutor_id: {
    type: Number,
    required: true,
    ref: 'TutorSchedule'
  },
  tutor_details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  experience: {
    type: [experienceSchema],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  unique_qualities: {
    type: String,
    default: ''
  },
  student_testimonials: {
    type: [String],
    default: []
  },
  ranks_awards: {
    type: [String],
    default: []
  },
  research_papers: {
    type: [researchPaperSchema],
    default: []
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expiry_at: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  collection: temporary_urls_collection
});

// Add TTL index to automatically expire documents
temporaryUrlSchema.index({ expiry_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('TemporaryUrl', temporaryUrlSchema);

const tempUrlStudentOnboardingSchema = new mongoose.Schema({
  hash_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  student_id: {
    type: Number,
    required: true
  },
  order_id: {
    type: String,
    required: false // Not always required as it's fetched internally
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expired_at: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month from now
  },
  data: {
    student_name: { type: String, required: true },
    course_subject: [
      new mongoose.Schema({
        name: { type: String, required: true },
        classes: { type: Number, required: true }
      }, { _id: false })
    ],
    schedule: [
      new mongoose.Schema({
        day: { type: String, required: true },
        time: { type: String, required: true },
        subject: { type: String, required: true }
      }, { _id: false })
    ]
  },
  status: {
    type: String,
    default: 'order_created'
  },
  schedule_confirmed: {
    type: Boolean,
    default: false
  },
  confirm_schedule: {
    type: String,
    enum: ['yes', 'requested_changes', 'no'],
    default: 'no',
    required: false
  },
  requested_changes: {
    type: String,
    default: ''
  },
  previous_status: [
    new mongoose.Schema({
      name: { type: String, required: true },
      created_at: { type: Date, default: Date.now }
    }, { _id: false })
  ]
}, {
  timestamps: true,
  collection: 'tempurl_studentonboarding'
});

// Add TTL index to automatically expire documents
tempUrlStudentOnboardingSchema.index({ expired_at: 1 }, { expireAfterSeconds: 0 });

export const TempUrlStudentOnboarding = mongoose.model('TempUrlStudentOnboarding', tempUrlStudentOnboardingSchema);