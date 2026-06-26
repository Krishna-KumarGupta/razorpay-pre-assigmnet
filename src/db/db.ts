import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not defined!');
}

// Disable prepared statements for compatibility with Supabase Transaction Pooler (port 6543)
const client = postgres(databaseUrl, {
  prepare: false,
});

export const db = drizzle(client, { schema });
export { client };
