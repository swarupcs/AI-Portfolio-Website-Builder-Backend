import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createPortfolio, getPortfolioPreview, getPortfolioStatus } from './../controllers/portfolio.controller.js';


const portfolioRouter = express.Router();

portfolioRouter.use(authMiddleware);



// ========== MAIN WORKFLOW ROUTES ==========

portfolioRouter.post('/createPortfolio', createPortfolio);
portfolioRouter.get("/:id/status", getPortfolioStatus);
portfolioRouter.get("/:id/preview", getPortfolioPreview);

// ========== ADDITIONAL UTILITY ROUTES ==========




export default portfolioRouter;
