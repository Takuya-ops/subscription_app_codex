import Dashboard from '@/app/dashboard';
import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema } from '@/db/runtime';
import { listSubscriptions, seedSubscriptions } from '@/db/subscription-store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await requireChatGPTUser('/');
  const db = await ensureSchema();
  await seedSubscriptions(db, user.userId);
  const subscriptions = await listSubscriptions(db, user.userId);

  return (
    <Dashboard
      initialSubscriptions={subscriptions}
      user={{ displayName: user.displayName, email: user.email }}
    />
  );
}
