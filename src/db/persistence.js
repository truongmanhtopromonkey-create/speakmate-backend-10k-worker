import { db } from './client.js';

export async function saveReviewSession(appUserId, payload, result) {
  await db.query(
    `insert into review_sessions (
      app_user_id, topic, transcript, corrected_text, advanced_answer, summary,
      score, grammar_score, fluency_score, pronunciation_score, vocabulary_score, is_fallback
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      appUserId,
      payload.topicTitle,
      payload.transcript,
      result.correctedText,
      result.advancedAnswer || null,
      result.summary,
      result.aiScore,
      result.grammarScore,
      result.fluencyScore,
      result.pronunciationScore,
      result.vocabularyScore,
      Boolean(result.meta?.isFallback)
    ]
  );
}
