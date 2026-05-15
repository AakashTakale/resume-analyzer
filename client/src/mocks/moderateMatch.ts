import type { AnalysisResult } from '../types/analysis';

export const moderateMatch: AnalysisResult = {
  atsScore: 63,
  summary:
    'Strong React and TypeScript base but missing high-signal keywords around system design, performance, and accessibility.',
  inputQuality: 'good',
  keywordGaps: [
    {
      keyword: 'Web Vitals',
      importance: 'critical',
      context: 'Demonstrated experience improving Core Web Vitals (LCP, CLS, FID) in production',
    },
    {
      keyword: 'WCAG',
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
      keyword: 'monorepo',
      importance: 'important',
      context: 'Experience working within a Turborepo or Nx monorepo is advantageous',
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
      keyword: 'Storybook',
      importance: 'nice-to-have',
      context: 'Documented components using Storybook for cross-team adoption',
    },
  ],
  sectionFit: [
    {
      section: 'Work Experience',
      score: 68,
      feedback: 'Lacks quantified impact and specific outcomes.',
    },
    { section: 'Skills', score: 55, feedback: 'Missing high-value keywords from the JD.' },
    { section: 'Projects', score: 80, feedback: 'Strong. Add adoption metrics.' },
    { section: 'Education', score: 90, feedback: 'Well formatted and accurate.' },
  ],
  rewriteSuggestions: [
    {
      original: 'Built reusable UI components for the product dashboard using React and TypeScript.',
      improved:
        'Architected a 40-component React/TypeScript design system adopted by 3 teams, cutting duplicate code by 60% and reducing LCP by 200ms.',
      reason: 'Adds scope, measurable outcomes, and exact JD language.',
    },
    {
      original: 'JavaScript, React, CSS, Git',
      improved:
        'React, TypeScript, GraphQL, Web Vitals optimization, WCAG accessibility, micro-frontend architecture, CI/CD',
      reason: 'Replaces generic list with JD-specific high-signal keywords.',
    },
  ],
};
