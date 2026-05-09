import { create } from "zustand";
import type { Account, AccountType, AccountTreeNode } from "@/types";
import {
  fetchAccounts,
  createAccount,
  deactivateAccount,
  updateAccount,
} from "@/lib/firebase/accounts";

interface AccountState {
  accounts:       Account[];
  isLoading:      boolean;
  error:          string | null;
  fetchAccounts:  (userId: string) => Promise<void>;
  createAccount:  (
    userId: string,
    name: string,
    type: AccountType,
    parentId: string | null,
    linkedAccountIds: string[]
  ) => Promise<void>;
  deactivateAccount: (accountId: string) => Promise<void>;
  updateAccount: (
    accountId: string,
    updates: Partial<Pick<Account, "name" | "linkedAccountIds">>
  ) => Promise<void>;
  getAccountTree: () => AccountTreeNode[];
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts:  [],
  isLoading: false,
  error:     null,

  fetchAccounts: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await fetchAccounts(userId);
      set({ accounts, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch accounts";
      set({ error: msg, isLoading: false });
    }
  },

  createAccount: async (userId, name, type, parentId, linkedAccountIds) => {
    set({ isLoading: true, error: null });
    try {
      const account = await createAccount(userId, name, type, parentId, linkedAccountIds);
      set((s) => ({ accounts: [...s.accounts, account], isLoading: false }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      set({ error: msg, isLoading: false });
    }
  },

  deactivateAccount: async (accountId) => {
    try {
      await deactivateAccount(accountId);
      set((s) => ({
        accounts: s.accounts.map((a) =>
          a.id === accountId ? { ...a, isActive: false } : a
        ),
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to deactivate account";
      set({ error: msg });
    }
  },

  updateAccount: async (accountId, updates) => {
    try {
      await updateAccount(accountId, updates);
      set((s) => ({
        accounts: s.accounts.map((a) =>
          a.id === accountId ? { ...a, ...updates } : a
        ),
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update account";
      set({ error: msg });
    }
  },

  // Build the nested tree structure from the flat accounts array
  getAccountTree: () => {
    const { accounts } = get();
    const active = accounts.filter((a) => a.isActive);
    const map = new Map<string, AccountTreeNode>();

    // First pass: create all nodes
    active.forEach((a) => map.set(a.id, { ...a, children: [] }));

    const roots: AccountTreeNode[] = [];

    // Second pass: attach children to parents
    active.forEach((a) => {
      const node = map.get(a.id)!;
      if (a.parentId && map.has(a.parentId)) {
        map.get(a.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },
}));