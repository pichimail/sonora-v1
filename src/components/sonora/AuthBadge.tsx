import { LogOut } from 'lucide-react';
import { signOut } from '@/auth';
import styles from './AuthBadge.module.css';

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

export function AuthBadge({ user }: Props) {
  const initial = (user.name || user.email || 'S').trim().charAt(0).toUpperCase();

  return (
    <details className={styles.root}>
      <summary aria-label="Account menu"><span>{initial}</span></summary>
      <div className={styles.menu}>
        <div className={styles.copy}>
          <b>{user.name || 'Sonora user'}</b>
          <span>{user.email}</span>
        </div>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/signin' }); }}>
          <button type="submit"><LogOut size={14}/> Sign out</button>
        </form>
      </div>
    </details>
  );
}
