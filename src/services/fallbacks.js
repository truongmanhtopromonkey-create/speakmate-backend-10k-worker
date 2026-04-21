import { normalizeLocale } from '../lib/language.js';

const reviewFallbackCopy = {
  en: {
    summary: 'Good effort. This is basic feedback while the AI service is temporarily busy.',
    overallRating: 'Good',
    praise: ['You completed a speaking attempt.', 'Your answer is understandable.'],
    nextStep: 'Try one longer sentence with more detail.'
  },
  vi: {
    summary: 'Bạn đã cố gắng tốt. Đây là phản hồi cơ bản trong lúc dịch vụ AI đang bận.',
    overallRating: 'Tốt',
    praise: ['Bạn đã hoàn thành một lượt luyện nói.', 'Câu trả lời của bạn có thể hiểu được.'],
    nextStep: 'Hãy thử nói thêm một câu dài hơn với nhiều chi tiết hơn.'
  },
  ja: {
    summary: 'よく頑張りました。AIサービスが混み合っているため、現在は基本的なフィードバックを表示しています。',
    overallRating: '良い',
    praise: ['スピーキング練習を完了できました。', 'あなたの答えは理解できます。'],
    nextStep: 'もう少し詳しく、長めの文を1つ追加してみましょう。'
  },
  ko: {
    summary: '좋은 시도였어요. AI 서비스가 일시적으로 바빠서 기본 피드백을 보여드리고 있습니다.',
    overallRating: '좋음',
    praise: ['말하기 연습을 완료했어요.', '답변이 이해하기 쉬웠어요.'],
    nextStep: '조금 더 자세한 긴 문장 하나를 추가해 보세요.'
  },
  'zh-Hans': {
    summary: '做得不错。AI 服务暂时繁忙，现在显示基础反馈。',
    overallRating: '不错',
    praise: ['你完成了一次口语练习。', '你的回答可以被理解。'],
    nextStep: '试着再说一个更长、更具体的句子。'
  },
  de: {
    summary: 'Guter Versuch. Dies ist ein Basis-Feedback, während der AI-Dienst vorübergehend ausgelastet ist.',
    overallRating: 'Gut',
    praise: ['Du hast eine Sprechübung abgeschlossen.', 'Deine Antwort ist verständlich.'],
    nextStep: 'Versuche einen längeren Satz mit mehr Details.'
  },
  fr: {
    summary: 'Bon effort. Ceci est un retour de base pendant que le service IA est temporairement occupé.',
    overallRating: 'Bien',
    praise: ['Vous avez terminé un exercice d’expression orale.', 'Votre réponse est compréhensible.'],
    nextStep: 'Essayez une phrase plus longue avec plus de détails.'
  },
  es: {
    summary: 'Buen esfuerzo. Este es un feedback básico mientras el servicio de IA está ocupado temporalmente.',
    overallRating: 'Bien',
    praise: ['Completaste una práctica de speaking.', 'Tu respuesta se entiende.'],
    nextStep: 'Prueba una oración más larga con más detalles.'
  },
  'pt-BR': {
    summary: 'Bom esforço. Este é um feedback básico enquanto o serviço de IA está temporariamente ocupado.',
    overallRating: 'Bom',
    praise: ['Você completou uma prática de fala.', 'Sua resposta é compreensível.'],
    nextStep: 'Tente uma frase mais longa com mais detalhes.'
  },
  it: {
    summary: 'Buon lavoro. Questo è un feedback di base mentre il servizio AI è temporaneamente occupato.',
    overallRating: 'Buono',
    praise: ['Hai completato un esercizio di speaking.', 'La tua risposta è comprensibile.'],
    nextStep: 'Prova una frase più lunga con più dettagli.'
  },
  tr: {
    summary: 'İyi deneme. AI hizmeti geçici olarak meşgul olduğu için şu anda temel geri bildirim gösteriliyor.',
    overallRating: 'İyi',
    praise: ['Bir konuşma alıştırmasını tamamladın.', 'Cevabın anlaşılır.'],
    nextStep: 'Daha fazla ayrıntı içeren biraz daha uzun bir cümle dene.'
  },
  ar: {
    summary: 'محاولة جيدة. هذا تقييم أساسي بينما خدمة الذكاء الاصطناعي مشغولة مؤقتًا.',
    overallRating: 'جيد',
    praise: ['لقد أكملت تمرينًا في التحدث.', 'إجابتك مفهومة.'],
    nextStep: 'جرّب جملة أطول تحتوي على تفاصيل أكثر.'
  }
};

const conversationFallbackCopy = {
  en: {
    quickFeedback: 'Basic feedback is shown while the AI conversation service is busy.',
    pronunciationTip: 'Try speaking a little slower and stress the most important words clearly.'
  },
  vi: {
    quickFeedback: 'Đây là phản hồi cơ bản trong lúc dịch vụ hội thoại AI đang bận.',
    pronunciationTip: 'Hãy nói chậm hơn một chút và nhấn rõ các từ quan trọng nhất.'
  },
  ja: {
    quickFeedback: 'AI会話サービスが混み合っているため、基本的なフィードバックを表示しています。',
    pronunciationTip: '少しゆっくり話し、大事な単語をはっきり強調してみましょう。'
  },
  ko: {
    quickFeedback: 'AI 대화 서비스가 바빠서 기본 피드백을 보여드리고 있습니다.',
    pronunciationTip: '조금 더 천천히 말하고 중요한 단어를 또렷하게 강조해 보세요.'
  },
  'zh-Hans': {
    quickFeedback: 'AI 对话服务暂时繁忙，现在显示基础反馈。',
    pronunciationTip: '试着说慢一点，并清楚地重读最重要的词。'
  },
  de: {
    quickFeedback: 'Der AI-Konversationsdienst ist gerade ausgelastet, daher wird Basis-Feedback angezeigt.',
    pronunciationTip: 'Sprich etwas langsamer und betone die wichtigsten Wörter deutlich.'
  },
  fr: {
    quickFeedback: 'Le service de conversation IA est occupé, donc un retour de base est affiché.',
    pronunciationTip: 'Essayez de parler un peu plus lentement et d’accentuer clairement les mots importants.'
  },
  es: {
    quickFeedback: 'El servicio de conversación con IA está ocupado, por eso se muestra feedback básico.',
    pronunciationTip: 'Intenta hablar un poco más despacio y marcar claramente las palabras más importantes.'
  },
  'pt-BR': {
    quickFeedback: 'O serviço de conversa com IA está ocupado, então este é um feedback básico.',
    pronunciationTip: 'Tente falar um pouco mais devagar e destacar claramente as palavras mais importantes.'
  },
  it: {
    quickFeedback: 'Il servizio di conversazione AI è occupato, quindi viene mostrato un feedback di base.',
    pronunciationTip: 'Prova a parlare un po’ più lentamente e a mettere in evidenza le parole più importanti.'
  },
  tr: {
    quickFeedback: 'AI konuşma hizmeti meşgul olduğu için temel geri bildirim gösteriliyor.',
    pronunciationTip: 'Biraz daha yavaş konuşmayı ve en önemli kelimeleri net vurgulamayı dene.'
  },
  ar: {
    quickFeedback: 'خدمة محادثة الذكاء الاصطناعي مشغولة حاليًا، لذلك يظهر تقييم أساسي.',
    pronunciationTip: 'حاول التحدث ببطء أكثر قليلًا وشدّد بوضوح على الكلمات الأهم.'
  },
  'zh-Hant': {
    quickFeedback: '這是基本回饋；請試著用更自然的一句話回答。',
    pronunciationTip: '放慢一點，清楚說出關鍵字。'
  },
  id: {
    quickFeedback: 'Ini umpan balik dasar; coba jawab dengan satu kalimat yang lebih alami.',
    pronunciationTip: 'Bicaralah sedikit lebih pelan dan tekankan kata penting.'
  },
  th: {
    quickFeedback: 'นี่คือคำแนะนำพื้นฐาน ลองตอบให้เป็นธรรมชาติมากขึ้นหนึ่งประโยค',
    pronunciationTip: 'พูดช้าลงเล็กน้อยและเน้นคำสำคัญให้ชัดเจน'
  },
  hi: {
    quickFeedback: 'यह बुनियादी feedback है; एक और natural sentence बोलकर देखें।',
    pronunciationTip: 'थोड़ा धीरे बोलें और मुख्य शब्दों पर stress दें।'
  },
  ru: {
    quickFeedback: 'Это базовая подсказка; попробуйте ответить одной более естественной фразой.',
    pronunciationTip: 'Говорите чуть медленнее и выделяйте ключевые слова.'
  },
  nl: {
    quickFeedback: 'Dit is basisfeedback; probeer één natuurlijkere zin te zeggen.',
    pronunciationTip: 'Spreek iets langzamer en benadruk de belangrijkste woorden.'
  },
  pl: {
    quickFeedback: 'To podstawowa wskazówka; spróbuj powiedzieć jedno bardziej naturalne zdanie.',
    pronunciationTip: 'Mów trochę wolniej i wyraźnie akcentuj ważne słowa.'
  },
  sv: {
    quickFeedback: 'Detta är enkel feedback; prova att säga en mer naturlig mening.',
    pronunciationTip: 'Tala lite långsammare och betona de viktigaste orden.'
  },
  ms: {
    quickFeedback: 'Ini maklum balas asas; cuba jawab dengan satu ayat yang lebih semula jadi.',
    pronunciationTip: 'Bercakap sedikit perlahan dan tekankan perkataan penting.'
  },
  fil: {
    quickFeedback: 'Basic feedback ito; subukan mong magsabi ng mas natural na sentence.',
    pronunciationTip: 'Magsalita nang kaunti pang mabagal at idiin ang mahahalagang salita.'
  }
};

function getReviewCopy(uiLanguage) {
  return reviewFallbackCopy[normalizeLocale(uiLanguage)] || reviewFallbackCopy.en;
}

function getConversationCopy(uiLanguage) {
  return conversationFallbackCopy[normalizeLocale(uiLanguage)] || conversationFallbackCopy.en;
}

export function fallbackReview(transcript, topicTitle, isPremium = false, uiLanguage = 'en') {
  const copy = getReviewCopy(uiLanguage);

  return {
    correctedText: transcript,
    aiScore: 62,
    pronunciationScore: 60,
    grammarScore: 61,
    fluencyScore: 63,
    vocabularyScore: 60,
    summary: copy.summary,
    overallRating: copy.overallRating,
    praise: copy.praise,
    improvements: [],
    pronunciationWords: [],
    nextStep: copy.nextStep,
    errors: [],
    meta: { cached: false, isPremium, isFallback: true },
    advancedAnswer: topicTitle?.toLowerCase().includes('food')
      ? 'My favorite food is pizza because it is delicious and easy to share with friends.'
      : 'You can try a longer answer with clearer grammar and more details.'
  };
}

export function fallbackConversation(mode, userMessage, uiLanguage = 'en') {
  const copy = getConversationCopy(uiLanguage);
  const cleanMessage = String(userMessage || '').trim();
  const replyMap = {
    casual: 'What do you usually enjoy talking about with friends?',
    travel: 'What would you ask first when you arrive at the hotel?',
    interview: 'What strength would you like to explain in your interview?',
    work: 'What update would you give your manager today?',
    expert: 'What exact situation do you want to practice next?'
  };
  return {
    reply: replyMap[mode] || 'What would you say next?',
    correctedUserText: cleanMessage || null,
    quickFeedback: copy.quickFeedback,
    suggestedReplies: ['Let me try again.', 'I want to explain it simply.'],
    score: null,
    pronunciation: null,
    isFallback: true
  };
}
