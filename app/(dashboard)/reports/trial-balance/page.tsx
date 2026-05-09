"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { cn } from "@/lib/utils";

export default function TrialBalancePage() {
  const user         = useAuthStore((s) => s.user);
  const accounts     = useAccountStore((s) => s.accounts);
  const entries      = useLedgerStore((s) => s.entries);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);

  useEffect(() => { if (user) fetchEntries(user.uid); }, [user, fetchEntries]);

  const { rows, totalDebits, totalCredits, isBalanced } = useMemo(() => {
    // Aggregate debits and credits per account
    const debits:  Record<string, number> = {};
    const credits: Record<string, number> = {};

    entries.forEach((e) => {
      // Debit: Time & Effort account
      debits["timeAndEffort"] = (debits["timeAndEffort"] ?? 0) + e.effortScore;
      // Credit: Knowledge/Goal account
      credits[e.creditAccountId] = (credits[e.creditAccountId] ?? 0) + e.effortScore;
    });

    // Build rows: one for Time & Effort + one per credited account
    const allIds = new Set([
      "timeAndEffort",
      ...Object.keys(credits),
    ]);

    const rows = Array.from(allIds).map((id) => {
      const name =
        id === "timeAndEffort"
          ? "Time & Effort"
          : (accounts.find((a) => a.id === id)?.name ?? "Unknown");
      return {
        id,
        name,
        debit:  parseFloat((debits[id]  ?? 0).toFixed(2)),
        credit: parseFloat((credits[id] ?? 0).toFixed(2)),
      };
    });

    const totalDebits  = rows.reduce((s, r) => s + r.debit,  0);
    const totalCredits = rows.reduce((s, r) => s + r.credit, 0);
    const isBalanced   = Math.abs(totalDebits - totalCredits) < 0.001;

    return { rows, totalDebits, totalCredits, isBalanced };
  }, [entries, accounts]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trial Balance</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Full debit and credit summary across all accounts.
          </p>
        </div>
      </div>

      {/* Balance status */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border",
        isBalanced
          ? "bg-emerald-50 border-emerald-200"
          : "bg-red-50 border-red-200"
      )}>
        <div className="flex items-center gap-2">
          {isBalanced ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <span className={cn(
            "font-semibold text-sm",
            isBalanced ? "text-emerald-700" : "text-red-600"
          )}>
            {isBalanced ? "Books are balanced — debits equal credits" : "Imbalance detected"}
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Debits</p>
            <p className="font-mono font-semibold text-slate-800">{totalDebits.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Credits</p>
            <p className="font-mono font-semibold text-slate-800">{totalCredits.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Account</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Debit</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-slate-400">
                  No entries yet. Log a session to populate the trial balance.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-700">
                    {row.debit > 0 ? row.debit.toFixed(2) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-slate-700">
                    {row.credit > 0 ? row.credit.toFixed(2) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
              <td className="px-5 py-3 text-slate-800">Total</td>
              <td className="px-5 py-3 text-right font-mono text-slate-800">{totalDebits.toFixed(2)}</td>
              <td className="px-5 py-3 text-right font-mono text-slate-800">{totalCredits.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}