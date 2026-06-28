// SOP Scoring Logic (0-100) based on the 21 PDF judgment and evaluation criteria points

export const scoreSop = (text, university = '', professor = '') => {
  if (!text || text.trim().length === 0) {
    return {
      total: 0,
      breakdown: { hook: 0, goals: 0, fit: 0, flow: 0, language: 0 },
      suggestions: ["Write or paste some text to start the real-time review."]
    };
  }

  const textClean = text.trim();
  const words = textClean.split(/\s+/);
  const totalWords = words.length;
  const textLower = textClean.toLowerCase();
  
  // Split into paragraphs
  const paragraphs = textClean.split(/\n+/).filter(p => p.trim().length > 0);
  const firstParagraph = paragraphs[0] || '';
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  
  const suggestions = [];

  // =========================================================================
  // 1. Hook & Introduction (Max 15) - Breakdown Category: 'hook'
  //    (Covers: 1. Strong Hook, 4. Authentic Story, 5. Transformation)
  // =========================================================================
  let hookScore = 15;

  // Rule 1: Avoid cliché starting lines
  const weakStarts = ["i want to study", "i am applying to", "my name is", "i am writing to", "since i was a child", "ever since a child"];
  const firstSentence = firstParagraph.split(/[.!?]/)[0] || '';
  const hasWeakStart = weakStarts.some(weak => firstSentence.toLowerCase().trim().startsWith(weak));
  if (hasWeakStart) {
    hookScore -= 5;
    suggestions.push("❌ Quality 1 (Hook Start): Your opening sentence starts with a cliché (e.g. 'I want to study...'). Rewrite it using a story or turning point.");
  }

  // Rule 2: Personal Story/Turning Point inclusion
  const storyKeywords = ["realized", "challenge", "project", "struggled", "developed", "problem", "designed", "novel", "pivotal", "sparked", "encountered", "passion"];
  const storyHits = storyKeywords.filter(word => firstParagraph.toLowerCase().includes(word)).length;
  if (storyHits < 2) {
    hookScore -= 4;
    suggestions.push("⚠️ Quality 4 (Storytelling): Your introduction lacks indicators of personal storytelling or turning points. Incorporate a brief real-life narrative.");
  }

  // Rule 3: Transformation/Growth representation
  const growthKeywords = ["grow", "transformed", "evolved", "learned", "overcome", "gained", "shift", "transition"];
  const growthHits = growthKeywords.filter(word => textLower.includes(word)).length;
  if (growthHits < 2) {
    hookScore -= 3;
    suggestions.push("⚠️ Quality 5 (Transformation): Introduce your developmental growth (before vs. after scenario) to display self-transformation.");
  }

  // Rule 4: Intro paragraph length
  const introWords = firstParagraph.split(/\s+/).length;
  if (introWords < 50) {
    hookScore -= 3;
    suggestions.push("⚠️ Quality 1 (Intro Length): Your introductory paragraph is very short. Expand on your opening background narrative.");
  }

  hookScore = Math.max(0, hookScore);

  // =========================================================================
  // 2. Clarity of Purpose & Motivation (Max 20) - Breakdown Category: 'goals'
  //    (Covers: 2. Clear Purpose, 6. Motivation, 14. Short/Long term, 15. Contribution)
  // =========================================================================
  let goalsScore = 20;

  // Rule 5: Clear Purpose
  const purposeKeywords = ["purpose", "choose", "select", "pursue", "degree", "field", "program"];
  const hasPurpose = purposeKeywords.some(w => textLower.includes(w));
  if (!hasPurpose) {
    goalsScore -= 5;
    suggestions.push("❌ Quality 2 (Clear Purpose): Explicitly state what program you want to study and why you chose this timeline.");
  }

  // Rule 6: Subject Motivation
  const motivationKeywords = ["motivated", "inspired", "fascinated", "interest", "passion", "drive"];
  const hasMotivation = motivationKeywords.some(w => textLower.includes(w));
  if (!hasMotivation) {
    goalsScore -= 4;
    suggestions.push("⚠️ Quality 6 (Motivation): Clearly explain your underlying motivation for choosing this specific academic field.");
  }

  // Rule 7: Short-term Goals
  const shortTermKeywords = ["short-term", "short term", "after graduation", "immediate goal", "joining the industry", "post-graduation"];
  const hasShortTerm = shortTermKeywords.some(w => textLower.includes(w));
  if (!hasShortTerm) {
    goalsScore -= 5;
    suggestions.push("❌ Quality 14 (Short-Term Goal): Specify your immediate post-graduation job role, research pathway, or industry goals.");
  }

  // Rule 8: Long-term Goals
  const longTermKeywords = ["long-term", "long term", "future vision", "career path", "ultimate aspiration", "ten years", "longterm"];
  const hasLongTerm = longTermKeywords.some(w => textLower.includes(w));
  if (!hasLongTerm) {
    goalsScore -= 4;
    suggestions.push("❌ Quality 14 (Long-Term Goal): Specify your ultimate long-term career aspirations or leadership visions.");
  }

  // Rule 9: Future Contribution
  const contribKeywords = ["contribution", "contribute", "cohort", "student body", "impact", "give back"];
  const hasContrib = contribKeywords.some(w => textLower.includes(w));
  if (!hasContrib) {
    goalsScore -= 2;
    suggestions.push("⚠️ Quality 15 (Future Contribution): State how you will contribute to the student cohort, laboratories, or university community.");
  }

  goalsScore = Math.max(0, goalsScore);

  // =========================================================================
  // 3. Academic & University Fit (Max 25) - Breakdown Category: 'fit'
  //    (Covers: 7. Academic Background, 8. Research, 9. Work, 13. University Fit)
  // =========================================================================
  let fitScore = 25;

  // Rule 10: Academic Background
  const acadKeywords = ["gpa", "cgpa", "coursework", "bachelor", "degree", "undergraduate", "major", "grade"];
  const acadHits = acadKeywords.filter(w => textLower.includes(w)).length;
  if (acadHits < 2) {
    fitScore -= 5;
    suggestions.push("❌ Quality 7 (Academic Background): Mention your major, relevant courses taken, GPA/CGPA, or academic milestones.");
  }

  // Rule 11: Research Experience
  const researchKeywords = ["research", "thesis", "methodology", "publication", "conference", "investigated", "project"];
  const researchHits = researchKeywords.filter(w => textLower.includes(w)).length;
  if (researchHits < 2) {
    fitScore -= 5;
    suggestions.push("⚠️ Quality 8 (Research Experience): Details on research methodologies, supervisors, or publications are weak. Expand your research section.");
  }

  // Rule 12: Internship & Professional Experience
  const workKeywords = ["internship", "intern", "work", "job", "company", "duties", "industry", "professional"];
  const workHits = workKeywords.filter(w => textLower.includes(w)).length;
  if (workHits < 1) {
    fitScore -= 3;
    suggestions.push("⚠️ Quality 9 (Internship/Work): If you have professional or internship experience, mention it alongside problems you solved.");
  }

  // Rule 13: University fit keywords (Why program, courses)
  const fitKeywords = ["curriculum", "syllabus", "course", "facilities", "infrastructure", "program option"];
  const fitHits = fitKeywords.filter(w => textLower.includes(w)).length;
  if (fitHits < 2) {
    fitScore -= 4;
    suggestions.push("❌ Quality 13 (University Fit): Mention specific courses or unique program elements to explain why this university fits you.");
  }

  // Rule 14: University & Professor Name Match
  if (university) {
    const hasUniName = textLower.includes(university.toLowerCase());
    if (!hasUniName) {
      fitScore -= 4;
      suggestions.push(`❌ Fit: Your target university '${university}' is not mentioned in the text.`);
    }
  } else {
    fitScore -= 2;
  }

  if (professor) {
    const hasProfName = textLower.includes(professor.toLowerCase());
    if (!hasProfName) {
      fitScore -= 4;
      suggestions.push(`❌ Fit: Your target professor Dr. '${professor}' is not referenced. Connect their research to your interest.`);
    }
  } else {
    fitScore -= 2;
  }

  fitScore = Math.max(0, fitScore);

  // =========================================================================
  // 4. Flow & Section Structure (Max 20) - Breakdown Category: 'flow'
  //    (Covers: 3. Personal Brand, 10. Skills, 11. Passion Projects, 12. Challenges, 16. Logical Flow)
  // =========================================================================
  let flowScore = 20;

  // Rule 15: Skills inclusion
  const skillKeywords = ["python", "sql", "matlab", "r", "c++", "java", "tensorflow", "pytorch", "leadership", "teamwork", "critical thinking", "machine learning"];
  const skillHits = skillKeywords.filter(w => textLower.includes(w)).length;
  if (skillHits < 2) {
    flowScore -= 4;
    suggestions.push("⚠️ Quality 10 (Skills): Explicitly mention your technical languages, laboratory skills, or soft qualities.");
  }

  // Rule 16: Passion Projects
  const projectKeywords = ["project", "built", "designed", "github", "repository", "prototype"];
  const hasProject = projectKeywords.some(w => textLower.includes(w));
  if (!hasProject) {
    flowScore -= 4;
    suggestions.push("⚠️ Quality 11 (Passion Project): Reference an independent project or hobby build to display practical application.");
  }

  // Rule 17: Challenges & Growth
  const challengeKeywords = ["challenge", "setback", "obstacle", "overcame", "difficulty", "struggle"];
  const hasChallenge = challengeKeywords.some(w => textLower.includes(w));
  if (!hasChallenge) {
    flowScore -= 4;
    suggestions.push("⚠️ Quality 12 (Challenges): Share a setback or academic challenge you faced, focusing on how you resolved it.");
  }

  // Rule 18: Logical Flow (Checking section order sequence)
  // Ideal order: Intro -> Academic/Research -> Fit/Goals -> Conclusion
  const introIndex = textLower.indexOf("introduction") >= 0 ? textLower.indexOf("introduction") : 0;
  const researchIndex = textLower.indexOf("research") >= 0 ? textLower.indexOf("research") : 1;
  const fitIndex = textLower.indexOf("university") >= 0 ? textLower.indexOf("university") : 2;
  const goalsIndex = textLower.indexOf("goal") >= 0 ? textLower.indexOf("goal") : 3;

  if (introIndex > researchIndex || researchIndex > fitIndex || fitIndex > goalsIndex) {
    // Flow is out of chronological order
    flowScore -= 4;
    suggestions.push("⚠️ Quality 16 (Logical Flow): The progression feels disjointed. Restructure to flow from Interest -> Learning -> Skills -> University -> Future Goals.");
  }

  // Rule 19: Personal Brand differentiation
  const brandKeywords = ["unique", "distinct", "differentiate", "unlike", "cohort", "background"];
  const brandHits = brandKeywords.filter(w => textLower.includes(w)).length;
  if (brandHits < 1) {
    flowScore -= 4;
    suggestions.push("⚠️ Quality 3 (Personal Brand): Add phrases that define your unique brand. Why should you be chosen over 1000 other candidates?");
  }

  flowScore = Math.max(0, flowScore);

  // =========================================================================
  // 5. Language, Human Style & Mistake Checks (Max 20) - Breakdown Category: 'language'
  //    (Covers: 17. Human Writing, 18. Language Style, 19. AI Usage, 20. Conclusion, 21. Mistakes)
  // =========================================================================
  let languageScore = 20;

  // Rule 20: AI Clichés & Human Style
  const aiCliches = ["delve", "tapestry", "beacon", "testament", "furthermore", "moreover", "in conclusion", "synergy", "paradigm", "pave the way", "nestled", "not only, but also", "meticulous"];
  const matchedCliches = aiCliches.filter(cliche => textLower.includes(cliche));
  if (matchedCliches.length > 2) {
    languageScore -= 5;
    suggestions.push(`❌ Quality 17 (AI Clichés): AI-generated cliché words found (${matchedCliches.slice(0, 3).join(', ')}). Replace them with direct human language.`);
  }

  // Rule 21: Critical placeholders checklist warning
  const placeholderRegex = /\[.*?\]|<.*?>/g;
  const placeholders = textClean.match(placeholderRegex);
  if (placeholders) {
    languageScore -= 6;
    suggestions.push(`❌ Quality 21 (Mistakes): Critical placeholders detected (${placeholders.slice(0, 2).join(', ')}). Replace brackets with your actual data.`);
  }

  // Rule 22: Strong Conclusion
  const conclusionKeywords = ["readiness", "prepared", "gratitude", "sincerely", "in summary", "prepared to", "look forward", "vision"];
  const lastParagraphLower = lastParagraph.toLowerCase();
  const hasConclusion = conclusionKeywords.some(w => lastParagraphLower.includes(w));
  if (!hasConclusion) {
    languageScore -= 4;
    suggestions.push("⚠️ Quality 20 (Strong Conclusion): The final paragraph does not convey confidence, gratitude, or readiness. Polish your closing remarks.");
  }

  // Rule 23: Word Count validation
  if (totalWords < 450) {
    languageScore -= 5;
    suggestions.push("⚠️ Quality 21 (Mistake): Word count is too short (under 450 words). Ensure you cover all structural sections.");
  } else if (totalWords > 1500) {
    languageScore -= 3;
    suggestions.push("⚠️ Quality 21 (Mistake): Word count is too long (over 1500 words). Aim for a concise range of 800-1200 words.");
  }

  languageScore = Math.max(0, languageScore);

  // Calculate overall score (0-100)
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
    suggestions: suggestions.length > 0 ? suggestions : ["✨ Outstanding! Your SOP satisfies all 21 key evaluation points. Ready to submit."]
  };
};
