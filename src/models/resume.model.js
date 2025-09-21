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

    // Updated: Nested file object instead of separate fields
    file: {
      url: { type: String, required: true }, // was: fileUrl
      publicId: { type: String, required: true }, // was: filePublicId
      format: { type: String }, // was: fileFormat
      size: { type: Number }, // was: fileSize
    },

    // Updated: More detailed processing status
    processing: {
      status: {
        type: String,
        enum: ['uploaded', 'extracting', 'parsing', 'completed', 'failed'],
        default: 'uploaded',
      },
      error: { type: String },
      attempts: { type: Number, default: 0 },
      lastProcessedAt: { type: Date },
    },

    // Updated: Enhanced content structure instead of simple aiData
    content: {
      extractedText: { type: String },

      structured: {
        // Enhanced personal info
        personalInfo: {
          name: String,
          email: String,
          phone: String,
          location: String,
          linkedin: String,
          github: String,
          website: String,
        },

        summary: String,

        // Enhanced skills structure
        skills: {
          technical: [String],
          soft: [String],
          languages: [String],
        },

        // Enhanced experience structure
        experience: [
          {
            company: String,
            position: String, // was: role
            location: String,
            startDate: String, // was: part of duration
            endDate: String, // was: part of duration
            current: { type: Boolean, default: false },
            description: String,
            achievements: [String], // new field
            technologies: [String], // new field
          },
        ],

        // Enhanced education structure
        education: [
          {
            institution: String,
            degree: String,
            field: String, // new field
            location: String, // new field
            startDate: String, // was: year (start)
            endDate: String, // was: year (end)
            gpa: String, // new field
            honors: [String], // new field
          },
        ],

        // New sections
        projects: [
          {
            name: String,
            description: String,
            technologies: [String],
            url: String,
            github: String,
            startDate: String,
            endDate: String,
          },
        ],

        certifications: [
          {
            name: String,
            issuer: String,
            date: String,
            expiryDate: String,
            credentialId: String,
          },
        ],
      },

      // AI processing metadata
      aiMetadata: {
        model: String, // e.g., "gpt-4"
        confidence: Number,
        processingTime: Number,
        tokensUsed: Number,
        version: String,
      },
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ user: 1, isPrimary: 1 });
resumeSchema.index({ 'processing.status': 1 });

// Instance methods
resumeSchema.methods.isFullyProcessed = function () {
  return (
    this.processing.status === 'completed' &&
    this.content.structured &&
    Object.keys(this.content.structured).length > 0
  );
};

// Static methods
resumeSchema.statics.findPrimaryResume = function (userId) {
  return this.findOne({
    user: userId,
    isPrimary: true,
    'processing.status': 'completed',
  });
};

export const Resume = mongoose.model('Resume', resumeSchema);
