import { eq, like, and, SQL } from 'drizzle-orm';
import { getDb, schema }      from '../../db/connection';
import type { CreateMapperDto, UpdateMapperDto, MapperQueryDto } from './mapper.dto';

const mapperSelect = {
  id:             schema.fieldMappers.id,
  companyId:      schema.fieldMappers.companyId,
  companyTicker:  schema.companies.ticker,
  companyName:    schema.companies.name,
  statementType:  schema.fieldMappers.statementType,
  rawLabel:       schema.fieldMappers.rawLabel,
  canonicalField: schema.fieldMappers.canonicalField,
  targetTable:    schema.fieldMappers.targetTable,
  targetColumn:   schema.fieldMappers.targetColumn,
  transform:      schema.fieldMappers.transform,
  priority:       schema.fieldMappers.priority,
  isActive:       schema.fieldMappers.isActive,
  notes:          schema.fieldMappers.notes,
  createdAt:      schema.fieldMappers.createdAt,
};

export async function findAllMappers(query: MapperQueryDto) {
  const db      = await getDb();
  const filters: SQL[] = [];

  if (query.companyId !== undefined)
    filters.push(eq(schema.fieldMappers.companyId, query.companyId));
  if (query.statementType)
    filters.push(eq(schema.fieldMappers.statementType, query.statementType));
  if (query.isActive !== undefined)
    filters.push(eq(schema.fieldMappers.isActive, query.isActive));
  if (query.search)
    filters.push(like(schema.fieldMappers.rawLabel, `%${query.search}%`));

  return db
    .select(mapperSelect)
    .from(schema.fieldMappers)
    .leftJoin(schema.companies, eq(schema.fieldMappers.companyId, schema.companies.id))
    .where(filters.length ? and(...filters) : undefined)
    .limit(query.limit)
    .offset(query.offset);
}

export async function findMapperById(id: number) {
  const db   = await getDb();
  const rows = await db
    .select(mapperSelect)
    .from(schema.fieldMappers)
    .leftJoin(schema.companies, eq(schema.fieldMappers.companyId, schema.companies.id))
    .where(eq(schema.fieldMappers.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createMapper(data: CreateMapperDto) {
  const db       = await getDb();
  const [result] = await db.insert(schema.fieldMappers).values(data);
  return findMapperById(result.insertId);
}

export async function updateMapper(id: number, data: UpdateMapperDto) {
  const db = await getDb();
  await db.update(schema.fieldMappers).set(data).where(eq(schema.fieldMappers.id, id));
  return findMapperById(id);
}

export async function deleteMapper(id: number) {
  const db = await getDb();
  await db.delete(schema.fieldMappers).where(eq(schema.fieldMappers.id, id));
}
