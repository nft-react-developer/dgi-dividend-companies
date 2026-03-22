import { eq, like, and, SQL } from 'drizzle-orm';
import { getDb, schema }      from '../../db/connection';
import type { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto } from './companies.dto';

// Select sin el blob para los listados normales
const companySelect = {
  id:            schema.companies.id,
  ticker:        schema.companies.ticker,
  isin:          schema.companies.isin,
  name:          schema.companies.name,
  industry:      schema.companies.industry,
  countryIso:    schema.companies.countryIso,
  currency:      schema.companies.currency,
  exchange:      schema.companies.exchange,
  hasLogo:       schema.companies.logoMimeType, // null si no tiene logo
  fiscalYearEnd: schema.companies.fiscalYearEnd,
  isActive:      schema.companies.isActive,
  createdAt:     schema.companies.createdAt,
  sectorId:      schema.companies.sectorId,
  sectorCode:    schema.sectors.code,
  sectorName:    schema.sectors.name,
};

export async function findAllCompanies(query: CompanyQueryDto) {
  const db      = await getDb();
  const filters: SQL[] = [];

  if (query.isActive !== undefined) filters.push(eq(schema.companies.isActive, query.isActive));
  if (query.country)  filters.push(eq(schema.companies.countryIso, query.country.toUpperCase()));
  if (query.search)   filters.push(like(schema.companies.name, `%${query.search}%`));

  if (!db) throw new Error('Database connection not available');
  return db
    .select(companySelect)
    .from(schema.companies)
    .leftJoin(schema.sectors, eq(schema.companies.sectorId, schema.sectors.id))
    .where(filters.length ? and(...filters) : undefined)
    .limit(query.limit)
    .offset(query.offset);
}

export async function findCompanyById(id: number) {
  const db   = await getDb();
  if (!db) throw new Error('Database connection not available');
  const rows = await db
    .select({ ...companySelect, updatedAt: schema.companies.updatedAt })
    .from(schema.companies)
    .leftJoin(schema.sectors, eq(schema.companies.sectorId, schema.sectors.id))
    .where(eq(schema.companies.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findCompanyByTicker(ticker: string) {
  const db   = await getDb();
  if (!db) throw new Error('Database connection not available');
  const rows = await db
    .select({ id: schema.companies.id, ticker: schema.companies.ticker })
    .from(schema.companies)
    .where(eq(schema.companies.ticker, ticker.toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function findCompanyLogo(id: number) {
  const db   = await getDb();
  if (!db) throw new Error('Database connection not available');
  const rows = await db
    .select({
      data:     schema.companies.logo,
      mimeType: schema.companies.logoMimeType,
    })
    .from(schema.companies)
    .where(eq(schema.companies.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createCompany(data: CreateCompanyDto) {
  const db         = await getDb();
  if (!db) throw new Error('Database connection not available');
  const [result]   = await db.insert(schema.companies).values(data);
  return findCompanyById(result.insertId);
}

export async function updateCompany(id: number, data: UpdateCompanyDto) {
  const db = await getDb();
  if (!db) throw new Error('Database connection not available');
  await db.update(schema.companies).set(data).where(eq(schema.companies.id, id));
  return findCompanyById(id);
}

export async function updateCompanyLogo(id: number, buffer: Buffer, mimeType: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection not available');
  await db
    .update(schema.companies)
    .set({ logo: buffer, logoMimeType: mimeType })
    .where(eq(schema.companies.id, id));
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection not available');
  await db.delete(schema.companies).where(eq(schema.companies.id, id));
}