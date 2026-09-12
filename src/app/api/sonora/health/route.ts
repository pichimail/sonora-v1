import { NextResponse } from 'next/server';
import { checkDatabase, ENDPOINTS } from '@/lib/sonora/musicgpt';
import { checkRedis } from '@/lib/sonora/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  return NextResponse.json({
    ok: database.ok,
    database,
    redis,
    blob: { configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
    auth: { googleConfigured: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) },
    musicgptKey: Boolean(process.env.MUSICGPT_API_KEY),
    mode: process.env.MUSICGPT_API_KEY && process.env.MUSICGPT_MOCK !== '1' ? 'live' : 'mock-safe',
    endpointCount: Object.keys(ENDPOINTS).length,
    baseUrl: process.env.MUSICGPT_BASE_URL || 'https://api.musicgpt.com/api/public',
  });
}
