import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as authSchema from './schema.ts';
import * as progressSchema from './progress-schema.ts';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const schema = {
  ...authSchema,
  ...progressSchema,
};

export const db = drizzle(pool, { schema });
