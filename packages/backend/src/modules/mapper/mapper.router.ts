import { Router, Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter }            from 'express';
import * as service from './mapper.service';
import {
  createMapperDto, updateMapperDto,
  mapperParamsDto, mapperQueryDto,
} from './mapper.dto';

const router: ExpressRouter = Router();

// GET /api/mapper
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = mapperQueryDto.parse(req.query);
    const data  = await service.getMappers(query);
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

// GET /api/mapper/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = mapperParamsDto.parse(req.params);
    const data   = await service.getMapperById(id);
    res.json({ data });
  } catch (err) { next(err); }
});

// POST /api/mapper
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createMapperDto.parse(req.body);
    const data = await service.createMapper(body);
    res.status(201).json({ data });
  } catch (err) { next(err); }
});

// PATCH /api/mapper/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = mapperParamsDto.parse(req.params);
    const body   = updateMapperDto.parse(req.body);
    const data   = await service.updateMapper(id, body);
    res.json({ data });
  } catch (err) { next(err); }
});

// DELETE /api/mapper/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = mapperParamsDto.parse(req.params);
    await service.deleteMapper(id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
