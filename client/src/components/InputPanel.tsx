import { useState, useRef, useCallback } from 'react';
import type { ResumeInput } from '../hooks/useAnalysis';

interface InputPanelProps {
  onSubmit: (resume: ResumeInput, jobDescription: string) => Promise<void>;
  loading: boolean;
  initialResumeText?: string;
  initialJdText?: string;
  onCancel?: () => void;
  layout?: 'split' | 'stacked';
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIN_JD_CHARS = 100;
const MIN_RESUME_CHARS = 200;

export default function InputPanel({
  onSubmit,
  loading,
  initialResumeText,
  initialJdText,
  onCancel,
  layout = 'split',
}: InputPanelProps) {
  const [tab, setTab] = useState<'paste' | 'upload'>('paste');
  const [resumeText, setResumeText] = useState(initialResumeText ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState(initialJdText ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string | null {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') return 'Only PDF and DOCX files are supported.';
    if (f.size > MAX_FILE_SIZE) return 'File must be 5MB or smaller.';
    return null;
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f);
    if (err) { setFileError(err); setFile(null); }
    else { setFileError(null); setFile(f); }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const resumeReady = tab === 'paste'
    ? resumeText.trim().length >= MIN_RESUME_CHARS
    : file !== null;

  const canSubmit = resumeReady && jobDescription.trim().length >= MIN_JD_CHARS && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const resume: ResumeInput = tab === 'upload' && file
      ? { mode: 'file', file }
      : { mode: 'text', text: resumeText };
    await onSubmit(resume, jobDescription);
  }

  const minH = layout === 'stacked' ? 'min-h-[160px]' : 'min-h-[260px]';
  const jdMinH = layout === 'stacked' ? 'min-h-[160px]' : 'min-h-[290px]';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={layout === 'stacked' ? 'flex flex-col gap-4' : 'grid grid-cols-2 gap-4'}>

        {/* ── Left / Top: Resume input ────────────────────────── */}
        <div
          className="flex flex-col overflow-hidden border border-app-border bg-app-surface"
          style={{ borderRadius: '10px' }}
        >
          {/* Tabs */}
          <div className="flex border-b border-app-border flex-shrink-0">
            {(['paste', 'upload'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[10px] uppercase tracking-[0.1em] transition-colors duration-150 ${
                  tab === t
                    ? 'text-app-text border-b border-app-accent -mb-px'
                    : 'text-app-secondary hover:text-app-text'
                }`}
              >
                {t === 'paste' ? 'Paste Text' : 'Upload File'}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 flex flex-col">
            {tab === 'paste' ? (
              <>
                <div className="relative flex-1">
                  <textarea
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here…"
                    className={`w-full h-full ${minH} bg-transparent text-app-text placeholder:text-app-muted text-xs leading-relaxed focus:outline-none resize-none`}
                    style={{ fontSize: '12px' }}
                  />
                  {resumeText && (
                    <button
                      type="button"
                      onClick={() => setResumeText('')}
                      className="absolute top-0 right-0 p-1 text-app-muted hover:text-app-secondary transition-colors"
                      aria-label="Clear resume text"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-app-muted mt-2 flex-shrink-0" style={{ fontFamily: '"DM Mono", monospace' }}>
                  {resumeText.trim().length} / {MIN_RESUME_CHARS} chars min
                </p>
              </>
            ) : (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 ${minH} rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors duration-150 ${
                    isDragging
                      ? 'border-app-accent bg-app-surface'
                      : 'border-app-border hover:border-app-secondary'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                  />
                  {file ? (
                    <div className="flex items-center gap-2 px-4 w-full justify-center">
                      <UploadedFileIcon />
                      <span
                        className="text-xs text-app-text truncate"
                        style={{ fontFamily: '"DM Mono", monospace', fontWeight: 400 }}
                      >
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setFile(null); setFileError(null); }}
                        className="flex-shrink-0 p-0.5 text-app-muted hover:text-app-secondary transition-colors"
                        aria-label="Remove file"
                      >
                        <XIcon />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadIcon />
                      <div className="text-center px-4">
                        <p className="text-xs text-app-secondary">
                          Drop PDF or DOCX, or{' '}
                          <span className="text-app-accent">browse</span>
                        </p>
                        <p
                          className="text-[11px] text-app-muted mt-1"
                          style={{ fontFamily: '"DM Mono", monospace' }}
                        >
                          Max 5 MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {fileError && (
                  <p className="text-[11px] mt-2" style={{ color: '#E24B4A' }}>{fileError}</p>
                )}
                <p className="text-[11px] text-app-muted mt-2 leading-relaxed">
                  Complex formatting (columns, tables) may reduce accuracy. Try paste mode if results look off.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Right / Bottom: Job description ────────────────────── */}
        <div
          className="border border-app-border bg-app-surface p-4 flex flex-col"
          style={{ borderRadius: '10px' }}
        >
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <p className="text-[10px] uppercase tracking-[0.1em] text-app-muted">
              Job Description
            </p>
            {jobDescription && (
              <button
                type="button"
                onClick={() => setJobDescription('')}
                className="p-1 text-app-muted hover:text-app-secondary transition-colors"
                aria-label="Clear job description"
              >
                <XIcon />
              </button>
            )}
          </div>
          <div className="relative flex-1">
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              className={`w-full h-full ${jdMinH} bg-transparent text-app-text placeholder:text-app-muted text-xs leading-relaxed focus:outline-none resize-none`}
              style={{ fontSize: '12px' }}
            />
          </div>
          <p className="text-[11px] text-app-muted mt-2 flex-shrink-0" style={{ fontFamily: '"DM Mono", monospace' }}>
            {jobDescription.trim().length} / {MIN_JD_CHARS} chars min
          </p>
        </div>
      </div>

      {/* ── Analyze button ─────────────────────────────────── */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-analyze w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 text-sm"
      >
        {loading ? (
          <>
            <Spinner />
            Analyzing…
          </>
        ) : (
          'Analyze Resume'
        )}
      </button>

      {/* ── Cancel link (reanalyze mode only) ─────────────── */}
      {onCancel && (
        <div className="text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-app-muted hover:text-app-secondary transition-colors duration-150"
            style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}

/* ── Icons ───────────────────────────────────────────────── */

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-app-muted">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function UploadedFileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-accent flex-shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
