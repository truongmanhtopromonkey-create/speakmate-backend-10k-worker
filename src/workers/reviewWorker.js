import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { generateReview } from '../services/reviewService.js';
import { saveReviewSession } from '../db/persistence.js';
import { QUEUES } from '../workers/constants.js';

export function startReviewWorker() {
  return new Worker(QUEUES.REVIEW, async job => {
    const result = await generateReview({
      transcript: job.data.payload.transcript,
      topicTitle: job.data.payload.topicTitle,
      isPremium: job.data.isPremium
    });
    await saveReviewSession(job.data.appUserId, job.data.payload, result);
    return result;
  }, { connection: redis, concurrency: 5 });
}
