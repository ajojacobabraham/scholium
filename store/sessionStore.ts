import { create } from "zustand";
import type { CreateSessionInput, Account } from "@/types";
import {
  createSessionTransaction,
  reverseSession,
  updateSessionNotes,
} from "@/lib/firebase/sessions";
import { useAccountStore } from "./accountStore";

interface SessionState {
  isLoading: boolean;
  error:     string | null;
  logSession:        (userId: string, input: CreateSessionInput) => Promise<void>;
  deleteSession:     (userId: string, sessionId: string) => Promise<void>;
  editSessionNotes:  (sessionId: string, notes: string) => Promise<void>;
}

// Determine all accounts that should receive/lose effort points
function getAffectedAccountIds(accounts: Account[], targetAccountId: string): string[] {
  const affected = new Set<string>();
  const target   = accounts.find((a) => a.id === targetAccountId);
  if (!target) return [];

  affected.add(target.id);

  if (target.type === "goal" && target.linkedAccountIds) {
    target.linkedAccountIds.forEach((id) => affected.add(id));
  }

  const traverseUp = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (acc?.parentId) {
      affected.add(acc.parentId);
      traverseUp(acc.parentId);
    }
  };

  Array.from(affected).forEach((id) => traverseUp(id));
  return Array.from(affected);
}

export const useSessionStore = create<SessionState>((set) => ({
  isLoading: false,
  error:     null,

  logSession: async (userId, input) => {
    set({ isLoading: true, error: null });
    try {
      const accounts     = useAccountStore.getState().accounts;
      const affectedIds  = getAffectedAccountIds(accounts, input.accountId);
      await createSessionTransaction(userId, input, affectedIds);
      await useAccountStore.getState().fetchAccounts(userId);
      set({ isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log session";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteSession: async (userId, sessionId) => {
    set({ isLoading: true, error: null });
    try {
      // We need the session's accountId to calculate affected accounts.
      // Fetch it from Firestore via the existing getDoc in reverseSession.
      // But we need accountId first to build affectedIds — fetch session doc here.
      const { getDoc, doc } = await import("firebase/firestore");
      const { db }          = await import("@/lib/firebase/config");
      const snap            = await getDoc(doc(db, "sessions", sessionId));
      if (!snap.exists()) throw new Error("Session not found");

      const accounts    = useAccountStore.getState().accounts;
      const accountId   = snap.data().accountId as string;
      const affectedIds = getAffectedAccountIds(accounts, accountId);

      await reverseSession(userId, sessionId, affectedIds);
      await useAccountStore.getState().fetchAccounts(userId);
      set({ isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete session";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  editSessionNotes: async (sessionId, notes) => {
    set({ isLoading: true, error: null });
    try {
      await updateSessionNotes(sessionId, notes);
      set({ isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update notes";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },
}));