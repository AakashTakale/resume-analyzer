import { useState } from 'react';
import type { AnalysisResult, AnalysisResponse } from '../types/analysis';

const API_URL = import.meta.env.VITE_API_URL as string;

// Set to true to skip the API call and return fake data instantly.
// Flip back to false before deploying.
const MOCK_MODE = false;

const MOCK_DELAY_MS = 2200;

const MOCK_RESULT: AnalysisResult = {
  atsScore: 63,
  summary:
    'Your resume shows solid React and TypeScript experience but is missing several high-signal keywords the JD repeats — particularly around system design, performance optimization, and accessibility. The Skills and Experience sections need reframing to match the role\'s language more closely.',
  inputQuality: 'good',
  keywordGaps: [
    {
      keyword: 'Web Vitals',
      importance: 'critical',
      context: 'Demonstrated experience improving Core Web Vitals (LCP, CLS, FID) in production',
    },
    {
      keyword: 'accessibility (WCAG)',
      importance: 'critical',
      context: 'Must have experience building WCAG 2.1 AA compliant interfaces',
    },
    {
      keyword: 'micro-frontends',
      importance: 'critical',
      context: 'Experience with micro-frontend architecture at scale is required',
    },
    {
      keyword: 'design system',
      importance: 'important',
      context: 'Contributed to or maintained a production design system used across teams',
    },
    {
      keyword: 'code splitting',
      importance: 'important',
      context: 'Applied code splitting and lazy loading to reduce bundle size',
    },
    {
      keyword: 'GraphQL',
      importance: 'important',
      context: 'Experience consuming GraphQL APIs in a React application',
    },
    {
      keyword: 'Storybook',
      importance: 'important',
      context: 'Documented components using Storybook for cross-team adoption',
    },
    {
      keyword: 'feature flags',
      importance: 'nice-to-have',
      context: 'Familiarity with feature flag systems (LaunchDarkly, GrowthBook) is a plus',
    },
    {
      keyword: 'Cypress',
      importance: 'nice-to-have',
      context: 'E2E testing with Cypress or Playwright preferred',
    },
    {
      keyword: 'monorepo',
      importance: 'nice-to-have',
      context: 'Experience working within a Turborepo or Nx monorepo is advantageous',
    },
  ],
  sectionFit: [
    {
      section: 'Work Experience',
      score: 68,
      feedback:
        'Three of five bullets describe generic CRUD work without measurable outcomes. The JD wants evidence of scale and performance wins — quantify impact and use the role\'s language ("shipped", "reduced", "improved LCP").',
    },
    {
      section: 'Skills',
      score: 55,
      feedback:
        'The skills list is long but undifferentiated. Critical keywords from the JD (Web Vitals, WCAG, micro-frontends) are absent entirely. Remove irrelevant tools and add the missing ones.',
    },
    {
      section: 'Projects',
      score: 80,
      feedback:
        'The open-source component library is a strong signal for this role. Consider surfacing bundle size metrics or adoption numbers to reinforce the design system angle.',
    },
    {
      section: 'Education',
      score: 72,
      feedback:
        'Solid CS fundamentals align with the JD\'s preference for computer science background. No changes needed here.',
    },
  ],
  rewriteSuggestions: [
    {
      original:
        'Built reusable UI components for the product dashboard using React and TypeScript.',
      improved:
        'Architected a library of 40+ accessible React + TypeScript components adopted across 3 product teams, reducing duplicated UI code by 60% and cutting new-feature delivery time by 2 sprints.',
      reason:
        'The JD explicitly values design system ownership and cross-team impact. Adding the scope (40+ components, 3 teams) and a measurable outcome (60% reduction) turns a generic statement into direct evidence.',
    },
    {
      original: 'Worked on improving the performance of the main application.',
      improved:
        'Improved LCP from 4.2s to 1.8s on the main product page by implementing route-based code splitting, deferring non-critical scripts, and optimizing image loading — raising the Lighthouse performance score from 54 to 91.',
      reason:
        'The JD requires demonstrated Core Web Vitals experience. Naming the specific metric (LCP), the before/after numbers, and the techniques used mirrors the JD\'s language exactly.',
    },
    {
      original: 'Helped ensure the app was accessible to all users.',
      improved:
        'Led a WCAG 2.1 AA audit and remediation sprint, resolving 34 critical accessibility violations across keyboard navigation, focus management, and ARIA labelling — enabling the product to pass an enterprise accessibility review.',
      reason:
        'Accessibility (WCAG) is a critical keyword appearing three times in the JD. Quantifying the violations fixed and naming the standard (2.1 AA) directly addresses the requirement rather than paraphrasing it.',
    },
    {
      original: 'Reviewed pull requests and mentored junior developers.',
      improved:
        'Established frontend code review standards and an onboarding guide for a 6-person team; mentored 2 junior engineers from mid-level to senior track within 18 months.',
      reason:
        'The JD\'s "Senior" designation implies technical leadership. Specific numbers (6-person team, 2 engineers promoted) replace a generic statement with a concrete leadership signal.',
    },
  ],
};

export type ResumeInput =
  | { mode: 'file'; file: File }
  | { mode: 'text'; text: string };

interface UseAnalysisResult {
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  analyze: (resume: ResumeInput, jobDescription: string, previousRewrites?: string[]) => Promise<void>;
  reset: () => void;
  injectResult: (r: AnalysisResult) => void;
}

export function useAnalysis(): UseAnalysisResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function analyze(_resume: ResumeInput, _jobDescription: string, _previousRewrites?: string[]) {
    setLoading(true);
    setError(null);
    setResult(null);

    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
      setResult(MOCK_RESULT);
      setLoading(false);
      return;
    }

    try {
      let response: Response;

      if (_resume.mode === 'file') {
        const formData = new FormData();
        formData.append('resume', _resume.file);
        formData.append('jobDescription', _jobDescription);
        if (_previousRewrites && _previousRewrites.length > 0) {
          formData.append('previousRewrites', JSON.stringify(_previousRewrites));
        }
        response = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText: _resume.text,
            jobDescription: _jobDescription,
            ...(_previousRewrites && _previousRewrites.length > 0 && { previousRewrites: _previousRewrites }),
          }),
        });
      }

      const data = await response.json() as AnalysisResponse;

      if (!data.success || !data.data) {
        setError(data.error ?? 'Analysis failed. Please try again.');
        return;
      }

      setResult(data.data);
    } catch {
      setError('Could not reach the server. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { loading, error, result, analyze, reset, injectResult: setResult };
}
