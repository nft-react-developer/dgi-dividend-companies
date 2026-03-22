import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { testConnection } from '../../db/connection';

const router: ExpressRouter = Router();

// GET /health  — basic liveness check (no DB)
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status:    'ok',
    service:   'dgi-analyzer-backend',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
  });
});

// GET /health/db  — checks DB connectivity
router.get('/db', async (_req: Request, res: Response) => {
  const ok = await testConnection();

  if (ok) {
    return res.json({
      status:   'ok',
      database: process.env.DATABASE_DB_NAME ?? 'dgi_analyzer',
      host:     process.env.DATABASE_HOST_NAME ?? 'localhost',
      port:     Number(process.env.DB_PORT ?? 3306),
    });
  }

  return res.status(503).json({
    status:  'error',
    message: 'Cannot connect to database',
  });
});

export default router;