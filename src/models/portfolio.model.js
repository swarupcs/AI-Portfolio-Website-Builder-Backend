import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Portfolio Website',
    },

    // Generated website content
    content: {
      hero: {
        headline: String,
        subheading: String,
        cta: String,
      },
      about: {
        introduction: String,
        highlights: [String],
      },
      services: [
        {
          title: String,
          description: String,
          icon: String,
        },
      ],
      contact: {
        cta: String,
        description: String,
      },
    },

    // Enhanced projects for web display
    enhancedProjects: [
      {
        name: String,
        tagline: String,
        description: String,
        challenge: String,
        solution: String,
        technologies: [String],
        features: [String],
        metrics: [String],
        url: String,
        github: String,
        images: {
          hero: String,
          gallery: [String],
        },
      },
    ],

    // Website structure and layout
    structure: {
      type: {
        type: String,
        enum: ['developer', 'designer', 'business', 'general'],
        default: 'general',
      },
      sections: [String], // ['hero', 'about', 'skills', 'projects', 'experience', 'contact']
      layout: String, // 'code-focused', 'visual-heavy', 'professional-clean'
      features: [String], // ['github-integration', 'live-demos', 'testimonials']
      colorScheme: String, // 'dark-modern', 'creative-vibrant', 'corporate-blue'
      navigation: String, // 'fixed-header', 'side-menu', 'top-menu'
    },

    // Visual theme and styling
    theme: {
      name: String,
      description: String,
      colors: {
        primary: String,
        secondary: String,
        accent: String,
        background: String,
        surface: String,
        text: String,
        textSecondary: String,
      },
      typography: {
        primary: String,
        code: String,
        accent: String,
      },
      layout: String,
      animations: String,
    },

    // Generated website files
    template: {
      html: {
        type: String,
        required: true,
      },
      css: {
        type: String,
        required: true,
      },
      javascript: {
        type: String,
        required: true,
      },
    },

    // Generation and processing metadata
    generation: {
      contentConfidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      processingTime: Number, // in milliseconds
      preferences: mongoose.Schema.Types.Mixed, // User preferences used
      generatedAt: {
        type: Date,
        default: Date.now,
      },
      lastCustomizedAt: Date,
      lastRegeneratedAt: Date,
      version: {
        type: String,
        default: '1.0',
      },
    },

    // Portfolio status and visibility
    status: {
      type: String,
      enum: [
        'generating',
        'generated',
        'customized',
        'regenerated',
        'published',
      ],
      default: 'generating',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true, // Only require uniqueness for non-null values
    },

    // Analytics and performance
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      lastViewedAt: Date,
      deployments: [
        {
          platform: String, // 'netlify', 'vercel', 'github-pages'
          url: String,
          deployedAt: Date,
          status: String,
        },
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better query performance
portfolioSchema.index({ user: 1, createdAt: -1 });
portfolioSchema.index({ user: 1, status: 1 });
portfolioSchema.index({ slug: 1 });
portfolioSchema.index({ isPublic: 1, status: 1 });

// Instance methods
portfolioSchema.methods.isReadyForPreview = function () {
  return (
    ['generated', 'customized', 'regenerated'].includes(this.status) &&
    this.template.html &&
    this.template.css &&
    this.template.javascript
  );
};

portfolioSchema.methods.generateSlug = function () {
  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  this.slug = `${baseSlug}-${this._id.toString().slice(-6)}`;
  return this.slug;
};

// Static methods
portfolioSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isPublic: true });
};

portfolioSchema.statics.findUserPortfolios = function (userId, options = {}) {
  const { status, limit = 10, skip = 0 } = options;
  const query = { user: userId };

  if (status) query.status = status;

  return this.find(query)
    .populate('resume', 'title processing.status')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Pre-save middleware
portfolioSchema.pre('save', function (next) {
  // Generate slug if not exists and portfolio is public
  if (this.isPublic && !this.slug) {
    this.generateSlug();
  }

  // Update processing status
  if (this.template.html && this.template.css && this.template.javascript) {
    if (this.status === 'generating') {
      this.status = 'generated';
    }
  }

  next();
});

export const Portfolio = mongoose.model('Portfolio', portfolioSchema);
