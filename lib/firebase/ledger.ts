import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "./config";
import type { LedgerEntry, Session } from "@/types";

export async function fetchLedgerEntries(userId: string): Promise<LedgerEntry[]> {
  const q = query(
    collection(db, "ledgerEntries"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LedgerEntry));
}

export async function fetchAllSessions(userId: string): Promise<Session[]> {
  const q = query(
    collection(db, "sessions"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
}