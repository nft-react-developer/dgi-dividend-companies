import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { getDb, closeDb } from './db/connection';
import { errorHandler } from './shared/errors/error-handler';
import healthRouter from './modules/health/health.router';

const app  = express();
const PORT = Number(process.env.API_PORT ?? 3000);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);

// TODO: register module routers here as you build them
// app.use('/api/companies', companiesRouter);
// app.use('/api/importer',  importerRouter);
// app.use('/api/mapper',    mapperRouter);
// app.use('/api/ratios',    ratiosRouter);
// app.use('/api/portfolio', portfolioRouter);
// app.use('/api/dividends', dividendsRouter);

// ── Error handler (always last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ───────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    // Init DB pool on startup
    await getDb();
    console.log('✅ Database pool initialized');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(`   GET http://localhost:${PORT}/health`);
      console.log(`   GET http://localhost:${PORT}/health/db`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received — shutting down gracefully`);
      server.close(async () => {
        await closeDb();
        console.log('💤 Server and DB pool closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();