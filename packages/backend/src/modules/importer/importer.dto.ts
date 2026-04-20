import { z } from 'zod'

// Query param para el endpoint
export const importParamsDto = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
})

export type ImportParamsDto = z.infer<typeof importParamsDto>

// Lo que devuelve el pipeline
export const importResultDto = z.object({
  ticker: z.string(),
  rowsImported: z.number(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
})

export type ImportResultDto = z.infer<typeof importResultDto>