import { mysqlTable, tinyint, varchar, text } from 'drizzle-orm/mysql-core';

export const sectors = mysqlTable('sectors', {
  id:    tinyint('id').autoincrement().primaryKey(),
  code:  varchar('code', { length: 30 }).notNull(),
  name:  varchar('name', { length: 80 }).notNull(),
  notes: text('notes'),
});

export type Sector    = typeof sectors.$inferSelect;
export type NewSector = typeof sectors.$inferInsert;