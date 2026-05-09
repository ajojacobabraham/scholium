import { Timestamp } from "firebase/firestore";

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

export interface User {
  id:          string;
  email:       string;
  displayName: string;
  createdAt:   Timestamp;
}

// ─────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────

export type AccountType = "knowledge" | "goal";

export interface Account {
  id:               string;
  userId:           string;
  name:             string;
  type:             AccountType;
  parentId:         string | null;       // null = root level account
  linkedAccountIds: string[];            // goal → knowledge account links
  totalEffortScore: number;
  isActive:         boolean;
  createdAt:        Timestamp;
}

// A node in the rendered account tree
export interface AccountTreeNode extends Account {
  children: AccountTreeNode[];
}

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────

export interface Session {
  id:          string;
  userId:      string;
  accountId:   string;
  date:        Timestamp;
  duration:    number;        // stored in minutes
  difficulty:  number;        // 1–5
  focus:       number;        // 1–5
  effortScore: number;        // calculated: (duration / 60) × difficulty × focus
  notes:       string;
  createdAt:   Timestamp;
}

// What we send to the API when creating a session
export interface CreateSessionInput {
  accountId:  string;
  date:       Date;
  durationHours:   number;
  durationMinutes: number;
  difficulty: number;
  focus:      number;
  notes:      string;
}

// ─────────────────────────────────────────────
// LEDGER
// ─────────────────────────────────────────────

export interface LedgerEntry {
  id:              string;
  userId:          string;
  sessionId:       string;
  date:            Timestamp;
  debitAccount:    "timeAndEffort";      // always the same per the spec
  creditAccountId: string;
  effortScore:     number;
  notes:           string;
}

// ─────────────────────────────────────────────
// EFFORT SCORE
// ─────────────────────────────────────────────

// Used for the real time preview on the session form
export interface EffortScoreBreakdown {
  durationInHours: number;
  difficulty:      number;
  focus:           number;
  score:           number;
}
