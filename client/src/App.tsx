import { useState, useEffect, useRef, useCallback } from 'react';
import InputPanel from './components/InputPanel';
import LoadingState from './components/LoadingState';
import ScoreCard from './components/ScoreCard';
import KeywordGaps from './components/KeywordGaps';
import FitBreakdown from './components/FitBreakdown';
import RewriteSuggestions from './components/RewriteSuggestions';
import { useAnalysis, type ResumeInput } from './hooks/useAnalysis';
import { strongMatch } from './mocks/strongMatch';
import { moderateMatch } from './mocks/moderateMatch';
import { weakMatch } from './mocks/weakMatch';
import type { AnalysisResult } from './types/analysis';

type Theme = 'dark' | 'light';
type AppState = 'idle' | 'loading' | 'results' | 'reanalyze';

type LastInput = {
  resumeLabel: string;
  jdCharCount: number;
};

export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
  );
  const [lastInput, setLastInput] = useState<LastInput | null>(null);
  const { loading, error, result, analyze, injectResult } = useAnalysis();

  const [previousRewrites, setPreviousRewrites] = useState<string[]>([]);

  // Accumulate improved bullets from every successful analysis so Claude never repeats a suggestion
  const accumulateRewrites = useCallback((analysisResult: typeof result) => {
    if (!analysisResult) return;
    setPreviousRewrites(prev => [
      ...prev,
      ...analysisResult.rewriteSuggestions.map(r => r.improved),
    ]);
  }, []);

  useEffect(() => {
    if (result) accumulateRewrites(result);
  }, [result, accumulateRewrites]);

  // Reanalyze split-view state
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [splitAnimated, setSplitAnimated] = useState(false);
  const [reanalyzeSnapshot, setReanalyzeSnapshot] = useState<AnalysisResult | null>(null);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);
  const [reanalyzeKey, setReanalyzeKey] = useState(0);
  const [previousResumeText, setPreviousResumeText] = useState('');
  const [previousJdText, setPreviousJdText] = useState('');
  const reanalyzeInProgressRef = useRef(false);

  const appState: AppState = isReanalyzing
    ? 'reanalyze'
    : loading
    ? 'loading'
    : result
    ? 'results'
    : 'idle';

  const reanalyzeLoading = isReanalyzing && loading;

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // When a reanalyze-initiated analysis finishes, exit split view
  useEffect(() => {
    if (!loading && reanalyzeInProgressRef.current) {
      reanalyzeInProgressRef.current = false;
      if (!error && result) {
        setSplitAnimated(false);
        const t = setTimeout(() => {
          setIsReanalyzing(false);
          setReanalyzeSnapshot(null);
          setReanalyzeError(null);
        }, 300);
        return () => clearTimeout(t);
      } else if (error) {
        setReanalyzeError(error);
      }
    }
  }, [loading, error, result]);

  function handleAnalyze(resume: ResumeInput, jobDescription: string): Promise<void> {
    const label = resume.mode === 'file' ? resume.file.name : 'Pasted Text';
    const resumeText = resume.mode === 'text' ? resume.text : '';
    setLastInput({ resumeLabel: label, jdCharCount: jobDescription.trim().length });
    setPreviousResumeText(resumeText);
    setPreviousJdText(jobDescription);
    setPreviousRewrites([]);
    return analyze(resume, jobDescription, []);
  }

  function enterReanalyze() {
    if (!result) return;
    setReanalyzeKey(k => k + 1);
    setReanalyzeSnapshot(result);
    setReanalyzeError(null);
    setSplitAnimated(false);
    setIsReanalyzing(true);
    // Double rAF ensures the DOM has painted before starting the width animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSplitAnimated(true));
    });
  }

  function cancelReanalyze() {
    reanalyzeInProgressRef.current = false;
    setSplitAnimated(false);
    setTimeout(() => {
      setIsReanalyzing(false);
      setReanalyzeSnapshot(null);
      setReanalyzeError(null);
    }, 300);
  }

  function handleReanalyzeSubmit(resume: ResumeInput, jd: string): Promise<void> {
    setReanalyzeError(null);
    const label = resume.mode === 'file' ? resume.file.name : 'Pasted Text';
    const resumeText = resume.mode === 'text' ? resume.text : '';
    setLastInput({ resumeLabel: label, jdCharCount: jd.trim().length });
    setPreviousResumeText(resumeText);
    setPreviousJdText(jd);
    reanalyzeInProgressRef.current = true;
    return analyze(resume, jd, previousRewrites);
  }

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <div className="h-screen overflow-hidden relative bg-app-bg text-app-text font-sans">

      {/* ── Input / Loading layer — idle and loading states ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          opacity: appState === 'idle' || appState === 'loading' ? 1 : 0,
          pointerEvents: appState === 'idle' || appState === 'loading' ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      >
        {/* Top header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 border-b border-app-border bg-app-bg"
          style={{ height: '52px' }}
        >
          <span className="text-sm font-medium tracking-tight text-app-text">ResumeAI</span>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Input panel */}
          <div
            className="overflow-y-auto"
            style={{
              width: appState === 'idle' ? '100%' : '50%',
              opacity: appState === 'loading' ? 0.4 : 1,
              pointerEvents: appState === 'loading' ? 'none' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: appState === 'idle' ? 'center' : 'flex-start',
              padding: appState === 'idle' ? '48px 40px' : '40px 32px',
              transition: 'width 300ms ease, opacity 200ms ease',
            }}
          >
            <div className="w-full max-w-5xl">
              {appState !== 'loading' && (
                <div className="text-center mb-10">
                  <h1
                    className="text-app-text mb-3"
                    style={{ fontSize: '2.4rem', fontWeight: 500, lineHeight: 1.2 }}
                  >
                    Is your resume ATS-ready?
                  </h1>
                  <p className="text-app-secondary text-sm">
                    Paste your resume and a job description. Get a score and targeted fixes in seconds.
                  </p>
                </div>
              )}
              <InputPanel onSubmit={handleAnalyze} loading={loading} />
              {error && (
                <p className="mt-3 text-xs text-center" style={{ color: '#E24B4A' }}>
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Skeleton panel — right half, only during loading */}
          {appState === 'loading' && (
            <div
              className="flex-1 border-l border-app-border overflow-y-auto"
              style={{ padding: '40px 32px' }}
            >
              <LoadingState />
            </div>
          )}
        </div>
      </div>

      {/* ── Results layer — full-width results view ── */}
      <div
        className="absolute inset-0 flex flex-col bg-app-bg"
        style={{
          opacity: appState === 'results' ? 1 : 0,
          pointerEvents: appState === 'results' ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      >
        {/* Thin sticky topbar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 border-b border-app-border bg-app-bg"
          style={{ height: '48px' }}
        >
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <FileIcon />
            <span
              className="text-app-secondary truncate max-w-[200px]"
              style={{ fontSize: '13px', fontWeight: 500, fontFamily: '"DM Mono", monospace' }}
            >
              {lastInput?.resumeLabel ?? 'Pasted Text'}
            </span>
            <Dot />
            <span
              className="whitespace-nowrap"
              style={{ fontSize: '13px', color: 'var(--meta-text)', fontFamily: '"DM Mono", monospace' }}
            >
              {lastInput?.jdCharCount.toLocaleString()} chars
            </span>
            <Dot />
            <span className="whitespace-nowrap" style={{ fontSize: '13px', color: 'var(--meta-text)' }}>Job Description</span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <span className="whitespace-nowrap" style={{ fontSize: '13px', color: 'var(--meta-text)' }}>analyzed just now</span>
            <button
              onClick={enterReanalyze}
              className="btn-reanalyze px-3 py-1 rounded-lg text-xs"
            >
              Re-analyze
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} small />
          </div>
        </div>

        {/* Scrollable results content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-10 px-8 space-y-8">
            {result?.inputQuality === 'degraded' && (
              <div
                className="rounded-lg px-4 py-2 text-xs leading-relaxed"
                style={{ background: '#FAEEDA', color: '#854F0B' }}
              >
                ⚠ Low-quality input detected — results may be less accurate.
              </div>
            )}
            {result && (
              <>
                <ScoreCard result={result} />
                <KeywordGaps gaps={result.keywordGaps} />
                <FitBreakdown sections={result.sectionFit} />
                <RewriteSuggestions suggestions={result.rewriteSuggestions} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Reanalyze split-view layer ── */}
      <div
        className="absolute inset-0 flex flex-col bg-app-bg"
        style={{
          opacity: appState === 'reanalyze' ? 1 : 0,
          pointerEvents: appState === 'reanalyze' ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      >
        {/* Topbar — no Re-analyze button */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 border-b border-app-border bg-app-bg"
          style={{ height: '48px' }}
        >
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <FileIcon />
            <span
              className="text-app-secondary truncate max-w-[200px]"
              style={{ fontSize: '13px', fontWeight: 500, fontFamily: '"DM Mono", monospace' }}
            >
              {lastInput?.resumeLabel ?? 'Pasted Text'}
            </span>
            <Dot />
            <span
              className="whitespace-nowrap"
              style={{ fontSize: '13px', color: 'var(--meta-text)', fontFamily: '"DM Mono", monospace' }}
            >
              {lastInput?.jdCharCount.toLocaleString()} chars
            </span>
            <Dot />
            <span className="whitespace-nowrap" style={{ fontSize: '13px', color: 'var(--meta-text)' }}>Job Description</span>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} small />
        </div>

        {/* Split panels */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left panel — 40%, slides in from 0 */}
          <div
            style={{
              width: splitAnimated ? '40%' : '0%',
              flexShrink: 0,
              overflow: 'hidden',
              transition: 'width 300ms ease',
              opacity: reanalyzeLoading ? 0.4 : 1,
              pointerEvents: reanalyzeLoading ? 'none' : 'auto',
            }}
          >
            {/* Inner container fixed at 40vw so content doesn't squish during animation */}
            <div
              className="overflow-y-auto"
              style={{ width: '40vw', height: '100%', padding: '32px 28px' }}
            >
              <InputPanel
                key={reanalyzeKey}
                onSubmit={handleReanalyzeSubmit}
                loading={reanalyzeLoading}
                initialResumeText={previousResumeText}
                initialJdText={previousJdText}
                onCancel={cancelReanalyze}
                layout="stacked"
              />
              {reanalyzeError && (
                <p className="mt-3 text-xs text-center" style={{ color: '#E24B4A' }}>
                  {reanalyzeError}
                </p>
              )}
            </div>
          </div>

          {/* Right panel — remaining width, read-only results */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ borderLeft: '1px solid var(--app-border)' }}
          >
            {/* "Current results" label */}
            <div style={{ padding: '20px 32px 0' }}>
              <p
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--app-muted)',
                }}
              >
                Current results
              </p>
            </div>

            {reanalyzeLoading ? (
              <div style={{ padding: '24px 32px' }}>
                <LoadingState />
              </div>
            ) : reanalyzeSnapshot && (
              <div className="py-8 px-8 space-y-8">
                {reanalyzeSnapshot.inputQuality === 'degraded' && (
                  <div
                    className="rounded-lg px-4 py-2 text-xs leading-relaxed"
                    style={{ background: '#FAEEDA', color: '#854F0B' }}
                  >
                    ⚠ Low-quality input detected — results may be less accurate.
                  </div>
                )}
                <ScoreCard result={reanalyzeSnapshot} />
                <KeywordGaps gaps={reanalyzeSnapshot.keywordGaps} />
                <FitBreakdown sections={reanalyzeSnapshot.sectionFit} />
                <RewriteSuggestions suggestions={reanalyzeSnapshot.rewriteSuggestions} />
              </div>
            )}
          </div>
        </div>
      </div>

      {import.meta.env.DEV && (
        <MockSwitcher onLoad={injectResult} />
      )}
    </div>
  );
}

/* ── Shared sub-components ───────────────────────────────── */

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  small?: boolean;
}

function ThemeToggle({ theme, onToggle, small }: ThemeToggleProps) {
  const size = small ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <button
      onClick={onToggle}
      className={`${size} rounded-lg flex items-center justify-center text-app-secondary hover:text-app-text transition-colors duration-150`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function Dot() {
  return <span className="text-app-muted text-xs flex-shrink-0">·</span>;
}

function FileIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-app-secondary flex-shrink-0"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

interface MockSwitcherProps {
  onLoad: (result: AnalysisResult) => void;
}

function MockSwitcher({ onLoad }: MockSwitcherProps) {
  const mocks: { label: string; data: AnalysisResult }[] = [
    { label: 'Strong', data: strongMatch },
    { label: 'Moderate', data: moderateMatch },
    { label: 'Weak', data: weakMatch },
  ];

  return (
    <div className="fixed bottom-4 left-4 flex gap-1.5 z-50">
      {mocks.map(({ label, data }) => (
        <button
          key={label}
          onClick={() => onLoad(data)}
          className="px-2.5 py-1 rounded-md text-[10px] font-medium border border-app-border bg-app-surface text-app-secondary hover:text-app-text hover:bg-app-inner transition-colors duration-150"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
