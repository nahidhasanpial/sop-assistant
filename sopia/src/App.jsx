import React, { useState, useEffect } from 'react';
import logo from './assets/logo.png';
import { 
  loginWithGoogle, 
  logout, 
  onAuthChange, 
  saveSop, 
  fetchSops, 
  updatePremiumStatus 
} from './firebase';
import { scoreSop } from './utils/scorer';
import { detectAiStyle } from './utils/detector';
import { exportToPdf, exportToDocx, exportTipsToPdf, exportPremiumTemplate } from './utils/exporter';
import { getAISuggestions, generateSOP } from './api/ai';
import StructureChecklist from './components/StructureChecklist';

const TEMPLATES = {
  cs: {
    title: "Computer Science & AI",
    content: `[POWERFUL INTRODUCTION]
My interest in Machine Learning was catalyzed during my junior year database project, where I struggled to optimize a dataset of 10 million telemetry logs. This bottleneck led me to research vector index databases, and I realized that standard architectures are fundamentally limited without intelligent predictive caching. This cognitive spark drove me to pursue graduate studies in computer science.

[ACADEMIC BACKGROUND]
During my undergraduate studies in Computer Science at Dhaka University, I built a solid foundation in discrete math and statistics. I particularly excelled in advanced coursework, achieving A+ in Machine Learning, Algorithms, and Distributed Systems, graduating with a CGPA of 3.85.

[RESEARCH EXPERIENCE]
Under the supervision of Dr. Ahmed, I investigated distributed tensor optimizations. Using PyTorch, my contribution was designing a layer-wise caching model that reduced training latency by 12%. This work was presented at the IEEE National Conference.

[INTERNSHIP / PROFESSIONAL EXPERIENCE]
As a Software Engineer Intern at TechSolutions, I spearheaded query caching overhauls. By deploying Redis caches, I minimized database response time by 18% for 5,000 active sessions.

[PROJECTS + SKILLS + ACHIEVEMENTS]
I engineered a self-directed reinforcement learning platform using Python and TensorFlow. I am highly proficient in C++, SQL, and cloud deployments.

[CHALLENGES + GROWTH + TRANSFORMATION]
In my sophomore year, my grades declined due to health issues. I mitigated this by auditing online courses and seeking counseling, subsequently raising my semester GPA from 3.0 to 3.9 in my final year.

[WHY PROGRAM + UNIVERSITY + PROFESSOR (FIT)]
The Master of Science in Computer Science at Stanford University is the perfect ecosystem for my work. I am eager to join the AI Lab under Dr. Andrew Ng to contribute to their projects on automated robotics caching, while enrolling in courses like CS229.

[SHORT-TERM GOAL]
My immediate post-graduation objective is to secure a role as an R&D Machine Learning Engineer in the cloud computing sector.

[LONG-TERM GOAL]
In the long term, I aspire to lead an industrial research lab focused on distributed AI platforms, helping establish global caching standards.

[FUTURE CONTRIBUTION]
I look forward to contributing by mentoring undergraduate researchers in the lab and organizing hackathons within the department.

[STRONG & CONFIDENT CONCLUSION]
In conclusion, I am fully prepared to take on the academic rigor of Stanford University. I thank you for considering my application.`
  },
  bio: {
    title: "Biology & Life Sciences",
    content: `[POWERFUL INTRODUCTION]
My fascination with cellular biology was sparked when I first observed the cell division of yeast under a microscope. Seeing the orderly replication of chromosomes made me realize that molecular choreography is the foundation of all pathology, inspiring my desire to explore cell mutations.

[ACADEMIC BACKGROUND]
I completed my Bachelor of Science in Biochemistry at BRAC University. I specialized in molecular genetics, maintaining a major CGPA of 3.90 and receiving the Academic Excellence Award.

[RESEARCH EXPERIENCE]
Working under Dr. Kabir, I investigated gene expression in Saccharomyces cerevisiae. I prepared assays, maintained cell cultures, and analyzed RNA-seq data, identifying 3 novel gene activations under oxidative stress.

[INTERNSHIP / PROFESSIONAL EXPERIENCE]
As a Lab Analyst Intern at BioPharma Lab, I optimized high-throughput screening workflows, speeding up sample preparation pipelines by 15% using automation tools.

[PROJECTS + SKILLS + ACHIEVEMENTS]
I built an offline genetic sequence compiler in Python to match protein strings, mastering sequence alignment algorithms and SQL query modeling.

[CHALLENGES + GROWTH + TRANSFORMATION]
Transitioning to lab-based courses was difficult due to lack of practical equipment in my freshman year. I overcame this by volunteering for extra lab shifts and reading lab protocols, becoming proficient in PCR and gel electrophoresis.

[WHY PROGRAM + UNIVERSITY + PROFESSOR (FIT)]
I choose the Molecular Biology PhD program at Johns Hopkins University due to their leading biochemistry research. I aim to work with Dr. Carol Greider to study telomere extensions and cancer cells.

[SHORT-TERM GOAL]
My immediate goal is to secure a postdoctoral fellowship researching chromosome stability.

[LONG-TERM GOAL]
Long term, I aim to lead a structural biology research lab at a university, pioneering cancer genetic therapies.

[FUTURE CONTRIBUTION]
I intend to organize seminar series for incoming biology cohorts, sharing lab safety protocols and peer mentoring.

[STRONG & CONFIDENT CONCLUSION]
I am eager to contribute to the rich research environment at Johns Hopkins University. I thank the admissions committee for their review.`
  },
  business: {
    title: "MBA & Business Administration",
    content: `[POWERFUL INTRODUCTION]
My career trajectory changed when our family retail business faced digital disruption. By initiating an online store, I turned a 25% revenue loss into a 40% year-on-year growth, realizing that digital transformation is vital for business survival.

[ACADEMIC BACKGROUND]
I hold a Bachelor of Business Administration from NSU, majoring in Finance and graduating with honors.

[INTERNSHIP / PROFESSIONAL EXPERIENCE]
At Deloitte, I worked as a Business Analyst, leading client audits and optimizing supply chain logistics for 3 major manufacturing clients, saving them over $120,000 annually.

[PROJECTS + SKILLS + ACHIEVEMENTS]
I developed a financial model that predicts retail stock turnarounds, combining Python metrics with Tableau visual dashboards.

[CHALLENGES + GROWTH + TRANSFORMATION]
Managing diverse teams was initially challenging. I enrolled in leadership training, practiced peer coaching, and successfully led our regional project division to win the Best Analyst Award.

[WHY PROGRAM + UNIVERSITY + PROFESSOR (FIT)]
The MBA program at Columbia Business School offers unmatched access to the New York market. I choose their Value Investing program to study under Professor Greenwald, leveraging courses in corporate finance.

[SHORT-TERM GOAL]
Post-graduation, I aim to secure a Senior Associate role in digital consulting.

[LONG-TERM GOAL]
Long term, I plan to establish a venture fund targeting fintech startups in South Asia.

[FUTURE CONTRIBUTION]
I look forward to contributing as an active member of the Consulting Club and supporting peer business workshops.

[STRONG & CONFIDENT CONCLUSION]
I am confident my analytical skills make me a strong fit for Columbia Business School. Thank you for your time.`
  }
};

export default function App() {
  const isEmbedded = window.location.search.includes('embed=true');
  const [user, setUser] = useState({ isGuest: true, isPremium: false, displayName: "Guest" });
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analyze');
  
  // Editor State
  const [draft, setDraft] = useState('');
  const [university, setUniversity] = useState('');
  const [professor, setProfessor] = useState('');
  const [wordLimit, setWordLimit] = useState(1000);
  
  // AI Settings
  const [apiProvider, setApiProvider] = useState('none'); // 'none' | 'gemini' | 'claude'
  const [apiKey, setApiKey] = useState('');

  // Loaded SOPs list
  const [savedSops, setSavedSops] = useState([]);
  const [currentSopId, setCurrentSopId] = useState(null);
  
  // Scoring & AI results
  const [scoreData, setScoreData] = useState({
    total: 0,
    breakdown: { hook: 0, goals: 0, fit: 0, flow: 0, language: 0 },
    suggestions: []
  });
  const [aiData, setAiData] = useState({
    aiLikelihood: 0,
    sentences: [],
    flaggedCount: 0
  });

  // Billing Modal
  const [showBilling, setShowBilling] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // AI Helper Panel
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [selectedSection, setSelectedSection] = useState('intro');
  const [dailyAiCount, setDailyAiCount] = useState(0);
  const [aiCustomQuery, setAiCustomQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState({
    hook: true,
    academic: true,
    research: true,
    fit: true,
    goals: true,
    aiRisk: false,
    storyArc: false,
    languageTone: false
  });
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hi! I've analyzed your SOP. Your research experience and academic record are real strengths. Your two urgent fixes are the generic opening and missing university fit section. Where would you like to start?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  // Custom auth & verification modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup' | 'verify' | 'setpassword'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authVerificationInput, setAuthVerificationInput] = useState('');
  const [authVerificationCode, setAuthVerificationCode] = useState('');

  // Generator State
  const [generatorSubTab, setGeneratorSubTab] = useState('ai'); // 'ai' | 'samples'
  const [genDegreeField, setGenDegreeField] = useState('');
  const [genBackground, setGenBackground] = useState('');
  const [genExperience, setGenExperience] = useState('');
  const [genGoals, setGenGoals] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [landingDraft, setLandingDraft] = useState(
    "My name is John. I want to study Computer Science at Stanford University. I am passionate about programming ever since I was a child. I want to study here because it is a very good university. In conclusion, I hope you accept me."
  );

  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        loadUserSops(firebaseUser.uid);
      } else {
        setUser({ isGuest: true, isPremium: false, displayName: "Guest" });
      }
      setAuthLoading(false);
      
      // Load settings
      const savedKey = localStorage.getItem('sop_assistant_apikey') || '';
      const savedProvider = localStorage.getItem('sop_assistant_apiprovider') || 'none';
      setApiKey(savedKey);
      setApiProvider(savedProvider);
    });
    return () => unsub();
  }, []);

  // Listen for extension messages
  useEffect(() => {
    const handleExtensionMessage = (event) => {
      if (event.data && event.data.type === 'SEND_PAGE_TEXT') {
        setDraft(event.data.text);
      }
    };
    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, []);

  const handleSyncFromPage = () => {
    window.parent.postMessage({ type: 'REQUEST_PAGE_TEXT' }, '*');
  };

  const handleInsertToPage = () => {
    if (!draft) {
      alert("Editor draft is empty. Write something or load a template first!");
      return;
    }
    window.parent.postMessage({ type: 'INSERT_PAGE_TEXT', text: draft }, '*');
  };

  // Update scores when text or settings change
  useEffect(() => {
    const score = scoreSop(draft, university, professor);
    setScoreData(score);

    const ai = detectAiStyle(draft);
    setAiData(ai);
  }, [draft, university, professor]);

  // Load SOP drafts from database
  const loadUserSops = async (uid) => {
    try {
      const list = await fetchSops(uid);
      setSavedSops(list);
      
      // Auto-load last modified SOP if exists
      if (list.length > 0) {
        const last = list[list.length - 1];
        setDraft(last.content || '');
        setUniversity(last.university || '');
        setProfessor(last.professor || '');
        setCurrentSopId(last.id);
      }
    } catch (e) {
      console.error("Failed to load drafts:", e);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      setShowAuthModal(false);
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser({ isGuest: true, isPremium: false, displayName: "Guest" });
    setDraft('');
    setUniversity('');
    setProfessor('');
    setCurrentSopId(null);
  };

  const handleSave = async () => {
    if (user.isGuest) {
      setAuthModalTab('login');
      setShowAuthModal(true);
      return;
    }
    try {
      const saved = await saveSop(user.uid, {
        id: currentSopId,
        content: draft,
        university,
        professor,
        title: university ? `SOP for ${university}` : `Draft SOP (${new Date().toLocaleDateString()})`
      });
      setCurrentSopId(saved.id);
      alert("SOP saved successfully!");
      loadUserSops(user.uid);
    } catch (e) {
      alert("Save failed: " + e.message);
    }
  };

  // Verification flow handlers
  const handleSendVerificationCode = () => {
    if (!authEmail.trim() || !authEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setAuthVerificationCode(code);
    setAuthModalTab('verify');
    alert(`🔑 SOPIA Verification Code Sent!\n\nYour 6-digit confirmation code is: ${code}`);
  };

  const handleConfirmVerificationCode = () => {
    if (authVerificationInput === authVerificationCode) {
      setAuthModalTab('setpassword');
    } else {
      alert("❌ Invalid verification code. Please check and try again.");
    }
  };

  const handleRegisterUser = () => {
    if (authPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (authPassword !== authConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    
    // Log them in as a simulated email user
    const mockUid = 'simulated-' + Math.random().toString(36).substr(2, 9);
    const mockUser = {
      uid: mockUid,
      email: authEmail,
      displayName: authEmail.split('@')[0],
      isPremium: false
    };
    setUser(mockUser);
    setShowAuthModal(false);
    alert("🎉 Account created and verified successfully!");
  };

  const handleEmailLogin = () => {
    if (!authEmail.trim() || !authPassword) {
      alert("Please enter both email and password.");
      return;
    }
    // Simulated simple login
    const mockUid = 'simulated-' + Math.random().toString(36).substr(2, 9);
    setUser({
      uid: mockUid,
      email: authEmail,
      displayName: authEmail.split('@')[0],
      isPremium: false
    });
    setShowAuthModal(false);
    alert("Welcome back to SOPIA!");
  };

  const loadSopDraft = (sop) => {
    setDraft(sop.content || '');
    setUniversity(sop.university || '');
    setProfessor(sop.professor || '');
    setCurrentSopId(sop.id);
  };

  const handleCreateNew = () => {
    setDraft('');
    setUniversity('');
    setProfessor('');
    setCurrentSopId(null);
  };

  // Payment simulation
  const handleUpgrade = async () => {
    if (user.isGuest) {
      setAuthModalTab('signup');
      setShowAuthModal(true);
      return;
    }
    setPaymentLoading(true);
    // Simulate gateway delay
    setTimeout(async () => {
      if (user && !user.isGuest) {
        await updatePremiumStatus(user.uid, true);
        setUser({ ...user, isPremium: true });
      } else {
        setUser(prev => ({ ...prev, isPremium: true }));
      }
      setPaymentLoading(false);
      setShowBilling(false);
      alert("Payment Successful! You are now a Premium Member. Thank you for your support!");
    }, 1500);
  };

  // Safe Snippet Insertion
  const insertSnippet = (snippet) => {
    setDraft(prev => prev + (prev ? '\n\n' : '') + snippet);
    setActiveTab('structure');
  };

  // Save Settings
  const handleSaveSettings = () => {
    localStorage.setItem('sop_assistant_apikey', apiKey);
    localStorage.setItem('sop_assistant_apiprovider', apiProvider);
    alert("Settings saved successfully!");
  };

  // Check if limits exceeded
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const isCloseToLimit = wordCount >= wordLimit * 0.9 && wordCount < wordLimit;
  const isOverLimit = wordCount > wordLimit;

  // Run AI Suggestions
  const handleGetAiSuggestions = async () => {
    if (!draft.trim()) {
      alert("Please write something in the editor first.");
      return;
    }

    const isPremiumUser = user?.isPremium;

    // Check usage limits for free tier
    if (!isPremiumUser && dailyAiCount >= 3) {
      setShowBilling(true);
      return;
    }

    setAiLoading(true);
    setAiResponse('');
    
    // Find active text matching section or use full draft
    let textToAnalyze = draft;
    const headerTitle = selectedSection.toUpperCase();

    // Try to extract specific section if template was used
    const lines = draft.split('\n');
    let sectionLines = [];
    let record = false;
    
    for (const line of lines) {
      if (line.includes('[') && line.includes(']')) {
        record = line.toUpperCase().includes(headerTitle) || (selectedSection === 'intro' && line.toUpperCase().includes('INTRODUCTION'));
        continue;
      }
      if (record) {
        sectionLines.push(line);
      }
    }

    if (sectionLines.length > 0) {
      textToAnalyze = sectionLines.join('\n');
    }

    try {
      const res = await getAISuggestions({
        sectionId: selectedSection,
        sectionTitle: selectedSection.toUpperCase(),
        text: textToAnalyze,
        university,
        professor,
        customQuery: aiCustomQuery,
        apiProvider: isPremiumUser ? apiProvider : 'none', // Free tier falls back to offline model
        apiKey: isPremiumUser ? apiKey : ''
      });
      setAiResponse(res.feedback);
      if (!isPremiumUser) {
        setDailyAiCount(prev => prev + 1);
      }
    } catch (e) {
      alert("AI suggestion failed: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunAnalysis = () => {
    if (!draft.trim()) {
      alert("Please paste your Statement of Purpose (SOP) first.");
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setActiveTab('results');
    }, 1500);
  };

  const handleSendChatMessage = async (presetText) => {
    const text = presetText || chatInput;
    if (!text.trim()) return;

    const newMsg = { role: 'user', text };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setAiLoading(true);

    // Compute the 21-point evaluation scorecard to feed context to the AI Advisor
    const currentScore = scoreSop(draft, university, professor);
    const scoreText = `Current Score: ${currentScore.total}/100. Breakdown: Hook=${currentScore.breakdown.hook}, Goals=${currentScore.breakdown.goals}, Fit=${currentScore.breakdown.fit}, Flow=${currentScore.breakdown.flow}, Language=${currentScore.breakdown.language}.`;
    const issuesText = currentScore.suggestions.length > 0 
      ? `Active warnings and improvements requested:\n${currentScore.suggestions.map((s, i) => `${i+1}. ${s}`).join('\n')}`
      : 'All 21 criteria points passed successfully!';

    const promptContext = `Student Query: "${text}"
    
---
Current SOP Scorecard Context (21-Point Judgement Engine):
- ${scoreText}
- ${issuesText}

Please guide the student directly on how to resolve these specific scorecard warnings in their draft. Keep your advice constructive, actionable, and reference their active errors.`;

    try {
      const res = await getAISuggestions({
        sectionId: 'chat',
        sectionTitle: 'AI Advisor',
        text: draft,
        university,
        professor,
        customQuery: promptContext,
        apiProvider: user?.isPremium ? apiProvider : 'none',
        apiKey: user?.isPremium ? apiKey : ''
      });
      setChatMessages(prev => [...prev, { role: 'ai', text: res.feedback }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "⚠️ Failed to get advice: " + e.message }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        const chatArea = document.getElementById('chat-area');
        if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
      }, 100);
    }
  };

  const handleExport = (type) => {
    if (!user?.isPremium) {
      setShowBilling(true);
      return;
    }

    if (type === 'pdf') {
      exportToPdf(draft, scoreData, university, professor);
    } else if (type === 'docx') {
      exportToDocx(draft, scoreData, university, professor);
    } else if (type === 'tips') {
      exportTipsToPdf(scoreData);
    } else if (type === 'template') {
      const field = prompt("Enter your field of study for the template (e.g. Computer Science, Mechanical Engineering, MBA):", "Computer Science");
      if (field) {
        exportPremiumTemplate(field, university, professor);
      }
    }
  };

  const handleGenerateSOP = async () => {
    if (!genDegreeField || !genBackground) {
      alert("Please fill in at least the Target Degree/Field and your Academic Background.");
      return;
    }

    const isPremiumUser = user?.isPremium;
    if (!isPremiumUser) {
      if (user.isGuest) {
        setAuthModalTab('signup');
        setShowAuthModal(true);
      } else {
        setShowBilling(true);
      }
      return;
    }

    setGenLoading(true);
    try {
      const res = await generateSOP({
        degreeField: genDegreeField,
        university,
        professor,
        background: genBackground,
        experience: genExperience,
        goals: genGoals,
        apiProvider: isPremiumUser ? apiProvider : 'none',
        apiKey: isPremiumUser ? apiKey : ''
      });

      if (res.success) {
        setDraft(res.feedback);
        alert("SOP Draft Generated successfully and loaded into your editor workspace!");
      } else {
        alert("Generation failed: " + res.feedback);
      }
    } catch (e) {
      alert("Generation failed: " + e.message);
    } finally {
      setGenLoading(false);
    }
  };

  // Rendering Loader
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a10] text-slate-300 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wider text-slate-400">Loading SOPIA...</span>
        </div>
      </div>
    );
  }



  // ==========================================
  // SOP ASSISTANT DASHBOARD (Authenticated)
  // ==========================================
  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo-area">
          <div className="logo-row">
            <img src={logo} className="logo-svg" style={{ borderRadius: '8px', objectFit: 'contain' }} alt="SOPIA Logo" />
            <div>
              <div className="logo-name">SOPIA</div>
              <div className="logo-tag">SOP BUILDER APP</div>
            </div>
          </div>
        </div>
        
        <div className="nav">
          <div className="nav-section">Workspace</div>
          <div 
            className={`nav-item ${activeTab === 'analyze' ? 'active' : ''}`} 
            onClick={() => setActiveTab('analyze')}
          >
            <i className="ti ti-sparkles ni" aria-hidden="true"></i> Analyze SOP
          </div>
          <div 
            className={`nav-item ${activeTab === 'results' ? 'active' : ''}`} 
            onClick={() => setActiveTab('results')}
          >
            <i className="ti ti-chart-bar ni" aria-hidden="true"></i> My Score 
            <span className="badge-num">{scoreData.total}</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} 
            onClick={() => setActiveTab('chat')}
          >
            <i className="ti ti-message-circle ni" aria-hidden="true"></i> AI Advisor
          </div>
          <div 
            className={`nav-item ${activeTab === 'premium' ? 'active' : ''}`} 
            onClick={() => setActiveTab('premium')}
          >
            <i className="ti ti-crown ni" aria-hidden="true"></i> Ready SOP 
            <span className="badge-pro">Pro</span>
          </div>
          
          <div className="nav-section" style={{ marginTop: '12px' }}>History</div>
          {savedSops.map((sop, idx) => (
            <div 
              key={sop.id || idx} 
              className="nav-item text-slate-400 hover:text-white" 
              onClick={() => loadSopDraft(sop)}
              title="Click to reload this version"
            >
              <i className="ti ti-clock ni" aria-hidden="true"></i> {sop.title || `Draft v${idx + 1}`} &nbsp;·&nbsp; {scoreSop(sop.content || '').total}/100
            </div>
          ))}
          {savedSops.length === 0 && (
            <div className="text-[10px] text-slate-500 px-2.5 py-1 italic">No saved drafts yet.</div>
          )}
        </div>

        {/* Upgrade Card */}
        <div className="upgrade-card">
          <h4><i className="ti ti-crown" aria-hidden="true"></i> {user.isPremium ? "Pro Active" : "Go Premium"}</h4>
          <p>{user.isPremium ? "Unlock unlimited AI templates and advisor queries" : "AI writes your full SOP + unlimited analyses"}</p>
          <div className="price-pill">{user.isPremium ? "PRO MEMBER" : "$1.99 / life"}</div>
          {!user.isPremium && (
            <button className="upgrade-btn" onClick={() => setShowBilling(true)}>Unlock Ready SOP</button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main">
        {/* VIEW 1: ANALYZE SOP */}
        {activeTab === 'analyze' && (
          <div id="v-analyze" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="topbar">
              <div className="topbar-left">
                <h2>Analyze your SOP</h2>
                <p>Upload or paste your draft to get a score and tips</p>
              </div>
              <div className="topbar-right">
                <button className="tb-btn" onClick={() => setActiveTab('results')}>
                  <i className="ti ti-eye" aria-hidden="true"></i> View last score
                </button>
                <button className="tb-btn" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>

            <div className="content">
              {/* Drop Zone */}
              <div className="drop-zone" onClick={() => {
                const fileInput = document.getElementById('sop-file-upload');
                if (fileInput) fileInput.click();
              }}>
                <div className="drop-icon"><i className="ti ti-cloud-upload" aria-hidden="true"></i></div>
                <div className="drop-title">Drop your SOP here</div>
                <div className="drop-sub">PDF, DOCX, TXT &nbsp;·&nbsp; <span>browse file</span></div>
                <input 
                  type="file" 
                  id="sop-file-upload" 
                  accept=".txt,.doc,.docx,.pdf"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setDraft(ev.target.result);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </div>

              <div className="divider">or paste text</div>

              {isEmbedded && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => window.parent.postMessage({ type: 'REQUEST_PAGE_TEXT' }, '*')}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border-none"
                    style={{ cursor: 'pointer' }}
                  >
                    🔄 Import from Google Doc
                  </button>
                  <button
                    onClick={() => window.parent.postMessage({ type: 'INSERT_PAGE_TEXT', text: draft }, '*')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border-none"
                    style={{ cursor: 'pointer' }}
                  >
                    📥 Export to Google Doc
                  </button>
                </div>
              )}

              {/* Text Area */}
              <div className="sop-area">
                <textarea 
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Paste your SOP here… Include your hook, academic background, research experience, goals, and why this specific university. More detail = better score."
                />
                <div className="wc">{draft.trim() ? draft.trim().split(/\s+/).length : 0} words</div>
              </div>

              {/* Checklist / Criteria selection */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '9px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="ti ti-adjustments" aria-hidden="true" style={{ color: 'var(--b4)' }}></i> What to evaluate
                </div>
                <div className="crit-grid">
                  {[
                    { key: 'hook', label: 'Hook & intro', desc: 'Opening story strength' },
                    { key: 'academic', label: 'Academic background', desc: 'Courses, CGPA, relevance' },
                    { key: 'research', label: 'Research experience', desc: 'Depth and contribution' },
                    { key: 'fit', label: 'University fit', desc: 'Professor, lab, curriculum' },
                    { key: 'goals', label: 'Career goals', desc: 'Short and long-term clarity' },
                    { key: 'aiRisk', label: 'AI detection risk', desc: 'Flags generic phrases' },
                    { key: 'storyArc', label: 'Story arc', desc: 'Before/after transformation' },
                    { key: 'languageTone', label: 'Language & tone', desc: 'Academic, natural, concise' }
                  ].map((crit) => (
                    <div 
                      key={crit.key}
                      className={`crit ${selectedCriteria[crit.key] ? 'on' : ''}`}
                      onClick={() => toggleCriteria(crit.key)}
                    >
                      <div className="crit-box">{selectedCriteria[crit.key] ? '✓' : ''}</div>
                      <div>
                        <div className="crit-h">{crit.label}</div>
                        <div className="crit-s">{crit.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action trigger button */}
              <div className="flex gap-2">
                <button 
                  className="go-btn flex-1" 
                  disabled={isAnalyzing} 
                  onClick={handleRunAnalysis}
                >
                  {isAnalyzing ? (
                    <>
                      <i className="ti ti-loader" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}></i> Analyzing…
                    </>
                  ) : (
                    <>
                      <i className="ti ti-sparkles" aria-hidden="true"></i> Analyze my SOP
                    </>
                  )}
                </button>
                <button 
                  className="px-5 py-3 border border-slate-200 rounded-xl font-bold text-xs bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={handleSave}
                >
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: RESULTS VIEW */}
        {activeTab === 'results' && (
          <div id="v-results" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="topbar">
              <div className="topbar-left">
                <h2>Your SOP score</h2>
                <p>Evaluation scorecard · Analysis complete</p>
              </div>
              <div className="topbar-right">
                <button className="tb-btn" onClick={() => setActiveTab('analyze')}>
                  <i className="ti ti-arrow-left" aria-hidden="true"></i> Re-analyze
                </button>
                <button className="tb-btn primary" onClick={() => handleExport('pdf')}>
                  <i className="ti ti-download" aria-hidden="true"></i> Export PDF
                </button>
                <button className="tb-btn" onClick={() => handleExport('docx')}>
                  Word (DOCX)
                </button>
              </div>
            </div>

            <div className="content">
              {/* Score Hero */}
              <div className="score-hero">
                <div className="score-left">
                  <div className="ring-wrap">
                    <svg width="86" height="86" viewBox="0 0 86 86">
                      <circle cx="43" cy="43" r="36" fill="none" stroke="#C8DEFF" stroke-width="7"/>
                      <circle 
                        cx="43" 
                        cy="43" 
                        r="36" 
                        fill="none" 
                        stroke="#1A6DD8" 
                        stroke-width="7" 
                        stroke-linecap="round" 
                        stroke-dasharray="226.2" 
                        stroke-dashoffset={226.2 - (226.2 * scoreData.total) / 100}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                    </svg>
                    <div className="ring-num">{scoreData.total}</div>
                  </div>
                  <div className="score-grade">
                    {scoreData.total >= 90 ? 'Outstanding' : scoreData.total >= 70 ? 'Good · Almost there' : 'Needs work'}
                  </div>
                </div>

                <div className="score-right">
                  <div className="score-title">
                    {scoreData.total >= 90 ? '🏆 Masterful Academic Writing!' : '✍️ Foundational Structure detected'}
                  </div>
                  <div className="score-msg">
                    {scoreData.total >= 90 
                      ? 'Excellent story hook, academic fit reasons, and career goal outlines.' 
                      : 'Your draft has a solid background but contains structural gaps or cliches.'}
                  </div>
                  <div className="score-tags">
                    <span className="stag g"><i className="ti ti-check" aria-hidden="true"></i> Structure {scoreData.breakdown.flow >= 15 ? 'Strong' : 'Basic'}</span>
                    <span className="stag w"><i className="ti ti-alert-circle" aria-hidden="true"></i> {scoreData.breakdown.hook < 8 ? 'Cliché Opening' : 'Hook Good'}</span>
                    <span className="stag r"><i className="ti ti-x" aria-hidden="true"></i> Fit score: {scoreData.breakdown.fit}/20</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="metrics">
                <div className="met g">
                  <div className="met-v">{scoreData.breakdown.hook}/10</div>
                  <div className="met-l">Hook & Intro</div>
                </div>
                <div className="met w">
                  <div className="met-v">{scoreData.breakdown.goals}/20</div>
                  <div className="met-l">Goals Clarity</div>
                </div>
                <div className="met g">
                  <div className="met-v">{scoreData.breakdown.fit}/20</div>
                  <div className="met-l">University Fit</div>
                </div>
                <div className="met r">
                  <div className="met-v">{scoreData.breakdown.language}/30</div>
                  <div className="met-l">Language & AI</div>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="breakdown-card">
                <div className="bc-title"><i className="ti ti-chart-line" aria-hidden="true" style={{ color: 'var(--b4)' }}></i> Score breakdown</div>
                <div className="bar-row">
                  <div className="bar-item">
                    <span className="bar-label">Hook &amp; intro</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(scoreData.breakdown.hook/10)*100}%`, background: 'var(--amber)' }}></div>
                    </div>
                    <span className="bar-pct" style={{ color: 'var(--amber)' }}>{Math.round((scoreData.breakdown.hook/10)*100)}%</span>
                  </div>
                  <div className="bar-item">
                    <span className="bar-label">University fit</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(scoreData.breakdown.fit/20)*100}%`, background: 'var(--red)' }}></div>
                    </div>
                    <span className="bar-pct" style={{ color: 'var(--red)' }}>{Math.round((scoreData.breakdown.fit/20)*100)}%</span>
                  </div>
                  <div className="bar-item">
                    <span className="bar-label">Career goals</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(scoreData.breakdown.goals/20)*100}%`, background: 'var(--b4)' }}></div>
                    </div>
                    <span className="bar-pct" style={{ color: 'var(--b4)' }}>{Math.round((scoreData.breakdown.goals/20)*100)}%</span>
                  </div>
                  <div className="bar-item">
                    <span className="bar-label">Language & AI risk</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(scoreData.breakdown.language/30)*100}%`, background: 'var(--green)' }}></div>
                    </div>
                    <span className="bar-pct" style={{ color: 'var(--green)' }}>{Math.round((scoreData.breakdown.language/30)*100)}%</span>
                  </div>
                </div>
              </div>

              {/* Action Item Tips */}
              <div className="tips-card">
                <div className="tips-head">
                  <h3><i className="ti ti-bulb" aria-hidden="true" style={{ color: 'var(--b4)' }}></i> Improvement suggestions</h3>
                  <span className="tc">{scoreData.suggestions.length} items</span>
                </div>
                {scoreData.suggestions.map((sug, idx) => (
                  <div key={idx} className="tip">
                    <div className="tip-ic w"><i className="ti ti-alert-circle" aria-hidden="true"></i></div>
                    <div>
                      <div className="tip-h">Action Item #{idx + 1}</div>
                      <div className="tip-d">{sug}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Premium Promo */}
              <div style={{ textAlign: 'center', paddingBottom: '4px' }}>
                <button 
                  onClick={() => setActiveTab('premium')}
                  style={{ background: 'var(--b4)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 26px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px', fontFamily: 'inherit' }}
                >
                  <i className="ti ti-crown" aria-hidden="true"></i> Get your AI-written Ready SOP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: AI ADVISOR */}
        {activeTab === 'chat' && (
          <div id="v-chat" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="topbar">
              <div className="topbar-left">
                <h2>AI Advisor Chat</h2>
                <p>Real-time suggestions linked directly to your current draft</p>
              </div>
            </div>

            <div className="content" id="chat-area" style={{ gap: '8px' }}>
              <div className="chat-wrap" id="thread">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`cmsg ${msg.role === 'user' ? 'u' : 'ai'}`}>
                    <div className={`av ${msg.role === 'user' ? 'u' : 'ai'}`}>
                      {msg.role === 'user' ? 'U' : <i className="ti ti-sparkles" aria-hidden="true"></i>}
                    </div>
                    <div className="bbl" dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="cmsg ai" id="typing-row">
                    <div className="av ai"><i className="ti ti-sparkles"></i></div>
                    <div className="typing-bbl">
                      <div className="d"></div>
                      <div className="d"></div>
                      <div className="d"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="qs">
                <button className="q" onClick={() => handleSendChatMessage('How do I fix my introduction clichés?')}>Fix my intro</button>
                <button className="q" onClick={() => handleSendChatMessage('What should I write for Stanford university fit?')}>University fit</button>
                <button className="q" onClick={() => handleSendChatMessage('Can you rate my career goals section?')}>Review my goals</button>
              </div>
            </div>

            <div className="cin">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChatMessage();
                }}
                placeholder="Ask anything about your SOP…" 
              />
              <button className="sbtn" onClick={() => handleSendChatMessage()} aria-label="Send">
                <i className="ti ti-send" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: PREMIUM LOCK & READY SOP */}
        {activeTab === 'premium' && (
          <div id="v-premium" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="topbar">
              <div className="topbar-left">
                <h2><i className="ti ti-crown" aria-hidden="true" style={{ color: 'var(--b4)' }}></i> Ready SOP Writer</h2>
                <p>AI generates your complete personalized statement of purpose</p>
              </div>
            </div>

            <div className="content">
              {/* Unlock Gate */}
              {!user.isPremium ? (
                <div className="pgate" id="pgate">
                  <div style={{ fontSize: '30px', marginBottom: '10px', color: 'var(--b4)' }}><i className="ti ti-lock" aria-hidden="true"></i></div>
                  <h3>Unlock Premium Ready SOP</h3>
                  <p>Based on your profile, experience, and goals — SOPIA compiles a complete, natural-sounding SOP that adheres to the perfect 11-step framework.</p>
                  <div className="price-big">$1.99<span>/life</span></div>
                  <div className="price-note">One-time payment · Lifetime access</div>
                  <button className="unlock-btn" onClick={() => setShowBilling(true)}>
                    <i className="ti ti-crown" aria-hidden="true"></i> Unlock for $1.99
                  </button>
                </div>
              ) : (
                <div className="pgate">
                  <div style={{ fontSize: '28px', color: 'var(--green)', marginBottom: '10px' }}><i className="ti ti-check-circle" aria-hidden="true"></i></div>
                  <h3>Your Premium Ready SOP is Active</h3>
                  <p>Read, customize, or generate a tailored template copy below.</p>
                  <div className="flex gap-2 justify-center mt-2">
                    <button className="tb-btn primary" onClick={handleGenerateSOP}>
                      🔄 Generate Custom Draft
                    </button>
                    <button className="tb-btn" onClick={() => handleExport('template')}>
                      📥 Download Word Format (.docx)
                    </button>
                  </div>
                </div>
              )}

              {/* Text Preview */}
              <div 
                className="preview-blur" 
                style={user.isPremium ? { filter: 'none', userSelect: 'auto', pointerEvents: 'auto', color: 'var(--text)' } : {}}
              >
                <p style={{ marginBottom: '10px' }}>
                  It was during my final undergraduate year in Computer Science when I stood at the crossroads of clinical engineering and deep learning. Working on database partitioning models, I witnessed first-hand the bottlenecks of translating genomic sequence speeds into bedside diagnostics. In that moment, I understood my true calling...
                </p>
                <p style={{ marginBottom: '10px' }}>
                  At my alma mater, where I maintained a high GPA while contributing to computational biological research groups, I built the mathematics foundation. Advanced coursework in distributed database partitions and machine learning shaped how I formulate these translational systems...
                </p>
                <p>
                  My goal is to translate these advancements into tools that assist medical professionals. Working with target faculty members at your university will allow me to master...
                </p>
              </div>

              {/* Features List */}
              <div className="feat-list">
                <h4>Everything in Student Pro License</h4>
                <div className="feat"><i className="ti ti-check" aria-hidden="true"></i> Complete 11-section Ready SOP written for you</div>
                <div className="feat"><i className="ti ti-check" aria-hidden="true"></i> Unlimited real-time grading reviews</div>
                <div className="feat"><i className="ti ti-check" aria-hidden="true"></i> Custom PDF/Word download reports</div>
                <div className="feat"><i className="ti ti-check" aria-hidden="true"></i> Full AI Advisor access with no restrictions</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BILLING DIALOG MODAL */}
      {showBilling && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-sm w-full flex flex-col gap-5 border-indigo-500/20 text-slate-800 bg-white relative">
            <button 
              onClick={() => setShowBilling(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 border-none bg-transparent"
              style={{ padding: 0 }}
            >
              ✕
            </button>
            <div className="text-center flex flex-col items-center gap-2">
              <span className="text-3xl">👑</span>
              <h3 className="text-base font-bold text-slate-800">SOPIA Pro Upgrade</h3>
              <p className="text-xs text-slate-500 leading-relaxed text-center">Unlock unlimited AI Suggestions, University Fit scores, and clean reports.</p>
            </div>
            
            <div className="flex justify-center items-baseline gap-1 my-1">
              <span className="text-3xl font-extrabold text-slate-800">$1.99</span>
              <span className="text-slate-500 text-xs">/ life</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Card Number</span>
                <input 
                  type="text" 
                  value="4242 4242 4242 4242" 
                  disabled
                  className="text-xs p-3 font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expiry</span>
                  <input type="text" value="12/28" disabled className="text-xs p-3 font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CVC</span>
                  <input type="text" value="***" disabled className="text-xs p-3 font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={paymentLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              style={{ cursor: 'pointer' }}
            >
              {paymentLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Secured Payment...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  Complete Enrollment ($1.99)
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* AUTHENTICATION / SIGN UP MODAL WITH EMAIL CODE VERIFICATION */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-sm w-full flex flex-col gap-5 border-indigo-500/20 text-slate-800 bg-white relative rounded-2xl shadow-xl">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 border-none bg-transparent"
              style={{ padding: 0, cursor: 'pointer' }}
            >
              ✕
            </button>

            {authModalTab === 'login' && (
              <div className="flex flex-col gap-4">
                <div className="text-center flex flex-col items-center gap-2">
                  <span className="text-3xl">🔑</span>
                  <h3 className="text-base font-bold text-slate-800">Sign in to SOPIA</h3>
                  <p className="text-xs text-slate-500 leading-relaxed text-center font-medium">Enter your credentials or continue with Google to access your dashboard.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</span>
                    <input 
                      type="email" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Password</span>
                    <input 
                      type="password" 
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••"
                      className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleEmailLogin}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h7a3 3 0 013 3v1"></path></svg>
                  Log In to My Workspace
                </button>

                <div className="text-center text-xs text-slate-400 font-medium">or</div>

                <button 
                  onClick={handleLogin}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all duration-200 shadow-sm border border-slate-200 flex items-center justify-center gap-2"
                  style={{ cursor: 'pointer' }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.53-6.16-4.53z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  Don't have an account? <span onClick={() => setAuthModalTab('signup')} className="text-indigo-600 font-bold cursor-pointer hover:underline">Sign up with code</span>
                </p>
              </div>
            )}

            {authModalTab === 'signup' && (
              <div className="flex flex-col gap-4">
                <div className="text-center flex flex-col items-center gap-2">
                  <span className="text-3xl">✉️</span>
                  <h3 className="text-base font-bold text-slate-800">Verify Your Email</h3>
                  <p className="text-xs text-slate-500 leading-relaxed text-center font-medium">We will generate and send a unique 6-digit confirmation key to verify your address.</p>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</span>
                  <input 
                    type="email" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <button
                  onClick={handleSendVerificationCode}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Request Verification Key
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  Already have an account? <span onClick={() => setAuthModalTab('login')} className="text-indigo-600 font-bold cursor-pointer hover:underline">Log in</span>
                </p>
              </div>
            )}

            {authModalTab === 'verify' && (
              <div className="flex flex-col gap-4">
                <div className="text-center flex flex-col items-center gap-2">
                  <span className="text-3xl">🔑</span>
                  <h3 className="text-base font-bold text-slate-800">Enter Verification Code</h3>
                  <p className="text-xs text-slate-500 leading-relaxed text-center font-medium">Check the mock on-screen notification banner and enter your 6-digit key below.</p>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification Key</span>
                  <input 
                    type="text" 
                    value={authVerificationInput}
                    onChange={(e) => setAuthVerificationInput(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="text-xs p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-center tracking-widest font-mono text-lg outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <button
                  onClick={handleConfirmVerificationCode}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Verify Key & Continue
                </button>
              </div>
            )}

            {authModalTab === 'setpassword' && (
              <div className="flex flex-col gap-4">
                <div className="text-center flex flex-col items-center gap-2">
                  <span className="text-3xl">🔒</span>
                  <h3 className="text-base font-bold text-slate-800">Set Account Password</h3>
                  <p className="text-xs text-slate-500 leading-relaxed text-center font-medium">Configure a secure password for your verified email profile.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure Password</span>
                    <input 
                      type="password" 
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••"
                      className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirm Password</span>
                    <input 
                      type="password" 
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRegisterUser}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                  Create Account & Finish
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
