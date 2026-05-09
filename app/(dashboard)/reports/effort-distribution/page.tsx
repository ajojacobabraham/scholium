"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import { useLedgerStore } from "@/store/ledgerStore";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

export default function EffortDistributionPage() {
  const user         = useAuthStore((s) => s.user);
  const accounts     = useAccountStore((s) => s.accounts);
  const entries      = useLedgerStore((s) => s.entries);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);

  useEffect(() => { if (user) fetchEntries(user.uid); }, [user, fetchEntries]);

  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    entries.forEach((e) => {
      totals[e.creditAccountId] = (totals[e.creditAccountId] ?? 0) + e.effortScore;
    });

    return Object.entries(totals)
      .map(([id, effort]) => {
        const acc = accounts.find((a) => a.id === id);
        return { id, name: acc?.name ?? "Unknown", effort: parseFloat(effort.toFixed(2)) };
      })
      .sort((a, b) => b.effort - a.effort);
  }, [entries, accounts]);

  const grandTotal = data.reduce((s, d) => s + d.effort, 0);

  // Auto-generated insights
  const insights = useMemo(() => {
    if (data.length === 0) return [];
    const top = data[0];
    const msgs = [
      `Your top account is "${top.name}" with ${top.effort.toFixed(2)} pts (${grandTotal > 0 ? ((top.effort / grandTotal) * 100).toFixed(1) : 0}% of total effort).`,
    ];
    if (data.length >= 3) {
      const top3 = data.slice(0, 3).reduce((s, d) => s + d.effort, 0);
      msgs.push(`Your top 3 accounts account for ${grandTotal > 0 ? ((top3 / grandTotal) * 100).toFixed(1) : 0}% of all effort.`);
    }
    if (data.length > 1) {
      const bottom = data[data.length - 1];
      msgs.push(`"${bottom.name}" has received the least attention with ${bottom.effort.toFixed(2)} pts.`);
    }
    return msgs;
  }, [data, grandTotal]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Effort Distribution</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            How your effort is spread across accounts.
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          No sessions logged yet.
        </div>
      ) : (
        <>
          {/* Donut chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="effort"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                  formatter={(v: number) => [`${v.toFixed(2)} pts`, "Effort"]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Insights</p>
              {insights.map((msg, i) => (
                <p key={i} className="text-sm text-slate-600 flex gap-2">
                  <span className="text-slate-400 shrink-0">·</span>
                  {msg}
                </p>
              ))}
            </div>
          )}

          {/* Breakdown table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Account</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">Effort</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {row.name}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-700">
                      {row.effort.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">
                      {grandTotal > 0 ? `${((row.effort / grandTotal) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200 font-semibold">
                  <td className="px-5 py-3 text-slate-700">Total</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-700">{grandTotal.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-slate-500">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}