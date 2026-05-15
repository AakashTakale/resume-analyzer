import type { AnalysisResult } from '../types/analysis';

export const strongMatch: AnalysisResult = {
  atsScore: 82,
  summary: 'Your resume closely aligns with the JD. A few minor keyword gaps remain.',
  inputQuality: 'good',
  keywordGaps: [
    {
      keyword: 'Storybook',
      importance: 'important',
      context: 'Documented components using Storybook for cross-team adoption',
    },
    {
      keyword: 'Cypress',
      importance: 'nice-to-have',
      context: 'E2E testing with Cypress or Playwright preferred',
    },
    {
      keyword: 'feature flags',
      importance: 'nice-to-have',
      context: 'Familiarity with feature flag systems (LaunchDarkly, GrowthBook) is a plus',
    },
  ],
  sectionFit: [
    { section: 'Work Experience', score: 85, feedback: 'Strong impact metrics and relevant tech.' },
    { section: 'Skills', score: 90, feedback: 'Excellent keyword alignment.' },
    { section: 'Projects', score: 80, feedback: 'Good. Add usage metrics.' },
    { section: 'Education', score: 88, feedback: 'Well formatted.' },
  ],
  rewriteSuggestions: [
    {
      original: 'Built a dashboard',
      improved:
        'Architected a real-time analytics dashboard handling 10k daily active users, reducing load time by 40%.',
      reason: 'Adds scale and outcome metrics.',
    },
  ],
};
