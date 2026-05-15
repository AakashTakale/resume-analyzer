/**
 * Test script: PDF parser
 * Usage: npx ts-node scripts/test-pdf-parser.ts <path-to-pdf>
 * Example: npx ts-node scripts/test-pdf-parser.ts ~/resume.pdf
 */
import fs from 'fs';
import path from 'path';
import { extractTextFromPDF } from '../src/services/pdfParser';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx ts-node scripts/test-pdf-parser.ts <path-to-pdf>');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  console.log(`Parsing: ${resolved}`);
  const buffer = fs.readFileSync(resolved);
  const text = await extractTextFromPDF(buffer);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  console.log(`\n--- Extracted Text (${wordCount} words) ---\n`);
  console.log(text.slice(0, 2000));
  if (text.length > 2000) {
    console.log(`\n... (truncated, total ${text.length} chars)`);
  }
  console.log(`\nQuality: ${wordCount < 100 ? 'DEGRADED (< 100 words)' : 'GOOD'}`);
}

main().catch(console.error);
