import type { SectionFit } from '../types/analysis';

interface FitBreakdownProps {
  sections: SectionFit[];
}

interface RowProps {
  section: SectionFit;
  isLast: boolean;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#639922';
  if (score >= 50) return '#EF9F27';
  return '#E24B4A';
}

function Row({ section, isLast }: RowProps) {
  const color = scoreColor(section.score);

  return (
    <div
      className={!isLast ? 'border-b border-[#F3F4F6] dark:border-[#1A1A1E]' : ''}
      style={{
        padding: '12px 16px 0',
        marginBottom: isLast ? undefined : '4px',
        ...(!isLast ? { borderBottomWidth: '0.5px' } : {}),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          className="text-app-text truncate"
          style={{ width: '140px', fontSize: '14px', fontWeight: 500, flexShrink: 0 }}
        >
          {section.section}
        </span>
        <span
          style={{ width: '36px', fontSize: '14px', fontWeight: 500, color, flexShrink: 0 }}
        >
          {section.score}
        </span>
        <div
          style={{ flex: 1, height: '3px', background: 'var(--bar-track)', borderRadius: '999px', overflow: 'hidden' }}
        >
          <div
            style={{ height: '100%', width: `${section.score}%`, background: color, borderRadius: '999px' }}
          />
        </div>
      </div>
      <div
        className="leading-relaxed dark:text-[#AAAAAA] text-[#4B5563]"
        style={{ paddingLeft: '176px', fontSize: '12px', marginTop: '4px', marginBottom: '12px' }}
      >
        {section.feedback}
      </div>
    </div>
  );
}

export default function FitBreakdown({ sections }: FitBreakdownProps) {
  if (sections.length === 0) return null;

  return (
    <section>
      <h2
        className="uppercase tracking-[0.1em] mb-3"
        style={{ fontSize: '10px', color: 'var(--heading-text)' }}
      >
        Section Fit
      </h2>

      <div
        className="border border-app-border bg-app-surface overflow-hidden"
        style={{ borderRadius: '10px' }}
      >
        {sections.map((s, i) => (
          <Row
            key={s.section}
            section={s}
            isLast={i === sections.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
