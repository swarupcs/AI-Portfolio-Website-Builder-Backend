import { Portfolio } from '../models/portfolio.model.js';
import { Resume } from '../models/resume.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

import { backgroundJobService } from '../services/portfolio-background-job.service.js';
import { portfolioService } from '../services/portfolio-generate.service.js';

// POST /api/portfolios - Create Portfolio
export const createPortfolio = asyncHandler(async (req, res) => {
  const { resume_id, title, user_preferences } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  if (!resume_id) {
    return new ApiResponse(400, 'Resume ID is required').send(res);
  }

  // Validate user owns the resume
  const resume = await Resume.findOne({
    _id: resume_id,
    user: userId,
  });

  if (!resume) {
    return new ApiResponse(404, 'Resume not found or access denied').send(res);
  }

  // Check if resume is ready for portfolio generation
  if (resume.processing?.status !== 'completed') {
    return new ApiResponse(
      400,
      'Resume must be fully processed before creating portfolio'
    ).send(res);
  }

  try {
    // Create Portfolio document with minimal data
    const portfolio = new Portfolio({
      user: userId,
      resume: resume_id,
      title: title || `${resume.title} - Portfolio`,
      status: 'generating',
      generation: {
        preferences: user_preferences || {},
        generatedAt: new Date(),
      },
    });

    await portfolio.save();

    // Queue background job immediately (don't wait)
    backgroundJobService.queuePortfolioGeneration(portfolio._id);

    // Return portfolio_id immediately
    return new ApiResponse(201, 'Portfolio creation initiated', {
      portfolio_id: portfolio._id,
      status: portfolio.status,
      estimated_completion_time: '30-45 seconds',
      status_check_url: `/api/portfolios/${portfolio._id}/status`,
    }).send(res);
  } catch (error) {
    console.error('Portfolio creation error:', error);
    return new ApiResponse(500, 'Failed to create portfolio').send(res);
  }
});

// GET /api/portfolios/:id/status - Status Check
export const getPortfolioStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: id,
    user: userId,
  }).select('status generation analytics createdAt updatedAt');

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  const response = {
    portfolio_id: portfolio._id,
    status: portfolio.status,
    created_at: portfolio.createdAt,
    updated_at: portfolio.updatedAt,
  };

  // Add processing metadata based on status
  if (portfolio.status === 'generating') {
    const elapsed = Date.now() - portfolio.createdAt.getTime();
    response.processing = {
      elapsed_time: Math.round(elapsed / 1000), // seconds
      estimated_remaining: Math.max(0, 45 - Math.round(elapsed / 1000)),
      current_step: portfolioService.getCurrentProcessingStep(elapsed),
    };
  } else if (
    ['generated', 'customized', 'regenerated'].includes(portfolio.status)
  ) {
    response.processing = {
      completed_at: portfolio.generation?.generatedAt,
      processing_time: portfolio.generation?.processingTime,
      confidence: portfolio.generation?.contentConfidence,
    };
    response.preview_url = `/api/portfolios/${portfolio._id}/preview`;
  } else if (portfolio.status === 'error') {
    response.error = {
      message: 'Portfolio generation failed',
      retry_url: `/api/portfolios/${portfolio._id}/regenerate`,
    };
  }

  return new ApiResponse(200, 'Portfolio status retrieved', response).send(res);
});

// GET /api/portfolios/:id/preview - Preview Generated Portfolio
export const getPortfolioPreview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: id,
    user: userId,
  });

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  // Verify portfolio is ready for preview
  if (!portfolio.isReadyForPreview()) {
    return new ApiResponse(
      400,
      `Portfolio is not ready for preview. Current status: ${portfolio.status}`
    ).send(res);
  }

  // Update analytics
  portfolio.analytics.views += 1;
  portfolio.analytics.lastViewedAt = new Date();
  await portfolio.save();

  // Return the complete HTML with embedded CSS and JS
  const htmlContent = portfolioService.generateCompleteHTML(portfolio);

  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

// PUT /api/portfolios/:id/publish - Make Portfolio Public
export const publishPortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: id,
    user: userId,
  });

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  if (!portfolio.isReadyForPreview()) {
    return new ApiResponse(
      400,
      'Portfolio must be generated before publishing'
    ).send(res);
  }

  // Generate unique slug if doesn't exist
  if (!portfolio.slug) {
    portfolio.generateSlug();
  }

  // Make portfolio public
  portfolio.isPublic = true;
  portfolio.status = 'published';

  // Track deployment
  portfolio.analytics.deployments.push({
    platform: 'portfolio-platform',
    url: `/portfolio/${portfolio.slug}`,
    deployedAt: new Date(),
    status: 'active',
  });

  await portfolio.save();

  return new ApiResponse(200, 'Portfolio published successfully', {
    portfolio_id: portfolio._id,
    slug: portfolio.slug,
    public_url: `/portfolio/${portfolio.slug}`,
    published_at: new Date(),
    analytics: {
      views: portfolio.analytics.views,
      deployments: portfolio.analytics.deployments.length,
    },
  }).send(res);
});

// GET /api/portfolios - Get User's Portfolios
export const getUserPortfolios = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { status, limit = 10, skip = 0 } = req.query;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolios = await Portfolio.findUserPortfolios(userId, {
    status,
    limit: parseInt(limit),
    skip: parseInt(skip),
  });

  const total = await Portfolio.countDocuments({
    user: userId,
    ...(status && { status }),
  });

  const portfolioData = portfolios.map((portfolio) => ({
    id: portfolio._id,
    title: portfolio.title,
    status: portfolio.status,
    isPublic: portfolio.isPublic,
    slug: portfolio.slug,
    analytics: {
      views: portfolio.analytics.views,
      lastViewedAt: portfolio.analytics.lastViewedAt,
    },
    resume: {
      id: portfolio.resume._id,
      title: portfolio.resume.title,
      status: portfolio.resume.processing?.status,
    },
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt,
  }));

  return new ApiResponse(200, 'User portfolios retrieved', {
    portfolios: portfolioData,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      hasMore: parseInt(skip) + parseInt(limit) < total,
    },
  }).send(res);
});

// GET /api/portfolios/:id - Get Portfolio Details
export const getPortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: id,
    user: userId,
  }).populate([
    { path: 'user', select: 'name email' },
    { path: 'resume', select: 'title processing.status content.aiMetadata' },
  ]);

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  return new ApiResponse(200, 'Portfolio details retrieved', {
    portfolio: {
      id: portfolio._id,
      title: portfolio.title,
      status: portfolio.status,
      isPublic: portfolio.isPublic,
      slug: portfolio.slug,
      content: portfolio.content,
      enhancedProjects: portfolio.enhancedProjects,
      structure: portfolio.structure,
      theme: portfolio.theme,
      generation: portfolio.generation,
      analytics: portfolio.analytics,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    },
    resume: {
      id: portfolio.resume._id,
      title: portfolio.resume.title,
      confidence: portfolio.resume.content?.aiMetadata?.confidence,
      status: portfolio.resume.processing?.status,
    },
    actions: {
      preview: `/api/portfolios/${portfolio._id}/preview`,
      customize: `/api/portfolios/${portfolio._id}/customize`,
      export: `/api/portfolios/${portfolio._id}/export`,
      regenerate: `/api/portfolios/${portfolio._id}/regenerate`,
      ...(portfolio.isPublic && {
        public_url: `/portfolio/${portfolio.slug}`,
      }),
    },
  }).send(res);
});

// PUT /api/portfolios/:id/regenerate - Regenerate Portfolio
export const regeneratePortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_preferences } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: id,
    user: userId,
  });

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  // Update portfolio for regeneration
  portfolio.status = 'generating';
  portfolio.generation.preferences = {
    ...portfolio.generation.preferences,
    ...user_preferences,
  };
  portfolio.generation.lastRegeneratedAt = new Date();

  await portfolio.save();

  // Queue background regeneration job
  backgroundJobService.queuePortfolioGeneration(portfolio._id, true);

  return new ApiResponse(200, 'Portfolio regeneration initiated', {
    portfolio_id: portfolio._id,
    status: portfolio.status,
    estimated_completion_time: '30-45 seconds',
    status_check_url: `/api/portfolios/${portfolio._id}/status`,
  }).send(res);
});

// DELETE /api/portfolios/:id - Delete Portfolio
export const deletePortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOneAndDelete({
    _id: id,
    user: userId,
  });

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  return new ApiResponse(200, 'Portfolio deleted successfully', {
    deleted_portfolio_id: id,
  }).send(res);
});
