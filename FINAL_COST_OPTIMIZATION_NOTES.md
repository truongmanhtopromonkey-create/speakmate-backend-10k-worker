# Final cost optimization worker update

## AI Coach response format
Conversation replies are now intentionally short to reduce token cost and improve UX:

- `reply`: one English follow-up question, max 18 words
- `correctedUserText`: one corrected natural English version
- `quickFeedback`: one short tip in the user's UI language
- `suggestedReplies`: two short English suggestions
- `score`: null
- `pronunciation`: null

## Voice conversation worker safety
`generateVoiceConversationReply` no longer transcribes audio or calls OpenAI STT. If an old queued voice job arrives, it returns a safe fallback response instead of processing audio.
