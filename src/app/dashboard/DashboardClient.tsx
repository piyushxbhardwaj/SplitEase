'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateGroupForm from '@/components/forms/CreateGroupForm';
import { formatCurrency } from '@/lib/helpers/formatters';
import { Plus, Users, ArrowRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface GroupWithBalance {
  id: string;
  name: string;
  created_at: string;
  myNet: number;
  memberCount: number;
}

interface DashboardClientProps {
  groups: GroupWithBalance[];
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  totalOwedToMe: number;
  totalIOwe: number;
  netBalance: number;
}

export default function DashboardClient({
  groups,
  user,
  totalOwedToMe,
  totalIOwe,
  netBalance,
}: DashboardClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Welcome back, {user.name || user.email.split('@')[0]}
          </h1>
          <p className="text-slate-400 mt-1">Here is a summary of your shared expenses.</p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center space-x-2 px-5 py-3 text-sm font-semibold rounded-xl text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Create a Group</span>
          </button>
        )}
      </div>

      {/* Conditionally render Create Group Form */}
      {showCreateForm && (
        <div className="max-w-md">
          <CreateGroupForm onCancel={() => setShowCreateForm(false)} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Net Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex items-start space-x-4">
          <div className="p-3 bg-slate-800 rounded-xl text-slate-300">
            <Wallet className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Net Balance</p>
            <h3 className={`text-2xl font-black mt-1 ${netBalance > 0 ? 'text-emerald-400' : netBalance < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {netBalance > 0 ? '+' : ''}{formatCurrency(netBalance)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {netBalance > 0 ? 'You are owed overall' : netBalance < 0 ? 'You owe overall' : 'You are all settled up!'}
            </p>
          </div>
        </div>

        {/* Card 2: You Owe */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex items-start space-x-4">
          <div className="p-3 bg-slate-800 rounded-xl text-rose-400/20">
            <TrendingDown className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">You Owe</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">
              {formatCurrency(totalIOwe)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Across all group balances</p>
          </div>
        </div>

        {/* Card 3: You Are Owed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex items-start space-x-4">
          <div className="p-3 bg-slate-800 rounded-xl text-emerald-400/20">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">You Are Owed</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(totalOwedToMe)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Across all group balances</p>
          </div>
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Users className="w-5 h-5 text-teal-400" />
          <span>Your Groups</span>
        </h2>

        {groups.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-12 text-center text-slate-400 space-y-4">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <p className="font-semibold text-lg text-slate-350">No groups yet</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">Groups help you organize bills and split them equally with roommates, friends, or family.</p>
            </div>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center space-x-1 px-4 py-2 border border-slate-700 text-sm font-semibold rounded-xl text-slate-300 hover:bg-slate-800 transition-colors active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="group block bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-99"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
                      {group.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
                      <Users className="w-3.5 h-3.5" />
                      <span>{group.memberCount} members</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      {group.myNet > 0 ? (
                        <>
                          <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">you are owed</p>
                          <p className="text-lg font-black text-emerald-400">{formatCurrency(group.myNet)}</p>
                        </>
                      ) : group.myNet < 0 ? (
                        <>
                          <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">you owe</p>
                          <p className="text-lg font-black text-rose-400">{formatCurrency(Math.abs(group.myNet))}</p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-slate-400">settled up</p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-650 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
