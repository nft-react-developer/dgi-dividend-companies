import { eq, like, and, SQL } from 'drizzle-orm';
import { getDb, schema } from '../../db/connection';
import type { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto } from './companies.dto';

export async function findAllCompanies(query: CompanyQueryDto) {
  const db = await getDb();

  const filters: SQL[] = [];

  if (query.isActive !== undefined) {
    filters.push(eq(schema.companies.isActive, query.isActive));
  }
  if (query.country) {
    filters.push(eq(schema.companies.countryIso, query.country.toUpperCase()));
  }
  if (query.search) {
    filters.push(like(schema.companies.name, `%${query.search}%`));
  }

  return db
    .select({
      id:            schema.companies.id,
      ticker:        schema.companies.ticker,
      isin:          schema.companies.isin,
      name:          schema.companies.name,
      industry:      schema.companies.industry,
      countryIso:    schema.companies.countryIso,
      currency:      schema.companies.currency,
      exchange:      schema.companies.exchange,
      fiscalYearEnd: schema.companies.fiscalYearEnd,
      isActive:      schema.companies.isActive,
      createdAt:     schema.companies.createdAt,
      sectorId:      schema.companies.sectorId,
      sectorCode:    schema.sectors.code,
      sectorName:    schema.sectors.name,
    })
    .from(schema.companies)
    .leftJoin(schema.sectors, eq(schema.companies.sectorId, schema.sectors.id))
    .where(filters.length ? and(...filters) : undefined)
    .limit(query.limit)
    .offset(query.offset);
}

export async function findCompanyById(id: number) {
  const db = await getDb();

  const rows = await db
    .select({
      id:            schema.companies.id,
      ticker:        schema.companies.ticker,
      isin:          schema.companies.isin,
      name:          schema.companies.name,
      industry:      schema.companies.industry,
      countryIso:    schema.companies.countryIso,
      currency:      schema.companies.currency,
      exchange:      schema.companies.exchange,
      fiscalYearEnd: schema.companies.fiscalYearEnd,
      isActive:      schema.companies.isActive,
      createdAt:     schema.companies.createdAt,
      updatedAt:     schema.companies.updatedAt,
      sectorId:      schema.companies.sectorId,
      sectorCode:    schema.sectors.code,
      sectorName:    schema.sectors.name,
    })
    .from(schema.companies)
    .leftJoin(schema.sectors, eq(schema.companies.sectorId, schema.sectors.id))
    .where(eq(schema.companies.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function findCompanyByTicker(ticker: string) {
  const db = await getDb();

  const rows = await db
    .select()
    .from(schema.companies)
    .where(eq(schema.companies.ticker, ticker.toUpperCase()))
    .limit(1);

  return rows[0] ?? null;
}

export async function createCompany(data: CreateCompanyDto) {
  const db = await getDb();

  const [result] = await db
    .insert(schema.companies)
    .values(data);

  return findCompanyById(result.insertId);
}

export async function updateCompany(id: number, data: UpdateCompanyDto) {
  const db = await getDb();

  await db
    .update(schema.companies)
    .set(data)
    .where(eq(schema.companies.id, id));

  return findCompanyById(id);
}

export async function deleteCompany(id: number) {
  const db = await getDb();

  await db
    .delete(schema.companies)
    .where(eq(schema.companies.id, id));
}