import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { generateConversationReply } from '../services/conversationService.js';
import { QUEUES } from '../workers/constants.js';

export function startConversationWorker() {
  return new Worker(QUEUES.CONVERSATION, async job => {
    return generateConversationReply(job.data.payload);
  }, { connection: redis, concurrency: 5 });
}
