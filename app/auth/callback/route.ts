import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';

function safePath(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/home';
}

/**
 * OAuth / email-confirmation landing.
 * - `code` (PKCE): Google sign-in, or an email link opened in the same browser that signed up.
 * - `token_hash` + `type`: email links using the recommended template (works on any device).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = safePath(url.searchParams.get('next'));
  const supabase = getSupabaseServer();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(`/auth/continue?next=${encodeURIComponent(next)}`, url.origin));
    return NextResponse.redirect(new URL('/login?error=link', url.origin));
  }
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(`/auth/continue?next=${encodeURIComponent(next)}`, url.origin));
    // A confirmation link opened in a different browser has no PKCE verifier; the email is confirmed anyway.
    return NextResponse.redirect(new URL('/login?confirmed=1', url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=oauth', url.origin));
}
