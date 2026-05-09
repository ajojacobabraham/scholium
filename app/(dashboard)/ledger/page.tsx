"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useAccountStore } from "@/store/accountStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LedgerPage() {
  const user = useAuthStore((s) => s.user);
  const entries = useLedgerStore((s) => s.entries);
  const isLoading = useLedgerStore((s) => s.isLoading);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);
  const accounts = useAccountStore((s) => s.accounts);

  useEffect(() => {
    if (user) fetchEntries(user.uid);
  }, [user, fetchEntries]);

  // Helper to map account IDs to readable names
  const getAccountName = (id: string) => {
    if (id === "timeAndEffort") return "Time & Effort";
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.name : "Unknown Account";
  };

  if (isLoading) {
    return <div className="text-slate-500">Loading general ledger...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">General Ledger</h2>
        <p className="text-sm text-slate-500 mt-1">
          Double-entry record of all your invested time and effort.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Narration (Notes)</TableHead>
              <TableHead className="w-[200px]">Account</TableHead>
              <TableHead className="text-right w-[100px]">Debit</TableHead>
              <TableHead className="text-right w-[100px]">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  No ledger entries yet. Log a study session to see it reflected here.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                // Safely parse the Firestore timestamp
                const dateObj = entry.date?.toDate ? entry.date.toDate() : new Date();
                const dateStr = new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(dateObj);

                return (
                  <React.Fragment key={entry.id}>
                    {/* Debit Row (Time & Effort Account) */}
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableCell className="align-top font-medium text-slate-600">
                        {dateStr}
                      </TableCell>
                      <TableCell className="align-top text-slate-600">
                        {entry.notes || "Study Session"}
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium">
                        {getAccountName(entry.debitAccount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-800">
                        {entry.effortScore.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-300">
                        -
                      </TableCell>
                    </TableRow>
                    
                    {/* Credit Row (Knowledge/Goal Account) */}
                    <TableRow className="bg-slate-50/30">
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-slate-600 pl-8">
                        {getAccountName(entry.creditAccountId)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-300">
                        -
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-800">
                        {entry.effortScore.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}