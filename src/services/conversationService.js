import { openai } from './openaiClient.js';
import { env } from '../config/env.js';
import { fallbackConversation } from './fallbacks.js';
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

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeConversationScores(reply) {
  if (!reply.score) return reply;
  return {
    ...reply,
    score: {
      grammar: clampScore(reply.score.grammar),
      fluency: clampScore(reply.score.fluency),
      naturalness: clampScore(reply.score.naturalness)
    }
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
    const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `You are a warm English speaking coach.

Conversation setup:
- Mode: ${mode}
- Goal: ${goal || 'general speaking'}
- Roleplay: ${roleplay || 'none'}
- Learning language: ${normalizedLearningLanguage}
- Feedback language: ${feedbackLanguage}

Conversation so far:
${historyText || '(no previous messages)'}

Latest learner message: ${userMessage}

Response rules:
- reply: write in English. Continue the conversation naturally and keep it short enough for speaking practice.
- correctedUserText: corrected English version of the learner's latest message. Use null if no correction is needed.
- quickFeedback: one short coaching sentence in ${feedbackLanguage}.
- suggestedReplies: exactly 3 short English replies the learner can tap and say next.
- score: grammar, fluency, naturalness from 0-100 as integers.
- pronunciation.hardWords: 0-3 English words from the learner message or your reply that may be hard to pronounce.
- pronunciation.tip: one practical pronunciation tip in ${feedbackLanguage}.
- Keep tone friendly and motivating for learners who already know basic English.`;

    const response = await openai.responses.create({
      model: env.openaiModelText,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: 'Return strict JSON only. JSON keys must stay in English. Keep conversation reply and suggested replies in English, but localize feedback fields as requested.'
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
          schema: conversationReplyJsonSchema
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    const normalized = normalizeConversationScores(parsed);
    const validated = conversationReplyResponseSchema.parse(normalized);
    return validated;
  } catch (error) {
    if (!env.enableFallback) throw error;
    return fallbackConversation(mode, userMessage, normalizedUiLanguage);
  }
}
