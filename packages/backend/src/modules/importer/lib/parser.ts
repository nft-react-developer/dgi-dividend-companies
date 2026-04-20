import * as XLSX from 'xlsx'
import type { TickerMapping } from '../types/mapping.types'

export function parseWorkbook(
  buffer: Buffer,
  mapping: TickerMapping
): Record<string, Record<string, any>[]> {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const result: Record<string, Record<string, any>[]> = {}

  for (const [section, config] of Object.entries(mapping.sheets)) {
    const ws = wb.Sheets[wb.SheetNames[config.sheetIndex]]
    if (!ws) throw new Error(`Sheet index ${config.sheetIndex} not found for section ${section}`)
    result[section] = XLSX.utils.sheet_to_json(ws, { header: 'A', defval: null })
  }

  return result
}