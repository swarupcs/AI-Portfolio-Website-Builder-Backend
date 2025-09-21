import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  customizePortfolio,
  exportPortfolio,
  generatePortfolio,
  getPortfolio,
  getUserPortfolios,
  previewPortfolio,
  regeneratePortfolio,
} from '../controllers/portfolio.controller.js';

const portfolioRouter = express.Router();

portfolioRouter.use(authMiddleware);

// ========== MAIN WORKFLOW ROUTES ==========

// Generate portfolio from resume
// POST /api/portfolio/generate/:resumeId
portfolioRouter.post('/generate/:resumeId', generatePortfolio);

// Get portfolio details
// GET /api/portfolio/:portfolioId
portfolioRouter.get('/:portfolioId', getPortfolio);

// Preview portfolio website (returns HTML)
// GET /api/portfolio/:portfolioId/preview
portfolioRouter.get('/:portfolioId/preview', previewPortfolio);

// Customize portfolio (content, theme, structure)
// PUT /api/portfolio/:portfolioId/customize
portfolioRouter.put('/:portfolioId/customize', customizePortfolio);

// Export portfolio files
// GET /api/portfolio/:portfolioId/export?format=files|zip
portfolioRouter.get('/:portfolioId/export', exportPortfolio);

// Regenerate portfolio with new preferences
// POST /api/portfolio/:portfolioId/regenerate
portfolioRouter.post('/:portfolioId/regenerate', regeneratePortfolio);

// Get all user portfolios
// GET /api/portfolio?page=1&limit=10&status=generated
portfolioRouter.get('/', getUserPortfolios);

// ========== ADDITIONAL UTILITY ROUTES ==========

// Public portfolio view (no auth required)
// GET /api/portfolio/public/:slug
portfolioRouter.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const portfolio = await Portfolio.findBySlug(slug);

    if (!portfolio) {
      return new ApiResponse(404, 'Portfolio not found').send(res);
    }

    // Increment view count
    portfolio.analytics.views += 1;
    portfolio.analytics.lastViewedAt = new Date();
    await portfolio.save();

    // Return HTML for public viewing
    res.setHeader('Content-Type', 'text/html');
    return res.send(portfolio.template.html);
  } catch (error) {
    return new ApiResponse(500, 'Failed to load portfolio').send(res);
  }
});

// Toggle portfolio visibility
// POST /api/portfolio/:portfolioId/toggle-visibility
portfolioRouter.post('/:portfolioId/toggle-visibility', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const userId = req.user?._id;

    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      user: userId,
    });

    if (!portfolio) {
      return new ApiResponse(404, 'Portfolio not found').send(res);
    }

    portfolio.isPublic = !portfolio.isPublic;

    // Generate slug if making public
    if (portfolio.isPublic && !portfolio.slug) {
      portfolio.generateSlug();
    }

    await portfolio.save();

    return new ApiResponse(
      200,
      `Portfolio ${
        portfolio.isPublic ? 'published' : 'unpublished'
      } successfully`,
      {
        portfolio: {
          id: portfolio._id,
          isPublic: portfolio.isPublic,
          slug: portfolio.slug,
          publicUrl: portfolio.isPublic
            ? `/api/portfolio/public/${portfolio.slug}`
            : null,
        },
      }
    ).send(res);
  } catch (error) {
    return new ApiResponse(500, 'Failed to toggle visibility').send(res);
  }
});

// Delete portfolio
// DELETE /api/portfolio/:portfolioId
portfolioRouter.delete('/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const userId = req.user?._id;

    const portfolio = await Portfolio.findOneAndDelete({
      _id: portfolioId,
      user: userId,
    });

    if (!portfolio) {
      return new ApiResponse(404, 'Portfolio not found').send(res);
    }

    return new ApiResponse(200, 'Portfolio deleted successfully', {
      deletedPortfolio: {
        id: portfolio._id,
        title: portfolio.title,
      },
    }).send(res);
  } catch (error) {
    return new ApiResponse(500, 'Failed to delete portfolio').send(res);
  }
});

// Get portfolio analytics
// GET /api/portfolio/:portfolioId/analytics
portfolioRouter.get('/:portfolioId/analytics', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const userId = req.user?._id;

    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      user: userId,
    }).select('analytics title isPublic createdAt');

    if (!portfolio) {
      return new ApiResponse(404, 'Portfolio not found').send(res);
    }

    return new ApiResponse(200, 'Portfolio analytics retrieved', {
      analytics: {
        views: portfolio.analytics.views,
        lastViewedAt: portfolio.analytics.lastViewedAt,
        isPublic: portfolio.isPublic,
        createdAt: portfolio.createdAt,
        deployments: portfolio.analytics.deployments,
      },
      insights: {
        dailyViews: Math.round(
          portfolio.analytics.views /
            Math.max(
              1,
              Math.ceil(
                (Date.now() - portfolio.createdAt) / (1000 * 60 * 60 * 24)
              )
            )
        ),
        status:
          portfolio.analytics.views === 0
            ? 'No views yet'
            : portfolio.analytics.views < 10
            ? 'Getting started'
            : 'Good traction',
      },
    }).send(res);
  } catch (error) {
    return new ApiResponse(500, 'Failed to get analytics').send(res);
  }
});

export default portfolioRouter;
