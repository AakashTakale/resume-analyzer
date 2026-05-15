import express from 'express';
import multer from 'multer';
import { parseResumeInput } from '../services/inputParser';
import { analyzeResume } from '../services/claudeService';
import { config } from '../config';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription, resumeText, previousRewrites: prevRewritesRaw } = req.body as {
      jobDescription?: string;
      resumeText?: string;
      previousRewrites?: string | string[];
    };
    const file = req.file;

    let previousRewrites: string[] | undefined;
    if (prevRewritesRaw !== undefined) {
      if (Array.isArray(prevRewritesRaw)) {
        if (prevRewritesRaw.every((item): item is string => typeof item === 'string')) {
          previousRewrites = prevRewritesRaw;
        }
      } else if (typeof prevRewritesRaw === 'string') {
        try {
          const parsed: unknown = JSON.parse(prevRewritesRaw);
          if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')) {
            previousRewrites = parsed as string[];
          }
        } catch {
          // malformed JSON — ignore
        }
      }
    }

    if (!jobDescription) {
      return res.status(400).json({ success: false, error: 'Job description is required.' });
    }

    let parsed: { text: string; quality: 'good' | 'degraded' };

    if (resumeText) {
      parsed = await parseResumeInput(resumeText, 'text');
    } else if (file) {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        return res.status(400).json({ success: false, error: 'Only PDF and DOCX files are supported.' });
      }
      parsed = await parseResumeInput(file.buffer, ext as 'pdf' | 'docx');
    } else {
      return res.status(400).json({ success: false, error: 'Resume input and job description are required.' });
    }

    if (!parsed.text) {
      return res.status(400).json({ success: false, error: 'Could not extract text from the provided resume.' });
    }

    const combinedWords = (parsed.text + jobDescription).split(/\s+/).filter(Boolean).length;
    if (combinedWords > config.maxInputWords) {
      return res.status(400).json({ success: false, error: 'Input too long. Please trim your resume or job description.' });
    }

    const result = await analyzeResume(parsed.text, jobDescription, parsed.quality, previousRewrites);

    if (result.summary === 'PARSE_ERROR') {
      return res.status(422).json({
        success: false,
        error: 'Could not read your resume — the formatting may be too complex. Please try pasting the text directly.',
      });
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' });
  }
});

export default router;
