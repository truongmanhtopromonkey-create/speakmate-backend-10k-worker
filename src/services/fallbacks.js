export function fallbackReview(transcript, topicTitle, isPremium = false) {
  return {
    correctedText: transcript,
    aiScore: 62,
    pronunciationScore: 60,
    grammarScore: 61,
    fluencyScore: 63,
    vocabularyScore: 60,
    summary: 'Good effort. This is basic feedback while the AI service is temporarily busy.',
    overallRating: 'Good',
    praise: ['You completed a speaking attempt.', 'Your answer is understandable.'],
    improvements: [],
    pronunciationWords: [],
    nextStep: 'Try one longer sentence with more detail.',
    errors: [],
    meta: { cached: false, isPremium, isFallback: true },
    advancedAnswer: topicTitle?.toLowerCase().includes('food')
      ? 'My favorite food is pizza because it is delicious and easy to share with friends.'
      : 'You can try a longer answer with clearer grammar and more details.'
  };
}

export function fallbackConversation(mode, userMessage) {
  const wordCount = userMessage.trim().split(/\s+/).filter(Boolean).length;
  const hardWords = userMessage.split(/\s+/).filter(w => w.length >= 7).slice(0, 3);
  const replyMap = {
    casual: 'Nice answer. Can you tell me more about your hobbies or daily routine?',
    travel: 'Nice. How would you ask for directions or help while traveling?',
    interview: 'Good start. Now tell me about one of your strengths.',
    work: 'That sounds clear. How would you explain one of your daily tasks?'
  };
  return {
    reply: replyMap[mode] || 'That is a good start. Can you tell me more?',
    correctedUserText: userMessage,
    quickFeedback: 'Basic feedback is shown while the AI conversation service is busy.',
    suggestedReplies: ['Can you repeat the question?', 'Let me explain in a simple way.', 'Here is a more complete answer.'],
    score: {
      grammar: Math.min(82, 55 + wordCount * 3),
      fluency: Math.min(84, 58 + wordCount * 2),
      naturalness: Math.min(80, 56 + wordCount * 2)
    },
    pronunciation: {
      hardWords,
      tip: 'Try speaking a little slower and stress the most important words clearly.'
    },
    isFallback: true
  };
}
