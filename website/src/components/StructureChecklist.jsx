import React, { useState } from 'react';

const STEPS_DATA = [
  {
    id: 'intro',
    number: '1',
    title: 'Powerful Introduction (Hook + Story + Motivation)',
    tips: [
      'Avoid cliché openings (e.g. "I want to study...", "My name is..."). Instead, begin with a personal hook or defining turning point.',
      'Clearly establish the academic field you are focusing on and why it matters to you.',
      'Provide a personal story or real-world challenge that motivated your interest in this field.'
    ],
    snippet: `My interest in [Field of Study] was not born in a classroom, but during [Specific Event/Project/Challenge]. Faced with [Describe the problem/challenge], I realized [Describe your key insight]. This pivotal experience propelled me to...`
  },
  {
    id: 'academic',
    number: '2',
    title: 'Academic Background',
    tips: [
      'List your undergraduate degree, target major, and core academic foundations.',
      'Highlight 2-3 advanced subjects or courses that directly prepared you for graduate-level research.',
      'Mention your CGPA if it is a strength, or focus on major-specific achievements.'
    ],
    snippet: `During my undergraduate studies in [Your Major] at [Your University], I built a solid foundation in [Core Areas]. I particularly excelled in advanced courses such as [Course 1] and [Course 2], achieving [Mention grade/score if good].`
  },
  {
    id: 'research',
    number: '3',
    title: 'Research Experience',
    tips: [
      'Detail your previous research projects, focusing on your hypothesis, methodologies, and findings.',
      'Clearly explain YOUR individual contribution to the research team or lab group.',
      'Highlight publications, conference presentations, or undergraduate thesis projects.'
    ],
    snippet: `Under the supervision of Dr. [Professor Name], I investigated [Research Topic]. Using [Methodology/Tools], my role was to [Your specific contribution]. Our work yielded [Results/Findings], which was subsequently [Published/Presented/Completed] as [Paper/Thesis Title].`
  },
  {
    id: 'internship',
    number: '4',
    title: 'Internship / Professional Experience',
    tips: [
      'Do not just list general company names or responsibilities.',
      'Explain specific technical challenges solved, actions taken, and metrics/outcomes.',
      'Use active verbs (e.g. optimized, engineered, spearheaded) to showcase practical competency.'
    ],
    snippet: `As a [Job Title] at [Company Name], I spearheaded [Project/Task] to address [Problem/Goal]. By implementing [Action taken], I optimized [System/Process], resulting in a [Quantified improvement, e.g. 15% increase in efficiency].`
  },
  {
    id: 'projects',
    number: '5',
    title: 'Projects + Skills + Achievements',
    tips: [
      'Mention side projects, hobby projects, or open-source repository contributions.',
      'Demonstrate self-learning, curiosity, and practical tool command.'
    ],
    snippet: `To further explore [Specific Field], I developed [Project Name], a [Short Description]. Built using [Tech Stack, e.g. Python, React], this project allowed me to master [Skill 1] and [Skill 2] while resolving [Challenge].`
  },
  {
    id: 'challenges',
    number: '6',
    title: 'Challenges + Growth + Transformation',
    tips: [
      'Address any academic anomalies (e.g. low GPA semester, gaps) professionally.',
      'Emphasize the pivot: what actions you took to resolve the issue and how it led to academic maturity.'
    ],
    snippet: `In my sophomore year, my academic performance was briefly affected by [Setback, e.g., health issue / family crisis]. However, I mitigated this by [Action taken, e.g. seeking mentorship/reorganizing schedules], which subsequently rebounded my major GPA to [Score].`
  },
  {
    id: 'fit',
    number: '7',
    title: 'Why Program + University + Professor (Fit)',
    tips: [
      'Show that you have heavily researched the target department and institutional values.',
      'Mention specific laboratory research, specialized courses, or research groups that align with your interest.',
      'Name 1-2 professors whose current research overlaps with your academic interests.'
    ],
    snippet: `The [Program Name] at [University Name] is the ideal catalyst for my goals, specifically due to the research being conducted in the [Lab Name]. I am eager to work under Dr. [Professor Name] to contribute to their current projects on [Topic]. Additionally, courses like [Course Name] will enable me to...`
  },
  {
    id: 'shortgoal',
    number: '8',
    title: 'Short-term Goal',
    tips: [
      'Keep your goals realistic, specific, and directly tied to the degree.',
      'Identify target roles (e.g. Machine Learning Engineer, Research Associate) immediately post-graduation.'
    ],
    snippet: `Immediately following graduation, my short-term goal is to secure a position as a [Job Role, e.g. Machine Learning Engineer / Research Fellow] within the [Target Industry, e.g., autonomous systems / healthcare technology] sector.`
  },
  {
    id: 'longgoal',
    number: '9',
    title: 'Long-term Goal',
    tips: [
      'Explain your 5-10 year career trajectory post-graduation.',
      'Describe your ultimate career vision (e.g. Principal Scientist, Academic Faculty).'
    ],
    snippet: `In the long term, I aspire to [Long-term goal, e.g. lead an R&D department / establish a research laboratory] focusing on [Field]. I aim to contribute to thought leadership and develop solutions that...`
  },
  {
    id: 'contribution',
    number: '10',
    title: 'Future Contribution',
    tips: [
      'Describe how you will enrich the student cohort and participate in campus life.',
      'Focus on specific contributions: peer mentorship, community seminars, or cohort leadership.'
    ],
    snippet: `As a graduate student, I look forward to contributing to the university community by [Contribution, e.g., mentoring undergraduate researchers / organizing technical hackathons] and promoting collaborative research within our cohort.`
  },
  {
    id: 'conclusion',
    number: '11',
    title: 'Strong & Confident Conclusion',
    tips: [
      'Reiterate your preparedness for the academic rigor of the program.',
      'State your gratitude for the committee\'s review and conclude with a strong statement of intent.'
    ],
    snippet: `In conclusion, I am fully prepared to take on the academic rigor of [University Name]. I am confident that my technical background, research preparation, and drive make me a valuable addition to your next cohort. I thank you for considering my application.`
  }
];

export default function StructureChecklist({ text, onInsertSnippet }) {
  const [showOnlyMissing, setShowOnlyMissing] = useState(true);
  const [openStep, setOpenStep] = useState(null);

  const textLower = text.toLowerCase();

  // Keyword check helper to show status indicators
  const checkStepStatus = (stepId) => {
    if (!text || text.trim().length === 0) return 'empty';

    switch (stepId) {
      case 'intro':
        const startsWithCliché = textLower.startsWith("i want to study") || textLower.startsWith("my name is");
        return startsWithCliché ? 'warning' : 'checked';
      case 'academic':
        return (textLower.includes('gpa') || textLower.includes('course') || textLower.includes('university')) ? 'checked' : 'warning';
      case 'research':
        return (textLower.includes('research') || textLower.includes('thesis') || textLower.includes('lab') || textLower.includes('project')) ? 'checked' : 'warning';
      case 'internship':
        return (textLower.includes('intern') || textLower.includes('work') || textLower.includes('job') || textLower.includes('company')) ? 'checked' : 'warning';
      case 'projects':
        return (textLower.includes('project') || textLower.includes('code') || textLower.includes('stack') || textLower.includes('github')) ? 'checked' : 'warning';
      case 'challenges':
        return (textLower.includes('challenge') || textLower.includes('overcame') || textLower.includes('growth') || textLower.includes('resilience')) ? 'checked' : 'warning';
      case 'fit':
        return (textLower.includes('professor') || textLower.includes('fit') || textLower.includes('facility') || textLower.includes('curriculum')) ? 'checked' : 'warning';
      case 'shortgoal':
        return (textLower.includes('short-term') || textLower.includes('short term') || textLower.includes('immediate') || textLower.includes('graduation')) ? 'checked' : 'warning';
      case 'longgoal':
        return (textLower.includes('long-term') || textLower.includes('long term') || textLower.includes('career') || textLower.includes('vision')) ? 'checked' : 'warning';
      case 'contribution':
        return (textLower.includes('contribution') || textLower.includes('cohort') || textLower.includes('give back')) ? 'checked' : 'warning';
      case 'conclusion':
        return (textLower.includes('conclusion') || textLower.includes('prepared') || textLower.includes('thank you') || textLower.includes('sincerely')) ? 'checked' : 'warning';
      default:
        return 'empty';
    }
  };

  // Compile checklist data with status resolved
  const processedSteps = STEPS_DATA.map(step => ({
    ...step,
    status: checkStepStatus(step.id)
  }));

  const missingSteps = processedSteps.filter(step => step.status !== 'checked');
  const visibleSteps = showOnlyMissing ? missingSteps : processedSteps;

  return (
    <div className="flex flex-col gap-3">
      {/* Header and Toggle Button */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SOP Structure Checklist</h3>
        <button
          onClick={() => setShowOnlyMissing(prev => !prev)}
          className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-200 transition-colors"
        >
          {showOnlyMissing ? "Show All Steps" : "Show Missing Only"}
        </button>
      </div>

      {/* Instant Action Banner */}
      {missingSteps.length > 0 ? (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-slate-700 rounded-xl text-[11px] leading-relaxed">
          ⚠️ <b>{missingSteps.length} Missing / Weak Parts</b>: Your draft is missing details or contains warnings in the highlighted sections below. Fix them to complete your SOP.
        </div>
      ) : (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl text-[11px] leading-relaxed text-center font-semibold">
          🎉 All structural segments successfully detected in your draft segment! Your SOP covers all 11 checklist milestones.
        </div>
      )}

      {/* Checklist Accordion */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] pr-1">
        {visibleSteps.map((step) => {
          const isOpen = openStep === step.id;

          return (
            <div 
              key={step.id} 
              className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                isOpen 
                  ? 'border-indigo-500/40 bg-indigo-950/10 shadow-lg' 
                  : 'border-slate-800/80 bg-slate-900/30'
              }`}
            >
              {/* Header */}
              <button
                onClick={() => setOpenStep(isOpen ? null : step.id)}
                className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isOpen ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step.number}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold transition-colors ${isOpen ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {step.title}
                    </h4>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  {step.status === 'checked' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400">
                      ✓
                    </span>
                  )}
                  {step.status === 'warning' && (
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] text-amber-400 font-bold" title="Section has warning/clichés">
                      !
                    </span>
                  )}
                  {step.status === 'empty' && (
                    <span className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold" title="Section not found in draft">
                      ?
                    </span>
                  )}
                  <span className={`text-slate-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              {/* Collapsible Content */}
              {isOpen && (
                <div className="p-4 border-t border-slate-800/50 bg-slate-950/20 text-xs flex flex-col gap-3">
                  {/* Tips */}
                  <div>
                    <h5 className="font-semibold text-slate-400 mb-1.5 text-[11px] tracking-wider uppercase">Writing Tips & Guidelines</h5>
                    <ul className="flex flex-col gap-1.5 text-slate-400 pl-4 list-disc leading-relaxed">
                      {step.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Template Snippet Insertion */}
                  <div className="mt-2 pt-3 border-t border-slate-800/60 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Template Snippet</span>
                      <button
                        onClick={() => onInsertSnippet(step.snippet)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium transition-colors shadow-sm shadow-indigo-600/20"
                      >
                        + Insert Snippet
                      </button>
                    </div>
                    <pre className="bg-slate-950/80 p-2.5 rounded border border-slate-800 text-[10px] text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                      {step.snippet}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
