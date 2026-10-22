'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/auth-provider';
import { Dialog } from '@/components/ui/dialog';
import { AuthForm } from './auth-form';

/** Global signup gate, opened by useRequireAuth(). The stored intent resumes after auth. */
export function AuthGateModal() {
  const { gate, openGate, closeGate } = useAuth();
  const pathname = usePathname();
  return (
    <Dialog open={gate.open} onClose={closeGate} labelledBy="gate-title">
      <div className="mb-5 text-center">
        <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-emerald-500 text-2xl shadow-lg">
          🎮
        </motion.div>
        <h2 id="gate-title" className="text-2xl font-bold">{gate.mode === 'signup' ? 'Ready to play?' : 'Welcome back'}</h2>
        <p className="mt-1 text-sm text-muted">{gate.reason ?? 'Sign up free to play games and save your progress.'}</p>
      </div>
      <AuthForm mode={gate.mode} onModeChange={(m) => openGate(m, gate.reason)} next={pathname || '/home'} onDone={closeGate} />
    </Dialog>
  );
}
