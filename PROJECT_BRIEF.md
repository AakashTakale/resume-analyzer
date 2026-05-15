# Resume Analyzer — Project Brief v2
**Hand this entire document to Claude Code as your starting prompt.**

---

## What We're Building

A full-stack web app where a user inputs their resume (PDF, DOCX, or plain text paste) and pastes a job description, and receives:
- An ATS compatibility score (0–100)
- A keyword gap analysis (missing keywords from the JD)
- A JD fit breakdown (how well each resume section maps to the role)
- Tailored rewrite suggestions for weak bullet points

**V1 scope:** Single resume analysis, deployed, live URL.
**Architected for V2:** Backend accepts an array of resumes so bulk hiring-manager screening can be added later without rearchitecting.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| LLM | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| PDF parsing | `pdf-parse` |
| DOCX parsing | `mammoth` |
| Deployment | Vercel (frontend) + Railway (backend) |

No database. No vector store. Resume + JD fits cleanly in Claude's context window.

---

## Folder Structure

```
resume-analyzer/
├── CLAUDE.md
│
├── client/                            # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.tsx         # Resume input (upload or paste) + JD textarea
│   │   │   ├── ScoreCard.tsx          # ATS score + summary
│   │   │   ├── KeywordGaps.tsx        # Missing keywords grouped by importance
│   │   │   ├── FitBreakdown.tsx       # Section-by-section fit with progress bars
│   │   │   ├── RewriteSuggestions.tsx # Before/after bullet rewrites
│   │   │   └── LoadingState.tsx       # Loading UI while Claude processes
│   │   ├── types/
│   │   │   └── analysis.ts            # All TypeScript interfaces
│   │   ├── hooks/
│   │   │   └── useAnalysis.ts         # API call + state management
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                            # Node + Express backend
│   ├── src/
│   │   ├── config.ts                  # All env vars and constants (model name, limits)
│   │   ├── routes/
│   │   │   └── analyze.ts             # POST /api/analyze
│   │   ├── services/
│   │   │   ├── inputParser.ts         # Routes PDF / DOCX / plain text to correct parser
│   │   │   ├── pdfParser.ts           # PDF → plain text
│   │   │   ├── docxParser.ts          # DOCX → plain text
│   │   │   └── claudeService.ts       # Prompt construction + Claude API call
│   │   ├── middleware/
│   │   │   └── rateLimiter.ts         # One request per IP per 30 seconds
│   │   ├── types/
│   │   │   └── analysis.ts            # Mirrors client types exactly
│   │   └── index.ts                   # Express app entry
│   ├── .env                           # Never commit
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## TypeScript Interfaces

Define in both `client/src/types/analysis.ts` and `server/src/types/analysis.ts` — keep them identical.

```typescript
export interface AnalysisRequest {
  resumeText: string;       // Always plain text by the time it hits Claude
  jobDescription: string;
}

// V2-ready: backend accepts array, V1 UI sends one
export interface BulkAnalysisRequest {
  resumes: AnalysisRequest[];
  jobDescription: string;
}

export interface KeywordGap {
  keyword: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  context: string;           // Where it appears in the JD
}

export interface SectionFit {
  section: string;           // e.g. "Work Experience", "Skills", "Summary"
  score: number;             // 0-100
  feedback: string;
}

export interface RewriteSuggestion {
  original: string;
  improved: string;
  reason: string;
}

export interface AnalysisResult {
  atsScore: number;
  summary: string;                         // 2-3 sentence plain English verdict
  keywordGaps: KeywordGap[];
  sectionFit: SectionFit[];
  rewriteSuggestions: RewriteSuggestion[]; // Top 3-5 bullets only
  inputQuality?: 'good' | 'degraded';      // Signal if PDF parsing produced garbled text
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}
```

---

## Input Modes — Three Paths

### Why three modes?
PDF parsing is fragile — two-column layouts, tables, and fancy formatting produce garbled text. Plain text paste is the most reliable input. DOCX covers users who work in Word. All three paths produce the same clean plain text before anything reaches Claude.

### Frontend — `InputPanel.tsx`
Two tabs or toggle: **Upload File** | **Paste Text**

**Upload File tab:**
- Drag-and-drop or click-to-upload
- Accept `.pdf` and `.docx` only — reject all other file types with a clear error message
- File size limit: 5MB max
- Show filename once uploaded
- Warn user: "Complex formatting (columns, tables) may affect accuracy. If results look wrong, try paste mode."

**Paste Text tab:**
- Textarea for resume plain text
- Minimum 200 characters before submission is allowed

**Job Description (always visible):**
- Textarea for pasting the JD
- Minimum 100 characters before submission is allowed

**Submit button rules:**
- Disabled until both resume input AND job description meet minimums
- Locks (disabled) immediately on submit — prevents double calls
- Unlocks again only on success or error

---

## Validation — Three Layers

### Layer 1 — Frontend (UX guardrails)
- File type: PDF or DOCX only
- File size: 5MB max
- JD length: 100 character minimum
- Resume paste length: 200 character minimum
- Submit lock on submission

### Layer 2 — Backend (server-side, cannot be bypassed)
In `inputParser.ts` before calling Claude:
- Estimate token count: if resume + JD combined exceeds 6000 words, reject with `error: "Input too long. Please trim your resume or job description."`
- Sanitize input: strip HTML tags from pasted text
- Validate resumeText is not empty after parsing
- If PDF parsing returns fewer than 100 words, return `inputQuality: 'degraded'` signal so frontend can suggest switching to paste mode

In `rateLimiter.ts`:
- One request per IP per 30 seconds
- Return `429` with `error: "Please wait 30 seconds before analyzing again."`

### Layer 3 — Prompt rules (Claude behavior)
See Claude Service section below.

---

## Backend — Core Logic

### `server/src/config.ts`
```typescript
export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  model: 'claude-sonnet-4-20250514',  // Single source of truth
  maxTokens: 2000,
  port: process.env.PORT || 3001,
  maxInputWords: 6000,
  rateLimitWindowMs: 30000,
};
```

### `server/src/services/pdfParser.ts`
```typescript
import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
```

### `server/src/services/docxParser.ts`
```typescript
import mammoth from 'mammoth';

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
```

### `server/src/services/inputParser.ts`
```typescript
import { extractTextFromPDF } from './pdfParser';
import { extractTextFromDOCX } from './docxParser';

type InputType = 'pdf' | 'docx' | 'text';

export async function parseResumeInput(
  input: string | Buffer,
  type: InputType
): Promise<{ text: string; quality: 'good' | 'degraded' }> {
  let text = '';

  if (type === 'text') {
    text = (input as string).trim();
  } else if (type === 'pdf') {
    text = await extractTextFromPDF(input as Buffer);
  } else if (type === 'docx') {
    text = await extractTextFromDOCX(input as Buffer);
  }

  // Sanitize HTML tags
  text = text.replace(/<[^>]*>/g, '');

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const quality = wordCount < 100 ? 'degraded' : 'good';

  return { text, quality };
}
```

### `server/src/services/claudeService.ts`
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { AnalysisResult } from '../types/analysis';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  inputQuality: 'good' | 'degraded'
): Promise<AnalysisResult> {

  // Prompt rules are commented intentionally — explain every decision
  const prompt = `
You are an expert ATS (Applicant Tracking System) and resume reviewer.

Analyze the resume against the job description below.

Return a JSON object ONLY — no preamble, no markdown fences, no explanation outside the JSON.

The JSON must match this exact structure:
{
  "atsScore": <number 0-100>,
  "summary": "<2-3 sentences, plain English, direct verdict>",
  "keywordGaps": [
    {
      "keyword": "<missing keyword>",
      "importance": "<critical | important | nice-to-have>",
      "context": "<exact phrase from JD where this keyword appears>"
    }
  ],
  "sectionFit": [
    {
      "section": "<section name>",
      "score": <0-100>,
      "feedback": "<specific, actionable feedback — no generic advice>"
    }
  ],
  "rewriteSuggestions": [
    {
      "original": "<exact bullet from resume>",
      "improved": "<rewritten version using language from the JD>",
      "reason": "<why this change improves ATS fit>"
    }
  ]
}

Scoring rules:
- Be critical and honest. A score above 80 should be rare and only given when the resume strongly matches the JD in skills, experience level, and language.
- A score of 50-70 is average — the candidate has relevant experience but significant keyword or framing gaps.
- Do not flatter. The user needs accurate signal, not encouragement.

Keyword rules:
- Only flag keywords genuinely absent from the resume — not synonyms or close matches.
- Group by importance: critical = appears multiple times or in requirements, important = appears once in requirements, nice-to-have = appears only in preferred/bonus section.

Rewrite rules:
- Pick the 3-5 weakest bullets — those with the least JD language alignment.
- Rewrites must use specific language from the JD, not generic improvement advice.
- Do not start rewrites with "Consider" or "You might want to" — rewrite directly.

${inputQuality === 'degraded' ? `
Note: The resume text may be garbled due to complex PDF formatting.
If the resume text appears incoherent or unreadable, return:
{ "atsScore": 0, "summary": "PARSE_ERROR", "keywordGaps": [], "sectionFit": [], "rewriteSuggestions": [] }
` : ''}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

  const message = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as AnalysisResult;

  // Attach input quality signal for frontend to act on
  parsed.inputQuality = inputQuality;
  return parsed;
}
```

### `server/src/routes/analyze.ts`
```typescript
import express from 'express';
import multer from 'multer';
import { parseResumeInput } from '../services/inputParser';
import { analyzeResume } from '../services/claudeService';
import { config } from '../config';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription, resumeText } = req.body;
    const file = req.file;

    // Determine input type
    let parsed: { text: string; quality: 'good' | 'degraded' };

    if (resumeText) {
      // Plain text paste path
      parsed = await parseResumeInput(resumeText, 'text');
    } else if (file) {
      // File upload path
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        return res.status(400).json({ success: false, error: 'Only PDF and DOCX files are supported.' });
      }
      parsed = await parseResumeInput(file.buffer, ext as 'pdf' | 'docx');
    } else {
      return res.status(400).json({ success: false, error: 'Resume input and job description are required.' });
    }

    // Token estimation guard
    const combinedWords = (parsed.text + jobDescription).split(/\s+/).length;
    if (combinedWords > config.maxInputWords) {
      return res.status(400).json({ success: false, error: 'Input too long. Please trim your resume or job description.' });
    }

    const result = await analyzeResume(parsed.text, jobDescription, parsed.quality);

    // Handle parse error signal from Claude
    if (result.summary === 'PARSE_ERROR') {
      return res.status(422).json({
        success: false,
        error: 'Could not read your resume — the formatting may be too complex. Please try pasting the text directly.'
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' });
  }
});

export default router;
```

---

## Frontend — Key Behaviors

### `useAnalysis.ts`
- Accepts either a File or a plain text string as resume input
- Detects which path and builds FormData or JSON body accordingly
- Returns `{ loading, error, result }` state
- On `inputQuality === 'degraded'` in result — show a banner: "Results may be inaccurate due to formatting. Try paste mode for better accuracy."
- On `PARSE_ERROR` — surface backend error directly, suggest paste mode

### `ScoreCard.tsx`
- Large score display — color coded: 0–49 red, 50–74 amber, 75–100 green
- Show `summary` text directly below score
- If `inputQuality === 'degraded'` — show amber warning banner above score

### `KeywordGaps.tsx`
- Group chips by importance tier: Critical / Important / Nice-to-have
- Show `context` on hover or in an expandable row

### `FitBreakdown.tsx`
- Progress bar per section
- Score + feedback text below each bar

### `RewriteSuggestions.tsx`
- Card per suggestion
- Original bullet greyed out with strikethrough
- Improved bullet highlighted
- Reason in smaller text below

---

## Environment Variables

**Server `.env` — never commit:**
```
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

**Client `.env.local` — never commit:**
```
VITE_API_URL=http://localhost:3001
```

In production, `VITE_API_URL` points to the Railway backend URL.

---

## Dependencies

**Server:**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "latest",
    "cors": "latest",
    "dotenv": "latest",
    "express": "latest",
    "express-rate-limit": "latest",
    "mammoth": "latest",
    "multer": "latest",
    "pdf-parse": "latest"
  },
  "devDependencies": {
    "@types/cors": "latest",
    "@types/express": "latest",
    "@types/multer": "latest",
    "@types/pdf-parse": "latest",
    "ts-node": "latest",
    "typescript": "latest"
  }
}
```

**Client:**
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@vitejs/plugin-react": "latest",
    "autoprefixer": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "vite": "latest"
  }
}
```

---

## Build Order — Follow This Exactly

Do not skip ahead. Each step must work before moving to the next.

### Day 1 — Server foundation
- [ ] Create `CLAUDE.md` with all rules — before any code
- [ ] Scaffold server with Express + TypeScript
- [ ] `GET /api/health` returns `{ success: true }` — server running locally confirmed

### Day 2 — Parsing and Claude integration
- [ ] PDF parsing works — test with your own resume, log extracted text
- [ ] DOCX parsing works — test with a Word doc
- [ ] Plain text path works
- [ ] Claude API call returns valid JSON matching `AnalysisResult` interface
- [ ] `POST /api/analyze` works end-to-end via Postman or curl — all three input modes

### Day 3-4 — Frontend
- [ ] Scaffold React + TypeScript + Vite + Tailwind
- [ ] `InputPanel` — upload and paste modes both functional
- [ ] `useAnalysis` hook — connects to backend, handles loading/error states
- [ ] All four result components render with real API data
- [ ] Parse error banner shows correctly when `inputQuality === 'degraded'`

### Day 5 — Deploy
- [ ] Backend deployed on Railway
- [ ] Frontend deployed on Vercel with correct `VITE_API_URL`
- [ ] End-to-end works on live URL — test all three input modes

### Week 2 — Polish
- [ ] Loading state is smooth — skeleton screens or progress indicator
- [ ] Error states handled gracefully for all failure modes
- [ ] Mobile responsive
- [ ] Rate limiter tested
- [ ] GitHub README written — what it does, stack, how to run locally, live URL
- [ ] Added to portfolio site

---

## Deployment Plan

### Backend → Railway
1. Push `server/` to GitHub
2. Connect repo to Railway
3. Set env var: `ANTHROPIC_API_KEY`
4. Railway auto-detects Node — deploys automatically
5. Copy the Railway public URL

### Frontend → Vercel
1. Push `client/` to GitHub
2. Connect repo to Vercel
3. Set env var: `VITE_API_URL=<your Railway URL>`
4. Vercel auto-detects Vite — deploys automatically
5. Live URL ready to share

---