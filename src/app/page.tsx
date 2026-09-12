import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AuthBadge } from '@/components/sonora/AuthBadge';
import { SonoraStudio } from '@/components/sonora/SonoraStudio';

export const dynamic = 'force-dynamic';

export default async function SonoraPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');

  return (
    <>
      <SonoraStudio />
      <AuthBadge user={session.user} />
    </>
  );
}
