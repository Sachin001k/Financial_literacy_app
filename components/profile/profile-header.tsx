'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, Pencil, X } from 'lucide-react';
import { Avatar } from '@/components/layout/navbar';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from '@/components/providers/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { MeSummary } from '@/lib/server/me';

/** Must match allowed_mime_types on the `avatars` bucket (0001_init.sql). */
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function ProfileHeader({ me }: { me: MeSummary }) {
  const { refreshMe } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.displayName);
  const [saving, setSaving] = useState(false);

  async function upload(file: File) {
    if (!AVATAR_TYPES.includes(file.type)) return toast.error('Please choose a PNG, JPEG, WebP or GIF image');
    if (file.size > 2 * 1024 * 1024) return toast.error('Image too large', 'Keep it under 2 MB.');
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${me.id}/avatar-${Date.now()}.${ext}`;
      const storage = getSupabaseBrowser().storage.from('avatars');
      const { error } = await storage.upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = storage.getPublicUrl(path);
      await api('/me', { method: 'PATCH', json: { avatarUrl: data.publicUrl } });
      await refreshMe();
      toast.success('Avatar updated');
    } catch (e) {
      toast.error('Upload failed', (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function saveName() {
    setSaving(true);
    try {
      await api('/me', { method: 'PATCH', json: { displayName: name.trim() } });
      await refreshMe();
      setEditing(false);
      toast.success('Name updated');
    } catch (e) {
      toast.error('Could not save name', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand via-violet-500 to-emerald-500 opacity-90" />
      <div className="relative flex flex-col items-center gap-5 pt-8 sm:flex-row sm:items-end">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }} className="relative">
          <div className="rounded-full bg-surface p-1.5"><Avatar name={me.displayName} url={me.avatarUrl} size={104} /></div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-brand text-white shadow-lg transition hover:scale-110 disabled:opacity-60" aria-label="Change avatar">
            {uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-4 w-4" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Reset so picking the same file again still fires onChange.
              e.target.value = '';
              if (file) void upload(file);
            }}
          />
        </motion.div>
        <div className="flex-1 text-center sm:text-left">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Display name" className="max-w-xs" autoFocus />
              <Button size="icon" onClick={saveName} loading={saving} disabled={name.trim().length < 2} aria-label="Save name"><Check className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { setEditing(false); setName(me.displayName); }} aria-label="Cancel"><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold sm:justify-start">
              {me.displayName}
              <button onClick={() => setEditing(true)} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Edit name"><Pencil className="h-4 w-4" /></button>
            </h1>
          )}
          <p className="text-sm text-muted">
            {me.email} · {me.familiarity === 'BEGINNER' ? '🌱 Beginner track' : '🚀 Some experience track'} · Joined {new Date(me.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
