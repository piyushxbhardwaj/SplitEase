'use client';

import { useActionState } from 'react';
import { createGroup } from '@/app/group-actions';
import { X, Check } from 'lucide-react';

const initialState = {
  error: null as string | null,
};

interface CreateGroupFormProps {
  onCancel: () => void;
}

export default function CreateGroupForm({ onCancel }: CreateGroupFormProps) {
  const [state, formAction, isPending] = useActionState(createGroup, initialState);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-white">Create New Group</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg text-center">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300">
            Group Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            className="mt-1 block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            placeholder="e.g. Roommates 2026, Trip to Bali"
          />
        </div>

        <div className="flex space-x-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-slate-700 text-sm font-semibold rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center space-x-1 px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all active:scale-98 disabled:opacity-50"
          >
            {isPending ? (
              <span>Creating...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Create Group</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
