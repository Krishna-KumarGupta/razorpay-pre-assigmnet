import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from './db';

async function main() {
  console.log('Running Drizzle migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrations complete!');
  await client.end();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
