import Queue from 'bull';
import { portfolioService } from './portfolio-generate.service.js';

// Initialize Redis-based job queue
const portfolioQueue = new Queue('portfolio generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || "redispass",
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay
    },
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs for debugging
  },
});


// For testing the queue and redis

// ✅ Queue connection events
portfolioQueue.on('ready', () => {
  console.log('✅ Queue is ready and connected to Redis');
});

portfolioQueue.on('error', (err) => {
  console.error('❌ Queue connection error:', err);
});

// ✅ Job lifecycle events
portfolioQueue.on('waiting', (jobId) => {
  console.log(`⏳ Job ${jobId} is waiting`);
});

portfolioQueue.on('active', (job) => {
  console.log(`🚀 Job ${job.id} is active`);
});

portfolioQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed with result:`, result);
});

portfolioQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});



// Queue portfolio generation job
export const queuePortfolioGeneration = async (
  portfolioId,
  isRegeneration = false
) => {
  try {
    const jobData = {
      portfolioId,
      isRegeneration,
      queuedAt: new Date(),
    };

    console.log("jobData", jobData);
    console.log(
      `Queueing portfolio generation job for portfolio ${portfolioId}`
    );

    const jobOptions = {
      delay: 0, // Start immediately
      priority: isRegeneration ? 5 : 10, // Higher priority for regenerations
      jobId: `portfolio-${portfolioId}-${Date.now()}`, // Unique job ID
    };

    const job = await portfolioQueue.add(
      'generatePortfolio',
      jobData,
      jobOptions
    );

    console.log(
      `📋 Queued portfolio generation job ${job.id} for portfolio ${portfolioId}`
    );

    return {
      jobId: job.id,
      estimatedStartTime: new Date(),
      estimatedCompletionTime: new Date(Date.now() + 45000), // 45 seconds
    };
  } catch (error) {
    console.error('Failed to queue portfolio generation:', error);
    throw error;
  }
};

// Process portfolio generation jobs
portfolioQueue.process('generatePortfolio', 5, async (job) => {
  const { portfolioId, isRegeneration } = job.data;

  console.log(
    `🔄 Processing portfolio generation job ${job.id} for portfolio ${portfolioId}`
  );

  // Update job progress
  await job.progress(10);

  try {
    // Call the main generation function
    await portfolioService.generatePortfolioBackground(
      portfolioId,
      isRegeneration
    );

    // Mark job as complete
    await job.progress(100);

    return {
      portfolioId,
      status: 'completed',
      completedAt: new Date(),
    };
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error; // This will mark the job as failed
  }
});

// Job event listeners for monitoring
portfolioQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed for portfolio ${result.portfolioId}`);
});

portfolioQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

portfolioQueue.on('stalled', (job) => {
  console.warn(`⏳ Job ${job.id} stalled and may need to be restarted`);
});

portfolioQueue.on('progress', (job, progress) => {
  console.log(`📈 Job ${job.id} progress: ${progress}%`);
});

// Get queue statistics
export const getQueueStats = async () => {
  try {
    const waiting = await portfolioQueue.getWaiting();
    const active = await portfolioQueue.getActive();
    const completed = await portfolioQueue.getCompleted();
    const failed = await portfolioQueue.getFailed();
    const delayed = await portfolioQueue.getDelayed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total:
        waiting.length +
        active.length +
        completed.length +
        failed.length +
        delayed.length,
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
      error: error.message,
    };
  }
};

// Get job status by ID
export const getJobStatus = async (jobId) => {
  try {
    const job = await portfolioQueue.getJob(jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id,
      status: state,
      progress: progress,
      data: job.data,
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason || null,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    };
  } catch (error) {
    console.error('Failed to get job status:', error);
    return { status: 'error', error: error.message };
  }
};

// Clean old completed jobs
export const cleanOldJobs = async () => {
  try {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Clean completed jobs older than 1 hour
    await portfolioQueue.clean(oneHourAgo, 'completed');

    // Clean failed jobs older than 1 day
    await portfolioQueue.clean(oneDayAgo, 'failed');

    console.log('🧹 Cleaned old jobs from queue');
  } catch (error) {
    console.error('Failed to clean old jobs:', error);
  }
};

// Retry failed job
export const retryFailedJob = async (jobId) => {
  try {
    const job = await portfolioQueue.getJob(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    const state = await job.getState();

    if (state !== 'failed') {
      throw new Error(`Job is not in failed state. Current state: ${state}`);
    }

    await job.retry();

    console.log(`🔄 Retrying failed job ${jobId}`);

    return {
      jobId: job.id,
      status: 'retrying',
      retriedAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to retry job:', error);
    throw error;
  }
};

// Pause/Resume queue for maintenance
export const pauseQueue = async () => {
  try {
    await portfolioQueue.pause(true); // Global pause
    console.log('⏸️ Portfolio queue paused');
  } catch (error) {
    console.error('Failed to pause queue:', error);
    throw error;
  }
};

export const resumeQueue = async () => {
  try {
    await portfolioQueue.resume(true); // Global resume
    console.log('▶️ Portfolio queue resumed');
  } catch (error) {
    console.error('Failed to resume queue:', error);
    throw error;
  }
};

// Get queue health status
export const getQueueHealth = async () => {
  try {
    const stats = await getQueueStats();
    const isHealthy = stats.active < 10 && stats.failed < 5; // Thresholds

    return {
      isHealthy,
      stats,
      isPaused: await portfolioQueue.isPaused(),
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Failed to get queue health:', error);
    return {
      isHealthy: false,
      error: error.message,
      timestamp: new Date(),
    };
  }
};

// Graceful shutdown
export const shutdownQueue = async () => {
  try {
    console.log('🔄 Shutting down portfolio queue...');

    // Wait for active jobs to complete (max 30 seconds)
    await portfolioQueue.close(30000);

    console.log('✅ Portfolio queue shut down gracefully');
  } catch (error) {
    console.error('Failed to shutdown queue gracefully:', error);
    throw error;
  }
};

// Export service object
export const backgroundJobService = {
  queuePortfolioGeneration,
  getQueueStats,
  getJobStatus,
  cleanOldJobs,
  retryFailedJob,
  pauseQueue,
  resumeQueue,
  getQueueHealth,
  shutdownQueue,
};

// Start queue monitoring (run cleanup every hour)
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanOldJobs, 60 * 60 * 1000); // Every hour
}
