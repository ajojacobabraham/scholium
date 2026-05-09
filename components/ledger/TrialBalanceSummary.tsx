"use client";

import { CheckCircle2 } from "lucide-react";
import type { LedgerEntry } from "@/types";

interface Props {
  entries: LedgerEntry[];
}

export default function TrialBalanceSummary({ entries }: Props) {
  const total = entries.reduce((sum, e) => sum + e.effortScore, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 text-emerald-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Books are balanced</span>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-0.5">Total Debits</p>
          <p className="text-sm font-mono font-semibold text-slate-800">
            {total.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-0.5">Total Credits</p>
          <p className="text-sm font-mono font-semibold text-slate-800">
            {total.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-0.5">Entries</p>
          <p className="text-sm font-mono font-semibold text-slate-800">
            {entries.length}
          </p>
        </div>
      </div>
    </div>
  );
}   