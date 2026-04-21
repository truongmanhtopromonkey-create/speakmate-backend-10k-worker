import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { generateConversationReply, generateVoiceConversationReply } from '../services/conversationService.js';
import { JOB_NAMES, QUEUES } from '../workers/constants.js';

export function startConversationWorker() {
  return new Worker(QUEUES.CONVERSATION, async job => {
    if (job.name === JOB_NAMES.CONVERSATION_VOICE) {
      return generateVoiceConversationReply({
        payload: job.data.payload,
        audioBufferBase64: job.data.audioBufferBase64,
        mimeType: job.data.mimeType
      });
    }
    return generateConversationReply(job.data.payload);
  }, { connection: redis, concurrency: 5 });
}
