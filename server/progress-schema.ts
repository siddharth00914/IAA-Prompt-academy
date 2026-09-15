import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './schema.ts';

/**
 * Per-learner progress row. `state` stores the Progress JSON blob;
 * `revision` supports optimistic concurrency for sync.
 */
export const learnerProgress = pgTable('learner_progress', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  state: jsonb('state').notNull(),
  revision: integer('revision').notNull().default(0),
  legacyImportedAt: timestamp('legacy_imported_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
