import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  SupabaseSession,
  UserRow,
  UserRowUpdate,
  clearStoredSession,
  completeSessionFromUrlHash,
  fetchUserRow,
  getValidSession,
  isOnboarded,
  isSupabaseConfigured,
  signInWithOtp as supabaseSignInWithOtp,
  signOut as supabaseSignOut,
  upsertUserRow,
} from '../lib/supabase';

interface AuthContextType {
  isSupabaseConfigured: boolean;
  session: SupabaseSession | null;
  profile: UserRow | null;
  isOnboarded: boolean;
  /** True while the initial session/profile bootstrap (or a hash-callback exchange) is in flight. */
  isLoading: boolean;
  authError: string | null;
  signInWithOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (updates: UserRowUpdate) => Promise<UserRow>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfileFor = useCallback(async (activeSession: SupabaseSession) => {
    try {
      const row = await fetchUserRow(activeSession);
      setProfile(row);
    } catch (e) {
      console.error('[LegalLingo] Failed to load user profile:', e);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // A magic-link redirect lands with tokens in the URL hash — handle
        // that first regardless of which route it lands on, so a user who
        // bookmarks/shares a link mid-flow still gets signed in.
        const fromHash = await completeSessionFromUrlHash();
        const active = fromHash ?? (await getValidSession());

        if (!isMounted) return;

        setSession(active);
        if (active) {
          await loadProfileFor(active);
        } else {
          setProfile(null);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setAuthError(e?.message || 'Failed to sign in.');
        setSession(null);
        setProfile(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [loadProfileFor]);

  const signInWithOtp = useCallback(async (email: string) => {
    setAuthError(null);
    await supabaseSignInWithOtp(email);
  }, []);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    clearStoredSession();
    setSession(null);
    setProfile(null);
  }, []);

  const saveProfile = useCallback(
    async (updates: UserRowUpdate): Promise<UserRow> => {
      if (!session) {
        throw new Error('You must be signed in to save your profile.');
      }
      const row = await upsertUserRow(session, updates);
      setProfile(row);
      return row;
    },
    [session]
  );

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    await loadProfileFor(session);
  }, [session, loadProfileFor]);

  return (
    <AuthContext.Provider
      value={{
        isSupabaseConfigured,
        session,
        profile,
        isOnboarded: isOnboarded(profile),
        isLoading,
        authError,
        signInWithOtp,
        signOut,
        saveProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
