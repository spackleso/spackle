import dotenv from 'dotenv';
import { sql } from 'spackle-db';
import { redis } from '@/queue'

dotenv.config({ path: './.env.test' });

afterAll(async () => {
  await sql.end();
  await redis.quit();
});