import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { analyzePronunciation } from '../services/pronunciationService.js';
import { QUEUES } from '../workers/constants.js';

export function startPronunciationWorker() {
  return new Worker(QUEUES.PRONUNCIATION, async job => {
    return analyzePronunciation({ transcript: job.data.transcript });
  }, { connection: redis, concurrency: 3 });
}
