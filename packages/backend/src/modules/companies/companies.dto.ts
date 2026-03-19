import { z } from 'zod';

export const createCompanyDto = z.object({
  ticker:        z.string().min(1).max(12).toUpperCase(),
  isin:          z.string().length(12).optional(),
  name:          z.string().min(1).max(150),
  sectorId:      z.number().int().positive(),
  industry:      z.string().max(100).optional(),
  countryIso:    z.string().length(2).toUpperCase(),
  currency:      z.string().length(3).toUpperCase(),
  exchange:      z.string().max(20).optional(),
  fiscalYearEnd: z.number().int().min(1).max(12).default(12),
  isActive:      z.boolean().default(true),
});

export const updateCompanyDto = createCompanyDto.partial();

export const companyParamsDto = z.object({
  id: z.coerce.number().int().positive(),
});

export const companyQueryDto = z.object({
  sector:   z.string().optional(),
  country:  z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(100).default(50),
  offset:   z.coerce.number().int().min(0).default(0),
});

export type CreateCompanyDto  = z.infer<typeof createCompanyDto>;
export type UpdateCompanyDto  = z.infer<typeof updateCompanyDto>;
export type CompanyParamsDto  = z.infer<typeof companyParamsDto>;
export type CompanyQueryDto   = z.infer<typeof companyQueryDto>;