import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  tutor_id: {
    type: Number,
    required: true
  },
  student_id: {
    type: Number,
    required: false
  },
  user_id: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['communication', 'content_knowledge', 'delivery', 'overall'],
    required: true
  },
  rating: {
    type: Number,
    required: false,
    min: 1,
    max: 10
  },
  text: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
feedbackSchema.index({ tutor_id: 1 });
feedbackSchema.index({ user_id: 1 });

const FeedbackModel = mongoose.model('Feedback', feedbackSchema);
export default FeedbackModel;
