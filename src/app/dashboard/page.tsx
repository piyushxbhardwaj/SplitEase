import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupsForUser, getGroupData } from '@/lib/supabase/queries';
import { calculateBalances } from '@/lib/calculations/balances';
import Navbar from '@/components/layout/Navbar';
import DashboardClient from './DashboardClient';

export const revalidate = 0; // Disable static caching so balances update dynamically

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const groups = await getGroupsForUser(user.id);

  // Fetch balances for each group dynamically
  const groupsWithBalances = await Promise.all(
    groups.map(async (group) => {
      const data = await getGroupData(group.id);
      const { balances } = calculateBalances(
        data.members,
        data.expenses,
        data.splits,
        data.settlements
      );
      
      const myBalanceObj = balances.find((b) => b.memberId === user.id);
      return {
        id: group.id,
        name: group.name,
        created_at: group.created_at,
        myNet: myBalanceObj ? myBalanceObj.net : 0,
        memberCount: data.members.length,
      };
    })
  );

  // Calculate global dashboard figures
  let totalOwedToMe = 0;
  let totalIOwe = 0;

  groupsWithBalances.forEach((g) => {
    if (g.myNet > 0) {
      totalOwedToMe += g.myNet;
    } else if (g.myNet < 0) {
      totalIOwe += Math.abs(g.myNet);
    }
  });

  const netBalance = Math.round((totalOwedToMe - totalIOwe + Number.EPSILON) * 100) / 100;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar userName={user.name} userEmail={user.email} />
      <main className="flex-1 flex flex-col">
        <DashboardClient
          groups={groupsWithBalances}
          user={user}
          totalOwedToMe={totalOwedToMe}
          totalIOwe={totalIOwe}
          netBalance={netBalance}
        />
      </main>
    </div>
  );
}
