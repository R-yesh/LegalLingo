import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';

/**
 * Landing target for the Supabase magic-link email
 * (VITE_SUPABASE redirect: {origin}/auth/callback#access_token=...).
 * AuthProvider captures the token from the URL hash on mount; this page just
 * waits for that to settle and routes onward.
 */
export const AuthCallbackPage: React.FC = () => {
  const { session, isOnboarded, isLoading, authError } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-steel">Signing you in…</p>
      </div>
    );
  }

  if (authError || !session) {
    return (
      <div className="max-w-md mx-auto my-16 bg-surface rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-whisper">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-charcoal">Sign-in link didn't work</h3>
          <p className="text-xs text-steel mt-1">
            {authError || 'This link may have expired or already been used.'}
          </p>
        </div>
        <Button onClick={() => (window.location.href = '/login')} variant="primary">
          Try again
        </Button>
      </div>
    );
  }

  return <Navigate to={isOnboarded ? '/' : '/onboarding'} replace />;
};
