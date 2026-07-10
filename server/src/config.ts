import dotenv from 'dotenv';

dotenv.config();

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  // Single source of truth for model name — never reference it elsewhere
  model: 'claude-sonnet-4-6',
  // Realistic output ceiling: ~1,400 tokens. 2,500 gives ~80% buffer.
  // If responses are getting truncated, increase to 2,500 — not higher.
  maxTokens: 2500,
  port: parseInt(process.env.PORT ?? '3001', 10),
  // 4,000 words covers 95%+ of real resumes and JDs.
  // Reduces input token cost without impacting real-world usage.
  maxInputWords: 4000,
  maxResumeWords: 2500,
  maxJobDescWords: 1500,
  // 2 requests per IP per 30 minutes
  rateLimitWindowMs: 30 * 60 * 1000,
  rateLimitMax: 2,
};
