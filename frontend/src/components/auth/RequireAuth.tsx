import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * Gates a route behind Supabase auth + a completed onboarding profile.
 *
 * - Not signed in            -> redirect to /login (remembers where you were headed)
 * - Signed in, not onboarded -> redirect to /onboarding
 * - Neither                  -> render the route
 */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSupabaseConfigured, session, isOnboarded, isLoading } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-lg mx-auto my-16 bg-surface rounded-3xl border border-amber-200 bg-amber-50/60 p-8 text-center space-y-3 shadow-whisper">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-charcoal">Sign-in is not configured</h3>
        <p className="text-xs text-steel">
          VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing from the frontend environment.
          Copy <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">.env.example</code> to{' '}
          <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">.env</code> and restart the dev server.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
