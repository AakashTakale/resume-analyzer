interface LoadingStateProps {
  warmingUp?: boolean;
}

/* Skeleton placeholders shaped like the results layout */
export default function LoadingState({ warmingUp = false }: LoadingStateProps) {
  if (warmingUp) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 py-24 text-center">
        <WarmUpSpinner />
        <div className="space-y-1.5">
          <p className="text-app-text text-sm font-medium">Waking up the server…</p>
          <p className="text-app-secondary text-xs max-w-xs leading-relaxed">
            The server sleeps when idle. This takes about 30 seconds — hang tight.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8 max-w-3xl">

      {/* ScoreCard skeleton — ring + divider + text */}
      <div
        className="border border-app-border bg-app-surface p-5"
        style={{ borderRadius: '10px' }}
      >
        <div className="flex items-center gap-6">
          {/* Ring */}
          <div className="skeleton flex-shrink-0 rounded-full" style={{ width: 88, height: 88 }} />
          {/* Divider */}
          <div className="flex-shrink-0 self-stretch skeleton" style={{ width: 1 }} />
          {/* Text */}
          <div className="flex-1 space-y-3">
            <div className="skeleton h-5 w-24 rounded-full" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>

      {/* Keyword gaps skeleton — three column cards */}
      <div className="space-y-3">
        <div className="skeleton h-2.5 w-28 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[5, 4, 3].map((count, col) => (
            <div
              key={col}
              className="border border-app-border bg-app-surface p-4 space-y-3"
              style={{ borderRadius: '10px' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="skeleton w-2 h-2 rounded-full flex-shrink-0" />
                  <div className="skeleton h-2.5 w-16 rounded" />
                </div>
                <div className="skeleton h-2.5 w-4 rounded" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: count }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton h-6 rounded-full"
                    style={{ width: `${55 + (i * 19) % 45}px` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section fit skeleton — single card with rows */}
      <div className="space-y-3">
        <div className="skeleton h-2.5 w-24 rounded" />
        <div
          className="border border-app-border bg-app-surface overflow-hidden"
          style={{ borderRadius: '10px' }}
        >
          {[70, 90, 55, 80].map((w, i) => (
            <div
              key={i}
              className="grid items-center gap-4 px-4 py-3"
              style={{
                gridTemplateColumns: '110px 32px 1fr 160px',
                borderBottom: i < 3 ? '1px solid var(--app-inner)' : 'none',
              }}
            >
              <div className="skeleton h-3 rounded" style={{ width: `${w}%` }} />
              <div className="skeleton h-3 w-6 rounded" />
              <div className="skeleton h-0.5 w-full rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Rewrite suggestions skeleton */}
      <div className="space-y-3">
        <div className="skeleton h-2.5 w-36 rounded" />
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="border border-app-border bg-app-surface p-4 space-y-0"
            style={{ borderRadius: '10px' }}
          >
            <div className="flex items-center gap-3">
              <div className="skeleton w-6 h-6 rounded-full flex-shrink-0" />
              <div className="skeleton h-3 flex-1 rounded" />
              <div className="skeleton h-5 w-20 rounded" style={{ borderRadius: '4px' }} />
              <div className="skeleton w-4 h-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WarmUpSpinner() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
      {/* Spinning ring */}
      <svg
        className="absolute inset-0 animate-spin"
        style={{ animationDuration: '1.4s' }}
        viewBox="0 0 48 48"
        fill="none"
      >
        <circle
          cx="24" cy="24" r="20"
          stroke="var(--app-border)"
          strokeWidth="3"
        />
        <path
          d="M24 4 A20 20 0 0 1 44 24"
          stroke="var(--app-secondary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {/* Server dot */}
      <div
        className="rounded-full"
        style={{ width: 8, height: 8, background: 'var(--app-secondary)' }}
      />
    </div>
  );
}
