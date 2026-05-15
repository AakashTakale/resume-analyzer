export interface AnalysisRequest {
  resumeText: string;
  jobDescription: string;
  previousRewrites?: string[];
}

export interface BulkAnalysisRequest {
  resumes: AnalysisRequest[];
  jobDescription: string;
}

export interface KeywordGap {
  keyword: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  context: string;
}

export interface SectionFit {
  section: string;
  score: number;
  feedback: string;
}

export interface RewriteSuggestion {
  original: string;
  improved: string;
  reason: string;
}

export interface AnalysisResult {
  atsScore: number;
  summary: string;
  keywordGaps: KeywordGap[];
  sectionFit: SectionFit[];
  rewriteSuggestions: RewriteSuggestion[];
  inputQuality?: 'good' | 'degraded';
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}
