import { NextRequest, NextResponse } from 'next/server';
import { callMusicGPT, ENDPOINTS, persistJob } from '@/lib/sonora/musicgpt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ feature: string }> }) {
  const { feature } = await context.params;
  if (!ENDPOINTS[feature]) return NextResponse.json({ success: false, message: 'Unknown Sonora feature' }, { status: 404 });
  let body: Record<string, unknown> = {};
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ success: false, message: 'Expected JSON request body' }, { status: 400 }); }
  try {
    const result = await callMusicGPT(feature, body) as Record<string, unknown>;
    const id = crypto.randomUUID();
    const taskId = typeof result.task_id === 'string' ? result.task_id : undefined;
    const status = typeof result.status === 'string' ? result.status : result.success === false ? 'FAILED' : 'IN_QUEUE';
    const credit = typeof result.credit_estimate === 'number' ? result.credit_estimate : Number(result.credit_estimate || 0) || undefined;
    await persistJob({ id, feature, taskId, status, title: typeof body.title === 'string' ? body.title : undefined, request: body, response: result, credit }).catch(() => false);
    const httpStatus = typeof result.httpStatus === 'number' ? result.httpStatus : 200;
    return NextResponse.json({ ...result, sonora_job_id: id }, { status: httpStatus >= 400 ? httpStatus : 200 });
  } catch (error) { return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Sonora generation failed' }, { status: 500 }); }
}

export async function GET(request: NextRequest, context: { params: Promise<{ feature: string }> }) {
  const { feature } = await context.params;
  if (!['lyrics','get-voices','search-voices','status'].includes(feature)) return NextResponse.json({ success: false, message: 'GET is not available for this feature' }, { status: 405 });
  const data: Record<string, unknown> = {};
  request.nextUrl.searchParams.forEach((value, key) => { data[key] = value; });
  try { return NextResponse.json(await callMusicGPT(feature, data)); }
  catch (error) { return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Provider request failed' }, { status: 500 }); }
}
