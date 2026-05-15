type LastInput = {
  resumeLabel: string;
  jdCharCount: number;
};

interface InputSidebarProps {
  lastInput: LastInput | null;
  onReset: () => void;
  error: string | null;
}

export default function InputSidebar({ lastInput, onReset, error }: InputSidebarProps) {
  return (
    <div className="p-6 h-full flex flex-col gap-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-app-muted mb-3">
          Analyzed Input
        </p>
        {lastInput && (
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <FileIcon />
              <span className="text-sm text-app-text font-medium leading-snug break-all">
                {lastInput.resumeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <DocIcon />
              <span className="text-xs text-app-muted">
                {lastInput.jdCharCount.toLocaleString()} chars · Job Description
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg p-3 leading-relaxed">
          {error}
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-lg border border-app-border text-sm font-medium text-app-text hover:bg-app-border transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Re-analyze
        </button>
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-muted flex-shrink-0 mt-0.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-muted flex-shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
