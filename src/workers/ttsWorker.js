import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { generateTTS } from '../services/ttsService.js';
import { QUEUES } from '../workers/constants.js';

export function startTTSWorker() {
  return new Worker(QUEUES.TTS, async job => {
    return generateTTS(job.data.payload);
  }, { connection: redis, concurrency: 3 });
}
