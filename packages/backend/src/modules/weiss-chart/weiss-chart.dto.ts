import { z } from 'zod';

const dateStringDto = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date format YYYY-MM-DD');

export const weissChartParamsDto = z.object({
  ticker: z.string().trim().min(1).max(20).transform(v => v.toUpperCase()),
});

export const weissChartQueryDto = z.object({
  from:      dateStringDto.optional(),
  to:        dateStringDto.optional(),
  startDate: dateStringDto.optional(),
  endDate:   dateStringDto.optional(),
});

export type WeissChartParamsDto = z.infer<typeof weissChartParamsDto>;
export type WeissChartQueryDto  = z.infer<typeof weissChartQueryDto>;
