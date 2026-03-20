import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRE_DATABASE_URI || '',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || '',
  NVIDIA_MODEL: process.env.NVIDIA_MODEL || 'qwen/qwen3.5-122b-a10b',
};
