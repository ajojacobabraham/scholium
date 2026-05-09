"use client";

import { useEffect, useState } from "react";
import { useAccountStore } from "@/store/accountStore";
import { fetchSessionsForAccount } from "@/lib/firebase/sessions";
import type { Account, Session } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Target,
  X,
  Clock,
  TrendingUp,
  Link2,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  account: Account;
  onClose: () => void;
}

export default function AccountDetailPanel({ account, onClose }: Props) {
  const accounts = useAccountStore((s) => s.accounts);
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recent sessions for this account
  useEffect(() => {
    setIsLoading(true);
    fetchSessionsForAccount(account.id, 5)
      .then(setSessions)
      .finally(() => setIsLoading(false));
  }, [account.id]);

  // Direct children of this account
  const subAccounts = accounts.filter(
    (a) => a.parentId === account.id && a.isActive
  );

  // Linked accounts (for goals → knowledge, or knowledge → goals)
  const linkedAccounts = accounts.filter((a) =>
    account.linkedAccountIds.includes(a.id)
  );

  // Build mini chart data from the 5 recent sessions (oldest → newest)
  const chartData = [...sessions]
    .reverse()
    .map((s, i) => ({
      label: `S${i + 1}`,
      score: s.effortScore,
    }));

  const isKnowledge = account.type === "knowledge";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          {isKnowledge ? (
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-slate-900 text-base leading-tight">
              {account.name}
            </h3>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs mt-1 capitalize",
                isKnowledge
                  ? "bg-blue-50 text-blue-600"
                  : "bg-emerald-50 text-emerald-600"
              )}
            >
              {account.type}
            </Badge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Total effort score */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Total Effort Score
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {account.totalEffortScore.toFixed(2)}
            <span className="text-base font-normal text-slate-400 ml-1">pts</span>
          </div>
        </div>

        {/* Mini chart */}
        {sessions.length > 1 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Recent Effort
            </p>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "6px",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={isKnowledge ? "#3b82f6" : "#10b981"}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: isKnowledge ? "#3b82f6" : "#10b981" }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sub accounts */}
        {subAccounts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Sub Accounts
            </p>
            <div className="space-y-2">
              {subAccounts.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-sm text-slate-700">{sub.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {sub.totalEffortScore.toFixed(2)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked accounts */}
        {linkedAccounts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Linked Accounts
            </p>
            <div className="space-y-2">
              {linkedAccounts.map((linked) => (
                <div
                  key={linked.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {linked.type === "knowledge" ? (
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="text-sm text-slate-700">{linked.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {linked.totalEffortScore.toFixed(2)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recent Sessions
          </p>
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-slate-400">No sessions logged yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => {
                const dateObj = s.date?.toDate ? s.date.toDate() : new Date();
                const dateStr = new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(dateObj);
                const hrs  = Math.floor(s.duration / 60);
                const mins = s.duration % 60;
                const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

                return (
                  <div
                    key={s.id}
                    className="p-3 bg-white border border-slate-100 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{dateStr}</span>
                      <span className="text-xs font-mono font-medium text-slate-700">
                        {s.effortScore.toFixed(2)} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{durationStr}</span>
                      <span>·</span>
                      <span>Difficulty {s.difficulty}</span>
                      <span>·</span>
                      <span>Focus {s.focus}</span>
                    </div>
                    {s.notes && (
                      <p className="text-xs text-slate-500 italic truncate">
                        "{s.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}