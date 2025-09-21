import { Resume } from '../models/resume.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  extractText,
  parseWithAI,
  calculateConfidence,
  testGroqConnection,
} from '../services/resume-processing.service.js';

// STEP 1: Upload Resume (Fast Response)
export const uploadResumeToCloudinary = asyncHandler(async (req, res) => {
  if (!req.file) {
    return new ApiResponse(400, 'No file uploaded').send(res);
  }

  const { path: fileUrl, filename: filePublicId, mimetype, size } = req.file;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedTypes.includes(mimetype)) {
    return new ApiResponse(
      400,
      'Invalid file type. Only PDF and DOCX files are allowed'
    ).send(res);
  }

  try {
    // Handle primary resume logic
    const isPrimary =
      req.body.isPrimary === 'true' || req.body.isPrimary === true;

    if (isPrimary) {
      await Resume.updateMany(
        { user: userId, isPrimary: true },
        { isPrimary: false }
      );
    }

    // Create resume record with updated schema structure
    const resume = await Resume.create({
      user: userId,
      title: req.body.title || 'Untitled Resume',
      file: {
        url: fileUrl,
        publicId: filePublicId,
        format: mimetype?.split('/')[1],
        size: size,
      },
      processing: {
        status: 'uploaded',
        attempts: 0,
        lastProcessedAt: null,
        error: null,
      },
      content: {
        extractedText: null,
        structured: {
          personalInfo: {},
          summary: null,
          skills: { technical: [], soft: [], languages: [] },
          experience: [],
          education: [],
          projects: [],
          certifications: [],
        },
        aiMetadata: { version: '1.0' },
      },
      isPrimary: isPrimary,
    });

    await resume.populate('user', 'name email');

    // 🚀 Start processing in background (async, non-blocking)
    setImmediate(async () => {
      try {
        await processResumeInBackground(resume._id);
      } catch (error) {
        console.error('Background processing failed:', error);
        // Error handling is done inside processResumeInBackground
      }
    });

    // ✅ Immediate response to user
    return new ApiResponse(
      201,
      '✅ Resume uploaded successfully! Processing started.',
      {
        resume: {
          id: resume._id,
          title: resume.title,
          file: {
            url: resume.file.url,
            format: resume.file.format,
            size: resume.file.size,
          },
          processing: {
            status: 'uploaded',
            progress: 10,
          },
          isPrimary: resume.isPrimary,
          user: resume.user,
          createdAt: resume.createdAt,
        },
        nextSteps: {
          checkStatus: `/api/resumes/${resume._id}/status`,
          statusPolling: 'Check status every 2-3 seconds',
          estimatedTime: '30-60 seconds',
        },
      }
    ).send(res);
  } catch (error) {
    console.error('Resume upload error:', error);
    return new ApiResponse(500, 'Failed to upload resume', {
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }).send(res);
  }
});

// STEP 2: Background Processing Function (Using function-based service)
async function processResumeInBackground(resumeId) {
  try {
    console.log(`🚀 Starting background processing for resume ${resumeId}`);

    const processingStartTime = Date.now();

    // Update status to extracting
    await Resume.findByIdAndUpdate(resumeId, {
      'processing.status': 'extracting',
      'processing.attempts': 1,
      'processing.lastProcessedAt': new Date(),
      'processing.error': null,
    });

    console.log(`📄 Extracting text for resume ${resumeId}`);

    // Get resume data
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    // Step 1: Extract text from file using service function
    const extractedText = await extractText(
      resume.file.url,
      resume.file.format
    );

    // Update with extracted text and change status to parsing
    await Resume.findByIdAndUpdate(resumeId, {
      'processing.status': 'parsing',
      'content.extractedText': extractedText,
    });

    console.log(`🤖 Parsing with AI for resume ${resumeId}`);

    // Step 2: Parse with AI using service function
    const parsedResult = await parseWithAI(extractedText, 'balanced');

    const processingTime = Date.now() - processingStartTime;

    // Step 3: Save final results
    await Resume.findByIdAndUpdate(resumeId, {
      'processing.status': 'completed',
      'processing.lastProcessedAt': new Date(),
      'content.structured': parsedResult.structured,
      'content.aiMetadata': {
        model: parsedResult.model,
        confidence: parsedResult.confidence,
        processingTime: processingTime,
        tokensUsed: parsedResult.tokensUsed,
        version: '1.0',
      },
    });

    console.log(
      `✅ Background processing completed for resume ${resumeId} in ${processingTime}ms`
    );

    // 🎯 Optional: Send notification to frontend (implement if needed)
    // await notifyFrontend(resume.user, 'resume-processed', { resumeId, status: 'completed' });
  } catch (error) {
    console.error(
      `❌ Background processing failed for resume ${resumeId}:`,
      error
    );

    // Update status to failed
    await Resume.findByIdAndUpdate(resumeId, {
      'processing.status': 'failed',
      'processing.error': error.message,
      'processing.lastProcessedAt': new Date(),
    });

    // 🎯 Optional: Send error notification to frontend
    // await notifyFrontend(resume.user, 'resume-processing-failed', { resumeId, error: error.message });
  }
}

// STEP 3: Get Processing Status (Real-time Polling)
export const getProcessingStatus = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    user: userId,
  }).select('processing content.aiMetadata title createdAt updatedAt');

  if (!resume) {
    return new ApiResponse(404, 'Resume not found').send(res);
  }

  // Calculate progress percentage
  const getProgressData = (status) => {
    const statusMap = {
      uploaded: {
        progress: 10,
        message: 'Resume uploaded, starting extraction...',
      },
      extracting: { progress: 30, message: 'Extracting text from resume...' },
      parsing: { progress: 70, message: 'AI is analyzing your resume...' },
      completed: { progress: 100, message: 'Resume processed successfully!' },
      failed: { progress: 0, message: 'Processing failed. You can retry.' },
    };
    return statusMap[status] || { progress: 0, message: 'Unknown status' };
  };

  const progressData = getProgressData(resume.processing.status);

  return new ApiResponse(200, 'Processing status retrieved', {
    resumeId: resumeId,
    status: resume.processing.status,
    progress: progressData.progress,
    message: progressData.message,
    isComplete: resume.processing.status === 'completed',
    isFailed: resume.processing.status === 'failed',
    canRetry: resume.processing.status === 'failed',
    processing: {
      lastProcessedAt: resume.processing.lastProcessedAt,
      attempts: resume.processing.attempts,
      error: resume.processing.error,
    },
    aiMetadata: resume.content?.aiMetadata || null,
    timestamps: {
      uploaded: resume.createdAt,
      lastUpdated: resume.updatedAt,
    },
    // Frontend polling guidance
    polling: {
      shouldContinue: !['completed', 'failed'].includes(
        resume.processing.status
      ),
      interval: 2000, // Poll every 2 seconds
      maxWaitTime: 120000, // Stop polling after 2 minutes
    },
  }).send(res);
});

// STEP 4: Get Final Results (After Processing Complete)
export const getProcessedResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    user: userId,
  }).populate('user', 'name email');

  if (!resume) {
    return new ApiResponse(404, 'Resume not found').send(res);
  }

  if (resume.processing.status !== 'completed') {
    return new ApiResponse(400, 'Resume processing not completed yet', {
      currentStatus: resume.processing.status,
      checkStatusEndpoint: `/api/resumes/${resumeId}/status`,
    }).send(res);
  }

  return new ApiResponse(200, 'Processed resume data retrieved', {
    resume: {
      id: resume._id,
      title: resume.title,
      file: resume.file,
      processing: resume.processing,
      content: {
        structured: resume.content.structured,
        aiMetadata: resume.content.aiMetadata,
      },
      isPrimary: resume.isPrimary,
      user: resume.user,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    },
    actions: {
      editResume: `/api/resumes/${resumeId}/edit`,
      createPortfolio: `/api/portfolios/create`,
      downloadPDF: `/api/resumes/${resumeId}/export/pdf`,
    },
  }).send(res);
});

// STEP 5: Retry Failed Processing
export const retryProcessing = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    user: userId,
  });

  if (!resume) {
    return new ApiResponse(404, 'Resume not found').send(res);
  }

  // Only allow retry for failed or uploaded status
  if (!['failed', 'uploaded'].includes(resume.processing.status)) {
    return new ApiResponse(
      400,
      `Cannot retry. Current status: ${resume.processing.status}`,
      {
        currentStatus: resume.processing.status,
        allowedStatuses: ['failed', 'uploaded'],
      }
    ).send(res);
  }

  try {
    // Reset status and start background processing
    await Resume.findByIdAndUpdate(resumeId, {
      'processing.status': 'uploaded',
      'processing.error': null,
    });

    // Start background processing
    setImmediate(async () => {
      try {
        await processResumeInBackground(resumeId);
      } catch (error) {
        console.error('Retry processing failed:', error);
      }
    });

    return new ApiResponse(200, '🔄 Processing restarted successfully', {
      resumeId: resumeId,
      status: 'uploaded',
      message: 'Processing has been restarted. Check status for updates.',
      checkStatus: `/api/resumes/${resumeId}/status`,
    }).send(res);
  } catch (error) {
    console.error('Retry processing error:', error);
    return new ApiResponse(500, 'Failed to restart processing', {
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }).send(res);
  }
});

// STEP 6: Manual Processing Trigger (Alternative to background processing)
export const processResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user?._id;
  const { model = 'balanced' } = req.body;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    user: userId,
  });

  if (!resume) {
    return new ApiResponse(404, 'Resume not found').send(res);
  }

  // Check if already processing
  if (['extracting', 'parsing'].includes(resume.processing.status)) {
    return new ApiResponse(409, 'Resume is already being processed', {
      currentStatus: resume.processing.status,
      lastProcessedAt: resume.processing.lastProcessedAt,
    }).send(res);
  }

  // Check if already completed
  if (resume.processing.status === 'completed') {
    return new ApiResponse(200, 'Resume already processed', {
      resume: {
        id: resume._id,
        processing: resume.processing,
        content: resume.content,
      },
      reprocessOptions: {
        endpoint: `/api/resumes/${resumeId}/reprocess`,
        description:
          'Use reprocess endpoint to process again with different settings',
      },
    }).send(res);
  }

  try {
    const processingStartTime = Date.now();

    // Update status to extracting
    await Resume.findByIdAndUpdate(resumeId, {
      'processing.status': 'extracting',
      'processing.attempts': resume.processing.attempts + 1,
      'processing.lastProcessedAt': new Date(),
      'processing.error': null,
    });

    // Step 1: Extract text using service function
    const extractedText = await extractText(
      resume.file.url,
      resume.file.format
    );

    // Update status to parsing
    await Resume.findByIdAndUpdate(resumeId, {
      'processing.status': 'parsing',
      'content.extractedText': extractedText,
    });

    // Step 2: Parse with AI using service function
    const parsedResult = await parseWithAI(extractedText, model);

    const processingTime = Date.now() - processingStartTime;

    // Step 3: Save final results
    const updatedResume = await Resume.findByIdAndUpdate(
      resumeId,
      {
        'processing.status': 'completed',
        'processing.lastProcessedAt': new Date(),
        'content.structured': parsedResult.structured,
        'content.aiMetadata': {
          model: parsedResult.model,
          confidence: parsedResult.confidence,
          processingTime: processingTime,
          tokensUsed: parsedResult.tokensUsed,
          version: '1.0',
        },
      },
      { new: true }
    ).populate('user', 'name email');

    return new ApiResponse(200, '🎉 Resume processed successfully', {
      resume: {
        id: updatedResume._id,
        title: updatedResume.title,
        processing: updatedResume.processing,
        content: {
          structured: updatedResume.content.structured,
          aiMetadata: updatedResume.content.aiMetadata,
        },
        isPrimary: updatedResume.isPrimary,
      },
      processingStats: {
        timeMs: processingTime,
        model: parsedResult.model,
        confidence: parsedResult.confidence,
      },
    }).send(res);
  } catch (error) {
    console.error('Resume processing error:', error);

    // Update status to failed
    await Resume.findByIdAndUpdate(resumeId, {
      'processing.status': 'failed',
      'processing.error': error.message,
      'processing.lastProcessedAt': new Date(),
    });

    return new ApiResponse(500, 'Failed to process resume', {
      error: error.message,
      resumeId: resumeId,
      canRetry: true,
      retryEndpoint: `/api/resumes/${resumeId}/process`,
    }).send(res);
  }
});

// UTILITY: Get All User Resumes with Status
export const getUserResumes = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { page = 1, limit = 10, status } = req.query;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  // Build query
  const query = { user: userId };
  if (status) {
    query['processing.status'] = status;
  }

  const resumes = await Resume.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-content.extractedText'); // Exclude large text field

  const total = await Resume.countDocuments(query);

  // Add progress info to each resume
  const resumesWithProgress = resumes.map((resume) => {
    const getProgressData = (status) => {
      const statusMap = {
        uploaded: { progress: 10, message: 'Ready to process' },
        extracting: { progress: 30, message: 'Extracting text...' },
        parsing: { progress: 70, message: 'AI analyzing...' },
        completed: { progress: 100, message: 'Processed successfully' },
        failed: { progress: 0, message: 'Processing failed' },
      };
      return statusMap[status] || { progress: 0, message: 'Unknown' };
    };

    const progressData = getProgressData(resume.processing.status);

    return {
      id: resume._id,
      title: resume.title,
      file: resume.file,
      processing: {
        ...resume.processing.toObject(),
        progress: progressData.progress,
        message: progressData.message,
      },
      isPrimary: resume.isPrimary,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  });

  return new ApiResponse(200, 'User resumes retrieved successfully', {
    resumes: resumesWithProgress,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    summary: {
      total,
      completed: resumesWithProgress.filter(
        (r) => r.processing.status === 'completed'
      ).length,
      processing: resumesWithProgress.filter((r) =>
        ['extracting', 'parsing'].includes(r.processing.status)
      ).length,
      failed: resumesWithProgress.filter(
        (r) => r.processing.status === 'failed'
      ).length,
    },
  }).send(res);
});

// UTILITY: Test Groq Connection
export const testAIConnection = asyncHandler(async (req, res) => {
  try {
    const testResult = await testGroqConnection();

    if (testResult.success) {
      return new ApiResponse(200, '✅ AI connection successful', {
        model: testResult.model,
        response: testResult.message,
        timestamp: new Date().toISOString(),
      }).send(res);
    } else {
      return new ApiResponse(500, '❌ AI connection failed', {
        error: testResult.error,
        suggestion: 'Check GROQ_API_KEY in environment variables',
      }).send(res);
    }
  } catch (error) {
    return new ApiResponse(500, '❌ AI connection test failed', {
      error: error.message,
    }).send(res);
  }
});
