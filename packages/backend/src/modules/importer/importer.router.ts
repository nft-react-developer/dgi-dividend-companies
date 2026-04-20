import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import type { Router as ExpressRouter } from 'express'
import * as service from './importer.service'
import { importParamsDto } from './importer.dto'

const router: ExpressRouter = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'text/csv',
    ]
    cb(null, allowed.includes(file.mimetype))
  },
})

// POST /api/importer/:ticker
router.post(
  '/:ticker',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ticker } = importParamsDto.parse(req.params)
      if (!req.file) throw new Error('No file uploaded')
      const result = await service.importFinancials(ticker, req.file.buffer)
      res.status(201).json({ data: result })
    } catch (err) {
      next(err)
    }
  }
)

export default router