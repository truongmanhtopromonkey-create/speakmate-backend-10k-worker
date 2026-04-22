import { openai } from './openaiClient.js';
import { env } from '../config/env.js';
import { fallbackConversation } from './fallbacks.js';
import { logger } from '../lib/logger.js';
import { getLanguageName, normalizeLearningLanguage, normalizeLocale } from '../lib/language.js';
import { conversationReplyResponseSchema } from '../workers/schemas.js';

const conversationReplyJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reply: { type: 'string' },
    correctedUserText: { type: ['string', 'null'] },
    quickFeedback: { type: ['string', 'null'] },
    suggestedReplies: {
      type: 'array',
      items: { type: 'string' }
    },
    score: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: {
        grammar: { type: 'integer' },
        fluency: { type: 'integer' },
        naturalness: { type: 'integer' }
      },
      required: ['grammar', 'fluency', 'naturalness']
    },
    pronunciation: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: {
        hardWords: {
          type: 'array',
          items: { type: 'string' }
        },
        tip: { type: 'string' }
      },
      required: ['hardWords', 'tip']
    },
    isFallback: { type: 'boolean' }
  },
  required: [
    'reply',
    'correctedUserText',
    'quickFeedback',
    'suggestedReplies',
    'score',
    'pronunciation',
    'isFallback'
  ]
};

function trimHistory(history = []) {
  return history
    .slice(-6)
    .map(m => `${String(m.role || 'user').toUpperCase()}: ${String(m.content || '').slice(0, 240)}`)
    .join('\n');
}

export async function generateVoiceConversationReply({ payload }) {
  const normalizedUiLanguage = normalizeLocale(payload?.uiLanguage || 'en');
  return {
    ...fallbackConversation(payload?.mode || 'expert', '', normalizedUiLanguage),
    reply: 'Please try the microphone again. Your app now transcribes voice on device before sending text.',
    correctedUserText: null,
    quickFeedback: 'Voice uploads are disabled to keep practice fast and affordable.',
    userTranscript: '',
    isFallback: true
  };
}

export async function generateConversationReply({
  mode,
  goal,
  roleplay,
  userMessage,
  history = [],
  uiLanguage = 'en',
  learningLanguage = 'en'
}) {
  const normalizedUiLanguage = normalizeLocale(uiLanguage);
  const normalizedLearningLanguage = normalizeLearningLanguage(learningLanguage);
  const feedbackLanguage = getLanguageName(normalizedUiLanguage);

  try {
    const historyText = trimHistory(history);
    const prompt = `You are a premium-feeling English speaking coach for adult learners who already know basic English.

Conversation setup:
- Mode: ${mode || 'expert'}
- Goal: ${goal || 'speak more naturally'}
- Roleplay: ${roleplay || 'none'}
- Learning language: ${normalizedLearningLanguage}
- Feedback language: ${feedbackLanguage}

Recent conversation:
${historyText || '(no previous messages)'}

Latest learner message: ${userMessage}

Create a concise coaching turn that makes the learner want to continue practicing.

Return exactly:
- reply: one natural follow-up question in English, max 18 words. This is the coach's next message in chat.
- correctedUserText: one corrected, natural English version of the learner's latest message. If already correct, make it slightly more natural.
- quickFeedback: exactly one short, encouraging speaking tip in ${feedbackLanguage}, max 18 words.
- suggestedReplies: exactly 2 short English replies the learner can tap and say next.
- score: null.
- pronunciation: null.
- isFallback: false.

Do not give long analysis. Do not include markdown. Do not translate the coach reply.`;

    const response = await openai.responses.create({
      model: env.openaiModelText,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: 'Return strict JSON only. JSON keys must stay in English. Keep reply and suggestedReplies in English. Only quickFeedback uses the requested feedback language. Keep output short to reduce cost.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'conversation_reply',
          schema: conversationReplyJsonSchema,
          strict: true
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    const validated = conversationReplyResponseSchema.parse(parsed);
    return validated;
  } catch (error) {
    logger.error({
      err: error,
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      param: error?.param,
      model: env.openaiModelText,
      hasOpenAIKey: Boolean(env.openaiApiKey)
    }, 'conversation OpenAI call failed');

    if (!env.enableFallback) throw error;
    return fallbackConversation(mode, userMessage, normalizedUiLanguage);
  }
}
