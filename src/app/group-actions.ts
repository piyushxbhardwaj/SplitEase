'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createGroup(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;

  if (!name || name.trim() === '') {
    return { error: 'Group name is required' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Create the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: name.trim(),
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError || !group) {
    return { error: groupError?.message || 'Failed to create group' };
  }

  // Add the creator as the first member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
    });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath('/dashboard');
  redirect(`/groups/${group.id}`);
}

export async function addMemberToGroup(groupId: string, userId: string) {
  if (!groupId || !userId) {
    return { error: 'Group and User are required' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function addExpense(prevState: any, formData: FormData) {
  const groupId = formData.get('groupId') as string;
  const description = formData.get('description') as string;
  const amountStr = formData.get('amount') as string;
  const paidBy = formData.get('paidBy') as string;
  const memberIds = formData.getAll('memberIds') as string[];

  if (!groupId || !description || !amountStr || !paidBy) {
    return { error: 'All fields are required' };
  }

  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  if (memberIds.length === 0) {
    return { error: 'Select at least one member to split with' };
  }

  const supabase = await createClient();

  // Create the expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      description: description.trim(),
      amount,
      paid_by: paidBy,
    })
    .select()
    .single();

  if (expenseError || !expense) {
    return { error: expenseError?.message || 'Failed to record expense' };
  }

  // Calculate splits
  const splitAmount = Math.round((amount / memberIds.length) * 100) / 100;
  const sumSplits = splitAmount * memberIds.length;
  const difference = Math.round((amount - sumSplits) * 100) / 100;

  // The payer absorbs the remainder if they are in the split, otherwise the first selected person does.
  const payerInSplitsIndex = memberIds.indexOf(paidBy);
  const adjustIndex = payerInSplitsIndex !== -1 ? payerInSplitsIndex : 0;

  const splitsToInsert = memberIds.map((userId, index) => {
    let owed = splitAmount;
    if (index === adjustIndex) {
      owed = Math.round((splitAmount + difference) * 100) / 100;
    }
    return {
      expense_id: expense.id,
      user_id: userId,
      amount_owed: owed,
    };
  });

  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splitsToInsert);

  if (splitsError) {
    // Note: in a real production system we would handle transaction rollbacks, 
    // but for MVP cascade delete handles cleanups if needed, or simple error rendering is sufficient.
    return { error: splitsError.message };
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function recordSettlement(prevState: any, formData: FormData) {
  const groupId = formData.get('groupId') as string;
  const paidBy = formData.get('paidBy') as string;
  const paidTo = formData.get('paidTo') as string;
  const amountStr = formData.get('amount') as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log('--- RECORD SETTLEMENT LOG ---');
  console.log('groupId:', groupId);
  console.log('paidBy (payer):', paidBy);
  console.log('paidTo (payee):', paidTo);
  console.log('amountStr:', amountStr);
  console.log('currentAuthUser.id:', user?.id);
  console.log('-----------------------------');

  if (!groupId || !paidBy || !paidTo || !amountStr) {
    return { error: 'All fields are required' };
  }

  if (paidBy === paidTo) {
    return { error: 'A member cannot settle with themselves' };
  }

  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  const { error } = await supabase
    .from('settlements')
    .insert({
      group_id: groupId,
      paid_by: paidBy,
      paid_to: paidTo,
      amount,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}
