import express from 'express';
import cors from 'cors';
import { config } from './config';
import { rateLimiter } from './middleware/rateLimiter';
import analyzeRouter from './routes/analysis';

const app = express();

// Render sits behind a reverse proxy — trust the first hop so req.ip
// reflects the real client IP from X-Forwarded-For, not the proxy IP.
// Without this every user shares one rate limit bucket and the limiter breaks.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true });
});

app.use('/api/analyze', rateLimiter, analyzeRouter);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
