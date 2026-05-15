/**
 * Test script: DOCX parser
 * Usage: npx ts-node scripts/test-docx-parser.ts <path-to-docx>
 * Example: npx ts-node scripts/test-docx-parser.ts ~/resume.docx
 */
import fs from 'fs';
import path from 'path';
import { extractTextFromDOCX } from '../src/services/docxParser';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx ts-node scripts/test-docx-parser.ts <path-to-docx>');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  console.log(`Parsing: ${resolved}`);
  const buffer = fs.readFileSync(resolved);
  const text = await extractTextFromDOCX(buffer);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  console.log(`\n--- Extracted Text (${wordCount} words) ---\n`);
  console.log(text.slice(0, 2000));
  if (text.length > 2000) {
    console.log(`\n... (truncated, total ${text.length} chars)`);
  }
  console.log(`\nQuality: ${wordCount < 100 ? 'DEGRADED (< 100 words)' : 'GOOD'}`);
}

main().catch(console.error);
