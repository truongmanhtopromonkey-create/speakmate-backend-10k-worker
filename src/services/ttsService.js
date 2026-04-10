import { openai } from './openaiClient.js';
import { env } from '../config/env.js';

export async function generateTTS({ text, voice }) {
  const speech = await openai.audio.speech.create({
    model: env.openaiModelTts,
    voice: voice || 'alloy',
    input: text,
    format: 'mp3'
  });

  const arrayBuffer = await speech.arrayBuffer();
  return {
    contentType: 'audio/mpeg',
    base64Audio: Buffer.from(arrayBuffer).toString('base64')
  };
}
