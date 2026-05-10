"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useAccountStore } from "@/store/accountStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Target, BookOpen, Zap, TrendingUp, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAllSessions } from "@/lib/firebase/ledger";
import type { Session } from "@/types";

const TIME_RANGES: { label: string; value: "7d" | "30d" | "3m" | "1y" | "all" }[] = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "3M", value: "3m" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const entries = useLedgerStore((s) => s.entries);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);
  const accounts = useAccountStore((s) => s.accounts);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "3m" | "1y" | "all">("7d");
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchEntries(user.uid);
    fetchAllSessions(user.uid).then(setSessions);
  }, [user, fetchEntries]);

  // Date helpers
  const rangeEnd = useMemo(() => new Date(), []);
  const rangeStart = useMemo(() => {
    const now = new Date();
    if (timeRange === "7d") { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    if (timeRange === "30d") { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    if (timeRange === "3m") { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
    if (timeRange === "1y") { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    return new Date(0);
  }, [timeRange]);

  const inRangeEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = e.date?.toDate ? e.date.toDate() : new Date();
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [entries, rangeStart, rangeEnd]);

  const inRangeSessions = useMemo(() => {
    return sessions.filter((s) => {
      const d = s.date?.toDate ? s.date.toDate() : new Date();
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [sessions, rangeStart, rangeEnd]);

  // Top-level stats (all time)
  const stats = useMemo(() => {
    const totalEffort = entries.reduce((sum, e) => sum + e.effortScore, 0);
    const activeGoals = accounts.filter(a => a.type === "goal" && a.isActive).length;
    const activeKnowledge = accounts.filter(a => a.type === "knowledge" && a.isActive).length;
    return { totalEffort, totalSessions: entries.length, activeGoals, activeKnowledge };
  }, [entries, accounts]);

  // Average focus & difficulty (selected range)
  const averages = useMemo(() => {
    if (inRangeSessions.length === 0) return { avgFocus: 0, avgDifficulty: 0 };
    const avgFocus = inRangeSessions.reduce((s, e) => s + e.focus, 0) / inRangeSessions.length;
    const avgDifficulty = inRangeSessions.reduce((s, e) => s + e.difficulty, 0) / inRangeSessions.length;
    return { avgFocus, avgDifficulty };
  }, [inRangeSessions]);

  // Chart data
  const chartData = useMemo(() => {
    if (timeRange === "all") {
      const monthly: Record<string, number> = {};
      entries.forEach(entry => {
        const d = entry.date?.toDate ? entry.date.toDate() : new Date();
        const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthly[key] = (monthly[key] || 0) + entry.effortScore;
      });
      return Object.entries(monthly).map(([date, score]) => ({ date, score: parseFloat(score.toFixed(2)) }));
    }

    let totalDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "3m" ? 90 : 365;
    const daysMap: Record<string, number> = {};
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      daysMap[d.toISOString().slice(0, 10)] = 0;
    }

    entries.forEach(entry => {
      const d = entry.date?.toDate ? entry.date.toDate() : new Date();
      const key = d.toISOString().slice(0, 10);
      if (daysMap[key] !== undefined) daysMap[key] += entry.effortScore;
    });

const step = totalDays > 60 ? 14 : totalDays > 30 ? 7 : 1;
const aggregated: Map<string, number> = new Map();

for (const [key, val] of Object.entries(daysMap)) {
  // Extract the raw timestamp based on whether we are grouping or not
  const bucketTs = step > 1 
    ? Math.floor(Date.parse(key + "T00:00:00") / (86400000 * step)) * (86400000 * step) 
    : Date.parse(key + "T00:00:00");

  // Pass the raw timestamp directly into new Date()
  const aggKey = new Date(bucketTs).toISOString().slice(0, 10);
  aggregated.set(aggKey, (aggregated.get(aggKey) || 0) + val);
}
    const label = (key: string) => {
      const d = new Date(key + "T00:00:00");
      return totalDays > 90
        ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return Array.from(aggregated.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, score]) => ({ date: label(date), score: parseFloat(score.toFixed(2)) }));
  }, [entries, timeRange]);

  // Top accounts
  const topAccounts = useMemo(() =>
    [...accounts].filter(a => a.isActive).sort((a, b) => b.totalEffortScore - a.totalEffortScore).slice(0, 5)
  , [accounts]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Analytics Overview</h2>
        <p className="text-slate-500 mt-1">Track your momentum and ledger balances.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Effort</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalEffort.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Lifetime points earned</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Study Sessions</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSessions}</div>
            <p className="text-xs text-slate-500 mt-1">Total sessions logged</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.activeGoals}</div>
            <p className="text-xs text-slate-500 mt-1">Objectives in progress</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Knowledge Topics</CardTitle>
            <BookOpen className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.activeKnowledge}</div>
            <p className="text-xs text-slate-500 mt-1">Subjects being tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional stat cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Focus</CardTitle>
            <Brain className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {averages.avgFocus > 0 ? averages.avgFocus.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {timeRange === "7d" ? "Last 7 days focus" : inRangeSessions.length > 0 ? `Across ${inRangeSessions.length} sessions` : "No sessions in range"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Difficulty</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {averages.avgDifficulty > 0 ? averages.avgDifficulty.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {timeRange === "7d" ? "Last 7 days difficulty" : inRangeSessions.length > 0 ? `Across ${inRangeSessions.length} sessions` : "No sessions in range"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Effort Velocity Chart */}
      <Card className="bg-white border-slate-200 shadow-sm col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-slate-800">
              Effort Velocity ({timeRange === "all" ? "All Time" : timeRange === "1y" ? "Past Year" : timeRange === "3m" ? "Past 3 Months" : `Last ${timeRange.replace("d", " days")}`})
            </CardTitle>
            <div className="flex items-center gap-1">
              {TIME_RANGES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setTimeRange(value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    timeRange === value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Accounts */}
      {topAccounts.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Top Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAccounts.map((acc, i) => {
                const maxScore = topAccounts[0]?.totalEffortScore ?? 1;
                const pct = (acc.totalEffortScore / maxScore) * 100;
                return (
                  <div key={acc.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                          {acc.type === "knowledge" ? "📚" : "🎯"} {acc.name}
                        </span>
                      </div>
                      <span className="text-sm font-mono text-slate-600">
                        {acc.totalEffortScore.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full ml-6 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
