import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getProcessedResume, getProcessingStatus, getUserResumes, processResume, retryProcessing, testAIConnection, uploadResumeToCloudinary } from "../controllers/resume.controller.js";
import upload from "../middlewares/upload.middleware.js";

const resumeRouter = express.Router();

resumeRouter.use(authMiddleware);

// STEP 1: Upload Resume (Immediate response + background processing starts)
resumeRouter.post("/uploadResumeToCloudinary", upload.single("resume"),uploadResumeToCloudinary)

// STEP 2: Check Processing Status (Real-time polling)
// GET /api/resumes/:resumeId/status
resumeRouter.get('/:resumeId/status', getProcessingStatus);

// STEP 3: Get Final Processed Results (After completion)
// GET /api/resumes/:resumeId/processed
resumeRouter.get('/:resumeId/processed', getProcessedResume);

// ========== UTILITY ROUTES ==========

// Retry failed processing
// POST /api/resumes/:resumeId/retry
resumeRouter.post('/:resumeId/retry', retryProcessing);

// Manual processing trigger (alternative to automatic background processing)
// POST /api/resumes/:resumeId/process
resumeRouter.post('/:resumeId/process', processResume);

// Get all user resumes with status
// GET /api/resumes
resumeRouter.get('/', getUserResumes);


// ========== ADMIN/DEBUG ROUTES ==========

// Test AI connection
// GET /api/resumes/test/ai-connection
resumeRouter.get('/test/ai-connection', testAIConnection);

// ========== ADDITIONAL ROUTES (Future features) ==========

// Get specific resume by ID (basic info)
// GET /api/resumes/:resumeId
resumeRouter.get('/:resumeId', async (req, res) => {
  // Basic resume info without processing status details
  // Implementation needed
});

// Update resume title/metadata
// PATCH /api/resumes/:resumeId
resumeRouter.patch('/:resumeId', async (req, res) => {
  // Update resume title, isPrimary flag, etc.
  // Implementation needed
});

// Delete resume
// DELETE /api/resumes/:resumeId
resumeRouter.delete('/:resumeId', async (req, res) => {
  // Delete resume and associated files
  // Implementation needed
});

// Set primary resume
// POST /api/resumes/:resumeId/set-primary
resumeRouter.post('/:resumeId/set-primary', async (req, res) => {
  // Set a resume as primary
  // Implementation needed
});

// Export resume as PDF/JSON
// GET /api/resumes/:resumeId/export/:format
resumeRouter.get('/:resumeId/export/:format', async (req, res) => {
  // Export in different formats
  // Implementation needed
});

// Reprocess with different AI model
// POST /api/resumes/:resumeId/reprocess
resumeRouter.post('/:resumeId/reprocess', async (req, res) => {
  // Reprocess with different model (fast/balanced/detailed)
  // Implementation needed
});

export default resumeRouter;




/**
 * 1. Get - /resumes - Get all resumes for logged-in user
 * 2. Get - /resumes/:id - Get specific resume by ID
 * 3. Delete - /resumes/:id - Delete specific resume by ID
 * 4. Patch - /resumes/:id/setPrimary - Set a specific resume as primary
 * 5. /resumes/:id/parse - Trigger AI parsing for a specific resume
 * 
 */