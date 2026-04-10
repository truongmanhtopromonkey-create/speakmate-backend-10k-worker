import { openai } from './openaiClient.js';
import { fallbackReview } from './fallbacks.js';
import { env } from '../config/env.js';
import { reviewSpeakingResponseSchema } from '../workers/schemas.js';

export async function generateReview({ transcript, topicTitle, isPremium }) {
  try {
    const prompt = `You are an English speaking coach. Analyze the learner answer for the topic. Return JSON only.\nTopic: ${topicTitle}\nLearner answer: ${transcript}`;

    const response = await openai.responses.create({
      model: env.openaiModelText,
      input: [
        { role: 'developer', content: [{ type: 'text', text: 'Return strict JSON matching the requested schema. Keep feedback short, encouraging, and useful for English learners.' }] },
        { role: 'user', content: [{ type: 'text', text: prompt }] }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'review_response',
          schema: {
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
                type: 'array', items: {
                  type: 'object', additionalProperties: false,
                  properties: { original: { type: 'string' }, better: { type: 'string' }, reason: { type: 'string' } },
                  required: ['original', 'better', 'reason']
                }
              },
              pronunciationWords: {
                type: 'array', items: {
                  type: 'object', additionalProperties: false,
                  properties: { word: { type: 'string' }, tip: { type: 'string' } },
                  required: ['word', 'tip']
                }
              },
              nextStep: { type: 'string' },
              errors: {
                type: 'array', items: {
                  type: 'object', additionalProperties: false,
                  properties: { original: { type: 'string' }, suggestion: { type: 'string' }, type: { type: 'string' }, explanation: { type: 'string' } },
                  required: ['original', 'suggestion', 'type', 'explanation']
                }
              },
              meta: {
                type: 'object', additionalProperties: false,
                properties: { cached: { type: 'boolean' }, isPremium: { type: 'boolean' }, isFallback: { type: 'boolean' } },
                required: ['cached', 'isPremium', 'isFallback']
              },
              advancedAnswer: { type: ['string', 'null'] }
            },
            required: ['correctedText','aiScore','pronunciationScore','grammarScore','fluencyScore','vocabularyScore','summary','overallRating','praise','improvements','pronunciationWords','nextStep','errors','meta','advancedAnswer']
          }
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    const valid = reviewSpeakingResponseSchema.parse(parsed);
    valid.meta = { ...(valid.meta || {}), isPremium, isFallback: false, cached: false };
    return valid;
  } catch (error) {
    if (!env.enableFallback) throw error;
    return fallbackReview(transcript, topicTitle, isPremium);
  }
}
