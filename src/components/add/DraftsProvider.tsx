import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Draft } from '@/schemas/transactionForm';
import type { ReceiptPhoto } from '@/services';

interface DraftsContextValue {
  drafts: Draft[];
  setDrafts: (drafts: Draft[]) => void;
  updateDraft: (draft: Draft) => void;
  removeDraft: (key: string) => void;
  /** Captured receipt photo (uri + base64 for the AI), or 'sample' for the demo receipt */
  receiptPhoto: ReceiptPhoto | null;
  setReceiptPhoto: (photo: ReceiptPhoto | null) => void;
}

const DraftsContext = createContext<DraftsContextValue | null>(null);

/**
 * Unsaved transactions shared by the add flows (manual → confirm, scan →
 * review → confirm, voice → confirm). It wraps the modals stack, so drafts
 * live exactly as long as the flow is open and vanish when it closes.
 * Passing them in URL params would mean serialising objects into strings
 * (and on web a photo URI is a multi-megabyte base64 string).
 */
export function DraftsProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [receiptPhoto, setReceiptPhoto] = useState<ReceiptPhoto | null>(null);
  const updateDraft = useCallback((d: Draft) => setDrafts((all) => all.map((x) => (x.key === d.key ? d : x))), []);
  const removeDraft = useCallback((key: string) => setDrafts((all) => all.filter((x) => x.key !== key)), []);
  const value = useMemo(
    () => ({ drafts, setDrafts, updateDraft, removeDraft, receiptPhoto, setReceiptPhoto }),
    [drafts, updateDraft, removeDraft, receiptPhoto],
  );
  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts() {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error('useDrafts must be used inside <DraftsProvider>');
  return ctx;
}
