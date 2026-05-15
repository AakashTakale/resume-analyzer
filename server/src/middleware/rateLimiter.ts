import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Please wait 30 seconds before analyzing again.' },
});
