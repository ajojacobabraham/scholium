"use client";

import { useMemo, useState } from "react";
import { useAccountStore } from "@/store/accountStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account } from "@/types";

type Range = "7d" | "30d" | "all";

function getStartDate(range: Range): Date | null {
  if (range === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - (range === "7d" ? 7 : 30));
  return d;
}

export default function BalanceSheetPage() {
  const user         = useAuthStore((s) => s.user);
  const accounts     = useAccountStore((s) => s.accounts).filter((a) => a.isActive);
  const entries      = useLedgerStore((s) => s.entries);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);
  const [range, setRange] = useState<Range>("all");

  useEffect(() => {
    if (user) fetchEntries(user.uid);
  }, [user, fetchEntries]);

  const rows = useMemo(() => {
    const startDate = getStartDate(range);

    // Count sessions per account within range
    const sessionCounts: Record<string, number> = {};
    const effortTotals:  Record<string, number> = {};

    entries.forEach((e) => {
      if (startDate) {
        const d = e.date?.toDate ? e.date.toDate() : new Date();
        if (d < startDate) return;
      }
      sessionCounts[e.creditAccountId] = (sessionCounts[e.creditAccountId] ?? 0) + 1;
      effortTotals[e.creditAccountId]  = (effortTotals[e.creditAccountId]  ?? 0) + e.effortScore;
    });

    return accounts
      .map((a) => ({
        ...a,
        sessions: sessionCounts[a.id] ?? 0,
        effort:   effortTotals[a.id]  ?? 0,
      }))
      .sort((a, b) => b.effort - a.effort);
  }, [accounts, entries, range]);

  const totals = useMemo(() => ({
    effort:   rows.reduce((s, r) => s + r.effort,   0),
    sessions: rows.reduce((s, r) => s + r.sessions, 0),
  }), [rows]);

  const maxEffort = rows[0]?.effort ?? 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Effort Balance Sheet</h2>
          <p className="text-sm text-slate-500 mt-0.5">All accounts ranked by effort invested.</p>
        </div>
      </div>

      {/* Range toggle */}
      <div className="flex gap-2">
        {(["7d", "30d", "all"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              range === r
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All time"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Account</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Type</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Sessions</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500 w-48">Effort</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-400">
                  No data for this period.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                      row.type === "knowledge"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                    )}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-slate-600">
                    {row.sessions}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {/* Bar */}
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(row.effort / maxEffort) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-800 w-16 text-right">
                        {row.effort.toFixed(2)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200 font-semibold">
              <td className="px-5 py-3 text-slate-700">Total</td>
              <td />
              <td className="px-5 py-3 text-right font-mono text-slate-700">{totals.sessions}</td>
              <td className="px-5 py-3 text-right font-mono text-slate-700 pr-5">{totals.effort.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}