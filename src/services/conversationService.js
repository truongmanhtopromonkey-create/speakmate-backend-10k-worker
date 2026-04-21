import { createReadStream } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
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
    isFallback: { type: 'boolean' },
    userTranscript: { type: 'string' }
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


const voiceErrorCopy = {
  en: {
    unclearReply: "I couldn't hear that clearly. Please try recording one short sentence again.",
    failedReply: "I couldn't analyze the audio clearly. Please try again in a quieter place.",
    feedback: 'The voice message could not be analyzed. Keep your phone close and speak clearly for 5–10 seconds.'
  },
  vi: {
    unclearReply: 'Mình chưa nghe rõ. Bạn hãy thử ghi âm lại một câu ngắn nhé.',
    failedReply: 'Mình chưa phân tích rõ được âm thanh. Hãy thử lại ở nơi yên tĩnh hơn.',
    feedback: 'Tin nhắn giọng nói chưa được phân tích rõ. Hãy để điện thoại gần hơn và nói rõ trong 5–10 giây.'
  },
  ja: {
    unclearReply: '音声がはっきり聞き取れませんでした。短い文をもう一度録音してみてください。',
    failedReply: '音声をうまく分析できませんでした。静かな場所でもう一度試してください。',
    feedback: '音声メッセージを十分に分析できませんでした。スマートフォンを近づけて、5〜10秒はっきり話してください。'
  },
  ko: {
    unclearReply: '소리가 명확하지 않았어요. 짧은 문장 하나를 다시 녹음해 보세요.',
    failedReply: '오디오를 명확하게 분석하지 못했어요. 더 조용한 곳에서 다시 시도해 주세요.',
    feedback: '음성 메시지를 명확하게 분석하지 못했어요. 휴대폰을 가까이 두고 5–10초 동안 또렷하게 말해 보세요.'
  },
  'zh-Hans': {
    unclearReply: '我没有听清楚。请再录一句简短的话。',
    failedReply: '我无法清楚分析这段音频。请在更安静的地方再试一次。',
    feedback: '语音消息未能清楚分析。请把手机靠近一些，并清楚说 5–10 秒。'
  },
  de: {
    unclearReply: 'Ich konnte das nicht klar hören. Nimm bitte noch einmal einen kurzen Satz auf.',
    failedReply: 'Ich konnte das Audio nicht klar analysieren. Versuche es bitte an einem ruhigeren Ort erneut.',
    feedback: 'Die Sprachnachricht konnte nicht klar analysiert werden. Halte das Handy näher und sprich 5–10 Sekunden deutlich.'
  },
  fr: {
    unclearReply: 'Je n’ai pas bien entendu. Essayez d’enregistrer une phrase courte à nouveau.',
    failedReply: 'Je n’ai pas pu analyser clairement l’audio. Réessayez dans un endroit plus calme.',
    feedback: 'Le message vocal n’a pas pu être analysé clairement. Gardez le téléphone près de vous et parlez clairement pendant 5 à 10 secondes.'
  },
  es: {
    unclearReply: 'No pude escucharlo con claridad. Intenta grabar una frase corta otra vez.',
    failedReply: 'No pude analizar bien el audio. Inténtalo de nuevo en un lugar más tranquilo.',
    feedback: 'El mensaje de voz no se pudo analizar con claridad. Acerca el teléfono y habla claro durante 5–10 segundos.'
  },
  'pt-BR': {
    unclearReply: 'Não consegui ouvir com clareza. Tente gravar uma frase curta novamente.',
    failedReply: 'Não consegui analisar o áudio com clareza. Tente novamente em um lugar mais silencioso.',
    feedback: 'A mensagem de voz não foi analisada com clareza. Deixe o celular mais perto e fale claramente por 5–10 segundos.'
  },
  it: {
    unclearReply: 'Non sono riuscito a sentire chiaramente. Prova a registrare di nuovo una frase breve.',
    failedReply: 'Non sono riuscito ad analizzare bene l’audio. Riprova in un posto più silenzioso.',
    feedback: 'Il messaggio vocale non è stato analizzato chiaramente. Tieni il telefono vicino e parla chiaramente per 5–10 secondi.'
  },
  tr: {
    unclearReply: 'Bunu net duyamadım. Lütfen kısa bir cümleyi tekrar kaydet.',
    failedReply: 'Sesi net analiz edemedim. Daha sessiz bir yerde tekrar dene.',
    feedback: 'Sesli mesaj net analiz edilemedi. Telefonu yakın tut ve 5–10 saniye net konuş.'
  },
  ar: {
    unclearReply: 'لم أسمع ذلك بوضوح. حاول تسجيل جملة قصيرة مرة أخرى.',
    failedReply: 'لم أتمكن من تحليل الصوت بوضوح. جرّب مرة أخرى في مكان أهدأ.',
    feedback: 'تعذر تحليل الرسالة الصوتية بوضوح. قرّب الهاتف وتحدث بوضوح لمدة 5 إلى 10 ثوانٍ.'
  }
};

function getVoiceErrorCopy(locale) {
  return voiceErrorCopy[normalizeLocale(locale)] || voiceErrorCopy.en;
}

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


function audioExtensionForMimeType(mimeType = '') {
  const normalized = String(mimeType).toLowerCase();
  if (normalized.includes('wav')) return 'wav';
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('webm')) return 'webm';
  if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) return 'm4a';
  return 'm4a';
}

async function transcribeConversationAudio({ audioBufferBase64, mimeType }) {
  const buffer = Buffer.from(audioBufferBase64, 'base64');
  const extension = audioExtensionForMimeType(mimeType);
  const tempPath = path.join(tmpdir(), `conversation-voice-${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`);

  await writeFile(tempPath, buffer);
  try {
    const transcription = await openai.audio.transcriptions.create({
      model: env.openaiModelStt,
      file: createReadStream(tempPath),
      language: 'en',
      response_format: 'text'
    });

    if (typeof transcription === 'string') return transcription.trim();
    if (transcription && typeof transcription.text === 'string') return transcription.text.trim();
    return String(transcription || '').trim();
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

export async function generateVoiceConversationReply({
  payload,
  audioBufferBase64,
  mimeType
}) {
  const normalizedUiLanguage = normalizeLocale(payload?.uiLanguage || 'en');
  const voiceCopy = getVoiceErrorCopy(normalizedUiLanguage);
  try {
    const userTranscript = await transcribeConversationAudio({ audioBufferBase64, mimeType });
    if (!userTranscript) {
      return {
        ...fallbackConversation(payload.mode, '', normalizedUiLanguage),
        reply: voiceCopy.unclearReply,
        correctedUserText: null,
        quickFeedback: voiceCopy.feedback,
        userTranscript: ''
      };
    }

    const reply = await generateConversationReply({
      ...payload,
      userMessage: userTranscript,
      uiLanguage: normalizedUiLanguage
    });
    return {
      ...reply,
      userTranscript
    };
  } catch (error) {
    if (!env.enableFallback) throw error;
    return {
      ...fallbackConversation(payload.mode, '', normalizedUiLanguage),
      reply: voiceCopy.failedReply,
      correctedUserText: null,
      quickFeedback: voiceCopy.feedback,
      userTranscript: '',
      isFallback: true
    };
  }
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
