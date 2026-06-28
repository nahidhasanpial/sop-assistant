// SOP Scoring Logic (0-100) based on PDF requirements

export const scoreSop = (text, university = '', professor = '') => {
  if (!text || text.trim().length === 0) {
    return {
      total: 0,
      breakdown: { hook: 0, goals: 0, fit: 0, flow: 0, language: 0 },
      suggestions: ["Write some text to start the real-time review."]
    };
  }

  const textClean = text.trim();
  const words = textClean.split(/\s+/);
  const totalWords = words.length;
  const textLower = textClean.toLowerCase();
  
  // Split into paragraphs
  const paragraphs = textClean.split(/\n+/).filter(p => p.trim().length > 0);
  const firstParagraph = paragraphs[0] || '';
  const firstParagraphWords = firstParagraph.split(/\s+/).length;

  let hookScore = 0;
  let goalsScore = 0;
  let fitScore = 0;
  let flowScore = 0;
  let languageScore = 30; // Starts at max, we deduct

  const suggestions = [];

  // ==========================================
  // 1. Hook Strength (Max 10)
  // ==========================================
  if (firstParagraph) {
    const weakStarts = ["i want to study", "i am applying to", "my name is", "i am writing to", "since i was a child", "ever since a child"];
    const hasWeakStart = weakStarts.some(weak => firstParagraph.toLowerCase().startsWith(weak));
    
    if (hasWeakStart) {
      hookScore = 3;
      suggestions.push("⚠️ Hook: Your introduction starts with a cliché/generic opening (e.g. 'I want to study...'). Rewrite it using a story or unique narrative.");
    } else {
      hookScore = 7;
    }

    // Story indicator keywords
    const storyKeywords = ["realized", "challenge", "project", "struggled", "developed", "problem", "designed", "novel", "pivotal"];
    const storyHits = storyKeywords.filter(word => firstParagraph.toLowerCase().includes(word)).length;
    if (storyHits >= 2 && !hasWeakStart) {
      hookScore = Math.min(10, hookScore + 3);
    }

    // Length check
    if (firstParagraphWords < 60) {
      hookScore = Math.max(2, hookScore - 2);
      suggestions.push("⚠️ Hook: Your introductory paragraph is too short. Expand your opening story (aim for 80-150 words).");
    } else if (firstParagraphWords > 220) {
      hookScore = Math.max(4, hookScore - 2);
      suggestions.push("⚠️ Hook: Your introduction is too long. Keep the hook paragraph concise and punchy.");
    }
  } else {
    suggestions.push("❌ Hook: Write an engaging opening paragraph.");
  }

  // ==========================================
  // 2. Clarity of Goals (Max 20)
  // ==========================================
  const goalKeywords = ["short-term", "long-term", "career", "aspiration", "goal", "objective", "industry", "academia", "phd", "master", "vision", "after graduating"];
  const goalHits = goalKeywords.filter(word => textLower.includes(word)).length;

  const hasShort = textLower.includes("short-term") || textLower.includes("short term") || textLower.includes("immediate goal") || textLower.includes("after graduation");
  const hasLong = textLower.includes("long-term") || textLower.includes("long term") || textLower.includes("future vision") || textLower.includes("career trajectory") || textLower.includes("ten years");

  if (hasShort && hasLong) {
    goalsScore = 20;
  } else if (hasShort || hasLong) {
    goalsScore = 14;
    suggestions.push(`⚠️ Goals: You mentioned ${hasShort ? 'short-term' : 'long-term'} goals, but did not specify both. Graduate programs look for both short-term roles and long-term career visions.`);
  } else if (goalHits >= 3) {
    goalsScore = 10;
    suggestions.push("⚠️ Goals: Address your career path directly. Use explicit sub-headings or phrases like 'My short-term goal is...'");
  } else {
    goalsScore = 4;
    suggestions.push("❌ Goals: Make sure to clearly state your career objectives post-graduation.");
  }

  // ==========================================
  // 3. University Fit (Max 20)
  // ==========================================
  if (university || professor) {
    let uniFound = false;
    let profFound = false;

    if (university) {
      uniFound = textLower.includes(university.toLowerCase());
      if (uniFound) fitScore += 10;
      else suggestions.push(`❌ Fit: Target university '${university}' is not mentioned in your SOP. Add specific curriculum reasons why you choose them.`);
    } else {
      fitScore += 5; // Default some points if not specified in settings
    }

    if (professor) {
      profFound = textLower.includes(professor.toLowerCase());
      if (profFound) fitScore += 10;
      else suggestions.push(`❌ Fit: Target professor Dr. '${professor}' is not mentioned in your SOP. Reference their specific papers or laboratory projects.`);
    } else {
      fitScore += 5;
    }
  } else {
    // Look for generic fit indicators
    const fitKeywords = ["professor", "university", "faculty", "lab", "research group", "curriculum", "syllabus", "course", "facilities"];
    const fitHits = fitKeywords.filter(word => textLower.includes(word)).length;
    
    if (fitHits >= 4) {
      fitScore = 12;
      suggestions.push("⚠️ Fit: Set your target university and professor in Settings to check if you mentioned them correctly.");
    } else {
      fitScore = 6;
      suggestions.push("❌ Fit: Your SOP lacks university-specific fit arguments. Mention why this university, its program, and its professors are perfect for you.");
    }
  }

  // ==========================================
  // 4. Flow & Structure (Max 20)
  // ==========================================
  // We check if the text references key structural sections:
  const sectionChecks = [
    { name: "Academic History", keys: ["gpa", "course", "undergraduate", "degree", "bachelor", "gpa", "score"] },
    { name: "Research Experience", keys: ["research", "thesis", "methodology", "publication", "lab", "supervisor"] },
    { name: "Professional Experience", keys: ["intern", "work", "job", "company", "duties", "solved"] },
    { name: "Projects", keys: ["project", "code", "built", "implemented", "repository", "github"] },
    { name: "Challenges", keys: ["challenge", "overcame", "setback", "growth", "resilience"] },
    { name: "Future Contribution", keys: ["contribution", "give back", "mentor", "cohort", "student body"] },
    { name: "Conclusion", keys: ["gratitude", "ready", "in summary", "prepared", "sincerely"] }
  ];

  let sectionsFound = 0;
  sectionChecks.forEach(sec => {
    const found = sec.keys.some(k => textLower.includes(k));
    if (found) sectionsFound++;
    else suggestions.push(`⚠️ Structure: You might be missing details about "${sec.name}". Ensure this is covered.`);
  });

  flowScore = Math.round((sectionsFound / sectionChecks.length) * 20);

  // ==========================================
  // 5. Language Quality & Cliches (Max 30)
  // ==========================================
  // AI clichés list
  const aiCliches = ["delve", "tapestry", "beacon", "testament", "furthermore", "moreover", "in conclusion", "synergy", "paradigm", "pave the way", "nestled", "not only, but also", "meticulous"];
  const matchedCliches = aiCliches.filter(cliche => textLower.includes(cliche));

  if (matchedCliches.length > 0) {
    languageScore -= Math.min(10, matchedCliches.length * 2);
    suggestions.push(`⚠️ Language: AI-style cliches detected (${matchedCliches.slice(0, 3).join(', ')}). Replace them with direct, active verbs.`);
  }

  // Check for repeated words (e.g. "the the", "and and")
  const repeatRegex = /\b(\w+)\s+\1\b/gi;
  const repeats = textClean.match(repeatRegex);
  if (repeats) {
    languageScore -= Math.min(6, repeats.length * 3);
    suggestions.push(`⚠️ Grammar: Repeated words detected (${repeats.slice(0, 2).join(', ')}). Remove duplicates.`);
  }

  // Check for weak phrases
  if (textLower.includes("i am passionate about") || textLower.includes("deeply passionate")) {
    languageScore -= 2;
    suggestions.push("⚠️ Tone: 'I am passionate about...' is overused. Let your achievements and projects show your passion instead.");
  }

  // Word count assessment
  if (totalWords < 400) {
    languageScore = Math.max(10, languageScore - 8);
    suggestions.push("⚠️ Length: Your SOP is very short (under 400 words). Ensure you cover all 11 steps of the guide.");
  } else if (totalWords > 1600) {
    languageScore = Math.max(10, languageScore - 5);
    suggestions.push("⚠️ Length: Your SOP exceeds 1600 words. Admissions committees prefer concise statements (aim for 800-1200 words).");
  }

  languageScore = Math.max(0, languageScore);

  // Compute total
  const total = hookScore + goalsScore + fitScore + flowScore + languageScore;

  return {
    total,
    breakdown: {
      hook: hookScore,
      goals: goalsScore,
      fit: fitScore,
      flow: flowScore,
      language: languageScore
    },
    suggestions: suggestions.length > 0 ? suggestions : ["✨ Your SOP looks excellent! Review any specific program guidelines before submitting."]
  };
};
