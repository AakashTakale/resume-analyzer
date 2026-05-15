import type { KeywordGap } from '../types/analysis';

interface KeywordGapsProps {
  gaps: KeywordGap[];
}

interface ChipProps {
  gap: KeywordGap;
  tier: KeywordGap['importance'];
}

type TierConfig = {
  label: string;
  dotColor: string;
  labelColor: string;
  chipBg: string;
  chipText: string;
  chipBgLight: string;
  chipTextLight: string;
  pillBg: string;
  pillText: string;
};

const TIERS: KeywordGap['importance'][] = ['critical', 'important'];

const TIER_CONFIG: Record<KeywordGap['importance'], TierConfig> = {
  critical: {
    label: 'Critical',
    dotColor: '#E24B4A',
    labelColor: '#A32D2D',
    chipBg: '#FCEBEB',
    chipText: '#A32D2D',
    chipBgLight: '#FCEBEB',
    chipTextLight: '#A32D2D',
    pillBg: 'var(--pill-critical-bg)',
    pillText: 'var(--pill-critical-text)',
  },
  important: {
    label: 'Important',
    dotColor: '#EF9F27',
    labelColor: '#854F0B',
    chipBg: '#FAEEDA',
    chipText: '#854F0B',
    chipBgLight: '#FAEEDA',
    chipTextLight: '#854F0B',
    pillBg: 'var(--pill-important-bg)',
    pillText: 'var(--pill-important-text)',
  },
  'nice-to-have': {
    label: 'Nice to Have',
    dotColor: 'var(--dot-nice)',
    labelColor: 'var(--label-nice)',
    chipBg: 'var(--chip-nice-bg)',
    chipText: 'var(--chip-nice-text)',
    chipBgLight: 'var(--chip-nice-bg)',
    chipTextLight: 'var(--chip-nice-text)',
    pillBg: 'var(--chip-nice-bg)',
    pillText: 'var(--chip-nice-text)',
  },
};

function Chip({ gap, tier }: ChipProps) {
  const cfg = TIER_CONFIG[tier];

  return (
    <div className="relative group">
      {/* Chip */}
      <span
        className="inline-block px-2.5 py-1 text-[12px] cursor-default select-none"
        style={{
          borderRadius: '999px',
          background: cfg.chipBg,
          color: cfg.chipText,
          fontWeight: 500,
        }}
      >
        {gap.keyword}
      </span>

      {/* Tooltip — pure CSS via group-hover */}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
          w-56 p-3 border border-app-border bg-app-surface
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150"
        style={{ borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
      >
        <p className="text-[10px] uppercase tracking-[0.08em] text-app-secondary mb-1">Context</p>
        <p className="text-[11px] text-app-secondary leading-relaxed">&ldquo;{gap.context}&rdquo;</p>
        {/* Caret */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid var(--app-border)',
          }}
        />
      </div>
    </div>
  );
}

export default function KeywordGaps({ gaps }: KeywordGapsProps) {
  if (gaps.length === 0) return null;

  return (
    <section>
      <h2
        className="uppercase tracking-[0.1em] mb-3"
        style={{ fontSize: '10px', color: 'var(--heading-text)' }}
      >
        Keyword Gaps
      </h2>

      {/* Two equal columns */}
      <div className="grid grid-cols-2 gap-3">
        {TIERS.map(tier => {
          const items = gaps.filter(g => g.importance === tier);
          const cfg = TIER_CONFIG[tier];
          return (
            <div
              key={tier}
              className="border border-app-border bg-app-surface p-4"
              style={{ borderRadius: '10px' }}
            >
              {/* Column header */}
              <div className="flex items-center mb-3">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mr-2"
                  style={{ background: cfg.dotColor }}
                />
                <span
                  className="text-[10px] uppercase tracking-[0.08em]"
                  style={{ color: cfg.labelColor }}
                >
                  {cfg.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '1px 7px',
                    borderRadius: '999px',
                    marginLeft: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: cfg.pillBg,
                    color: cfg.pillText,
                  }}
                >
                  {items.length}
                </span>
              </div>

              {/* Chips */}
              {items.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {items.map(gap => (
                    <Chip key={gap.keyword} gap={gap} tier={tier} />
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-app-muted">None found</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
