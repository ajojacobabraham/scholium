import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Account, AccountType } from "@/types";

const COL = "accounts";

// Fetch all accounts for a user
export async function fetchAccounts(userId: string): Promise<Account[]> {
  const q = query(collection(db, COL), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Account));
}

// Create a new account
export async function createAccount(
  userId: string,
  name: string,
  type: AccountType,
  parentId: string | null,
  linkedAccountIds: string[]
): Promise<Account> {
  const data = {
    userId,
    name,
    type,
    parentId,
    linkedAccountIds,
    totalEffortScore: 0,
    isActive: true,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), data);
  return { id: ref.id, ...data } as unknown as Account;
}

// Deactivate an account (soft delete)
export async function deactivateAccount(accountId: string): Promise<void> {
  await updateDoc(doc(db, COL, accountId), { isActive: false });
}

// Update account name or linked accounts
export async function updateAccount(
  accountId: string,
  updates: Partial<Pick<Account, "name" | "linkedAccountIds">>
): Promise<void> {
  await updateDoc(doc(db, COL, accountId), updates);
}