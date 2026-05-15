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

  // Strip any HTML that might be present in pasted or parsed content
  text = text.replace(/<[^>]*>/g, '');

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const quality = wordCount < 100 ? 'degraded' : 'good';

  return { text, quality };
}
