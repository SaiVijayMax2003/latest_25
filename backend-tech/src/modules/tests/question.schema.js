import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question_id: {
    type: String,
    unique: true,
    trim: true,
    validate: {
      validator: function(questionId) {
        // Pattern: M001, P001, C001, B001 (letter followed by 3 digits)
        const pattern = /^[MPCB]\d{3}$/;
        return pattern.test(questionId);
      },
      message: 'Question ID must be in format: M001, P001, C001, or B001 (letter followed by 3 digits)'
    }
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(options) {
        return options && options.length >= 2;
      },
      message: 'Question must have at least 2 options'
    }
  },
  ans: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['maths', 'physics', 'chemistry', 'biology'],
    lowercase: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
questionSchema.index({ question_id: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ topic: 1 });
questionSchema.index({ type: 1, topic: 1 });

// Virtual for checking if the answer is valid
questionSchema.virtual('isValidAnswer').get(function() {
  return this.options.includes(this.ans);
});

// Pre-save middleware to validate answer
questionSchema.pre('save', function(next) {
  if (!this.options.includes(this.ans)) {
    return next(new Error('Answer must be one of the provided options'));
  }
  
  // Validate that question_id prefix matches the type
  const typeToPrefix = {
    'maths': 'M',
    'physics': 'P', 
    'chemistry': 'C',
    'biology': 'B'
  };
  
  const expectedPrefix = typeToPrefix[this.type];
  const actualPrefix = this.question_id.charAt(0);
  
  if (actualPrefix !== expectedPrefix) {
    return next(new Error(`Question ID prefix '${actualPrefix}' does not match type '${this.type}'. Expected prefix: '${expectedPrefix}'`));
  }
  
  next();
});

// Static method to find questions by type
questionSchema.statics.findByType = function(type) {
  return this.find({ type: type.toLowerCase() });
};

// Static method to find questions by topic
questionSchema.statics.findByTopic = function(topic) {
  return this.find({ topic: { $regex: topic, $options: 'i' } });
};

// Static method to find questions by type and topic
questionSchema.statics.findByTypeAndTopic = function(type, topic) {
  return this.find({ 
    type: type.toLowerCase(), 
    topic: { $regex: topic, $options: 'i' } 
  });
};

const Question = mongoose.model('Question', questionSchema);

export default Question;
