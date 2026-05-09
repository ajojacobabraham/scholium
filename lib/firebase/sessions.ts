import { collection, doc, writeBatch, serverTimestamp, increment } from "firebase/firestore";
import { db } from "./config";
import type { CreateSessionInput } from "@/types";
import { calculateEffortScore } from "../calculations/effort";

export async function createSessionTransaction(
  userId: string,
  input: CreateSessionInput,
  affectedAccountIds: string[]
) {
  const batch = writeBatch(db);
  
  const totalMinutes = input.durationHours * 60 + input.durationMinutes;
  const effortScore = calculateEffortScore(totalMinutes, input.difficulty, input.focus);

  // 1. Create the Session Document
  const sessionRef = doc(collection(db, "sessions"));
  batch.set(sessionRef, {
    userId,
    accountId: input.accountId,
    date: input.date,
    duration: totalMinutes,
    difficulty: input.difficulty,
    focus: input.focus,
    effortScore,
    notes: input.notes,
    createdAt: serverTimestamp(),
  });

  // 2. Create the Ledger Entry
  const ledgerRef = doc(collection(db, "ledgerEntries"));
  batch.set(ledgerRef, {
    userId,
    sessionId: sessionRef.id,
    date: input.date,
    debitAccount: "timeAndEffort",
    creditAccountId: input.accountId,
    effortScore,
    notes: input.notes,
  });

  // 3. Update all affected accounts (Primary, Linked, and Parents)
  affectedAccountIds.forEach((id) => {
    const accRef = doc(db, "accounts", id);
    batch.update(accRef, {
      totalEffortScore: increment(effortScore),
    });
  });

  await batch.commit();
}