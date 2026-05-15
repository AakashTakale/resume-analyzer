# CLAUDE.md — Project Rules

## TypeScript
- No `any`, ever. Always define explicit types.
- All API response shapes must match interfaces in `types/analysis.ts`
- Every React component must have a defined props interface above the component
- Use `type` for object shapes, `interface` for component props

## React
- Functional components only — no class components
- One component per file
- All API and async logic goes in `hooks/` — never inside components directly
- No inline styles — Tailwind classes only
- When generating a component, define its TypeScript interface first

## Backend
- Every async function must have try/catch — no unhandled promise rejections
- Every route returns a consistent shape: `{ success: boolean, data?, error? }`
- Environment variables accessed only through a single `config.ts` — never `process.env` scattered across files
- PDF, DOCX, and text parsing logic lives in `services/` only — never inside route handlers
- If unsure whether logic belongs in frontend or backend — put it in backend

## General
- Never hardcode the model name in multiple places — define it once as a constant in `config.ts`
- Comment all prompt engineering decisions — explain why the prompt is worded the way it is
- Small working steps — each step must work before moving to the next
