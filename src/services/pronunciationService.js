export async function analyzePronunciation({ transcript }) {
  const words = transcript.split(/\s+/).filter(Boolean);
  const hardWords = words.filter(w => w.length >= 7).slice(0, 3);
  return {
    score: Math.max(60, Math.min(85, 60 + words.length * 2)),
    hardWords,
    tip: 'Slow down on longer words and stress the first syllable more clearly.'
  };
}
