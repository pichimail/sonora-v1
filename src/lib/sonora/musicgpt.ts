import { neon } from '@neondatabase/serverless';

export const MUSICGPT_BASE = process.env.MUSICGPT_BASE_URL || 'https://api.musicgpt.com/api/public';

type Transport = 'json' | 'multipart' | 'form' | 'query';
type EndpointSpec = { path: string; method: 'GET' | 'POST'; transport: Transport; conversionType?: string };

export const ENDPOINTS: Record<string, EndpointSpec> = {
  create: { path: '/v2/MusicAI', method: 'POST', transport: 'json', conversionType: 'MUSIC_AI' },
  remix: { path: '/v1/Remix', method: 'POST', transport: 'multipart', conversionType: 'REMIX' },
  extend: { path: '/v1/extend', method: 'POST', transport: 'multipart', conversionType: 'EXTEND' },
  replace: { path: '/v1/inpaint', method: 'POST', transport: 'multipart', conversionType: 'INPAINT' },
  'add-vocals': { path: '/v1/sing_over_instrumental', method: 'POST', transport: 'multipart', conversionType: 'SING_OVER_INSTRUMENTAL' },
  'add-instrumental': { path: '/v1/sing_over_vocal', method: 'POST', transport: 'multipart' },
  'image-song': { path: '/v1/image_to_song', method: 'POST', transport: 'multipart' },
  cover: { path: '/v1/Cover', method: 'POST', transport: 'multipart', conversionType: 'COVER' },
  tts: { path: '/v1/TextToSpeech', method: 'POST', transport: 'json', conversionType: 'TEXT_TO_SPEECH' },
  'voice-changer': { path: '/v1/VoiceChanger', method: 'POST', transport: 'multipart', conversionType: 'VOICE_CONVERSION' },
  sound: { path: '/v1/sound_generator', method: 'POST', transport: 'form', conversionType: 'SOUND_GENERATOR' },
  lyrics: { path: '/v1/prompt_to_lyrics', method: 'GET', transport: 'query', conversionType: 'LYRICS_GENERATOR' },
  stems: { path: '/v2/Extraction', method: 'POST', transport: 'multipart', conversionType: 'EXTRACTION' },
  'vocal-remover': { path: '/v2/Extraction', method: 'POST', transport: 'multipart', conversionType: 'VOCAL_EXTRACTION' },
  denoise: { path: '/v1/denoise', method: 'POST', transport: 'multipart', conversionType: 'DENOISING' },
  deecho: { path: '/v1/deecho', method: 'POST', transport: 'multipart', conversionType: 'DEECHO' },
  dereverb: { path: '/v1/dereverb', method: 'POST', transport: 'multipart', conversionType: 'DEREVERB' },
  'key-bpm': { path: '/v1/extract_key_bpm', method: 'POST', transport: 'multipart', conversionType: 'KEY_BPM_EXTRACTION' },
  transcribe: { path: '/v1/audio_transcribe', method: 'POST', transport: 'multipart', conversionType: 'AUDIO_TRANSCRIPTION' },
  mastering: { path: '/v1/audio_mastering', method: 'POST', transport: 'multipart', conversionType: 'AUDIO_MASTERING' },
  cutter: { path: '/v1/audio_cutter', method: 'POST', transport: 'multipart', conversionType: 'AUDIO_CUTTER' },
  speed: { path: '/v1/audio_speed_changer', method: 'POST', transport: 'multipart', conversionType: 'AUDIO_SPEED_CHANGER' },
  converter: { path: '/v1/file_convert', method: 'POST', transport: 'multipart', conversionType: 'FILE_CONVERT' },
  midi: { path: '/v1/audio_to_midi', method: 'POST', transport: 'multipart', conversionType: 'AUDIO_TO_MIDI' },
  'cover-art': { path: '/v1/image_generator', method: 'POST', transport: 'form' },
  'get-voices': { path: '/v1/getAllVoices', method: 'GET', transport: 'query' },
  'search-voices': { path: '/v1/searchVoices', method: 'GET', transport: 'query' },
  status: { path: '/v1/byId', method: 'GET', transport: 'query' },
};

const allowedKeys = new Set(['prompt','music_style','lyrics','make_instrumental','vocal_only','title','gender','voice_id','sample_audio_url','generate_album_cover','lyrics_timestamps','model','audio_url','reference_audio_url','extend_after','lyrics_section_to_extend','replace_start_at','replace_end_at','lyrics_section_to_replace','num_outputs','negative_tags','key','bpm','pitch','remove_background','text','stems','preprocessing_options','eco_mode','language','translate','transcription_format','translation_format','word_timestamps','audio_length','start_time','end_time','output_extension','speed_change_factor','target_format','target_sr','target_bit_depth','sonify_midi','save_note_events','style_preset','height','width','seed','limit','page','query','conversionType','task_id','conversion_id','image_url']);

function cleanPayload(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowedKeys.has(key) || value === undefined || value === null || value === '') continue;
    out[key] = value;
  }
  if (typeof out.prompt === 'string') out.prompt = out.prompt.slice(0, 1000);
  if (typeof out.lyrics === 'string') out.lyrics = out.lyrics.slice(0, 5000);
  return out;
}

function stringValue(key: string, value: unknown) {
  if (key === 'remove_background' && typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return JSON.stringify(value);
  return String(value);
}

export async function callMusicGPT(feature: string, raw: Record<string, unknown>) {
  const spec = ENDPOINTS[feature];
  if (!spec) throw new Error(`Unknown Sonora feature: ${feature}`);
  const payload = cleanPayload(raw);
  const key = process.env.MUSICGPT_API_KEY;

  if (feature === 'vocal-remover') payload.stems = ['vocals', 'instrumental'];
  if ((payload.voice_id || payload.vocal_only) && feature === 'create') payload.model = 'v6';
  if (feature === 'create' && payload.lyrics) {
    payload.prompt = '';
    payload.music_style = raw.music_style || raw.prompt || '';
  }
  if (feature === 'add-instrumental' && payload.make_instrumental) payload.lyrics_timestamps = false;

  if (!key || process.env.MUSICGPT_MOCK === '1') {
    const id = crypto.randomUUID();
    if (feature === 'lyrics') return { success: true, task_id: id, lyrics: mockLyrics(String(payload.prompt || 'A new song')), mock: true };
    if (feature === 'get-voices' || feature === 'search-voices') return { success: true, voices: mockVoices(), total: 12, mock: true };
    return { success: true, task_id: id, status: 'IN_QUEUE', eta: 8, credit_estimate: estimateCost(feature), message: 'Queued in Sonora safe mode. Add MUSICGPT_API_KEY in Vercel to run live conversions.', mock: true };
  }

  const headers: Record<string, string> = { Authorization: key };
  let url = `${MUSICGPT_BASE}${spec.path}`;
  let body: BodyInit | undefined;

  if (spec.transport === 'query') {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) params.set(k, stringValue(k, v));
    url += `?${params}`;
  } else if (spec.transport === 'json') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  } else if (spec.transport === 'form') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) params.set(k, stringValue(k, v));
    body = params;
  } else {
    const form = new FormData();
    for (const [k, v] of Object.entries(payload)) form.append(k, stringValue(k, v));
    body = form;
  }

  const response = await fetch(url, { method: spec.method, headers, body, cache: 'no-store' });
  const text = await response.text();
  let json: Record<string, unknown>;
  try { json = JSON.parse(text) as Record<string, unknown>; } catch { json = { success: false, message: text || `MusicGPT HTTP ${response.status}` }; }

  if (feature === 'create' && response.status === 404) {
    const fallback = { ...payload };
    delete fallback.model;
    delete fallback.lyrics_timestamps;
    const r = await fetch(`${MUSICGPT_BASE}/v1/MusicAI`, { method: 'POST', headers: { Authorization: key, 'Content-Type': 'application/json' }, body: JSON.stringify(fallback), cache: 'no-store' });
    const fallbackText = await r.text();
    try { return { ...(JSON.parse(fallbackText) as Record<string, unknown>), httpStatus: r.status, fallback: true }; }
    catch { return { success: false, message: fallbackText, httpStatus: r.status, fallback: true }; }
  }
  return { ...json, httpStatus: response.status };
}

export async function ensureSonoraJobTable() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!databaseUrl) return false;
  const sql = neon(databaseUrl);
  await sql`CREATE TABLE IF NOT EXISTS sonora_jobs (id text PRIMARY KEY, feature text NOT NULL, provider_task_id text, status text NOT NULL, title text, request jsonb NOT NULL DEFAULT '{}'::jsonb, response jsonb NOT NULL DEFAULT '{}'::jsonb, credit_estimate double precision, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
  return true;
}

export async function persistJob(args: { id: string; feature: string; taskId?: string; status: string; title?: string; request: Record<string, unknown>; response: Record<string, unknown>; credit?: number }) {
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!databaseUrl) return false;
  const sql = neon(databaseUrl);
  await ensureSonoraJobTable();
  await sql`INSERT INTO sonora_jobs (id, feature, provider_task_id, status, title, request, response, credit_estimate) VALUES (${args.id}, ${args.feature}, ${args.taskId || null}, ${args.status}, ${args.title || null}, ${JSON.stringify(args.request)}::jsonb, ${JSON.stringify(args.response)}::jsonb, ${args.credit ?? null}) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, response = EXCLUDED.response, updated_at = now()`;
  return true;
}

export async function listJobs(limit = 40) {
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!databaseUrl) return [];
  const sql = neon(databaseUrl);
  await ensureSonoraJobTable();
  return sql`SELECT id, feature, provider_task_id, status, title, credit_estimate, created_at, updated_at FROM sonora_jobs ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function checkDatabase() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!databaseUrl) return { configured: false, ok: false };
  try { const sql = neon(databaseUrl); await sql`SELECT 1`; return { configured: true, ok: true }; }
  catch (error) { return { configured: true, ok: false, error: error instanceof Error ? error.message : 'Database check failed' }; }
}

export function estimateCost(feature: string) {
  const costs: Record<string, number> = { create: 0.1, remix: 0.14, extend: 0.2, replace: 0.2, 'add-vocals': 0.14, tts: 0.07, sound: 0.0992, lyrics: 0.01, cover: 0.073, 'voice-changer': 0.05, denoise: 0.07, deecho: 0.055, dereverb: 0.045, mastering: 0.011, cutter: 0.011, speed: 0.011, converter: 0.008, 'key-bpm': 0.006, midi: 0.024, transcribe: 0.07 };
  return costs[feature] ?? 0.05;
}

function mockLyrics(prompt: string) { return `[Verse]\n${prompt}\nCity lights move slowly while the midnight colors glow\n\n[Chorus]\nTurn the silence into thunder, let the melody arrive\nWe can make another moment feel completely alive`; }
function mockVoices() { return ['Aurora','Atlas','Cedar','Ember','Indigo','Juniper','Lumen','Mira','Nova','Orion','Sage','Vega'].map((voice_name, index) => ({ voice_id: `sonora-${index + 1}`, voice_name })); }
