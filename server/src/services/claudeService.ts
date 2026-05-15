import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import type { AnalysisResult } from '../types/analysis';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  inputQuality: 'good' | 'degraded',
  previousRewrites?: string[]
): Promise<AnalysisResult> {
  const resumeWordCount = resumeText.trim().split(/\s+/).length;
  const jdWordCount = jobDescription.trim().split(/\s+/).length;
  if (resumeWordCount > config.maxResumeWords || jdWordCount > config.maxJobDescWords) {
    throw new Error(
      'Input too long. Please shorten your resume to under 2,500 words and your job description to under 1,500 words.'
    );
  }

  // Prompt rules are commented intentionally — explain every decision.
  // "Return JSON ONLY" prevents Claude from wrapping in prose or markdown fences.
  // Scoring rules are explicit to prevent inflated scores that would mislead users.
  // Rewrite rules forbid hedging ("Consider...") so output is directly usable.
  // The degraded-quality branch tells Claude to return a sentinel rather than hallucinate.
const prompt = `
Return a JSON object ONLY. Do not output your reasoning, steps, or any text before or after the JSON object. Begin your response with { and end with }.

You are an expert recruiter and ATS specialist. Your job is to evaluate 
whether this resume will get shortlisted for this specific role.

A resume gets shortlisted when:
1. It clears the ATS keyword filter for required qualifications
2. A recruiter sees relevant experience and measurable outcomes immediately
3. The language matches what the JD requires — not synonyms, exact terms

Return a JSON object ONLY — no preamble, no markdown fences, no 
explanation outside the JSON.

The JSON must match this exact structure:
{
  "atsScore": <number 0-100>,
  "summary": "<2-3 sentences — lead with shortlisting verdict first>",
  "keywordGaps": [
    {
      "keyword": "<1-4 words maximum — core skill or technology only>",
      "importance": "<critical | important>",
      "context": "<exact phrase from JD where this keyword appears>"
    }
  ],
  "sectionFit": [
    {
      "section": "<canonical section name — see rules below>",
      "score": <0-100>,
      "feedback": "<1-2 sentences — is this section helping or hurting 
      shortlisting? specific and actionable only>"
    }
  ],
  "rewriteSuggestions": [
    {
      "original": "<exact bullet from resume>",
      "improved": "<rewritten bullet using exact JD language>",
      "reason": "<one sentence — how this improves shortlisting 
      probability>"
    }
  ]
}

---

FOLLOW THESE STEPS IN ORDER BEFORE PRODUCING JSON:

Step 1 — Parse the resume
Identify all sections present. Map each to a canonical name:
- Any work history variation → "Work Experience"
- Any skills/technologies variation → "Technical Skills"
- Any projects/portfolio variation → "Projects"
- Any education variation → "Education"
- Any summary/objective variation → "Summary"

Step 2 — Identify keyword gaps
Scan ONLY the required qualifications and skills sections of the JD.
Do NOT scan responsibilities or duties — these are the work to be done,
not prerequisites.

For each required keyword or skill:
- Is it present in a resume bullet with context and evidence? 
  → Full coverage
- Is it present in a skills list only with no supporting bullet? 
  → Partial coverage
- Is it absent entirely? 
  → Gap — flag it

Only flag keywords as gaps if their absence would cause an ATS to 
filter this resume out or a recruiter to reject it immediately.
Drop nice-to-have keywords entirely — they do not affect shortlisting.

Keyword must be 1-4 words maximum. The core skill or technology only.
The full JD phrase goes in context field only.

Group remaining gaps by:
- critical = required qualification, appears multiple times, or 
  explicitly marked as must-have
- important = appears once in required qualifications

Step 3 — Score each section
For each section present in the resume, evaluate its shortlisting 
contribution:

- Does it use language from the JD requirements?
- Does it include measurable outcomes and metrics?
- Does it demonstrate scope, ownership, and seniority appropriate 
  for this role?

Score each section 0-100 based on shortlisting contribution.

Only include a section in sectionFit if:
- It is present in the resume, OR
- It is absent AND its absence would directly hurt shortlisting 
  for this specific JD

Do NOT include Projects if Work Experience score is 70+ and no 
projects section exists — normal for senior professionals.
Do NOT include Summary if work history speaks clearly for itself.
Feedback must be 1-2 sentences. No generic advice. No validation 
of what is already working.

Step 4 — Calculate atsScore
Use these weights:

Keyword coverage — 40%
- Full coverage (keyword in bullet with evidence) = full credit
- Partial coverage (keyword in skills list only) = 30% credit
- Absent = 0 credit
- Critical keywords worth 2x important keywords

Experience relevance — 30%
- Does work history demonstrate similar scope, seniority, and 
  technical depth to what the JD requires?
- Years of experience, system scale, team size, ownership signals

Section completeness — 20%
- Only penalize for missing sections that genuinely hurt 
  shortlisting for this specific role and candidate profile
- Do not penalize senior professionals for missing Projects

Language alignment — 10%
- Exact JD terminology scores higher than synonyms
- Recruiter-facing language alignment matters here

A resume where all critical keywords appear only in a skills list 
with no supporting evidence should score no higher than 55.
A score above 80 means this resume will very likely get shortlisted.
A score of 60-79 means it may clear ATS but a recruiter may hesitate.
A score below 60 means critical gaps exist that will likely cause 
rejection at ATS or recruiter screen.

Step 5 — Write the summary
Lead with the shortlisting verdict:
"This resume will / will not clear ATS for this role because..."
Then state the single most important gap or strength affecting 
shortlisting. Do not validate what is already working. Focus only 
on what is missing or needs to change. 2-3 sentences maximum.

Step 6 — Generate rewrite suggestions
First evaluate every bullet against these three criteria:
1. Does it use specific language from the JD requirements?
2. Does it include a measurable outcome or metric?
3. Does it demonstrate scope or ownership relevant to this role?

A bullet passing all three criteria is already strong — do not 
rewrite it.

Only suggest rewrites for bullets that fail at least one criterion 
AND where rewriting would directly improve shortlisting probability.

Return between 0 and 3 rewriteSuggestions:
- 0 if the resume is genuinely well-optimized for this role
- 1 if only one bullet meaningfully needs improvement
- 2-3 if multiple bullets are hurting shortlisting chances

Never manufacture rewrites for already-strong bullets.
Never suggest the same rewrite twice across multiple analyses of 
the same resume.
Rewrites must use exact language from the JD — not generic 
improvement advice.
Do not start with "Consider" or "You might want to."
Rewrite directly — produce the improved bullet, not advice.

---

${inputQuality === 'degraded' ? `
Note: The resume text may be garbled due to complex PDF formatting.
If the resume text appears incoherent or unreadable, return:
{
  "atsScore": 0,
  "summary": "PARSE_ERROR",
  "keywordGaps": [],
  "sectionFit": [],
  "rewriteSuggestions": []
}
` : ''}

${previousRewrites?.length ? `
PREVIOUSLY REWRITTEN BULLETS:
The following bullets were already rewritten in a previous analysis of this resume. Do not suggest rewriting any of these again under any circumstances. Treat them as already optimized and skip them entirely when selecting bullets for rewriteSuggestions:

${previousRewrites.map((r, i) => `${i + 1}. ${r}`).join('\n')}

If all weak bullets have already been rewritten, return an empty rewriteSuggestions array.
` : ''}
RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

  const message = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  if (raw.length > 3000) {
    console.warn(`Claude response unusually long: ${raw.length} chars — prompt may not have been followed correctly.`);
  }
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as AnalysisResult;

  // Attach input quality so the frontend can show a degraded-quality banner
  parsed.inputQuality = inputQuality;
  return parsed;
}
