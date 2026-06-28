import { jsPDF } from 'jspdf';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType
} from 'docx';

// Helper to trigger file download in browser
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ==========================================
// 1. PDF Exporter (jsPDF)
// ==========================================
export const exportToPdf = (sopText, scoreData, university = '', professor = '') => {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("SOPIA - SOP Builder Review Report", 20, y);
  y += 12;

  // Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Date: ${new Date().toLocaleDateString()} | Target University: ${university || 'N/A'} | Target Professor: ${professor || 'N/A'}`, 20, y);
  y += 15;

  // Draw Score Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(20, y, 170, 32, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text("OVERALL SOP SCORE", 28, y + 12);
  
  doc.setFontSize(28);
  doc.text(`${scoreData.total}/100`, 28, y + 24);

  // Sub-scores list in the box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85); // slate-700
  
  const b = scoreData.breakdown;
  doc.text(`Hook Strength: ${b.hook}/10`, 110, y + 8);
  doc.text(`Clarity of Goals: ${b.goals}/20`, 110, y + 14);
  doc.text(`University Fit: ${b.fit}/20`, 110, y + 20);
  doc.text(`Flow & Structure: ${b.flow}/20`, 110, y + 26);
  doc.text(`Language Quality: ${b.language}/30`, 110, y + 32);
  y += 45;

  // Score Suggestions / Action Items
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Key Action Items", 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  
  const activeSuggestions = scoreData.suggestions.slice(0, 5);
  activeSuggestions.forEach(sug => {
    // Wrap text if too long
    const lines = doc.splitTextToSize(`• ${sug.replace('⚠️ ', '').replace('❌ ', '')}`, 170);
    lines.forEach(line => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
  });
  y += 10;

  // Page break for the SOP Content
  doc.addPage();
  y = 20;

  // Title for SOP Content
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text("Statement of Purpose Draft", 20, y);
  y += 10;

  // SOP Text
  doc.setFont('times', 'normal'); // Standard academic font
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const paragraphs = sopText.split('\n');
  paragraphs.forEach(para => {
    if (para.trim().length === 0) {
      y += 6;
      return;
    }
    const lines = doc.splitTextToSize(para, 170);
    lines.forEach(line => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 6;
    });
    y += 4; // Space between paragraphs
  });

  doc.save(`SOP_Review_Report_${university || 'Draft'}.pdf`);
};

// ==========================================
// 2. DOCX Exporter (docx.js)
// ==========================================
export const exportToDocx = async (sopText, scoreData, university = '', professor = '') => {
  const b = scoreData.breakdown;

  // Define table for scorecard
  const scoreTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: "SOP Criterion", heading: HeadingLevel.HEADING_3 })],
            width: { size: 50, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: "Score Achieved", heading: HeadingLevel.HEADING_3 })],
            width: { size: 50, type: WidthType.PERCENTAGE }
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Hook Strength (Introduction)")] }),
          new TableCell({ children: [new Paragraph(`${b.hook} / 10`)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Clarity of Goals (Short & Long Term)")] }),
          new TableCell({ children: [new Paragraph(`${b.goals} / 20`)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("University & Professor Fit")] }),
          new TableCell({ children: [new Paragraph(`${b.fit} / 20`)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Flow & Structural Completeness")] }),
          new TableCell({ children: [new Paragraph(`${b.flow} / 20`)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Language Quality & AI Markers")] }),
          new TableCell({ children: [new Paragraph(`${b.language} / 30`)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "OVERALL SCORE", bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: `${scoreData.total} / 100`, bold: true })] })
        ]
      })
    ]
  });

  // Parse SOP paragraphs
  const sopParagraphs = sopText.split('\n').map(p => {
    return new Paragraph({
      children: [
        new TextRun({
          text: p,
          font: "Times New Roman",
          size: 24 // 12pt font size in docx scale (2 * pt)
        })
      ],
      spacing: {
        after: 120, // 6pt space after
        line: 360,  // 1.5 line spacing (240 is single, 360 is 1.5)
      }
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "SOPIA - SOP Builder Review Report",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Target University: ${university || 'Not Specified'}   |   Target Professor: ${professor || 'Not Specified'}\n`,
              color: "64748B",
              size: 20
            }),
            new TextRun({
              text: `Review Date: ${new Date().toLocaleDateString()}`,
              color: "64748B",
              size: 20
            })
          ],
          spacing: { after: 360 }
        }),

        new Paragraph({
          text: "1. Scoring Dashboard",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 120, before: 240 }
        }),

        scoreTable,

        new Paragraph({ text: "", spacing: { after: 240 } }),

        new Paragraph({
          text: "2. Actionable Feedback",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 120, before: 240 }
        }),

        ...scoreData.suggestions.map(s => {
          return new Paragraph({
            text: `• ${s.replace('⚠️ ', '').replace('❌ ', '')}`,
            spacing: { after: 60 }
          });
        }),

        // Page break
        new Paragraph({
          text: "",
          pageBreakBefore: true
        }),

        new Paragraph({
          text: "3. Statement of Purpose Draft",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 240 }
        }),

        ...sopParagraphs
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `SOP_Document_${university || 'Draft'}.docx`);
};

// ==========================================
// 3. Structural Tips Exporter (PDF)
// ==========================================
export const exportTipsToPdf = (scoreData) => {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text("SOPIA - Graduate SOP Writing Guide & Tips", 20, y);
  y += 12;

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Use this structured checklist guide to audit your Statement of Purpose (SOP) milestones.", 20, y);
  y += 15;

  const steps = [
    { name: "1. Introduction Hook", tips: "Avoid cliché starts ('My name is', 'I want to study'). Lead with a technical hook or pivot story." },
    { name: "2. Academic Background", tips: "Highlight advanced coursework and major-specific achievements. Address GPA trends." },
    { name: "3. Research Experience", tips: "Specify your research question, methodology, results, and YOUR exact contributions." },
    { name: "4. Internship & Industry Work", tips: "Focus on technical problem-solving. Use action verbs and metric achievements." },
    { name: "5. Projects & Core Stack", tips: "Describe hobby projects or open-source. Ground with tools like PyTorch/React." },
    { name: "6. Resilience & Growth", tips: "Address low grades semester or career gaps professionally. Emphasize growth." },
    { name: "7. Why Program & Faculty Fit", tips: "Name target professors, laboratories, and specific course syllabi." },
    { name: "8. Short-term Goals", tips: "Specify job title and industry immediate target after graduation." },
    { name: "9. Long-term Trajectory", tips: "Define your 10-year career vision (R&D lead, faculty director)." },
    { name: "10. Cohort Contribution", tips: "Detail how you enrich the classroom and campus community (seminars, mentorship)." },
    { name: "11. Conclusion", tips: "State your preparedness and thank the committee. Keep it short." }
  ];

  steps.forEach(step => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(step.name, 20, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const wrappedTips = doc.splitTextToSize(`Guideline: ${step.tips}`, 170);
    wrappedTips.forEach(line => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 5;
  });

  doc.save("SOPIA_SOP_Structure_Writing_Tips.pdf");
};

// ==========================================
// 4. Premium SOP Format Template Exporter (DOCX)
// ==========================================
export const exportPremiumTemplate = async (field = "Computer Science", university = "Stanford University", professor = "Dr. Smith") => {
  const fieldTitle = field || "Computer Science";
  const targetUniv = university || "Target University";
  const targetProf = professor || "Target Professor";

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Running Header
        new Paragraph({
          text: `Statement of Purpose  |  Applicant Name  |  Target: ${targetUniv}`,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 360 }
        }),

        // Title
        new Paragraph({
          text: "STATEMENT OF PURPOSE",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `Field of Study: Master of Science in ${fieldTitle}\n`, bold: true }),
            new TextRun({ text: `Target Program: Graduate Admissions Department\n` }),
            new TextRun({ text: `Institution: ${targetUniv}\n` }),
            new TextRun({ text: `Faculty Interest: ${targetProf}` })
          ],
          spacing: { after: 480 }
        }),

        // Body Content Templates
        new Paragraph({
          children: [
            new TextRun({
              text: "My interest in " + fieldTitle + " was not born in a classroom, but during [Describe a specific technical challenge or project]. Faced with the bottleneck of [Describe problem], I realized the critical importance of [Describe key insight]. This pivotal experience propelled me to explore...",
              font: "Times New Roman",
              size: 24
            })
          ],
          spacing: { after: 240, line: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Building upon this interest, my academic career at [Undergraduate University] provided a strong foundation. In courses like [Course 1] and [Course 2], I mastered advanced concepts. My bachelor thesis, titled '[Thesis Title]' under the guidance of Dr. [Advisor], investigated...",
              font: "Times New Roman",
              size: 24
            })
          ],
          spacing: { after: 240, line: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "To bridge theory and practice, I worked at [Company/Lab Name], where my role was to [Your primary contribution]. Here, I optimized [System Name], achieving a [quantified metric, e.g., 20% latency reduction]. Additionally, I spearheaded side projects including [Project Name], using a tech stack of [React, PyTorch] to resolve...",
              font: "Times New Roman",
              size: 24
            })
          ],
          spacing: { after: 240, line: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "The graduate program at " + targetUniv + " is the ideal catalyst for my trajectory. I am specifically drawn to the pioneering work of Dr. " + targetProf + " on [Professor Research Topic]. I hope to contribute to their group's research while leveraging courses like [Course Name] to master...",
              font: "Times New Roman",
              size: 24
            })
          ],
          spacing: { after: 240, line: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Upon completing my studies, my short-term target is to secure a role as a Research Scientist/Engineer. In the long term, I aim to lead R&D departments to innovate solutions in the field. I am fully prepared for the academic rigor of your department, and thank the committee for reviewing my application.",
              font: "Times New Roman",
              size: 24
            })
          ],
          spacing: { after: 240, line: 360 }
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `SOPIA_Premium_SOP_Template_${fieldTitle.replace(/\s+/g, '_')}.docx`);
};
