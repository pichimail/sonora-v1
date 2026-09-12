import { NextResponse } from 'next/server';
import { checkDatabase, ENDPOINTS } from '@/lib/sonora/musicgpt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const database = await checkDatabase();
  return NextResponse.json({ ok: database.ok, database, musicgptKey: Boolean(process.env.MUSICGPT_API_KEY), mode: process.env.MUSICGPT_API_KEY && process.env.MUSICGPT_MOCK !== '1' ? 'live' : 'mock-safe', endpointCount: Object.keys(ENDPOINTS).length, baseUrl: process.env.MUSICGPT_BASE_URL || 'https://api.musicgpt.com/api/public' });
}
