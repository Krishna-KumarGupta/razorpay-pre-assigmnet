import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, client } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Seeding database...');

  const cfoEmail = 'cfo@org.com';
  const cfoPassword = 'CFO#ORG@April2026';

  // Check if CFO already exists
  const existing = await db.select().from(users).where(eq(users.email, cfoEmail)).limit(1);
  if (existing.length > 0) {
    console.log('CFO account already seeded.');
    await client.end();
    return;
  }

  const hashedPassword = await bcrypt.hash(cfoPassword, 12);

  await db.insert(users).values({
    name: 'CFO Account',
    email: cfoEmail,
    password: hashedPassword,
    role: 'CFO',
    isActive: true,
  });

  console.log('✅ CFO account seeded successfully!');
  await client.end();
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
