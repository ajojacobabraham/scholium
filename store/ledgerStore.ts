import { create } from "zustand";
import type { LedgerEntry } from "@/types";
import { fetchLedgerEntries } from "@/lib/firebase/ledger";

interface LedgerState {
  entries: LedgerEntry[];
  isLoading: boolean;
  error: string | null;
  fetchEntries: (userId: string) => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchEntries: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await fetchLedgerEntries(userId);
      set({ entries, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch ledger";
      set({ error: msg, isLoading: false });
      console.error(err); // Helpful for catching the missing index error!
    }
  },
}));