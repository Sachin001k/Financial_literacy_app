/** True when a game shortcut should ignore this key event (typing, modifiers, open dialogs, already handled). */
export function shouldIgnoreGameKey(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return true;
  if (typeof document !== 'undefined' && document.querySelector('[role="dialog"]')) return true;
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  if (t.isContentEditable || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return true;
  // Let focused buttons and links handle their own Enter/Space.
  if ((e.key === 'Enter' || e.key === ' ') && (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement)) return true;
  return false;
}
