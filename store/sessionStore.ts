import { create } from "zustand";
import type { CreateSessionInput, Account } from "@/types";
import { createSessionTransaction } from "@/lib/firebase/sessions";
import { useAccountStore } from "./accountStore";

interface SessionState {
  isLoading: boolean;
  error: string | null;
  logSession: (userId: string, input: CreateSessionInput) => Promise<void>;
}

// Helper to determine all accounts that should receive effort points
function getAffectedAccountIds(accounts: Account[], targetAccountId: string): string[] {
  const affected = new Set<string>();
  const target = accounts.find((a) => a.id === targetAccountId);
  
  if (!target) return [];

  // 1. Add the primary account
  affected.add(target.id);

  // 2. If it's a goal, add all linked knowledge accounts
  if (target.type === "goal" && target.linkedAccountIds) {
    target.linkedAccountIds.forEach((id) => affected.add(id));
  }

  // 3. Traverse up the tree to add parent accounts for everything currently affected
  const traverseUp = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (acc && acc.parentId) {
      affected.add(acc.parentId);
      traverseUp(acc.parentId); // recursive call
    }
  };

  Array.from(affected).forEach((id) => traverseUp(id));
  
  return Array.from(affected);
}

export const useSessionStore = create<SessionState>((set) => ({
  isLoading: false,
  error: null,

  logSession: async (userId, input) => {
    set({ isLoading: true, error: null });
    try {
      // Get the current accounts from the accountStore to calculate flow
      const accounts = useAccountStore.getState().accounts;
      const affectedIds = getAffectedAccountIds(accounts, input.accountId);

      await createSessionTransaction(userId, input, affectedIds);
      
      // Refresh accounts in the UI so the new balances show up immediately
      await useAccountStore.getState().fetchAccounts(userId);
      
      set({ isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log session";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },
}));