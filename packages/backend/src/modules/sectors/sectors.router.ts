import { Router, Request, Response, NextFunction } from 'express';
import { getDb, schema } from '../../db/connection';

const router: ReturnType<typeof Router> = Router();

// GET /api/sectors
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db   = await getDb();
    const data = await db.select().from(schema.sectors).orderBy(schema.sectors.name);
    res.json({ data });
  } catch (err) { next(err); }
});

export default router;