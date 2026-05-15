/**
 * Test script: inputParser — exercises all three input paths
 * Usage: npx ts-node scripts/test-input-parser.ts [pdf|docx] [path-to-file]
 *
 * Examples:
 *   npx ts-node scripts/test-input-parser.ts              # runs plain text path only
 *   npx ts-node scripts/test-input-parser.ts pdf ~/resume.pdf
 *   npx ts-node scripts/test-input-parser.ts docx ~/resume.docx
 */
import fs from 'fs';
import path from 'path';
import { parseResumeInput } from '../src/services/inputParser';

const SAMPLE_TEXT = `
John Doe
Software Engineer | john@example.com | github.com/johndoe

EXPERIENCE
Senior Software Engineer — Acme Corp (2021–Present)
- Led migration of monolithic Rails app to microservices using Node.js and Kubernetes
- Reduced p99 API latency by 40% through query optimization and Redis caching
- Mentored 3 junior engineers; introduced code review standards adopted org-wide

Software Engineer — Beta Inc (2018–2021)
- Built real-time dashboard using React and WebSockets serving 50k daily active users
- Automated CI/CD pipeline with GitHub Actions, cutting deploy time from 45 min to 8 min

SKILLS
Languages: TypeScript, Python, Go, SQL
Tools: Docker, Kubernetes, PostgreSQL, Redis, AWS (EC2, S3, Lambda)

EDUCATION
B.S. Computer Science — State University, 2018
`.trim();

async function main() {
  const mode = process.argv[2] as 'pdf' | 'docx' | undefined;
  const filePath = process.argv[3];

  if (!mode) {
    console.log('--- Testing plain text path ---');
    const result = await parseResumeInput(SAMPLE_TEXT, 'text');
    const wordCount = result.text.split(/\s+/).filter(Boolean).length;
    console.log(`Words: ${wordCount} | Quality: ${result.quality}`);
    console.log(`Text preview:\n${result.text.slice(0, 400)}`);
    return;
  }

  if (mode !== 'pdf' && mode !== 'docx') {
    console.error('Mode must be pdf, docx, or omitted (plain text)');
    process.exit(1);
  }

  if (!filePath) {
    console.error(`Usage: npx ts-node scripts/test-input-parser.ts ${mode} <path-to-file>`);
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  console.log(`--- Testing ${mode.toUpperCase()} path: ${resolved} ---`);
  const buffer = fs.readFileSync(resolved);
  const result = await parseResumeInput(buffer, mode);
  const wordCount = result.text.split(/\s+/).filter(Boolean).length;

  console.log(`Words: ${wordCount} | Quality: ${result.quality}`);
  console.log(`\nText preview:\n${result.text.slice(0, 1000)}`);
  if (result.text.length > 1000) {
    console.log(`\n... (truncated, total ${result.text.length} chars)`);
  }
}

main().catch(console.error);
