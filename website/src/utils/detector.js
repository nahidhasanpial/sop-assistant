// AI Detector & Cliche Highlighter for Statements of Purpose

const AI_MARKERS = [
  "delve", "tapestry", "beacon", "testament", "furthermore", 
  "moreover", "in conclusion", "synergy", "paradigm", "pave the way",
  "nestled", "not only, but also", "meticulous", "vibrant", "holistic",
  "underpinned", "key takeaway", "commendable", "multifaceted", "unwavering"
];

const WEAK_CLICHES = [
  "i am passionate about", "deeply passionate", "throughout my journey",
  "since childhood", "since i was a child", "ever since i was",
  "in today's fast-paced world", "in this digital era", "at the intersection of",
  "since time immemorial", "it goes without saying", "needless to say",
  "it is important to note", "always been fascinated", "i want to study"
];

export const detectAiStyle = (text) => {
  if (!text || text.trim().length === 0) {
    return {
      aiLikelihood: 0,
      sentences: [],
      flaggedCount: 0
    };
  }

  // Simple sentence tokenizer (splitting by period, exclamation, question mark)
  // We keep the delimiters
  const sentenceList = text.match(/[^.!?]+[.!?]*/g) || [text];
  
  let flaggedCount = 0;
  let aiMarkerHits = 0;
  let clicheHits = 0;

  const analyzedSentences = sentenceList.map(sentence => {
    const trimmed = sentence.trim();
    const lower = trimmed.toLowerCase();
    
    if (trimmed.length < 5) {
      return { text: sentence, type: 'ok' };
    }

    // Check for AI Markers
    const matchedAi = AI_MARKERS.filter(marker => {
      const regex = new RegExp(`\\b${marker}\\b`, 'i');
      return regex.test(lower);
    });

    // Check for Cliches
    const matchedCliche = WEAK_CLICHES.filter(cliche => lower.includes(cliche));

    if (matchedAi.length > 0) {
      flaggedCount++;
      aiMarkerHits += matchedAi.length;
      return {
        text: sentence,
        type: 'ai',
        reason: `Contains AI-style clichés: ${matchedAi.join(', ')}`,
        matches: matchedAi
      };
    }

    if (matchedCliche.length > 0) {
      flaggedCount++;
      clicheHits += matchedCliche.length;
      return {
        text: sentence,
        type: 'cliche',
        reason: `Contains overused phrase: "${matchedCliche[0]}"`,
        matches: matchedCliche
      };
    }

    return {
      text: sentence,
      type: 'ok'
    };
  });

  // Calculate AI Likelihood Score
  // Heavily weighted by typical LLM words like "delve", "tapestry", "beacon"
  let likelihood = 0;
  if (sentenceList.length > 0) {
    const aiWordRatio = (aiMarkerHits * 1.5 + clicheHits * 0.75) / sentenceList.length;
    likelihood = Math.min(99, Math.round(aiWordRatio * 100));
  }

  // Add baseline if specific high-probability AI words exist
  if (lowerContains(text, "delve") || lowerContains(text, "tapestry") || lowerContains(text, "testament")) {
    likelihood = Math.max(45, likelihood);
  }
  if (lowerContains(text, "delve") && lowerContains(text, "tapestry")) {
    likelihood = Math.max(85, likelihood);
  }

  return {
    aiLikelihood: likelihood,
    sentences: analyzedSentences,
    flaggedCount
  };
};

function lowerContains(text, word) {
  return text.toLowerCase().includes(word.toLowerCase());
}
