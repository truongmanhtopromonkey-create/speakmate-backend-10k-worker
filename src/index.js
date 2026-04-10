import { logger } from './lib/logger.js';
import { startReviewWorker } from './workers/reviewWorker.js';
import { startConversationWorker } from './workers/conversationWorker.js';
import { startPronunciationWorker } from './workers/pronunciationWorker.js';
import { startTTSWorker } from './workers/ttsWorker.js';

const workers = [
  startReviewWorker(),
  startConversationWorker(),
  startPronunciationWorker(),
  startTTSWorker()
];

for (const worker of workers) {
  worker.on('completed', job => logger.info({ queue: worker.name, jobId: job.id }, 'job completed'));
  worker.on('failed', (job, err) => logger.error({ queue: worker.name, jobId: job?.id, err }, 'job failed'));
}

logger.info('worker service started');
