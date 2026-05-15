import express from 'express';
import cors from 'cors';
import { config } from './config';
import { rateLimiter } from './middleware/rateLimiter';
import analyzeRouter from './routes/analysis';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true });
});

app.use('/api/analyze', rateLimiter, analyzeRouter);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
