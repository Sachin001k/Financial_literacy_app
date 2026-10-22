'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Send } from 'lucide-react';
import { toast } from '@/components/providers/toaster';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { api } from '@/lib/api';

export function FeedbackForm() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/feedback', { method: 'POST', json: { email: email || undefined, message } });
      setSent(true);
      toast.success('Thanks for the feedback!', 'We read every message.');
    } catch (err) {
      toast.error('Could not send feedback', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="feedback" className="scroll-mt-24 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-8 text-center">
            <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
              <CheckCircle2 className="h-16 w-16 text-gain" />
            </motion.div>
            <h3 className="text-2xl font-bold">Message received</h3>
            <p className="text-muted">Thank you for helping us make FinPlay better.</p>
            <Button variant="outline" onClick={() => { setSent(false); setMessage(''); }}>Send another</Button>
          </motion.div>
        ) : (
          <motion.form key="form" exit={{ opacity: 0, y: -10 }} onSubmit={submit} className="space-y-4">
            <h3 className="text-2xl font-bold">Tell us what you think</h3>
            <p className="text-sm text-muted">Found a bug, want a new game, or have an idea? We&apos;d love to hear it.</p>
            {!user && (
              <div>
                <Label htmlFor="fb-email">Email (optional)</Label>
                <Input id="fb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="So we can reply" />
              </div>
            )}
            <div>
              <Label htmlFor="fb-msg">Message</Label>
              <Textarea id="fb-msg" required minLength={3} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your feedback…" />
            </div>
            <Button type="submit" loading={loading}><Send className="h-4 w-4" /> Send feedback</Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
