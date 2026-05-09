"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import { useLedgerStore } from "@/store/ledgerStore";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// Distinct colours for up to 8 accounts
const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

export default function KnowledgeGrowthPage() {
  const user         = useAuthStore((s) => s.user);
  const accounts     = useAccountStore((s) => s.accounts);
  const entries      = useLedgerStore((s) => s.entries);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);

  useEffect(() => { if (user) fetchEntries(user.uid); }, [user, fetchEntries]);

  // Only active knowledge accounts
  const knowledgeAccounts = useMemo(
    () => accounts.filter((a) => a.isActive && a.type === "knowledge"),
    [accounts]
  );

  // Toggle which accounts are shown
  const [visible, setVisible] = useState<Set<string>>(new Set());
  useEffect(() => {
    setVisible(new Set(knowledgeAccounts.map((a) => a.id)));
  }, [knowledgeAccounts]);

  function toggleAccount(id: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Build cumulative effort over time per account
  const { chartData, totalRow } = useMemo(() => {
    // Collect all unique dates (day granularity), sorted ascending
    const dateSet = new Set<string>();
    entries.forEach((e) => {
      const d = e.date?.toDate ? e.date.toDate() : new Date();
      dateSet.add(d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }));
    });
    const dates = Array.from(dateSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Running totals per account
    const running: Record<string, number> = {};
    knowledgeAccounts.forEach((a) => (running[a.id] = 0));

    const data = dates.map((date) => {
      const row: Record<string, string | number> = { date };
      entries
        .filter((e) => {
          const d = e.date?.toDate ? e.date.toDate() : new Date();
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) === date;
        })
        .forEach((e) => {
          if (running[e.creditAccountId] !== undefined) {
            running[e.creditAccountId] += e.effortScore;
          }
        });
      knowledgeAccounts.forEach((a) => { row[a.id] = parseFloat(running[a.id].toFixed(2)); });
      return row;
    });

    // Breakdown table totals
    const totalRow = knowledgeAccounts.map((a) => ({
      id:      a.id,
      name:    a.name,
      effort:  a.totalEffortScore,
    }));
    const grandTotal = totalRow.reduce((s, r) => s + r.effort, 0);

    return { chartData: data, totalRow, grandTotal };
  }, [entries, knowledgeAccounts]);

  const grandTotal = totalRow.reduce((s, r) => s + r.effort, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Knowledge Growth</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cumulative effort over time per knowledge account.
          </p>
        </div>
      </div>

      {/* Account toggles */}
      <div className="flex flex-wrap gap-2">
        {knowledgeAccounts.map((a, i) => {
          const color   = COLORS[i % COLORS.length];
          const active  = visible.has(a.id);
          return (
            <button
              key={a.id}
              onClick={() => toggleAccount(a.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                active ? "border-transparent text-white" : "border-slate-200 text-slate-400 bg-white"
              )}
              style={active ? { backgroundColor: color } : {}}
            >
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        {chartData.length < 2 ? (
          <p className="text-center text-slate-400 py-12 text-sm">
            Log at least two sessions to see the growth chart.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                axisLine={false} tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                dx={-4}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
              {knowledgeAccounts.map((a, i) =>
                visible.has(a.id) ? (
                  <Line
                    key={a.id}
                    type="monotone"
                    dataKey={a.id}
                    name={a.name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Breakdown table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Account</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Total Effort</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {totalRow
              .sort((a, b) => b.effort - a.effort)
              .map((row, i) => (
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
                    {grandTotal > 0
                      ? `${((row.effort / grandTotal) * 100).toFixed(1)}%`
                      : "—"}
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
    </div>
  );
}