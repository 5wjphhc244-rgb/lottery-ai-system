import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import { initDatabase } from './utils/db';
import { startSyncService } from './services/syncService';
import { seedRealData } from './data/seedReal';

import lotteryRoutes from './routes/lottery';
import toolsRoutes from './routes/tools';
import aiRoutes from './routes/ai';
import rulesRoutes from './routes/rules';
import adsRoutes from './routes/ads';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database (non-blocking, won't crash on missing DB)
initDatabase()
  .then(() => seedRealData())
  .catch((err) => {
    console.warn('⚠️  Database initialization skipped:', err.message);
  });

// API Routes
app.use('/api/lottery', lotteryRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/ads', adsRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // 启动定期数据同步服务
  startSyncService();
});

export default app;
