import type { VercelRequest, VercelResponse } from '@vercel/node';
import Busboy from 'busboy';
import { parseResumeInput } from './lib/services/inputParser';
import { analyzeResume } from './lib/services/claudeService';
import { config as appConfig } from './lib/config';

// Disable Vercel's default body parser so we can handle both multipart and JSON manually
export const config = {
  api: {
    bodyParser: false,
  },
};

// TODO: replace with Upstash Redis rate limiting in V2

type ParsedForm = {
  fields: Record<string, string>;
  file?: { buffer: Buffer; filename: string };
};

function parseMultipart(req: VercelRequest): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers as Record<string, string> });
    const fields: Record<string, string> = {};
    let file: ParsedForm['file'];

    bb.on('field', (name, value) => {
      fields[name] = value;
    });

    bb.on('file', (name, stream, info) => {
      if (name !== 'resume') {
        // Drain and discard any unexpected file fields
        stream.resume();
        return;
      }
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        file = { buffer: Buffer.concat(chunks), filename: info.filename };
      });
    });

    bb.on('finish', () => resolve({ fields, file }));
    bb.on('error', reject);

    req.pipe(bb);
  });
}

function collectBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  try {
    const contentType = req.headers['content-type'] ?? '';

    let jobDescription: string | undefined;
    let resumeText: string | undefined;
    let previousRewrites: string[] | undefined;
    let fileBuffer: Buffer | undefined;
    let fileExt: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const { fields, file } = await parseMultipart(req);
      jobDescription = fields['jobDescription'];
      resumeText = fields['resumeText'];

      if (fields['previousRewrites']) {
        try {
          const parsed: unknown = JSON.parse(fields['previousRewrites']);
          if (Array.isArray(parsed) && parsed.every((x): x is string => typeof x === 'string')) {
            previousRewrites = parsed;
          }
        } catch {
          // malformed JSON — ignore
        }
      }

      if (file) {
        fileBuffer = file.buffer;
        fileExt = file.filename.split('.').pop()?.toLowerCase();
      }
    } else {
      const raw = await collectBody(req);
      const body = JSON.parse(raw.toString()) as {
        jobDescription?: string;
        resumeText?: string;
        previousRewrites?: unknown;
      };
      jobDescription = body.jobDescription;
      resumeText = body.resumeText;
      if (Array.isArray(body.previousRewrites) && body.previousRewrites.every((x): x is string => typeof x === 'string')) {
        previousRewrites = body.previousRewrites;
      }
    }

    if (!jobDescription) {
      return res.status(400).json({ success: false, error: 'Job description is required.' });
    }

    let parsed: { text: string; quality: 'good' | 'degraded' };

    if (resumeText) {
      parsed = await parseResumeInput(resumeText, 'text');
    } else if (fileBuffer && fileExt) {
      if (fileExt !== 'pdf' && fileExt !== 'docx') {
        return res.status(400).json({ success: false, error: 'Only PDF and DOCX files are supported.' });
      }
      parsed = await parseResumeInput(fileBuffer, fileExt as 'pdf' | 'docx');
    } else {
      return res.status(400).json({ success: false, error: 'Resume input and job description are required.' });
    }

    if (!parsed.text) {
      return res.status(400).json({ success: false, error: 'Could not extract text from the provided resume.' });
    }

    const combinedWords = (parsed.text + jobDescription).split(/\s+/).filter(Boolean).length;
    if (combinedWords > appConfig.maxInputWords) {
      return res.status(400).json({ success: false, error: 'Input too long. Please trim your resume or job description.' });
    }

    const result = await analyzeResume(parsed.text, jobDescription, parsed.quality, previousRewrites);

    if (result.summary === 'PARSE_ERROR') {
      return res.status(422).json({
        success: false,
        error: 'Could not read your resume — the formatting may be too complex. Please try pasting the text directly.',
      });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' });
  }
}
