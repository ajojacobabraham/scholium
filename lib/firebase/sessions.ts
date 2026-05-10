import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";
import type { CreateSessionInput, Session } from "@/types";
import { calculateEffortScore } from "../calculations/effort";

// ── Create session (atomic batch write) ──────────────────────────────────────

export async function createSessionTransaction(
  userId: string,
  input: CreateSessionInput,
  affectedAccountIds: string[]
) {
  const batch = writeBatch(db);

  const totalMinutes    = input.durationHours * 60 + input.durationMinutes;
  const effortScore     = calculateEffortScore(totalMinutes, input.difficulty, input.focus);
  const durationHours   = parseFloat((totalMinutes / 60).toFixed(4));
  const effortRemainder = parseFloat((effortScore - durationHours).toFixed(2));

  // 1. Create the Session Document
  const sessionRef = doc(collection(db, "sessions"));
  batch.set(sessionRef, {
    userId,
    accountId:  input.accountId,
    date:       input.date,
    duration:   totalMinutes,
    difficulty: input.difficulty,
    focus:      input.focus,
    effortScore,
    notes:      input.notes,
    isDeleted:  false,
    createdAt:  serverTimestamp(),
  });

  // 2. Create the Ledger Entry (split debit: Time + Effort)
  const ledgerRef = doc(collection(db, "ledgerEntries"));
  batch.set(ledgerRef, {
    userId,
    sessionId:          sessionRef.id,
    date:               input.date,
    debitTimeAccount:   "time",
    debitEffortAccount: "effort",
    creditAccountId:    input.accountId,
    durationHours,
    effortRemainder,
    effortScore,
    notes:              input.notes,
    isReversal:         false,
  });

  // 3. Update all affected accounts
  affectedAccountIds.forEach((id) => {
    batch.update(doc(db, "accounts", id), {
      totalEffortScore: increment(effortScore),
    });
  });

  await batch.commit();
}

// ── Fetch recent sessions for a specific account ──────────────────────────────

export async function fetchSessionsForAccount(
  accountId: string,
  limitCount = 5
): Promise<Session[]> {
  const q = query(
    collection(db, "sessions"),
    where("accountId", "==", accountId),
    where("isDeleted", "==", false),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
}

// ── Edit session notes (only editable field post-logging) ────────────────────

export async function updateSessionNotes(
  sessionId: string,
  notes: string
): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionId), { notes });

  // Mirror the notes update to the corresponding ledger entry
  const q    = query(collection(db, "ledgerEntries"), where("sessionId", "==", sessionId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { notes }));
  await batch.commit();
}

// ── Reverse a session (soft delete + reversal ledger entry) ──────────────────

export async function reverseSession(
  userId: string,
  sessionId: string,
  affectedAccountIds: string[]
): Promise<void> {
  const sessionSnap = await getDoc(doc(db, "sessions", sessionId));
  if (!sessionSnap.exists()) throw new Error("Session not found");

  const session         = sessionSnap.data();
  const effortScore: number = session.effortScore;
  const durationHours   = parseFloat((session.duration / 60).toFixed(4));
  const effortRemainder = parseFloat((effortScore - durationHours).toFixed(2));

  const batch = writeBatch(db);

  // 1. Soft delete the original session
  batch.update(doc(db, "sessions", sessionId), { isDeleted: true });

  // 2. Create a reversal ledger entry with negative values
  const reversalRef = doc(collection(db, "ledgerEntries"));
  batch.set(reversalRef, {
    userId,
    sessionId,
    date:               serverTimestamp(),
    debitTimeAccount:   "time",
    debitEffortAccount: "effort",
    creditAccountId:    session.accountId,
    durationHours:      -durationHours,
    effortRemainder:    -effortRemainder,
    effortScore:        -effortScore,
    notes:              `Reversal of session on ${new Date(session.date?.toDate?.() ?? session.date).toLocaleDateString()}`,
    isReversal:         true,
  });

  // 3. Reverse all affected account totals
  affectedAccountIds.forEach((id) => {
    batch.update(doc(db, "accounts", id), {
      totalEffortScore: increment(-effortScore),
    });
  });

  await batch.commit();
}