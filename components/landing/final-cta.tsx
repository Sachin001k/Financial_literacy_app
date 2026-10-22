'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  const { user, openGate } = useAuth();
  return (
    <section className="container-page py-16">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 80, damping: 16 }}
        className="relative overflow-hidden rounded-[2rem] p-10 text-center text-white shadow-2xl sm:p-16"
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#4f46e5,#7c3aed,#059669,#4f46e5)] bg-[length:300%_300%]"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div aria-hidden className="absolute -right-10 -top-10 -z-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.span className="mb-4 inline-block text-6xl" animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity }} aria-hidden>
          🪙
        </motion.span>
        <h2 className="text-3xl font-extrabold sm:text-5xl">Start with ₹1,000 virtual money</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">Free forever to start. Your first mission takes 3 minutes.</p>
        <div className="mt-8 flex justify-center">
          {user ? (
            <Link href="/home">
              <Button size="lg" className="bg-white text-indigo-700 shadow-xl hover:bg-white/90">Go to dashboard <ArrowRight className="h-5 w-5" /></Button>
            </Link>
          ) : (
            <Button size="lg" className="bg-white text-indigo-700 shadow-xl hover:bg-white/90" onClick={() => openGate('signup')}>
              Claim my ₹1,000 <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
