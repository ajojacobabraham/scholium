"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { fetchSessionsForAccount } from "@/lib/firebase/sessions";
import { useState } from "react";
import type { Session } from "@/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function FocusDifficultyPage() {
  const user         = useAuthStore((s) => s.user);
  const accounts     = useAccountStore((s) => s.accounts);
  const entries      = useLedgerStore((s) => s.entries);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);
  const [sessions,   setSessions]   = useState<Session[]>([]);

  useEffect(() => { if (user) fetchEntries(user.uid); }, [user, fetchEntries]);

  // Fetch all sessions for all accounts
  useEffect(() => {
    if (!user || accounts.length === 0) return;
    Promise.all(
      accounts.filter((a) => a.isActive).map((a) => fetchSessionsForAccount(a.id, 100))
    ).then((results) => {
      const all = results.flat().sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date();
        const db = b.date?.toDate ? b.date.toDate() : new Date();
        return da.getTime() - db.getTime();
      });
      setSessions(all);
    });
  }, [user, accounts]);

  // Average cards
  const averages = useMemo(() => {
    if (sessions.length === 0) return { focus: 0, difficulty: 0 };
    const focus      = sessions.reduce((s, x) => s + x.focus,      0) / sessions.length;
    const difficulty = sessions.reduce((s, x) => s + x.difficulty, 0) / sessions.length;
    return { focus: parseFloat(focus.toFixed(2)), difficulty: parseFloat(difficulty.toFixed(2)) };
  }, [sessions]);

  // Chart: group by date, average focus + difficulty per day
  const chartData = useMemo(() => {
    const byDate: Record<string, { focus: number[]; difficulty: number[] }> = {};
    sessions.forEach((s) => {
      const d   = s.date?.toDate ? s.date.toDate() : new Date();
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!byDate[key]) byDate[key] = { focus: [], difficulty: [] };
      byDate[key].focus.push(s.focus);
      byDate[key].difficulty.push(s.difficulty);
    });
    return Object.entries(byDate).map(([date, vals]) => ({
      date,
      focus:      parseFloat((vals.focus.reduce((a, b) => a + b, 0) / vals.focus.length).toFixed(2)),
      difficulty: parseFloat((vals.difficulty.reduce((a, b) => a + b, 0) / vals.difficulty.length).toFixed(2)),
    }));
  }, [sessions]);

  // Per-account breakdown
  const accountBreakdown = useMemo(() => {
    const map: Record<string, Session[]> = {};
    sessions.forEach((s) => {
      if (!map[s.accountId]) map[s.accountId] = [];
      map[s.accountId].push(s);
    });
    return Object.entries(map).map(([accountId, sess]) => {
      const acc        = accounts.find((a) => a.id === accountId);
      const avgFocus   = sess.reduce((s, x) => s + x.focus,      0) / sess.length;
      const avgDiff    = sess.reduce((s, x) => s + x.difficulty, 0) / sess.length;
      return {
        name:       acc?.name ?? "Unknown",
        type:       acc?.type ?? "knowledge",
        sessions:   sess.length,
        avgFocus:   parseFloat(avgFocus.toFixed(2)),
        avgDiff:    parseFloat(avgDiff.toFixed(2)),
      };
    }).sort((a, b) => b.sessions - a.sessions);
  }, [sessions, accounts]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Focus & Difficulty Trends</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            How your focus and session difficulty have tracked over time.
          </p>
        </div>
      </div>

      {/* Average cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Avg Focus</p>
          <p className="text-3xl font-bold text-violet-500 font-mono">{averages.focus}</p>
          <p className="text-xs text-slate-400 mt-1">out of 5</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Avg Difficulty</p>
          <p className="text-3xl font-bold text-blue-500 font-mono">{averages.difficulty}</p>
          <p className="text-xs text-slate-400 mt-1">out of 5</p>
        </div>
      </div>

      {/* Dual line chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        {chartData.length < 2 ? (
          <p className="text-center text-slate-400 py-12 text-sm">
            Log more sessions across different days to see trends.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dx={-4} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
              <Line type="monotone" dataKey="focus"      name="Focus"      stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "#8b5cf6" }} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="difficulty" name="Difficulty" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "#3b82f6" }} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-account breakdown */}
      {accountBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Account</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Sessions</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Avg Focus</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Avg Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accountBreakdown.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800 flex items-center gap-2">
                    <span>{row.type === "knowledge" ? "📚" : "🎯"}</span>
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">{row.sessions}</td>
                  <td className="px-5 py-3 text-right font-mono text-violet-600">{row.avgFocus}</td>
                  <td className="px-5 py-3 text-right font-mono text-blue-600">{row.avgDiff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}