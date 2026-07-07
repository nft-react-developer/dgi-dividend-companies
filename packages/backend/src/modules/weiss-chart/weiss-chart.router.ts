import { Router, Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter } from 'express';
import { AppError } from '../../shared/errors/error-handler';
import { weissChartParamsDto, weissChartQueryDto } from './weiss-chart.dto';
import * as service from './weiss-chart.service';

const router: ExpressRouter = Router();

// GET /api/weiss-chart/:ticker?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/:ticker', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedParams = weissChartParamsDto.safeParse(req.params);
    if (!parsedParams.success) throw new AppError(400, parsedParams.error.issues[0]?.message ?? 'Invalid ticker');

    const parsedQuery = weissChartQueryDto.safeParse(req.query);
    if (!parsedQuery.success) throw new AppError(400, parsedQuery.error.issues[0]?.message ?? 'Invalid query');

    const data = await service.getWeissChartData(parsedParams.data.ticker, parsedQuery.data);
    res.json({ data });
  } catch (err) { next(err); }
});

export default router;
