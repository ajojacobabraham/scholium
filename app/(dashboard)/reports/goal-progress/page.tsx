"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Target, BookOpen, Calendar, Clock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import { useLedgerStore } from "@/store/ledgerStore";
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from "recharts";

export default function GoalProgressPage() {
  const user         = useAuthStore((s) => s.user);
  const accounts     = useAccountStore((s) => s.accounts);
  const entries      = useLedgerStore((s) => s.entries);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);

  useEffect(() => { if (user) fetchEntries(user.uid); }, [user, fetchEntries]);

  const goalAccounts = useMemo(
    () => accounts.filter((a) => a.isActive && a.type === "goal"),
    [accounts]
  );

  const goals = useMemo(() => {
    return goalAccounts.map((goal) => {
      const goalEntries = entries
        .filter((e) => e.creditAccountId === goal.id)
        .sort((a, b) => {
          const da = a.date?.toDate ? a.date.toDate() : new Date();
          const db = b.date?.toDate ? b.date.toDate() : new Date();
          return da.getTime() - db.getTime();
        });

      const sessionCount = goalEntries.length;
      const totalEffort  = goalEntries.reduce((s, e) => s + e.effortScore, 0);

      const firstDate = goalEntries[0]?.date?.toDate
        ? goalEntries[0].date.toDate()
        : null;
      const lastDate = goalEntries[goalEntries.length - 1]?.date?.toDate
        ? goalEntries[goalEntries.length - 1].date.toDate()
        : null;

      // Mini sparkline data
      const sparkline = goalEntries.map((e, i) => ({
        i,
        score: e.effortScore,
      }));

      // Linked knowledge account names
      const linkedNames = goal.linkedAccountIds
        .map((id) => accounts.find((a) => a.id === id)?.name)
        .filter(Boolean) as string[];

      return { goal, sessionCount, totalEffort, firstDate, lastDate, sparkline, linkedNames };
    });
  }, [goalAccounts, entries, accounts]);

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Goal Progress</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Effort and session breakdown for every active goal.
          </p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No goal accounts yet.</p>
          <p className="text-sm mt-1">Create a goal account to track it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(({ goal, sessionCount, totalEffort, firstDate, lastDate, sparkline, linkedNames }) => (
            <div
              key={goal.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Target className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-slate-800">{goal.name}</h3>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono font-semibold text-slate-800">
                        {totalEffort.toFixed(2)}
                      </span>{" "}
                      pts
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">{sessionCount}</span>{" "}
                      {sessionCount === 1 ? "session" : "sessions"}
                    </span>
                    {firstDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Started {fmt(firstDate)}
                      </span>
                    )}
                    {lastDate && (
                      <span className="text-slate-400">
                        Last session {fmt(lastDate)}
                      </span>
                    )}
                  </div>

                  {/* Linked accounts */}
                  {linkedNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {linkedNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full"
                        >
                          <BookOpen className="w-3 h-3" />
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sparkline */}
                {sparkline.length > 1 && (
                  <div className="w-28 h-14 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkline}>
                        <Tooltip
                          contentStyle={{ fontSize: "11px", borderRadius: "6px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                          formatter={(v: number) => [`${v.toFixed(2)} pts`, "Effort"]}
                          labelFormatter={() => ""}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 3, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}