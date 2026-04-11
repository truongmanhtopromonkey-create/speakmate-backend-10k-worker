import { openai } from './openaiClient.js';
import { env } from '../config/env.js';
import { fallbackConversation } from './fallbacks.js';
import { conversationReplyResponseSchema } from '../workers/schemas.js';

export async function generateConversationReply({ mode, goal, roleplay, userMessage, history }) {
  try {
    const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `You are a warm English speaking coach. Mode: ${mode}. Goal: ${goal || 'general speaking'}. Roleplay: ${roleplay || 'none'}. Keep replies short and continue the conversation naturally. Correct the learner's last message, give one quick feedback sentence, provide 3 suggested replies, and score grammar, fluency, and naturalness from 0-100. Conversation so far:\n${historyText}\n\nLatest user message: ${userMessage}`;

    console.log('🌐 [conversation] model =', env.openaiModelText);
    console.log('🌐 [conversation] has api key =', Boolean(env.openaiApiKey));
    console.log('📤 [conversation] prompt =', prompt);

    const response = await openai.responses.create({
      model: env.openaiModelText,
      input: [
        {
          role: 'developer',
          content: [
            { type: 'text', text: 'Return strict JSON only. Keep the reply concise and supportive.' }
          ]
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt }
          ]
        }
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

    console.log('📥 [conversation] raw response id =', response.id);
    console.log('📥 [conversation] output_text =', response.output_text);

    const parsed = JSON.parse(response.output_text);
    console.log('✅ [conversation] parsed =', parsed);

    const validated = conversationReplyResponseSchema.parse(parsed);
    console.log('✅ [conversation] validated =', validated);

    return validated;
  } catch (error) {
    console.error('❌ [conversation] worker error name =', error?.name);
    console.error('❌ [conversation] worker error message =', error?.message);
    console.error('❌ [conversation] worker error status =', error?.status);
    console.error('❌ [conversation] worker error code =', error?.code);
    console.error('❌ [conversation] worker error type =', error?.type);
    console.error('❌ [conversation] worker error stack =', error?.stack);

    if (error?.response) {
      console.error('❌ [conversation] worker error response =', error.response);
    }

    if (!env.enableFallback) throw error;
    return fallbackConversation(mode, userMessage);
  }
}