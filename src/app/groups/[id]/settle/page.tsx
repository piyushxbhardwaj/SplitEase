import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupData } from '@/lib/supabase/queries';
import Navbar from '@/components/layout/Navbar';
import SettleUpForm from './SettleUpForm';
import { Suspense } from 'react';

import { calculateBalances } from '@/lib/calculations/balances';

export const revalidate = 0; // Dynamic rendering

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SettlePage({ params }: PageProps) {
  const { id: groupId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch group data
  const { members, expenses, splits, settlements } = await getGroupData(groupId);

  const { balances } = calculateBalances(members, expenses, splits, settlements);

  let suggestedPayerId = user.id;
  let suggestedPayeeId = '';

  if (members.length === 2) {
    const otherMember = members.find((m) => m.id !== user.id);
    if (otherMember) {
      const myBalance = balances.find((b) => b.memberId === user.id);
      const myNet = myBalance ? myBalance.net : 0;

      if (myNet < 0) {
        // Current user owes money, so current user is the payer
        suggestedPayerId = user.id;
        suggestedPayeeId = otherMember.id;
      } else if (myNet > 0) {
        // Other user owes money, so other user is the payer
        suggestedPayerId = otherMember.id;
        suggestedPayeeId = user.id;
      } else {
        // Settled: default to current user as payer
        suggestedPayerId = user.id;
        suggestedPayeeId = otherMember.id;
      }
    }
  } else {
    suggestedPayerId = user.id;
    suggestedPayeeId = '';
  }
  // Security check
  const isMember = members.some((m) => m.id === user.id);
  if (!isMember) {
    redirect('/dashboard');
  }

  // Fetch group metadata (name)
  const supabase = await (await import('@/lib/supabase/server')).createClient();
  const { data: groupMeta } = await supabase.from('groups').select('name').eq('id', groupId).single();
  const groupName = groupMeta?.name || 'Group';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userName={user.name} userEmail={user.email} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        {/* Wrap SettleUpForm in Suspense because it uses useSearchParams */}
        <Suspense fallback={<div className="text-slate-400">Loading settlement details...</div>}>
          <SettleUpForm
            groupId={groupId}
            groupName={groupName}
            members={members}
            currentUserId={user.id}
            suggestedPayerId={suggestedPayerId}
            suggestedPayeeId={suggestedPayeeId}
          />
        </Suspense>
      </main>
    </div>
  );
}
