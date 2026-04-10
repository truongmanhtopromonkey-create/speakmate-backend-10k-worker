import { openai } from './openaiClient.js';
import { env } from '../config/env.js';
import { fallbackConversation } from './fallbacks.js';
import { conversationReplyResponseSchema } from '../workers/schemas.js';

export async function generateConversationReply({ mode, goal, roleplay, userMessage, history }) {
  try {
    const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `You are a warm English speaking coach. Mode: ${mode}. Goal: ${goal || 'general speaking'}. Roleplay: ${roleplay || 'none'}. Keep replies short and continue the conversation naturally. Correct the learner's last message, give one quick feedback sentence, provide 3 suggested replies, and score grammar, fluency, and naturalness from 0-100. Conversation so far:\n${historyText}\n\nLatest user message: ${userMessage}`;

    const response = await openai.responses.create({
      model: env.openaiModelText,
      input: [
        { role: 'developer', content: [{ type: 'text', text: 'Return strict JSON only. Keep the reply concise and supportive.' }] },
        { role: 'user', content: [{ type: 'text', text: prompt }] }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'conversation_reply',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              reply: { type: 'string' },
              correctedUserText: { type: ['string', 'null'] },
              quickFeedback: { type: ['string', 'null'] },
              suggestedReplies: { type: 'array', items: { type: 'string' } },
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
                  hardWords: { type: 'array', items: { type: 'string' } },
                  tip: { type: 'string' }
                },
                required: ['hardWords', 'tip']
              },
              isFallback: { type: 'boolean' }
            },
            required: ['reply', 'correctedUserText', 'quickFeedback', 'suggestedReplies', 'score', 'pronunciation', 'isFallback']
          }
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    return conversationReplyResponseSchema.parse(parsed);
  } catch (error) {
    if (!env.enableFallback) throw error;
    return fallbackConversation(mode, userMessage);
  }
}
