import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = supabaseUrl && supabaseAnonKey;

  if (isConfigured) {
    // If configured, let's see if user is authenticated
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        redirect('/dashboard');
      } else {
        redirect('/login');
      }
    } catch (e) {
      // If error occurs (e.g. during SSR cookie access), redirect to login
      redirect('/login');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-[#1e293b] to-[#0f172a] px-4 py-12">
      <div className="max-w-xl w-full bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-slate-800 shadow-2xl text-center space-y-8">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            SplitEase
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            A beautiful, simplified MVP for splitting bills with friends.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm p-4 rounded-xl text-left space-y-2">
          <p className="font-semibold text-base text-amber-400">⚠️ Setup Environment Variables Required</p>
          <p>To run the application, configure your Supabase credentials. Create a file named <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono text-xs">.env.local</code> in the root directory and add:</p>
          <pre className="bg-slate-950 p-3 rounded-lg text-slate-300 text-xs font-mono overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key`}
          </pre>
          <p className="text-xs text-amber-400/80">Also, ensure you run the SQL scripts from <code className="font-mono text-slate-200">schema.sql</code> in your Supabase SQL Editor to initialize the database tables and auth triggers.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all text-center"
          >
            Go to Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 border border-slate-700 text-sm font-semibold rounded-xl text-slate-300 hover:bg-slate-800 transition-all text-center"
          >
            Go to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
