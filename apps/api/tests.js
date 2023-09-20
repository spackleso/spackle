import dotenv from 'dotenv';
import { conn } from '@/db';
import { redis } from '@/queue'

dotenv.config({ path: './.env.test' });

afterAll(async () => {
  await conn.end();
  await redis.quit();
});