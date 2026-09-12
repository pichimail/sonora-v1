import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
const AUDIO_TYPES = new Set(['audio/mpeg','audio/wav','audio/x-wav','audio/flac','audio/ogg','audio/aac','audio/webm','audio/mp4']);
const IMAGE_TYPES = new Set(['image/jpeg','image/png','image/gif','image/bmp','image/webp']);

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ ok: false, message: 'Missing file' }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ ok: false, message: 'Maximum file size is 50 MB' }, { status: 413 });
    if (!AUDIO_TYPES.has(file.type) && !IMAGE_TYPES.has(file.type)) return NextResponse.json({ ok: false, message: 'Unsupported file type' }, { status: 415 });
    if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ ok: true, mock: true, name: file.name, size: file.size, mime: file.type, url: '' });
    const blob = await put(`sonora/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`, file, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
    return NextResponse.json({ ok: true, name: file.name, size: file.size, mime: file.type, url: blob.url });
  } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 }); }
}
