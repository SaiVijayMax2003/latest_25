import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { users_collection } from '../../config/collection.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'operation', 'sales', 'student', 'tutor', 'operations_lead', 'sales_lead', 'accounts'],
    required: true
  },
  password: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  modified_at: [{
    type: Date,
    default: Date.now
  }],
  no_of_assignees: {
    type: Number,
    default: 0
  },
  is_order_eligible: {
    type: Boolean,
    default:false
  }
}, {
  collection: users_collection
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check MongoDB connection
const checkConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not established');
  }
};


userSchema.statics.generateUserId = async function() {
  try {
    checkConnection();

    // Find the user with the highest user_id (as a number, even if stored as string)
    const result = await this.aggregate([
      {
        $addFields: {
          user_id_num: { $toInt: '$user_id' }
        }
      },
      { $sort: { user_id_num: -1 } },
      { $limit: 1 }
    ]);
    const lastUser = result[0];

    if (!lastUser || !lastUser.user_id) {
      return '50001';
    }
    const lastId = parseInt(lastUser.user_id, 10);
    if (isNaN(lastId)) {
      return '50001';
    }
    return (lastId + 1).toString();
  } catch (error) {
    return '50001';
  }
};

// Add connection check to model methods
userSchema.statics.findOne = async function(...args) {
  checkConnection();
  return mongoose.Model.findOne.apply(this, args);
};

userSchema.statics.findOneAndDelete = async function(...args) {
  checkConnection();
  return mongoose.Model.findOneAndDelete.apply(this, args);
};

const User = mongoose.model('User', userSchema);

export default User; 