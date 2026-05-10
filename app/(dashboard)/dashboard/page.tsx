"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useAccountStore } from "@/store/accountStore";
import { fetchSessionsForAccount } from "@/lib/firebase/sessions";
import type { Session } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Activity, Target, BookOpen, Zap, Brain, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d" | "3m" | "1y" | "all";

const RANGES: { label: string; value: Range }[] = [
  { label: "7D",  value: "7d"  },
  { label: "30D", value: "30d" },
  { label: "3M",  value: "3m"  },
  { label: "1Y",  value: "1y"  },
  { label: "All", value: "all" },
];

function getStartDate(range: Range): Date | null {
  const now = new Date();
  if (range === "7d")  { const d = new Date(now); d.setDate(d.getDate() - 7);   return d; }
  if (range === "30d") { const d = new Date(now); d.setDate(d.getDate() - 30);  return d; }
  if (range === "3m")  { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
  if (range === "1y")  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
  return null;
}

export default function DashboardPage() {
  const user          = useAuthStore((s) => s.user);
  const entries       = useLedgerStore((s) => s.entries);
  const fetchEntries  = useLedgerStore((s) => s.fetchEntries);
  const accounts      = useAccountStore((s) => s.accounts);

  const [range,    setRange]    = useState<Range>("7d");
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => { if (user) fetchEntries(user.uid); }, [user, fetchEntries]);

  // Fetch sessions for avg focus/difficulty
  useEffect(() => {
    if (!user || accounts.length === 0) return;
    Promise.all(
      accounts.filter((a) => a.isActive).map((a) => fetchSessionsForAccount(a.id, 100))
    ).then((results) => setSessions(results.flat()));
  }, [user, accounts]);

  // Filter entries by selected range
  const filteredEntries = useMemo(() => {
    const startDate = getStartDate(range);
    if (!startDate) return entries;
    return entries.filter((e) => {
      const d = e.date?.toDate ? e.date.toDate() : new Date();
      return d >= startDate;
    });
  }, [entries, range]);

  // Summary stats (scoped to range)
  const stats = useMemo(() => {
    const totalEffort   = filteredEntries.reduce((s, e) => s + e.effortScore, 0);
    const totalSessions = filteredEntries.length;
    const activeGoals   = accounts.filter((a) => a.type === "goal"      && a.isActive).length;
    const activeKnow    = accounts.filter((a) => a.type === "knowledge" && a.isActive).length;
    return { totalEffort, totalSessions, activeGoals, activeKnow };
  }, [filteredEntries, accounts]);

  // Avg focus & difficulty (all time — not range scoped, needs sessions)
  const avgStats = useMemo(() => {
    if (sessions.length === 0) return { focus: 0, difficulty: 0 };
    const focus      = sessions.reduce((s, x) => s + x.focus,      0) / sessions.length;
    const difficulty = sessions.reduce((s, x) => s + x.difficulty, 0) / sessions.length;
    return { focus: focus.toFixed(2), difficulty: difficulty.toFixed(2) };
  }, [sessions]);

  // Chart: daily effort within range
  const chartData = useMemo(() => {
    const startDate = getStartDate(range);
    const days      = range === "7d" ? 7 : range === "30d" ? 30 : range === "3m" ? 90 : range === "1y" ? 365 : null;

    const dailyEffort: Record<string, number> = {};

    if (days) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dailyEffort[key] = 0;
      }
    }

    filteredEntries.forEach((e) => {
      const d   = e.date?.toDate ? e.date.toDate() : new Date();
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyEffort[key] = (dailyEffort[key] ?? 0) + e.effortScore;
    });

    return Object.entries(dailyEffort).map(([date, score]) => ({
      date,
      score: parseFloat(score.toFixed(2)),
    }));
  }, [filteredEntries, range]);

  // Top 5 accounts by effort score (all time from account totals)
  const topAccounts = useMemo(() => {
    return [...accounts]
      .filter((a) => a.isActive && a.totalEffortScore > 0)
      .sort((a, b) => b.totalEffortScore - a.totalEffortScore)
      .slice(0, 5);
  }, [accounts]);

  const maxEffort = topAccounts[0]?.totalEffortScore ?? 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header + range toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Your study momentum at a glance.</p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                range === value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Effort"       value={stats.totalEffort.toFixed(2)} sub="Points earned"         icon={Activity} color="text-blue-600"    />
        <StatCard title="Study Sessions"     value={stats.totalSessions}          sub="Sessions logged"       icon={Zap}      color="text-amber-500"   />
        <StatCard title="Active Goals"       value={stats.activeGoals}            sub="Objectives in progress"icon={Target}   color="text-emerald-600" />
        <StatCard title="Knowledge Topics"   value={stats.activeKnow}             sub="Subjects tracked"      icon={BookOpen} color="text-indigo-600"  />
        <StatCard title="Avg Focus"          value={avgStats.focus}               sub="Out of 5 (all time)"   icon={Brain}    color="text-violet-500"  />
        <StatCard title="Avg Difficulty"     value={avgStats.difficulty}          sub="Out of 5 (all time)"   icon={Flame}    color="text-rose-500"    />
      </div>

      {/* Effort over time chart */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-800">Effort Over Time</CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 24, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={8}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dx={-4}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top accounts */}
      {topAccounts.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Top Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-3">
                <span className="text-sm w-32 truncate text-slate-700 shrink-0">{acc.name}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      acc.type === "knowledge" ? "bg-blue-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${(acc.totalEffortScore / maxEffort) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-500 w-16 text-right shrink-0">
                  {acc.totalEffortScore.toFixed(2)} pts
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title, value, sub, icon: Icon, color,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}