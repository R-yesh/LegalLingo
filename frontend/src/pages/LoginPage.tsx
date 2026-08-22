import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Mail, ShieldCheck, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { session, isOnboarded, isLoading, signInWithOtp } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isLoading && session) {
    const from = (location.state as { from?: Location })?.from;
    return <Navigate to={isOnboarded ? (from?.pathname as string) || '/' : '/onboarding'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setErrorMessage(null);
    try {
      await signInWithOtp(email.trim());
      setStatus('sent');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Could not send the sign-in link. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-16">
      <div className="text-center mb-8 space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-900 to-brand-600 flex items-center justify-center text-white shadow-sm mx-auto">
          <FileText className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-charcoal font-display">Sign in to LegalLingo</h1>
        <p className="text-sm text-steel">
          We'll email you a secure sign-in link — no password to remember.
        </p>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-whisper">
        {status === 'sent' ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-charcoal">Check your email</h3>
              <p className="text-xs text-steel mt-1">
                We sent a sign-in link to <span className="font-semibold text-charcoal">{email}</span>. Open it on this
                device to continue.
              </p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-steel absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>
            </div>

            {status === 'error' && errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={!email.trim() || status === 'sending'}
              isLoading={status === 'sending'}
            >
              Send sign-in link
            </Button>

            <div className="flex items-center gap-2 text-[11px] text-steel justify-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>No password is ever created or stored.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
