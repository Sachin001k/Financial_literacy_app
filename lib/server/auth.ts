import 'server-only';
import { createClient, type User } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/env';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ApiError } from './http';

/** Resolves the caller from a Bearer token (mobile) or the Supabase auth cookies (web). */
export async function getRequestUser(req?: Request): Promise<User | null> {
  const header = req?.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data } = await client.auth.getUser(token);
    return data.user ?? null;
  }
  const { data } = await getSupabaseServer().auth.getUser();
  return data.user ?? null;
}

export async function requireUser(req?: Request): Promise<User> {
  const user = await getRequestUser(req);
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Please log in to continue.');
  return user;
}
