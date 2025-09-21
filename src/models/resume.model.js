import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Resume',
    },
    fileUrl: {
      type: String,
      required: true, // Cloudinary secure URL
    },
    filePublicId: {
      type: String,
      required: true, // Cloudinary ID
    },
    fileFormat: {
      type: String, // e.g., "pdf", "docx"
    },
    fileSize: {
      type: Number, // in bytes
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'parsed', 'error'],
      default: 'uploaded',
    },
    aiData: {
      extractedText: { type: String },
      parsed: {
        name: String,
        email: String,
        phone: String,
        skills: [String],
        education: [
          {
            institution: String,
            degree: String,
            year: String,
          },
        ],
        experience: [
          {
            company: String,
            role: String,
            duration: String,
            description: String,
          },
        ],
      },
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, createdAt: -1 });

export const Resume = mongoose.model('Resume', resumeSchema);
