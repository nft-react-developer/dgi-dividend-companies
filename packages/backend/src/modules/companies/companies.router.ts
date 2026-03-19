import { Router, Request, Response, NextFunction } from 'express';
import * as service from './companies.service';
import {
  createCompanyDto,
  updateCompanyDto,
  companyParamsDto,
  companyQueryDto,
} from './companies.dto';

const router = Router();

// GET /api/companies
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = companyQueryDto.parse(req.query);
    const data  = await service.getCompanies(query);
    res.json({ data, count: data.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = companyParamsDto.parse(req.params);
    const data   = await service.getCompanyById(id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createCompanyDto.parse(req.body);
    const data = await service.createCompany(body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/companies/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = companyParamsDto.parse(req.params);
    const body   = updateCompanyDto.parse(req.body);
    const data   = await service.updateCompany(id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/companies/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = companyParamsDto.parse(req.params);
    await service.deleteCompany(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;