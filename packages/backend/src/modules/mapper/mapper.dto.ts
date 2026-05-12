import { z } from 'zod';

const statementTypeEnum = z.enum(['income_statement', 'balance_sheet', 'cash_flow', 'dividends']);
const transformEnum     = z.enum(['none', 'negate', 'abs', 'thousands', 'millions', 'pct_to_decimal']);

export const createMapperDto = z.object({
  companyId:      z.number().int().positive().nullable().optional(),
  statementType:  statementTypeEnum,
  rawLabel:       z.string().min(1).max(255),
  canonicalField: z.string().min(1).max(100),
  targetTable:    z.string().min(1).max(50),
  targetColumn:   z.string().min(1).max(100),
  transform:      transformEnum.default('none'),
  priority:       z.number().int().min(0).max(127).default(10),
  isActive:       z.boolean().default(true),
  notes:          z.string().max(255).optional(),
});

export const updateMapperDto = createMapperDto.partial();

export const mapperParamsDto = z.object({
  id: z.coerce.number().int().positive(),
});

export const mapperQueryDto = z.object({
  companyId:     z.coerce.number().int().positive().optional(),
  statementType: statementTypeEnum.optional(),
  isActive:      z.coerce.boolean().optional(),
  search:        z.string().optional(),
  limit:         z.coerce.number().int().min(1).max(200).default(100),
  offset:        z.coerce.number().int().min(0).default(0),
});

export type CreateMapperDto = z.infer<typeof createMapperDto>;
export type UpdateMapperDto = z.infer<typeof updateMapperDto>;
export type MapperParamsDto = z.infer<typeof mapperParamsDto>;
export type MapperQueryDto  = z.infer<typeof mapperQueryDto>;
