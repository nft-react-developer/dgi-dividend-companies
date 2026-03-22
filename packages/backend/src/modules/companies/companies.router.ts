import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import type { Router as ExpressRouter } from 'express';
import * as service from './companies.service';
import {
  createCompanyDto, updateCompanyDto,
  companyParamsDto, companyQueryDto,
} from './companies.dto';

const router: ExpressRouter  = Router();
const upload  = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// GET /api/companies
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = companyQueryDto.parse(req.query);
    const data  = await service.getCompanies(query);
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

// GET /api/companies/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = companyParamsDto.parse(req.params);
    const data   = await service.getCompanyById(id);
    res.json({ data });
  } catch (err) { next(err); }
});

// GET /api/companies/:id/logo
router.get('/:id/logo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = companyParamsDto.parse(req.params);
    const logo   = await service.getCompanyLogo(id);

    res.setHeader('Content-Type',  logo.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(logo.data);
  } catch (err) { next(err); }
});

// POST /api/companies
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createCompanyDto.parse(req.body);
    const data = await service.createCompany(body);
    res.status(201).json({ data });
  } catch (err) { next(err); }
});

// PUT /api/companies/:id/logo
router.put('/:id/logo', upload.single('logo'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = companyParamsDto.parse(req.params);
    if (!req.file) throw new Error('No file uploaded');
    await service.uploadCompanyLogo(id, req.file.buffer, req.file.mimetype);
    res.json({ status: 'ok' });
  } catch (err) { next(err); }
});

// PATCH /api/companies/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = companyParamsDto.parse(req.params);
    const body   = updateCompanyDto.parse(req.body);
    const data   = await service.updateCompany(id, body);
    res.json({ data });
  } catch (err) { next(err); }
});

// DELETE /api/companies/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = companyParamsDto.parse(req.params);
    await service.deleteCompany(id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;