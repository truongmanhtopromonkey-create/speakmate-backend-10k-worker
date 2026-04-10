import 'dotenv/config';

function required(name, fallback = '') {
  return process.env[name] || fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  redisUrl: required('REDIS_URL'),
  databaseUrl: required('DATABASE_URL'),
  openaiApiKey: required('OPENAI_API_KEY'),
  openaiModelText: required('OPENAI_MODEL_TEXT', 'gpt-5.4-mini'),
  openaiModelTts: required('OPENAI_MODEL_TTS', 'gpt-4o-mini-tts'),
  openaiModelStt: required('OPENAI_MODEL_STT', 'gpt-4o-mini-transcribe'),
  enableFallback: String(process.env.ENABLE_FALLBACK || 'true') === 'true',
  s3Endpoint: process.env.S3_ENDPOINT || '',
  s3Region: process.env.S3_REGION || 'auto',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  s3Bucket: process.env.S3_BUCKET || '',
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL || ''
};
