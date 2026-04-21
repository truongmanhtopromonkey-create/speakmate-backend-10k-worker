import { openai } from './openaiClient.js';
import { fallbackReview } from './fallbacks.js';
import { env } from '../config/env.js';
import { getLanguageName, normalizeLearningLanguage, normalizeLocale } from '../lib/language.js';
import { reviewSpeakingResponseSchema } from '../workers/schemas.js';

const reviewResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    correctedText: { type: 'string' },
    aiScore: { type: 'integer' },
    pronunciationScore: { type: 'integer' },
    grammarScore: { type: 'integer' },
    fluencyScore: { type: 'integer' },
    vocabularyScore: { type: 'integer' },
    summary: { type: 'string' },
    overallRating: { type: 'string' },
    praise: { type: 'array', items: { type: 'string' } },
    improvements: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          original: { type: 'string' },
          better: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['original', 'better', 'reason']
      }
    },
    pronunciationWords: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          word: { type: 'string' },
          tip: { type: 'string' }
        },
        required: ['word', 'tip']
      }
    },
    nextStep: { type: 'string' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          original: { type: 'string' },
          suggestion: { type: 'string' },
          type: { type: 'string' },
          explanation: { type: 'string' }
        },
        required: ['original', 'suggestion', 'type', 'explanation']
      }
    },
    meta: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cached: { type: 'boolean' },
        isPremium: { type: 'boolean' },
        isFallback: { type: 'boolean' }
      },
      required: ['cached', 'isPremium', 'isFallback']
    },
    advancedAnswer: { type: ['string', 'null'] }
  },
  required: [
    'correctedText',
    'aiScore',
    'pronunciationScore',
    'grammarScore',
    'fluencyScore',
    'vocabularyScore',
    'summary',
    'overallRating',
    'praise',
    'improvements',
    'pronunciationWords',
    'nextStep',
    'errors',
    'meta',
    'advancedAnswer'
  ]
};

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeScores(review) {
  return {
    ...review,
    aiScore: clampScore(review.aiScore),
    pronunciationScore: clampScore(review.pronunciationScore),
    grammarScore: clampScore(review.grammarScore),
    fluencyScore: clampScore(review.fluencyScore),
    vocabularyScore: clampScore(review.vocabularyScore)
  };
}

export async function generateReview({ transcript, topicTitle, uiLanguage = 'en', learningLanguage = 'en', isPremium }) {
  const normalizedUiLanguage = normalizeLocale(uiLanguage);
  const normalizedLearningLanguage = normalizeLearningLanguage(learningLanguage);
  const feedbackLanguage = getLanguageName(normalizedUiLanguage);

  try {
    const prompt = `Analyze this English speaking practice answer.

Topic: ${topicTitle}
Learner answer transcript: ${transcript}

Language requirements:
- The learner is practicing English speaking.
- Write coaching explanations, encouragement, improvement reasons, error explanations, pronunciation tips, and next steps in ${feedbackLanguage}.
- Keep correctedText, improvement.original, improvement.better, error.original, error.suggestion, pronunciationWords.word, and advancedAnswer in English.
- Do not translate the learner's English answer into ${feedbackLanguage} except when a short explanation needs it.
- The learner already knows basic English, so give practical, intermediate-friendly speaking advice.
- Keep the tone warm, specific, and action-oriented.
- Use 0-100 integer scores.
- advancedAnswer should be a natural English sample answer for the same topic. Keep it concise unless the user is premium.
- If the transcript is very short, still return useful feedback and one easy next step.

Learning language: ${normalizedLearningLanguage}`;

    const response = await openai.responses.create({
      model: env.openaiModelText,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: 'Return strict JSON only matching the schema. JSON keys must stay in English. Localize only the user-facing feedback text as requested. Never include markdown outside JSON.'
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
          name: 'review_response',
          schema: reviewResponseJsonSchema
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    const normalized = normalizeScores(parsed);
    const valid = reviewSpeakingResponseSchema.parse(normalized);
    valid.meta = { ...(valid.meta || {}), isPremium, isFallback: false, cached: false };
    return valid;
  } catch (error) {
    if (!env.enableFallback) throw error;
    return fallbackReview(transcript, topicTitle, isPremium, normalizedUiLanguage);
  }
}
