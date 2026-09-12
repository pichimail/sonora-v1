import { AudioLines, ShieldCheck } from 'lucide-react';
import { auth, googleOAuthConfigured, signIn } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect('/');

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0c0d', color: '#fff', padding: 24 }}>
      <section style={{ width: 'min(420px, 100%)', display: 'grid', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#ff7a18,#ff2e93 55%,#7b2ff7)' }}><AudioLines size={20}/></span>
          <div><b style={{ fontSize: 16 }}>Sonora</b><div style={{ color: '#777a80', fontSize: 12 }}>AI Music Studio</div></div>
        </div>

        <div>
          <p style={{ margin: 0, color: '#7f8388', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase' }}>Secure workspace</p>
          <h1 style={{ margin: '8px 0 8px', fontSize: 34, lineHeight: 1.05, letterSpacing: '-.045em' }}>Continue with Google.</h1>
          <p style={{ margin: 0, color: '#92969b', fontSize: 14, lineHeight: 1.6 }}>Your Sonora workspace, uploads and generation history are scoped to your signed-in account.</p>
        </div>

        <form action={async () => { 'use server'; await signIn('google', { redirectTo: '/' }); }}>
          <button disabled={!googleOAuthConfigured} style={{ width: '100%', height: 52, border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, background: googleOAuthConfigured ? '#fff' : '#1b1d1f', color: googleOAuthConfigured ? '#0a0c0d' : '#686c70', fontWeight: 750, fontSize: 14, cursor: googleOAuthConfigured ? 'pointer' : 'not-allowed' }}>
            {googleOAuthConfigured ? 'Continue with Google' : 'Google OAuth environment variables required'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6f7378', fontSize: 11 }}><ShieldCheck size={14}/> Authentication is handled server-side with Auth.js.</div>
      </section>
    </main>
  );
}
