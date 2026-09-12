import { neon } from '@neondatabase/serverless';

type SonoraUserInput = {
  email: string;
  name?: string | null;
  image?: string | null;
  providerAccountId?: string | null;
};

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
}

export async function upsertSonoraUser(input: SonoraUserInput) {
  const url = databaseUrl();
  if (!url) throw new Error('DATABASE_URL is required for Sonora authentication.');
  const sql = neon(url);
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO sonora_users (id, email, name, image, provider, provider_account_id, last_login_at, updated_at)
    VALUES (${id}, ${input.email.toLowerCase()}, ${input.name || null}, ${input.image || null}, 'google', ${input.providerAccountId || null}, now(), now())
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      image = EXCLUDED.image,
      provider_account_id = COALESCE(EXCLUDED.provider_account_id, sonora_users.provider_account_id),
      last_login_at = now(),
      updated_at = now()
    RETURNING id, email, name, image
  `;
  return rows[0] as { id: string; email: string; name: string | null; image: string | null };
}

export async function attachJobUser(jobId: string, userId: string) {
  const url = databaseUrl();
  if (!url) return false;
  const sql = neon(url);
  await sql`UPDATE sonora_jobs SET user_id = ${userId}, updated_at = now() WHERE id = ${jobId}`;
  return true;
}

export async function listUserJobs(userId: string, limit = 50) {
  const url = databaseUrl();
  if (!url) return [];
  const sql = neon(url);
  return sql`
    SELECT id, feature, provider_task_id, status, title, credit_estimate, created_at, updated_at
    FROM sonora_jobs
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}
