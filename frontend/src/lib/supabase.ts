/**
 * Lightweight Supabase client — Auth (GoTrue) + table access (PostgREST) via
 * plain `fetch`, no `@supabase/supabase-js` dependency.
 *
 * Why: this project's environment couldn't reach the npm registry to install
 * the SDK when this was built. Both GoTrue and PostgREST are just HTTP APIs,
 * so this wrapper talks to the same endpoints the official SDK uses. It's a
 * drop-in-replaceable interface — to switch to the real SDK later:
 *   npm install @supabase/supabase-js
 * and replace this file's internals with `createClient(url, anonKey)`,
 * keeping the same exported function names so callers don't need to change.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function assertConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see frontend/.env.example).'
    );
  }
}

function authUrl(path: string): string {
  return `${SUPABASE_URL}/auth/v1${path}`;
}

function restUrl(path: string): string {
  return `${SUPABASE_URL}/rest/v1${path}`;
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.msg || data.error_description || data.message || data.error || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

// --------------------------------------------------------------------------
// Session types + local persistence
// --------------------------------------------------------------------------

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  token_type: string;
  user: SupabaseAuthUser;
}

const SESSION_STORAGE_KEY = 'legallingo_supabase_session';

export function loadStoredSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SupabaseSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: SupabaseSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('[LegalLingo] Failed to persist Supabase session:', e);
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// --------------------------------------------------------------------------
// Auth (GoTrue REST API)
// --------------------------------------------------------------------------

interface TokenResponsePayload {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseAuthUser;
}

function sessionFromTokenPayload(payload: TokenResponsePayload): SupabaseSession {
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + payload.expires_in,
    token_type: payload.token_type,
    user: payload.user,
  };
}

/** Sends a magic-link sign-in email. Creates the auth user on first sign-in. */
export async function signInWithOtp(email: string): Promise<void> {
  assertConfigured();
  const response = await fetch(authUrl('/otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY! },
    body: JSON.stringify({
      email,
      create_user: true,
      options: { email_redirect_to: `${window.location.origin}/auth/callback` },
    }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
}

async function fetchAuthUser(accessToken: string): Promise<SupabaseAuthUser> {
  const response = await fetch(authUrl('/user'), {
    headers: { apikey: SUPABASE_ANON_KEY!, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return response.json();
}

/**
 * Supabase's magic-link email redirects the browser to
 * `{email_redirect_to}#access_token=...&refresh_token=...&expires_in=...&token_type=bearer&type=magiclink`.
 * Call this once on load of the /auth/callback route.
 */
export async function completeSessionFromUrlHash(): Promise<SupabaseSession | null> {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  const params = new URLSearchParams(hash.substring(1));
  const errorDescription = params.get('error_description');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  // Clear tokens/error out of the URL immediately either way.
  window.history.replaceState(null, '', window.location.pathname);

  if (errorDescription) {
    throw new Error(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
  }
  if (!accessToken || !refreshToken) return null;

  const expiresIn = Number(params.get('expires_in') || '3600');
  const user = await fetchAuthUser(accessToken);
  const session: SupabaseSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: params.get('token_type') || 'bearer',
    user,
  };
  storeSession(session);
  return session;
}

async function refreshSession(refreshToken: string): Promise<SupabaseSession> {
  assertConfigured();
  const response = await fetch(authUrl('/token?grant_type=refresh_token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY! },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload: TokenResponsePayload = await response.json();
  const session = sessionFromTokenPayload(payload);
  storeSession(session);
  return session;
}

/**
 * Returns a valid session, refreshing it first if expired/about to expire.
 * Returns null if there's no session or the refresh fails — callers should
 * treat that as "signed out" rather than surface a scary error.
 */
export async function getValidSession(): Promise<SupabaseSession | null> {
  const stored = loadStoredSession();
  if (!stored) return null;

  const nowPlusBuffer = Math.floor(Date.now() / 1000) + 60;
  if (stored.expires_at > nowPlusBuffer) {
    return stored;
  }

  try {
    return await refreshSession(stored.refresh_token);
  } catch (e) {
    console.warn('[LegalLingo] Supabase session refresh failed, signing out locally:', e);
    clearStoredSession();
    return null;
  }
}

export async function signOut(): Promise<void> {
  const stored = loadStoredSession();
  clearStoredSession();
  if (!stored || !isSupabaseConfigured) return;
  try {
    await fetch(authUrl('/logout'), {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY!, Authorization: `Bearer ${stored.access_token}` },
    });
  } catch (e) {
    console.warn('[LegalLingo] Supabase sign-out request failed (session cleared locally anyway):', e);
  }
}

// --------------------------------------------------------------------------
// PostgREST: public.users (onboarding profile row)
// --------------------------------------------------------------------------

export interface UserRow {
  id: string;
  auth_uid: string;
  email: string | null;
  display_name: string | null;
  preferred_language: 'en' | 'hi' | 'mr';
  phone: string | null;
  state: string | null;
  occupation: string | null;
  income_bracket: string | null;
  area_type: 'Urban' | 'Rural' | 'Semi-Urban' | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function isOnboarded(row: UserRow | null): boolean {
  return Boolean(row?.onboarding_completed_at);
}

/** Fetches the caller's own users row (RLS restricts this to auth.uid() = auth_uid). */
export async function fetchUserRow(session: SupabaseSession): Promise<UserRow | null> {
  assertConfigured();
  const response = await fetch(restUrl(`/users?auth_uid=eq.${session.user.id}&select=*`), {
    headers: { apikey: SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const rows: UserRow[] = await response.json();
  return rows[0] ?? null;
}

export type UserRowUpdate = Partial<
  Pick<
    UserRow,
    'display_name' | 'phone' | 'state' | 'occupation' | 'income_bracket' | 'area_type' | 'preferred_language'
  >
> & { markOnboardingComplete?: boolean };

/** Upserts (by auth_uid) the caller's own users row. */
export async function upsertUserRow(session: SupabaseSession, updates: UserRowUpdate): Promise<UserRow> {
  assertConfigured();
  const { markOnboardingComplete, ...fields } = updates;
  const body = {
    auth_uid: session.user.id,
    email: session.user.email ?? null,
    ...fields,
    ...(markOnboardingComplete ? { onboarding_completed_at: new Date().toISOString() } : {}),
  };

  const response = await fetch(restUrl('/users?on_conflict=auth_uid'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${session.access_token}`,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const rows: UserRow[] = await response.json();
  return rows[0];
}
