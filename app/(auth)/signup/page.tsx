import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/auth-card';

export const metadata = { title: 'Sign up' };

export default function SignupPage() {
  return (
    <Suspense>
      <AuthCard initialMode="signup" />
    </Suspense>
  );
}
