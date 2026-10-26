import { boundedFetch as fetch, credentialFetch } from '@shared/http/boundedFetch';
import { API_CONFIG } from '../../../config/api.config';
import { QueryHttpError } from '../../../shared/http/QueryHttpError';
import { profileService } from '../../../shared/profile/service/profile.service';
import { preloadRole } from '../../../routes/roleModules';
import type { LoginPayload, LoginResponse, MeResponse } from './authentication.service';
import { SessionVerificationError } from '../components/SessionVerificationError';
import { createElement, type Dispatch, type SetStateAction, type RefObject, type ReactNode } from 'react';
import type { UserProfile, Role } from '../../../shared/profile/types/types';

interface RawSessionProfile extends Record<string, unknown> {
  id: string | number;
  user_name: string;
  role: string;
  name: string;
  email?: string;
  email_address?: string;
  phone?: string;
  contact_number?: string;
  contact?: string;
}

export function mapToUserProfile(raw: RawSessionProfile): UserProfile {
  return {
    id: raw.id,
    userName: raw.user_name,
    role: String(raw.role).toUpperCase() as Role,
    name: raw.name,
    email: raw.email ?? raw.email_address ?? '',
    phone: raw.phone ?? raw.contact_number ?? raw.contact ?? '',
    address: raw.address,
    subject: raw.subject,
    gradeLevel: raw.grade_level,
    section: raw.section,
    gender: String(raw.gender ?? '').toLowerCase() === 'male' ? 'male'
      : String(raw.gender ?? '').toLowerCase() === 'female' ? 'female' : undefined,
    avatarKey: raw.avatar_key ?? undefined,
  } as UserProfile;
}

// Keep the existing login transport/mapping with the lazy session work. The
// public facade and successful/failed-login contracts remain unchanged.
export async function loginSession(payload: LoginPayload): Promise<LoginResponse> {
  const response = await credentialFetch(`${API_CONFIG.baseURL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'include', body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Invalid User ID or password.');
  preloadRole(data.user.role);
  return { ...mapToUserProfile(data.user), token: data.user.token, mustChangePassword: !!data.user.mustChangePassword } as LoginResponse;
}

export const getProfile = profileService.getMyProfile;

const unavailable = (status: number) => new QueryHttpError('Unable to verify your session. Please retry.', status);

// This compatibility rule belongs only to bootstrap's session/profile checks.
// C.2 can replace the legacy message once the backend provides a stable code.
function rejectedSession(status: number, message?: string) {
  return status === 401 || status === 403 && message === 'Invalid or expired token.';
}

export async function getVerifiedSession(signal?: AbortSignal): Promise<MeResponse | null> {
  signal?.throwIfAborted();
  const response = await fetch(`${API_CONFIG.baseURL}/api/auth/me`, { credentials: 'include', signal });
  if (response.status === 401) return null;
  const data = await response.json().catch(() => { throw unavailable(response.status); });
  if (rejectedSession(response.status, data?.message)) return null;
  if (!response.ok) throw unavailable(response.status);
  if (data?.user === null) return null;
  const raw = data?.user;
  if (!raw || typeof raw !== 'object' ||
    !['string', 'number'].includes(typeof raw.id) || !String(raw.id).trim() ||
    typeof raw.role !== 'string' || !['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT'].includes(raw.role.toUpperCase())) {
    throw unavailable(response.status);
  }
  preloadRole(raw.role);
  return { ...mapToUserProfile(raw), mustChangePassword: !!raw.mustChangePassword } as MeResponse;
}

/** Optional profile enrichment cannot replace the verified session's identity. */
export async function restoreSession(signal: AbortSignal): Promise<MeResponse | null> {
  const me = await getVerifiedSession(signal);
  if (!me) return null;
  try {
    const profile = await profileService.getMyProfile(signal);
    if (String(profile?.id) !== String(me.id) || profile?.role !== me.role) return me;
    return { ...profile, mustChangePassword: me.mustChangePassword } as MeResponse;
  } catch (error) {
    if (error instanceof QueryHttpError && rejectedSession(error.status, error.message)) return null;
    // /me already verified authentication. Profile outages/timeouts may use
    // its base profile; they do not turn that success into a signed-out state.
    return me;
  }
}

interface BootstrapPort {
  request: AbortController;
  owner: RefObject<AbortController | null>;
  identity: RefObject<string | null>;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
  setPasswordFlag: Dispatch<SetStateAction<boolean>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<ReactNode>>;
  retry: () => void;
}

/** Owns a bounded verification attempt; cancellation cannot publish a stale identity. */
export async function verify(port: BootstrapPort) {
  // resetSession clears owner before advancing the auth generation. A unique
  // request owner therefore also fences old logins, retries and unmounts.
  const current = () => port.owner.current === port.request;
  const timeout = window.setTimeout(() => port.request.abort(), 15_000);
  try {
    const me = await restoreSession(port.request.signal);
    if (!current()) return;
    port.identity.current = me ? `${me.role}:${me.id}` : null;
    port.setUser(me);
    port.setPasswordFlag(me?.mustChangePassword ?? false);
  } catch (error) {
    if (current()) {
      console.error('Failed to restore session:', error);
      port.setError(createElement(SessionVerificationError, { retry: port.retry }));
    }
  } finally {
    window.clearTimeout(timeout);
    if (current()) {
      port.owner.current = null;
      port.setLoading(false);
    }
  }
}
