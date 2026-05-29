'use client';

import { useActionState, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { recordSettlement } from '@/app/group-actions';
import { ArrowLeft, CheckCircle2, DollarSign } from 'lucide-react';

const initialState = {
  error: null as string | null,
};

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface SettleUpFormProps {
  groupId: string;
  groupName: string;
  members: Member[];
  currentUserId: string;
}

export default function SettleUpForm({
  groupId,
  groupName,
  members,
  currentUserId,
}: SettleUpFormProps) {
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(recordSettlement, initialState);

  // Read prefilled query parameters from suggestion links
  const defaultFrom = searchParams.get('from') || currentUserId;
  const defaultTo = searchParams.get('to') || '';
  const defaultAmt = searchParams.get('amt') || '';

  // Use controlled states to avoid SSR/hydration mismatch bugs on searchParams
  const [paidBy, setPaidBy] = useState(defaultFrom ?? '');
  const [paidTo, setPaidTo] = useState(defaultTo ?? '');
  const [amount, setAmount] = useState(defaultAmt ?? '');

  useEffect(() => {
    if (searchParams.get('from')) {
      setPaidBy(searchParams.get('from')!);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('to')) {
      setPaidTo(searchParams.get('to')!);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('amt')) {
      setAmount(searchParams.get('amt')!);
    }
  }, [searchParams]);


  return (
    <div className="max-w-xl mx-auto bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link
          href={`/groups/${groupId}`}
          className="p-2 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white rounded-xl transition-colors hover:border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Record a Payment</h2>
          <p className="text-xs text-slate-400">in {groupName}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg text-center">
            {state.error}
          </div>
        )}

        <input type="hidden" name="groupId" value={groupId} />

        {/* Sender (Who paid) */}
        <div>
          <label htmlFor="paidBy" className="block text-sm font-semibold text-slate-355">
            Payer (Who sent money?)
          </label>
          <select
            id="paidBy"
            name="paidBy"
            value={paidBy ?? ''}
            onChange={(e) => setPaidBy(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-slate-950 border border-slate-855 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.email} {m.id === currentUserId ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Receiver (Who was paid) */}
        <div>
          <label htmlFor="paidTo" className="block text-sm font-semibold text-slate-355">
            Recipient (Who received money?)
          </label>
          <select
            id="paidTo"
            name="paidTo"
            value={paidTo ?? ''}
            onChange={(e) => setPaidTo(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-3 bg-slate-950 border border-slate-855 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          >
            <option value="">Select a member...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.email} {m.id === currentUserId ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-semibold text-slate-350">
            Amount ($)
          </label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <DollarSign className="w-5 h-5" />
            </span>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              min="0.01"
              value={amount ?? ''}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-11 block w-full px-4 py-3 bg-slate-950 border border-slate-855 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-850/60 p-4 rounded-xl text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">💡 Dynamic Settlement Info</p>
          <p>Recording a settlement creates a payment record in the ledger. It reduces the dynamically calculated balance between these two users.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 justify-end pt-2">
          <Link
            href={`/groups/${groupId}`}
            className="px-5 py-3 border border-slate-700 text-sm font-semibold rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center space-x-1.5 px-6 py-3 text-sm font-semibold rounded-xl text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all active:scale-98 disabled:opacity-50"
          >
            {isPending ? (
              <span>Recording payment...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Record Payment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
