import express from 'express';
import cors from 'cors';
import { createAppDeps } from './composition';
import { createSearchRouter } from './routes/search';
import { createReportRouter } from './routes/report';
import { createCompareRouter } from './routes/compare';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  const deps = createAppDeps();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/search', createSearchRouter(deps));
  app.use('/api/report', createReportRouter(deps));
  app.use('/api/compare', createCompareRouter(deps));

  app.use(errorHandler);

  return { app, deps };
}
