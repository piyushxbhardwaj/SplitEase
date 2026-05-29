import { createClient } from './server';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, email, name, created_at')
    .order('name');
  return data || [];
}

export async function getGroupsForUser(userId: string): Promise<Group[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('group_members')
    .select('group_id, groups (id, name, created_by, created_at)')
    .eq('user_id', userId);

  if (!data) return [];
  // Filter out any null groups and cast them
  return data.map((d: any) => d.groups).filter(Boolean) as Group[];
}

export async function getGroupData(groupId: string) {
  const supabase = await createClient();

  // Fetch members, expenses, splits, and settlements in parallel
  const [membersRes, expensesRes, splitsRes, settlementsRes] = await Promise.all([
    supabase
      .from('group_members')
      .select('user_id, profiles (id, name, email, created_at)')
      .eq('group_id', groupId),
    supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }),
    // We fetch splits for this group. Since expense_splits refers to expenses, 
    // we can filter using inner join on expenses which are in this group.
    supabase
      .from('expense_splits')
      .select('id, expense_id, user_id, amount_owed, expenses!inner(group_id)')
      .eq('expenses.group_id', groupId),
    supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }),
  ]);

  const members = (membersRes.data || []).map((m: any) => m.profiles).filter(Boolean);
  const expenses = expensesRes.data || [];
  
  // Map out the nested expense record from the inner join
  const splits = (splitsRes.data || []).map((s: any) => ({
    id: s.id,
    expense_id: s.expense_id,
    user_id: s.user_id,
    amount_owed: Number(s.amount_owed),
  }));

  const settlements = (settlementsRes.data || []).map((s: any) => ({
    id: s.id,
    group_id: s.group_id,
    paid_by: s.paid_by,
    paid_to: s.paid_to,
    amount: Number(s.amount),
    created_at: s.created_at,
  }));

  return {
    members,
    expenses,
    splits,
    settlements,
  };
}
