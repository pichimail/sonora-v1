import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listUserJobs } from '@/lib/sonora/auth-db';
import { rateLimit } from '@/lib/sonora/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, jobs: [], message: 'Authentication required' }, { status: 401 });

  const quota = await rateLimit('jobs', session.user.id, 60, 60);
  if (!quota.allowed) return NextResponse.json({ ok: false, jobs: [], message: 'Rate limit reached' }, { status: 429 });

  try {
    const jobs = await listUserJobs(session.user.id, 50);
    return NextResponse.json({ ok: true, jobs, rate_limit_remaining: quota.remaining });
  } catch (error) {
    return NextResponse.json({ ok: false, jobs: [], message: error instanceof Error ? error.message : 'Unable to load jobs' }, { status: 500 });
  }
}
