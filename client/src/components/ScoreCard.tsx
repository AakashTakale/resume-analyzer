import { useState, useEffect, useRef } from 'react';
import type { AnalysisResult } from '../types/analysis';

interface ScoreCardProps {
  result: AnalysisResult;
}

interface ScoreRingProps {
  score: number;
}

// Ring geometry: 88×88 SVG, stroke-width 6, radius = (88/2) - (6/2) = 41
const R = 41;
const CIRCUMFERENCE = 2 * Math.PI * R; // ≈ 257.6

function scoreColor(score: number): string {
  if (score >= 75) return '#639922';
  if (score >= 50) return '#EF9F27';
  return '#E24B4A';
}

function badgeColors(score: number): { bg: string; text: string } {
  if (score >= 80) return { bg: '#EAF3DE', text: '#3B6D11' };
  if (score >= 60) return { bg: '#FAEEDA', text: '#854F0B' };
  return { bg: '#FCEBEB', text: '#A32D2D' };
}

function badgeLabel(score: number): string {
  if (score >= 80) return 'Likely to be shortlisted';
  if (score >= 60) return 'May get shortlisted';
  return 'Unlikely to be shortlisted';
}

function ScoreRing({ score }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [strokeOffset, setStrokeOffset] = useState(CIRCUMFERENCE);
  const rafRef = useRef<number>(0);
  const color = scoreColor(score);

  useEffect(() => {
    const targetOffset = CIRCUMFERENCE * (1 - score / 100);
    const duration = 600;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setStrokeOffset(CIRCUMFERENCE - (CIRCUMFERENCE - targetOffset) * eased);
      setDisplayScore(Math.round(score * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  return (
    <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        {/* Track */}
        <circle
          cx="44"
          cy="44"
          r={R}
          fill="none"
          stroke="var(--app-border)"
          strokeWidth="6"
        />
        {/* Arc — starts from top */}
        <circle
          cx="44"
          cy="44"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '44px 44px', transition: 'stroke 300ms ease' }}
        />
      </svg>
      {/* Centered text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="tabular-nums leading-none"
          style={{ fontSize: '32px', fontWeight: 500, color }}
        >
          {displayScore}
        </span>
        <span
          className="uppercase tracking-[0.1em] text-app-secondary"
          style={{ fontSize: '9px', marginTop: '3px' }}
        >
          ATS Score
        </span>
      </div>
    </div>
  );
}

export default function ScoreCard({ result }: ScoreCardProps) {
  const badge = badgeColors(result.atsScore);

  return (
    <section>
      <div
        className="border border-app-border bg-app-surface"
        style={{ borderRadius: '10px', overflow: 'hidden' }}
      >
        <div className="flex items-center gap-0">
          {/* Ring side */}
          <div className="flex items-center justify-center p-5 flex-shrink-0">
            <ScoreRing score={result.atsScore} />
          </div>

          {/* Vertical divider */}
          <div className="self-stretch flex-shrink-0" style={{ width: '1px', background: 'var(--app-border)' }} />

          {/* Content side */}
          <div className="flex-1 px-5 py-4 space-y-2">
            {/* Match badge */}
            <span
              className="inline-block text-[10px] uppercase tracking-[0.08em] px-2.5 py-0.5"
              style={{
                background: badge.bg,
                color: badge.text,
                borderRadius: '999px',
                fontWeight: 500,
              }}
            >
              {badgeLabel(result.atsScore)}
            </span>
            {/* Summary */}
            <p
              className="text-app-secondary"
              style={{ fontSize: '13px', lineHeight: 1.6 }}
            >
              {result.summary}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
