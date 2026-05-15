/**
 * Test script: POST /api/analyze with plain text files
 * Usage: npx ts-node scripts/test-analyze.ts
 *
 * Edit test-jd.txt and test-resume.txt freely — no JSON escaping needed.
 */
import fs from 'fs';
import path from 'path';
import type { AnalysisResponse } from '../src/types/analysis';

const JD_FILE = path.resolve(__dirname, '../test-jd.txt');
const RESUME_FILE = path.resolve(__dirname, '../test-resume.txt');
const API_URL = process.env.API_URL ?? 'http://localhost:3001/api/analyze';

async function main() {
  if (!fs.existsSync(JD_FILE) || !fs.existsSync(RESUME_FILE)) {
    console.error('Missing files. Create test-jd.txt and test-resume.txt in server/');
    process.exit(1);
  }

  const jobDescription = fs.readFileSync(JD_FILE, 'utf8').trim();
  const resumeText = fs.readFileSync(RESUME_FILE, 'utf8').trim();

  console.log(`JD: ${jobDescription.split(/\s+/).length} words`);
  console.log(`Resume: ${resumeText.split(/\s+/).length} words`);
  console.log(`Calling ${API_URL}...\n`);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription, resumeText }),
  });

  const data = await response.json() as AnalysisResponse;

  if (!data.success || !data.data) {
    console.error('Error:', data.error);
    process.exit(1);
  }

  const r = data.data;
  console.log(`ATS Score: ${r.atsScore}/100 (quality: ${r.inputQuality})`);
  console.log(`\nSummary:\n${r.summary}`);

  console.log(`\nKeyword Gaps (${r.keywordGaps.length}):`);
  for (const k of r.keywordGaps) {
    console.log(`  [${k.importance}] ${k.keyword} — "${k.context}"`);
  }

  console.log(`\nSection Fit:`);
  for (const s of r.sectionFit) {
    console.log(`  ${s.section}: ${s.score}/100 — ${s.feedback}`);
  }

  console.log(`\nRewrite Suggestions (${r.rewriteSuggestions.length}):`);
  for (const rw of r.rewriteSuggestions) {
    console.log(`  BEFORE: ${rw.original}`);
    console.log(`  AFTER:  ${rw.improved}`);
    console.log(`  WHY:    ${rw.reason}\n`);
  }
}

main().catch(console.error);
