import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getGroupData, getAllProfiles } from '@/lib/supabase/queries';
import { calculateBalances } from '@/lib/calculations/balances';
import { formatCurrency, formatDate } from '@/lib/helpers/formatters';
import Navbar from '@/components/layout/Navbar';
import { addMemberToGroup } from '@/app/group-actions';
import { 
  Plus, 
  ArrowLeft, 
  UserPlus, 
  DollarSign, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  History, 
  AlertCircle 
} from 'lucide-react';

export const revalidate = 0; // Disable static cache for real-time calculation accuracy

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailsPage({ params }: PageProps) {
  const { id: groupId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch group data
  const { members, expenses, splits, settlements } = await getGroupData(groupId);

  // Security Check: Is the user a member of this group?
  const isMember = members.some((m) => m.id === user.id);
  if (!isMember) {
    // If not a member, check if the group exists at all
    const { data: groupExists } = await (await import('@/lib/supabase/server'))
      .createClient()
      .then(cli => cli.from('groups').select('id, name').eq('id', groupId).single());

    if (!groupExists) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
          <h1 className="text-xl font-bold">Group Not Found</h1>
          <Link href="/dashboard" className="mt-4 text-emerald-400 hover:underline">Back to Dashboard</Link>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">You are not a member of this group.</p>
        <Link href="/dashboard" className="mt-4 text-emerald-400 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  // Fetch the group name (we can grab it from one of the members' groups list or fetch it directly)
  const supabase = await (await import('@/lib/supabase/server')).createClient();
  const { data: groupMeta } = await supabase.from('groups').select('name').eq('id', groupId).single();
  const groupName = groupMeta?.name || 'Group Details';

  // Perform dynamic balance calculations
  const { balances, transactions } = calculateBalances(
    members,
    expenses,
    splits,
    settlements
  );

  // Get current user's balance detail
  const myBalance = balances.find((b) => b.memberId === user.id);
  const myNet = myBalance ? myBalance.net : 0;

  // Filter out registered profiles that are already members to support adding members
  const allProfiles = await getAllProfiles();
  const nonMembers = allProfiles.filter(
    (profile) => !members.some((m) => m.id === profile.id)
  );

  // Combine expenses and settlements into a single chronological ledger feed
  const ledger = [
    ...expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      paid_by: e.paid_by,
      created_at: e.created_at,
      type: 'expense' as const,
    })),
    ...settlements.map((s) => ({
      id: s.id,
      description: 'Recorded payment',
      amount: Number(s.amount),
      paid_by: s.paid_by,
      paid_to: s.paid_to,
      created_at: s.created_at,
      type: 'settlement' as const,
    })),
  ];

  // Sort chronological ledger: newest first
  ledger.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Form action handler for adding a member
  async function handleAddMember(formData: FormData) {
    'use server';
    const userIdToAdd = formData.get('memberId') as string;
    if (userIdToAdd) {
      await addMemberToGroup(groupId, userIdToAdd);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userName={user.name} userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full">
        {/* Navigation and Quick Action Headers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <Link 
              href="/dashboard" 
              className="p-2 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl transition-colors hover:border-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-white">{groupName}</h1>
              <p className="text-sm text-slate-450 mt-0.5">
                {myNet > 0 ? (
                  <span className="text-emerald-400 font-semibold">You are owed {formatCurrency(myNet)} in this group</span>
                ) : myNet < 0 ? (
                  <span className="text-rose-400 font-semibold">You owe {formatCurrency(Math.abs(myNet))} in this group</span>
                ) : (
                  <span className="text-slate-400 font-semibold">You are settled up in this group</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/groups/${groupId}/settle`}
              className="flex items-center space-x-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-750 transition-all active:scale-95 text-center"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
              <span>Settle Up</span>
            </Link>
            <Link
              href={`/groups/${groupId}/add-expense`}
              className="flex items-center space-x-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all active:scale-95 shadow-md shadow-emerald-500/5 text-center"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {/* Main Grid: Left Column (balances/suggestions), Right Column (ledger) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Balances, Suggestions, and Add Members */}
          <div className="space-y-6">
            
            {/* Balances Card */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Group Balances</h2>
              <div className="space-y-3">
                {balances.map((member) => (
                  <div key={member.memberId} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-850/50 last:border-0">
                    <span className="font-medium text-slate-300">
                      {member.name} {member.memberId === user.id ? '(You)' : ''}
                    </span>
                    <div>
                      {member.net > 0 ? (
                        <span className="text-emerald-400 font-bold">owed {formatCurrency(member.net)}</span>
                      ) : member.net < 0 ? (
                        <span className="text-rose-400 font-bold">owes {formatCurrency(Math.abs(member.net))}</span>
                      ) : (
                        <span className="text-slate-500">settled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settle Up Suggestions */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Suggested Payments</h2>
              {transactions.length === 0 ? (
                <p className="text-sm text-slate-550 py-2">Everyone is fully settled up! No payments are currently needed.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="flex flex-col p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-rose-450 font-semibold">{tx.fromName}</span>
                        <span className="text-slate-500">owes</span>
                        <span className="text-emerald-400 font-semibold">{tx.toName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white">{formatCurrency(tx.amount)}</span>
                        {tx.fromId === user.id ? (
                          <Link
                            href={`/groups/${groupId}/settle?from=${tx.fromId}&to=${tx.toId}&amt=${tx.amount}`}
                            className="text-xs font-semibold px-2.5 py-1 bg-emerald-400 hover:bg-emerald-350 text-slate-950 rounded-lg transition-colors cursor-pointer"
                          >
                            Pay now
                          </Link>
                        ) : tx.toId === user.id ? (
                          <Link
                            href={`/groups/${groupId}/settle?from=${tx.fromId}&to=${tx.toId}&amt=${tx.amount}`}
                            className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white rounded-lg transition-colors border border-slate-755 cursor-pointer"
                          >
                            Record pay
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Group Member form */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                <span>Add Group Members</span>
              </h2>
              {nonMembers.length === 0 ? (
                <p className="text-xs text-slate-500 py-1">All registered users are already members of this group.</p>
              ) : (
                <form action={handleAddMember} className="space-y-3">
                  <div className="flex flex-col space-y-2">
                    <select
                      name="memberId"
                      required
                      className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select a user...</option>
                      {nonMembers.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name || profile.email}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center space-x-1 py-2 px-3 text-xs font-semibold rounded-xl text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-350 hover:to-emerald-350 transition-colors cursor-pointer"
                    >
                      <span>Add Selected Member</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

          {/* Right Column: Ledger / Chronological History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
                <History className="w-5 h-5 text-emerald-400" />
                <span>Group Ledger & Activity</span>
              </h2>

              {ledger.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-3">
                  <History className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-sm font-semibold">No transactions recorded yet</p>
                  <p className="text-xs max-w-xs mx-auto">Get started by clicking "Add Expense" to log shared costs, or "Settle Up" to record a payment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ledger.map((item) => {
                    const payer = members.find((m) => m.id === item.paid_by);
                    const payerName = payer ? (payer.id === user.id ? 'You' : payer.name || payer.email.split('@')[0]) : 'Deleted User';

                    if (item.type === 'expense') {
                      // Fetch who split this expense and what they owe
                      const expenseSplits = splits.filter((s) => s.expense_id === item.id);
                      const mySplit = expenseSplits.find((s) => s.user_id === user.id);
                      const didIPay = item.paid_by === user.id;

                      return (
                        <div key={item.id} className="flex justify-between items-start p-4 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <DollarSign className="w-4 h-4" />
                              </span>
                              <div>
                                <h3 className="font-bold text-white text-sm sm:text-base">{item.description}</h3>
                                <p className="text-slate-500 text-xs mt-0.5">
                                  Paid by <span className="font-semibold text-slate-400">{payerName}</span> on {formatDate(item.created_at)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Collapse details on splits */}
                            <div className="flex flex-wrap gap-1.5 pl-9">
                              {expenseSplits.map((split) => {
                                const member = members.find((m) => m.id === split.user_id);
                                return (
                                  <span key={split.user_id} className="inline-flex items-center text-[10px] bg-slate-900 border border-slate-850/60 text-slate-400 px-2 py-0.5 rounded-full">
                                    {member ? (member.id === user.id ? 'You' : member.name || member.email.split('@')[0]) : 'User'}: {formatCurrency(split.amount_owed)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="text-right pl-4">
                            <span className="text-lg font-black text-slate-200">{formatCurrency(item.amount)}</span>
                            <div className="mt-1 text-xs">
                              {didIPay ? (
                                <span className="text-emerald-400 font-medium">
                                  You are owed {formatCurrency(item.amount - (mySplit?.amount_owed || 0))}
                                </span>
                              ) : mySplit ? (
                                <span className="text-rose-400 font-medium">
                                  You owe {formatCurrency(mySplit.amount_owed)}
                                </span>
                              ) : (
                                <span className="text-slate-500">Not involved</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // Settlement
                      const receiver = members.find((m) => m.id === item.paid_to);
                      const receiverName = receiver ? (receiver.id === user.id ? 'You' : receiver.name || receiver.email.split('@')[0]) : 'Deleted User';
                      const isIPayer = item.paid_by === user.id;
                      const isIReceiver = item.paid_to === user.id;

                      return (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-emerald-500/[0.02] border border-emerald-500/10 hover:border-emerald-500/20 rounded-2xl transition-all">
                          <div className="flex items-center space-x-3">
                            <span className="p-1.5 bg-emerald-450/10 rounded-lg text-emerald-400">
                              <CheckCircle2 className="w-5 h-5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {payerName} paid {receiverName}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                Recorded on {formatDate(item.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-emerald-400">{formatCurrency(item.amount)}</span>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                              {isIPayer ? 'You paid' : isIReceiver ? 'You received' : 'Settlement'}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
