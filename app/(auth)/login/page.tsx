import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/auth-card';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthCard initialMode="login" />
    </Suspense>
  );
}
