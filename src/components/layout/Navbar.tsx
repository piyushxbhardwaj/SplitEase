'use client';

import { signout } from '@/app/auth-actions';
import Link from 'next/link';
import { LogOut, Home, User } from 'lucide-react';

interface NavbarProps {
  userName?: string | null;
  userEmail?: string;
}

export default function Navbar({ userName, userEmail }: NavbarProps) {
  const displayName = userName || userEmail?.split('@')[0] || 'User';

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 hover:opacity-90 transition-opacity"
            >
              SplitEase
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-1 text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-300 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-800">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold">{displayName}</span>
            </div>

            <button
              onClick={() => signout()}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 px-3 py-2 rounded-xl text-slate-300 text-sm font-semibold transition-all border border-slate-700/60 hover:border-red-500/25 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
