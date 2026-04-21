import { Router, Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter } from 'express';
import { z } from 'zod';
import * as repo from './financial-data.repository';

const router: ExpressRouter = Router();
const paramsDto = z.object({ companyId: z.coerce.number().int().positive() });

// GET /api/financial-data/:companyId
router.get('/:companyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = paramsDto.parse(req.params);
    const data = await repo.getFinancialData(companyId);
    res.json({ data });
  } catch (err) { next(err); }
});

export default router;
