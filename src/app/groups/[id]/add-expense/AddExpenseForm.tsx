'use client';

import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { addExpense } from '@/app/group-actions';
import { formatCurrency } from '@/lib/helpers/formatters';
import { ArrowLeft, DollarSign, FileText, CheckCircle2 } from 'lucide-react';

const initialState = {
  error: null as string | null,
};

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface AddExpenseFormProps {
  groupId: string;
  groupName: string;
  members: Member[];
  currentUserId: string;
}

export default function AddExpenseForm({
  groupId,
  groupName,
  members,
  currentUserId,
}: AddExpenseFormProps) {
  const [state, formAction, isPending] = useActionState(addExpense, initialState);
  const [amount, setAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.id)
  );

  // Recalculate live split preview
  const numericAmount = Number(amount) || 0;
  const count = selectedMembers.length;
  const splitPreview = count > 0 ? numericAmount / count : 0;

  const handleCheckboxChange = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMembers(members.map((m) => m.id));
  };

  const handleSelectNone = () => {
    setSelectedMembers([]);
  };

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
          <h2 className="text-xl font-bold text-white">Add an Expense</h2>
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

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-350">
            Description
          </label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <FileText className="w-5 h-5" />
            </span>
            <input
              id="description"
              name="description"
              type="text"
              required
              className="pl-11 block w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g. Groceries, Utility Bill, Dinner"
            />
          </div>
        </div>

        {/* Amount Field */}
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-11 block w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Paid By Field */}
        <div>
          <label htmlFor="paidBy" className="block text-sm font-semibold text-slate-350">
            Paid By
          </label>
          <select
            id="paidBy"
            name="paidBy"
            defaultValue={currentUserId}
            className="mt-1 block w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.email} {m.id === currentUserId ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Split Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-350">
              Split Equally With:
            </label>
            <div className="flex space-x-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-emerald-450 hover:text-emerald-350 font-semibold"
              >
                Select All
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={handleSelectNone}
                className="text-rose-455 hover:text-rose-350 font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-850/80 rounded-xl divide-y divide-slate-850/60 p-1">
            {members.map((m) => {
              const isChecked = selectedMembers.includes(m.id);
              return (
                <label
                  key={m.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-900/40 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="memberIds"
                      value={m.id}
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(m.id)}
                      className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 h-4.5 w-4.5"
                    />
                    <span className="text-sm font-medium text-slate-300">
                      {m.name || m.email} {m.id === currentUserId ? '(You)' : ''}
                    </span>
                  </div>
                  {isChecked && numericAmount > 0 && count > 0 && (
                    <span className="text-xs font-semibold text-slate-500">
                      owes {formatCurrency(splitPreview)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Live Split Summary */}
        {numericAmount > 0 && count > 0 && (
          <div className="bg-emerald-500/[0.02] border border-emerald-500/10 p-4 rounded-xl text-center">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Split Summary</p>
            <p className="text-lg font-black text-emerald-400 mt-1">
              {formatCurrency(splitPreview)} <span className="text-xs font-normal text-slate-500">each ({count} people)</span>
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              (Small rounding difference remains with the payer)
            </p>
          </div>
        )}

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
            disabled={isPending || count === 0}
            className="flex items-center space-x-1.5 px-6 py-3 text-sm font-semibold rounded-xl text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span>Saving expense...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Expense</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
