import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/sonora/musicgpt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json({ ok: true, jobs: await listJobs(50) }); }
  catch (error) { return NextResponse.json({ ok: false, jobs: [], message: error instanceof Error ? error.message : 'Unable to load jobs' }, { status: 500 }); }
}
