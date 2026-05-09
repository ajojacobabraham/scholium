import { create } from "zustand";
import { type User as FirebaseUser } from "firebase/auth";
import { registerUser, signIn, signOut, subscribeToAuthChanges } from "@/lib/firebase/auth";

interface AuthState {
  user:        FirebaseUser | null;
  isLoading:   boolean;
  error:       string | null;
  signIn:      (email: string, password: string) => Promise<void>;
  register:    (email: string, password: string, displayName: string) => Promise<void>;
  signOut:     () => Promise<void>;
  initialize:  () => () => void;   // returns the unsubscribe function
  clearError:  () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  isLoading: true,   // true on first load until Firebase resolves auth state
  error:     null,

  initialize: () => {
    // Subscribe to Firebase auth state changes
    // This keeps our Zustand store in sync with Firebase at all times
    const unsubscribe = subscribeToAuthChanges((user) => {
      set({ user, isLoading: false });
    });
    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await signIn(email, password);
      // user state is set by the onAuthStateChanged listener above
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      await registerUser(email, password, displayName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await signOut();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign out";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));