import mongoose from 'mongoose';

const fileUploadSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  linkedToStudent: { type: Boolean, default: false },
  studentId: { type: Number, default: null },
});

export default mongoose.model('FileUpload', fileUploadSchema); 