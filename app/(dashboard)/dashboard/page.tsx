"use client";

import { useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useAccountStore } from "@/store/accountStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Target, BookOpen, Zap } from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const entries = useLedgerStore((s) => s.entries);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);
  const accounts = useAccountStore((s) => s.accounts);

  // Ensure ledger data is loaded if they land here first
  useEffect(() => {
    if (user) fetchEntries(user.uid);
  }, [user, fetchEntries]);

  // Calculate top-level stats
  const stats = useMemo(() => {
    const totalEffort = entries.reduce((sum, e) => sum + e.effortScore, 0);
    const totalSessions = entries.length; // 1 entry = 1 session per our spec
    
    const activeGoals = accounts.filter(a => a.type === "goal" && a.isActive).length;
    const activeKnowledge = accounts.filter(a => a.type === "knowledge" && a.isActive).length;

    return { totalEffort, totalSessions, activeGoals, activeKnowledge };
  }, [entries, accounts]);

  // Process data for the Line Chart (grouping effort by date)
  const chartData = useMemo(() => {
    const dailyEffort: Record<string, number> = {};
    
    // Initialize the last 7 days with 0 effort
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyEffort[dateStr] = 0;
    }

    // Add actual effort from ledger entries
    entries.forEach(entry => {
      const dateObj = entry.date?.toDate ? entry.date.toDate() : new Date();
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (dailyEffort[dateStr] !== undefined) {
        dailyEffort[dateStr] += entry.effortScore;
      }
    });

    return Object.entries(dailyEffort).map(([date, score]) => ({
      date,
      score: parseFloat(score.toFixed(2))
    }));
  }, [entries]);

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

      {/* Chart Section */}
      <Card className="bg-white border-slate-200 shadow-sm col-span-4">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Effort Velocity (Last 7 Days)</CardTitle>
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
    </div>
  );
}