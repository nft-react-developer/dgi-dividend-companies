import path from 'path'
import fs from 'fs/promises'
import type { TickerMapping } from '../types/mapping.types'

const MAPPINGS_DIR = path.join(__dirname, '..', 'mappings')

export async function loadMapping(ticker: string): Promise<TickerMapping | null> {
  const file = path.join(MAPPINGS_DIR, `${ticker.toUpperCase()}.json`)
  try {
    const content = await fs.readFile(file, 'utf-8')
    console.log(JSON.parse(content))
    return JSON.parse(content) as TickerMapping
  } catch {
    return null
  }
}

