import { useState } from 'react';
import type { RewriteSuggestion } from '../types/analysis';

interface RewriteSuggestionsProps {
  suggestions: RewriteSuggestion[];
}

interface CardProps {
  suggestion: RewriteSuggestion;
  index: number;
}

function truncate(text: string, max = 52): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

function Card({ suggestion, index }: CardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(suggestion.improved);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — silently ignore
    }
  }

  return (
    <div
      className="border border-app-border bg-app-surface overflow-hidden"
      style={{ borderRadius: '10px' }}
    >
      {/* ── Card header — always visible ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-app-inner transition-colors duration-150"
      >
        {/* Numbered circle */}
        <span
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[10px] tabular-nums"
          style={{
            background: 'var(--app-inner)',
            color: 'var(--app-secondary)',
          }}
        >
          {index + 1}
        </span>

        {/* Title: "Rewrite · [truncated original]" */}
        <span className="flex-1 text-app-secondary truncate min-w-0" style={{ fontSize: '13px', fontWeight: 500 }}>
          <span className="text-app-text">Rewrite</span>
          {' · '}
          {truncate(suggestion.original)}
        </span>

        {/* Critical impact badge */}
        <span
          className="flex-shrink-0 text-[10px] px-2 py-0.5 whitespace-nowrap"
          style={{
            background: '#FCEBEB',
            color: '#A32D2D',
            borderRadius: '4px',
          }}
        >
          Critical impact
        </span>

        {/* Chevron */}
        <ChevronIcon open={open} />
      </button>

      {/* ── Expandable body ── */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: open ? '600px' : '0',
          transition: 'max-height 300ms ease',
        }}
      >
        <div className="border-t border-app-border">
          {/* Two-column content — stacks on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Left — Original */}
            <div className="p-4 border-r border-app-border">
              <p
                className="uppercase tracking-[0.1em] text-app-muted mb-2"
                style={{ fontSize: '10px' }}
              >
                Original
              </p>
              <p
                className="leading-relaxed line-through"
                style={{ fontSize: '13px', color: 'var(--original-text)' }}
              >
                {suggestion.original}
              </p>
            </div>

            {/* Right — Improved */}
            <div
              className="p-4 relative"
              style={{ background: 'var(--improved-bg, #0D1A0D)' }}
            >
              {/* Copy button */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleCopy(); }}
                className="absolute top-3 right-3 flex items-center justify-center transition-colors duration-150"
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'var(--app-inner)',
                  color: 'var(--app-secondary)',
                }}
                aria-label="Copy improved text"
                title="Copy"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>

              <p
                className="uppercase tracking-[0.1em] mb-2"
                style={{ fontSize: '10px', color: '#639922' }}
              >
                Improved
              </p>
              <p
                className="leading-relaxed"
                style={{ fontSize: '13px', color: 'var(--improved-text, #86C35A)' }}
              >
                {suggestion.improved}
              </p>
            </div>
          </div>

          {/* Why row */}
          <div
            className="px-4 py-3 border-t border-app-border"
            style={{ background: 'var(--why-bg, #0D0D0D)' }}
          >
            <p className="leading-relaxed" style={{ fontSize: '12px', color: 'var(--why-text)' }}>
              <span className="font-medium text-app-text">Why: </span>
              {suggestion.reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-app-muted flex-shrink-0"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 200ms ease',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#639922' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function RewriteSuggestions({ suggestions }: RewriteSuggestionsProps) {
  return (
    <section>
      <h2
        className="uppercase tracking-[0.1em] mb-3"
        style={{ fontSize: '10px', color: 'var(--heading-text)' }}
      >
        Rewrite Suggestions
      </h2>
      {suggestions.length === 0 ? (
        <p
          className="text-center dark:text-[#888888] text-[#6B7280]"
          style={{ fontSize: '13px', padding: '20px' }}
        >
          Your bullets are well-optimized for this role. No rewrites needed.
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <Card key={i} suggestion={s} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
