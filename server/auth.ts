import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { admin } from 'better-auth/plugins';
import { db } from './db.ts';
import * as schema from './schema.ts';

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be set to at least 32 characters');
}

const baseURL = process.env.BETTER_AUTH_URL;
if (!baseURL) {
  throw new Error('BETTER_AUTH_URL is not set');
}

const appOrigin = process.env.APP_ORIGIN;
if (!appOrigin) {
  throw new Error('APP_ORIGIN is not set');
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin()],
  trustedOrigins: [appOrigin],
  baseURL,
  secret,
});
