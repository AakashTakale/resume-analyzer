import type { AnalysisResult } from '../types/analysis';

export const weakMatch: AnalysisResult = {
  atsScore: 21,
  summary:
    'Resume content does not align with the JD requirements. Critical keywords, relevant experience, and measurable outcomes are all absent.',
  inputQuality: 'degraded',
  keywordGaps: [
    {
      keyword: 'React',
      importance: 'critical',
      context: 'Core frontend framework required for all UI development',
    },
    {
      keyword: 'TypeScript',
      importance: 'critical',
      context: 'TypeScript is required across the entire frontend codebase',
    },
    {
      keyword: 'REST APIs',
      importance: 'critical',
      context: 'Must have experience integrating RESTful APIs in production',
    },
    {
      keyword: 'GraphQL',
      importance: 'critical',
      context: 'Experience consuming GraphQL APIs in a React application',
    },
    {
      keyword: 'system design',
      importance: 'critical',
      context: 'Senior-level system design for scalable frontend architecture required',
    },
    {
      keyword: 'CI/CD',
      importance: 'critical',
      context: 'Experience with CI/CD pipelines and automated deployment required',
    },
    {
      keyword: 'code review',
      importance: 'important',
      context: 'Expected to lead code reviews and maintain code quality standards',
    },
    {
      keyword: 'agile',
      importance: 'important',
      context: 'Experience working in agile/scrum development cycles',
    },
    {
      keyword: 'testing',
      importance: 'important',
      context: 'Unit and integration testing experience required',
    },
    {
      keyword: 'performance optimization',
      importance: 'important',
      context: 'Track record of measurable frontend performance improvements',
    },
    {
      keyword: 'Docker',
      importance: 'nice-to-have',
      context: 'Familiarity with Docker for local development environments is a plus',
    },
    {
      keyword: 'AWS',
      importance: 'nice-to-have',
      context: 'Experience deploying to AWS (S3, CloudFront) is advantageous',
    },
    {
      keyword: 'Redis',
      importance: 'nice-to-have',
      context: 'Knowledge of Redis for caching strategies is beneficial',
    },
  ],
  sectionFit: [
    {
      section: 'Work Experience',
      score: 22,
      feedback: 'No relevant frontend experience mentioned.',
    },
    { section: 'Skills', score: 18, feedback: 'Almost no overlap with JD requirements.' },
    { section: 'Projects', score: 30, feedback: 'Projects listed without tech stack or outcomes.' },
    {
      section: 'Education',
      score: 60,
      feedback: 'Degree present but no CS fundamentals mentioned.',
    },
  ],
  rewriteSuggestions: [
    {
      original: 'Managed team operations and coordinated schedules.',
      improved:
        'Led cross-functional delivery of 3 web features using React and REST APIs, reducing manual workflow time by 35%.',
      reason: 'Reframes non-technical experience using JD language and quantified outcome.',
    },
    {
      original: 'Hardworking professional seeking new opportunities.',
      improved:
        'Frontend engineer with experience in React, TypeScript, and REST API integration, seeking a role focused on scalable UI systems and performance.',
      reason: 'Adds technical keywords and role-specific framing the JD explicitly requires.',
    },
  ],
};
