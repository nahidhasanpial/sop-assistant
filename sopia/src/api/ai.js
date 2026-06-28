// AI Client supporting Gemini, Claude, and Offline local NLP Suggester

export const getAISuggestions = async ({
  sectionId,
  sectionTitle,
  text,
  university,
  professor,
  customQuery,
  apiProvider, // 'gemini' | 'claude' | 'none'
  apiKey
}) => {
  if (!text || text.trim().length < 5) {
    return {
      success: false,
      feedback: "Please write some text first before requesting AI suggestions."
    };
  }

  // 1. If no API key is provided, use the high-quality Offline local NLP Suggester
  if (apiProvider === 'none' || !apiKey) {
    return getOfflineSuggestions(sectionId, sectionTitle, text, university, professor, customQuery);
  }

  const prompt = customQuery 
    ? `You are an expert graduate admissions counselor. Help the student optimize their Statement of Purpose (SOP) draft.
Task requested by student: "${customQuery}"

Context:
- Target University: ${university || "Not specified"}
- Target Professor: ${professor || "Not specified"}

Student's Current Draft segment:
"""
${text}
"""

Instructions:
1. Address the student's request directly.
2. Provide a clear response, specific critique, and actionable improvements.
3. If they asked to rewrite or improve, provide 2 revised examples (e.g. one standard academic, one highly narrative).

Format your output in clean Markdown.`
    : `You are an expert graduate admissions counselor specializing in helping students write outstanding Statements of Purpose (SOP).
Analyze the following text written for the section "${sectionTitle}" (Part of an 11-step SOP structure).

Context:
- Target University: ${university || "Not specified"}
- Target Professor: ${professor || "Not specified"}

Student's Text:
"""
${text}
"""

Instructions:
1. Provide a brief critique of the text, highlighting specific strengths and weaknesses (e.g. tone, detail, flow).
2. Look out for weak openings like "I want to study" or generic statements and point them out.
3. Check for specific academic details: Did they mention methodologies, projects, or clear goals relevant to this section?
4. Offer 3 actionable improvement suggestions.
5. Provide 3-4 professional alternative vocabulary words or transition phrases.
6. Provide an example of how a revised sentence would look based on their input.

Format your output in clean Markdown with these exact headings:
### Critique
### Actionable Suggestions
### Recommended Vocabulary
### Revised Example`;

  try {
    if (apiProvider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to fetch from Gemini API");
      }
      const data = await response.json();
      const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return { success: true, feedback };
    } else if (apiProvider === 'claude') {
      // Direct call to Anthropic API (might need background script proxy due to CORS)
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true' // In extension context, we set this header
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to fetch from Claude API");
      }
      const data = await response.json();
      const feedback = data.content?.[0]?.text;
      return { success: true, feedback };
    }
  } catch (error) {
    console.error("AI Request Failed, falling back to local suggester:", error);
    // Fall back to offline suggester on error
    const localRes = getOfflineSuggestions(sectionId, sectionTitle, text, university, professor);
    return {
      success: true,
      feedback: `⚠️ **AI API Call Failed (${error.message}). Running Local Advisor instead:**\n\n${localRes.feedback}`
    };
  }
};

// ============================================================================
// Offline NLP Suggestion Generator (Rules + Analysis)
// ============================================================================
function getOfflineSuggestions(sectionId, sectionTitle, text, university, professor, customQuery) {
  if (customQuery) {
     let response = `### 📋 SOPIA AI Advisor Report\n\n`;
     const queryLower = customQuery.toLowerCase();
     
     if (queryLower.includes("warnings and improvements requested:")) {
        const warningsPart = customQuery.substring(queryLower.indexOf("warnings and improvements requested:"));
        response += `Based on your draft, our **21-Point Judgement Engine** flags these recommendations:\n\n`;
        
        if (warningsPart.toLowerCase().includes("hook")) {
           response += `🔹 **Fix Hook & Clichés (Quality 1)**: Avoid starting with passive sentences like *"I want to study"*. Instead, start immediately with a real-life challenge or spark moment. For example:\n*“My work in distributed computing was sparked when I designed a load balancer that collapsed under high thread-pool density...”*\n\n`;
        }
        if (warningsPart.toLowerCase().includes("goals")) {
           response += `🔹 **Define Goal Trajectories (Quality 14)**: Ensure you explicitly mention both **short-term** and **long-term** career goals. E.g., *"My short-term goal is to work as an R&D engineer, which will ultimately support my long-term aspiration of..."*\n\n`;
        }
        if (warningsPart.toLowerCase().includes("fit") || warningsPart.toLowerCase().includes("professor")) {
           response += `🔹 **Enhance University Fit (Quality 13)**: Mention specific curriculum courses or Dr. ${professor || '[Professor]'} and their active projects. Avoid general praises like *"your prestigious university"*.\n\n`;
        }
        if (warningsPart.toLowerCase().includes("clichés") || warningsPart.toLowerCase().includes("language")) {
           response += `🔹 **Human Writing Tone (Quality 17)**: Remove AI cliché markers like *"delve"*, *"tapestry"*, *"beacon"*, and *"furthermore"*. Use simple, professional terms like *"Additionally"* or *"Therefore"*.\n\n`;
        }
        if (warningsPart.toLowerCase().includes("placeholders") || warningsPart.toLowerCase().includes("mistakes")) {
           response += `🔹 **Placeholders Warning (Quality 21)**: You have brackets like \`[University Name]\` or \`[Professor Name]\` in your text. Please replace them with actual details to avoid instant rejection.\n\n`;
        }
        
        response += `*Let me know if you would like me to rewrite any of these sections for you!*`;
     } else {
        if (queryLower.includes("hook") || queryLower.includes("intro")) {
           response += `For your introduction, ensure you:
- Start with an active technical verb or a real-life challenge instead of clichés.
- Example: *'My research in distributed systems began when I had to optimize a 4-node database partition...'*`;
        } else if (queryLower.includes("flow") || queryLower.includes("transition")) {
           response += `To improve flow and transition:
- Use analytical transition words like *'Consequently'*, *'Specifically'*, *'Additionally'*, and *'Indeed'*.
- Avoid conversational ones like *'Furthermore'*, *'Besides'*, or *'So'* (and keep AI likelihood low by avoiding *'moreover'*).`;
        } else if (queryLower.includes("goal")) {
           response += `For goals:
- Define short-term employment targets (e.g. R&D engineer).
- Define long-term trajectory targets (e.g. group lead or principal investigator).`;
        } else {
           response += `Here are some quick pointers to improve your SOP:
1. Add specific tool names (e.g. PyTorch, Kubernetes) to ground your projects.
2. Clearly mention what *you* did (use 'I engineered' instead of 'Our team developed').
3. Keep sentences concise (aim for under 25 words per sentence for flow).`;
        }
     }
     return { success: true, feedback: response };
  }

  const wordCount = text.trim().split(/\s+/).length;
  let critique = "";
  let suggestions = [];
  let vocab = [];
  let example = "";

  const textLower = text.toLowerCase();

  // Common checks
  const hasIWant = textLower.includes("i want to study") || textLower.includes("i want to learn") || textLower.includes("i have a passion");
  const hasChildhood = textLower.includes("since my childhood") || textLower.includes("since i was a child") || textLower.includes("ever since I was");
  const hasPassionate = textLower.includes("passionate about") || textLower.includes("deeply passionate");

  switch(sectionId) {
    case 'intro':
      critique = "Your introduction needs to serve as a strong hook to engage the committee within 30 seconds.";
      if (hasIWant) {
        critique += " ❌ Flagged: Avoid generic, weak opening statements like 'I want to study...'. It is better to lead with a story.";
        suggestions.push("Replace 'I want to study...' with a narrative describing a critical project, problem, or turning point that sparked your interest.");
      }
      if (hasChildhood) {
        critique += " ❌ Flagged: Avoid childhood clichés ('Since I was a kid...'). Admissions committees are interested in your mature, academic motivations.";
        suggestions.push("Shift focus from childhood hobbies to your undergraduate experiences or recent professional challenges.");
      }
      if (!hasIWant && !hasChildhood) {
        critique += " ✔️ Good effort! Your opening avoids standard clichés.";
        suggestions.push("Describe a specific, real-world challenge or research question that motivates you today.");
      }
      suggestions.push("Define your immediate motivation for pursuing graduate school in the first paragraph.");
      suggestions.push("Ensure your personal brand or unique angle is clear in this section.");
      vocab = ["catalyst", "pivotal moment", "precipitated", "embarked", "cognitive spark"];
      example = `"My interest in Machine Learning was not born in a classroom, but during my junior year internship at X, when I struggled to optimize a neural network that repeatedly failed on sparse edge-case data. This specific challenge led me to realize..."`;
      break;

    case 'academic':
      critique = `Your academic background summary is currently ${wordCount} words. It should summarize your key accomplishments and prep.`;
      if (!textLower.includes("gpa") && !textLower.includes("grade") && !textLower.includes("score")) {
        suggestions.push("If you have a strong CGPA, explicitly state it. If it is lower, explain it constructively under Section 6 (Challenges).");
      }
      if (!textLower.includes("course") && !textLower.includes("subject")) {
        suggestions.push("Mention 2-3 specific advanced undergraduate courses that prepared you for this graduate degree.");
      }
      suggestions.push("Summarize relevant honors, scholarships, or academic awards.");
      vocab = ["rigorous coursework", "underpinned by", "academic foundation", "scholastic achievement", "mastery of"];
      example = `"My undergraduate curriculum in Computer Science provided a rigorous foundation in discrete mathematics and algorithms, where I excelled in advanced courses like Database Systems (A+) and Distributed Networks..."`;
      break;

    case 'research':
      critique = "Research experience is critical. You must state your topic, methodology, contribution, and findings.";
      if (!textLower.includes("method") && !textLower.includes("algorithm") && !textLower.includes("data")) {
        suggestions.push("Describe the specific methodology or algorithms you used in your research project.");
      }
      if (!textLower.includes("publish") && !textLower.includes("thesis") && !textLower.includes("paper")) {
        suggestions.push("If you wrote a thesis or have a publication (or paper in progress), state it clearly along with names of supervisors.");
      }
      suggestions.push("Explain what *your* specific contribution was in the lab, rather than just describing the general project.");
      vocab = ["formulated a hypothesis", "empirical analysis", "synthesized data", "under the supervision of", "published in"];
      example = `"Under the guidance of Dr. Rahman, I formulated a novel heuristic to reduce processing time in IoT routing protocols. By developing a simulated testbed in Python, we achieved a 14% reduction in packet loss, which we later published in..."`;
      break;

    case 'internship':
      critique = "For work experience, avoid simply listing your job duties. Highlight what problem you solved and what you learned.";
      if (textLower.includes("responsible for") || textLower.includes("duties included")) {
        critique += " ❌ Flagged: Avoid listing duties. Focus on achievements.";
        suggestions.push("Rewrite passive sentences like 'I was responsible for coding' into active, achievement-based results.");
      }
      suggestions.push("State the specific problem, your actions, and the measurable impact (e.g. percentages, speedups).");
      vocab = ["spearheaded", "optimized pipeline", "collaborated across functions", "resolved architectural bottlenecks", "spearheaded development"];
      example = `"During my summer internship at TechCorp, I spearheaded the optimization of the legacy query cache. By implementing a Redis-based cache layer, I reduced API response latency by 25% for over 10,000 active users..."`;
      break;

    case 'projects':
      critique = "Projects display your active coding or engineering capabilities. Emphasize passion projects that show self-motivation.";
      suggestions.push("Detail a side project that was self-directed. Explain the stack (e.g., PyTorch, React) and what motivated you to build it.");
      suggestions.push("Link hard skills (e.g., Python, SQL) to practical application outcomes.");
      vocab = ["engineered", "open-source contribution", "deployed to production", "architected", "robust system design"];
      example = `"To explore computer vision models firsthand, I engineered an open-source real-time object tracking system using OpenCV and PyTorch, which is currently deployed and receives active updates on GitHub..."`;
      break;

    case 'challenges':
      critique = "This section must show resilience. Shift the focus from the obstacle itself to your growth and transformation.";
      suggestions.push("Use a Before-After structure: State the setback briefly, then focus 70% of the paragraph on how you overcame it and what you learned.");
      suggestions.push("Avoid making excuses. Keep the tone professional, factual, and mature.");
      vocab = ["resilience", "mitigated the setback", "developed coping mechanisms", "subsequently rebounded", "transformative growth"];
      example = `"In my sophomore year, my grades temporarily declined due to a family medical crisis. Rather than conceding, I reorganized my scheduling, sought tutoring for advanced calculus, and subsequently rebounded with a 3.9 GPA in my final three semesters..."`;
      break;

    case 'fit':
      critique = "University Fit is the core differentiator. Show deep research into this specific program.";
      if (university) {
        if (!textLower.includes(university.toLowerCase())) {
          critique += ` ❌ Warning: You did not explicitly mention your target university '${university}' in the text.`;
          suggestions.push(`Integrate the name of the university (${university}) naturally.`);
        } else {
          critique += ` ✔️ Good: You mentioned '${university}'.`;
        }
      }
      if (professor) {
        if (!textLower.includes(professor.toLowerCase())) {
          critique += ` ❌ Warning: You did not mention target Professor '${professor}' in this fit section.`;
          suggestions.push(`Mention Dr. ${professor} and reference one of their recent papers or projects.`);
        } else {
          critique += ` ✔️ Good: You mentioned Dr. ${professor}.`;
        }
      }
      suggestions.push("Explain why the curriculum, specific labs, or equipment at this university fits your research direction.");
      vocab = ["synergy with", "faculty mentor", "state-of-the-art facility", "academic ecosystem", "highly aligned with"];
      example = `"The academic ecosystem at ${university || 'your target university'} is highly aligned with my goals. I am particularly eager to work with Dr. ${professor || 'Rahman'} in the ${professor ? professor + ' Lab' : 'AI Lab'} to contribute to their current research on..."`;
      break;

    case 'shortgoal':
      critique = "Your short-term goals must be highly specific, realistic, and achievable.";
      suggestions.push("State the specific role (e.g., R&D engineer, Research Fellow) and target industries you want to join immediately after graduation.");
      vocab = ["immediate post-graduation objective", "leveraging my training", "transition into", "secure a role as", "research fellow"];
      example = `"Upon graduation, my immediate objective is to secure a role as an R&D Machine Learning Engineer in the autonomous systems sector, where I can apply my graduate training in reinforcement learning to..."`;
      break;

    case 'longgoal':
      critique = "Your long-term goal should outline your overarching career trajectory.";
      suggestions.push("Describe where you want to be in 5-10 years (e.g. Lead Scientist, Academic Faculty, Startup Founder).");
      vocab = ["long-term vision", "pioneer new developments", "thought leadership", "industry standard", "founding principal"];
      example = `"My long-term vision is to lead an industrial research lab focused on ethical AI systems, contributing to open-source policy frameworks that shape how intelligent agents are deployed globally..."`;
      break;

    case 'contribution':
      critique = "Explain how you will give back to the student body, research labs, or university community.";
      suggestions.push("Be specific: Can you mentor junior students, organize hackathons, or contribute to diversity in STEM groups?");
      vocab = ["enrich the cohort", "foster collaboration", "peer mentorship", "vibrant graduate community", "active participant"];
      example = `"Drawing from my experience organizing student hackathons, I intend to coordinate peer-led technical workshops within the graduate department, fostering collaboration among diverse research cohorts..."`;
      break;

    case 'conclusion':
      critique = "The conclusion must be strong, confident, and leave a lasting impression of readiness.";
      if (textLower.includes("hope") || textLower.includes("please let me in") || textLower.includes("beg")) {
        critique += " ❌ Flagged: Avoid sounding desperate or pleading. Keep a professional, confident tone.";
        suggestions.push("Replace soft verbs like 'I hope you accept me' with assertions of readiness and future contribution.");
      }
      suggestions.push("Express gratitude and summarize your readiness to take on the rigor of the graduate program.");
      vocab = ["fully prepared to engage", "rigor of the program", "look forward to contributing", "in summary", "eagerly anticipate"];
      example = `"In summary, I am fully prepared to engage with the rigorous academic curriculum at ${university || 'your target university'}, confident that my research background and technical foundation will allow me to make meaningful contributions to your cohort..."`;
      break;

    default:
      critique = "General section assessment.";
      suggestions = ["Maintain a professional, academic tone.", "Ensure proper transitions between sentences."];
      vocab = ["furthermore", "consequently", "specifically", "analytical approach"];
      example = `"Moreover, my analysis indicates that..."`;
  }

  // Format into Markdown
  const feedback = `### Critique
${critique}

### Actionable Suggestions
${suggestions.map(s => `- ${s}`).join('\n')}

### Recommended Vocabulary
The following terms can elevate your tone:
${vocab.map(v => `- **${v}**`).join('\n')}

### Revised Example
Here is a sample sentence showing the ideal academic style:
*${example}*`;

  return {
    success: true,
    feedback
  };
}

export const generateSOP = async ({
  degreeField,
  university,
  professor,
  background,
  experience,
  goals,
  apiProvider,
  apiKey
}) => {
  if (!degreeField || !university || !background) {
    return {
      success: false,
      feedback: "Please provide at least the Degree/Field, Target University, and Academic Background to generate your SOP."
    };
  }

  // 1. If no API key is provided, use the local formatter generator
  if (apiProvider === 'none' || !apiKey) {
    return getLocalGeneratedSOP(degreeField, university, professor, background, experience, goals);
  }

  const prompt = `You are an elite graduate admissions counselor. Write a highly professional, cohesive, and compelling Statement of Purpose (SOP) based on the following student details:

Target Program & Field: ${degreeField}
Target University: ${university}
Target Professor / Lab: ${professor || "Not specified"}
Academic Background: ${background}
Key Projects / Research / Professional Experience: ${experience || "Not specified"}
Career Goals (Short & Long Term): ${goals || "Not specified"}

Your output MUST be a complete, ready-to-use Statement of Purpose containing 5 to 6 paragraphs that flow naturally while covering the 11-step structure.

Rules to achieve a perfect 100/100 score on our grading system:
1. Hook & Introduction (Paragraph 1): Begin with an active, engaging hook describing a technical challenge, project, or turning point. Use words like "challenge", "project", "developed", "realized". DO NOT use weak openings like "I am writing to apply...", "My name is...", "Since I was a child...", or "I want to study...".
2. Clarity of Goals: Explicitly state your career path. You MUST use the exact words "short-term" (e.g. "My short-term goal is to...") and "long-term" (e.g. "My long-term career trajectory is...") to describe your goals.
3. University Fit: Clearly explain how the curriculum, courses, or labs at "${university}" match your aspirations. Mention "${university}" and Dr. "${professor || ''}" naturally.
4. Structure Coverage: Ensure you mention keywords for Academic History ("undergraduate", "degree"), Research Experience ("research", "thesis", "supervisor"), Professional Experience ("internship", "job", "work"), Projects ("project", "built", "implemented", "github"), Challenges ("challenge", "setback"), and Future Contribution ("contribution", "cohort", "mentor").
5. Conclusion: End with a strong statement of readiness using words like "prepared", "in summary", and "ready".

CRITICAL - HUMAN TONE CHECK (MUST score 0% AI likelihood):
DO NOT use ANY of these AI-typical words and transition words:
- "delve"
- "tapestry"
- "beacon"
- "testament"
- "furthermore"
- "moreover"
- "in conclusion"
- "synergy"
- "paradigm"
- "pave the way"
- "nestled"
- "not only, but also"
- "meticulous"
- "vibrant"
- "holistic"
- "underpinned"
- "key takeaway"
- "commendable"
- "multifaceted"
- "unwavering"
- "passionate"
- "fascinated"

Instead of "furthermore" or "moreover", use "In addition", "Additionally", or "Therefore".
Provide ONLY the text of the Statement of Purpose (no titles, introductory notes, or markdown headings).`;

  try {
    if (apiProvider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to fetch from Gemini API");
      }
      const data = await response.json();
      const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return { success: true, feedback };
    } else if (apiProvider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to fetch from Claude API");
      }
      const data = await response.json();
      const feedback = data.content?.[0]?.text;
      return { success: true, feedback };
    }
  } catch (error) {
    console.error("AI Generation Failed, falling back to local suggester:", error);
    const localRes = getLocalGeneratedSOP(degreeField, university, professor, background, experience, goals);
    return {
      success: true,
      feedback: `⚠️ **AI API Call Failed (${error.message}). Running Local Generator instead:**\n\n${localRes.feedback}`
    };
  }
};

const getLocalGeneratedSOP = (degreeField, university, professor, background, experience, goals) => {
  const uniName = university || "your target university";
  const profName = professor ? "Dr. " + professor : "the department faculty";

  const localSOP = `STATEMENT OF PURPOSE

My choice to pursue a graduate degree in ${degreeField} at ${uniName} is driven by a pivotal research challenge I encountered. During my undergraduate studies, I developed a novel automation project to address data throughput bottlenecks. When my first prototype failed, I realized that I needed to master advanced computational models to overcome complex system design constraints. This specific technical challenge propelled my scholarly interest in this field and confirmed my readiness for graduate research.

Academically, I built a strong foundation in this discipline, graduating with a bachelor's degree in ${background || 'my undergraduate major'}. I focused on advanced mathematical modeling and algorithms, which prepared me for graduate-level research. During my academic semesters, I received high scores in relevant courses and regularly applied theoretical principles to practical lab projects, ensuring that my studies were grounded in real-world application.

My research experience includes working under academic supervisors to design and evaluate new software frameworks. For my undergraduate thesis project, I built a compiler tool and implemented data pipelines using version control systems like GitHub to share my repository. Our team solved several system integration setbacks, which taught me the value of methodology, experimental persistence, and long lab hours.

Beyond academia, my professional job and internship duties at a technology firm allowed me to apply my skills to commercial software deployments. I worked alongside senior engineers, where I was responsible for troubleshooting database integrations and optimizing server code. This industrial experience allowed me to grow professionally, understand team collaboration, and learn how to translate theoretical concepts into robust consumer products.

${uniName} represents the perfect academic fit for my future goals. I choose this program because the specific curriculum and research focus in this field align with my skills. Additionally, I am eager to align my studies with the research of ${profName}. I plan to contribute actively to the student body, offer peer mentorship to junior students, and enrich the academic cohort. In summary, I am prepared to dedicate myself to the rigorous requirements of this graduate degree, and I am ready to make a significant contribution. Specifically, my short-term goal is to secure a research engineer role post-graduation, which will prepare me for my long-term career trajectory of leading innovative academic labs.`;

  return {
    success: true,
    feedback: localSOP
  };
};
