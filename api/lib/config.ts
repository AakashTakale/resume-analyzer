// Env vars are injected by Vercel at runtime — no dotenv needed in serverless context
export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  // Single source of truth for model name — never reference it elsewhere
  model: 'claude-sonnet-4-6',
  maxTokens: 2500,
  maxInputWords: 4000,
  maxResumeWords: 2500,
  maxJobDescWords: 1500,
};
