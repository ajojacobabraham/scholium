"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import { useSessionStore } from "@/store/sessionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RatingSelector from "@/components/sessions/RatingSelector";
import EffortPreview from "@/components/sessions/EffortPreview";
import { checkCircle, BookOpen, Clock, Zap, BarChart3, ArrowLeft } from "lucide-react";

function calculateEffort(hours: number, minutes: number, difficulty: number, focus: number) {
  const totalMinutes = hours * 60 + minutes;
  return parseFloat(((totalMinutes / 60) * difficulty * focus).toFixed(2));
}

export default function NewSessionPage() {
  const user = useAuthStore((s) => s.user);
  const accounts = useAccountStore((s) => s.accounts).filter((a) => a.isActive);
  const logSession = useSessionStore((s) => s.logSession);
  const isLoading = useSessionStore((s) => s.isLoading);

  const [accountId, setAccountId] = useState("");
  const [durationHours, setDurationHours] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [focus, setFocus] = useState<number>(3);
  const [notes, setNotes] = useState("");

  const [lastSession, setLastSession] = useState<{
    accountName: string;
    accountType: string;
    durationHours: number;
    durationMinutes: number;
    difficulty: number;
    focus: number;
    effortScore: number;
    notes: string;
    updatedBalance: string;
  } | null>(null);

  const canSubmit =
    !!accountId && (durationHours > 0 || durationMinutes > 0) && !isLoading && !lastSession;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !canSubmit) return;
    try {
      await logSession(user.uid, {
        accountId,
        date: new Date(),
        durationHours,
        durationMinutes,
        difficulty,
        focus,
        notes,
      });

      const effortScore = calculateEffort(durationHours, durationMinutes, difficulty, focus);
      const account = accounts.find((a) => a.id === accountId);
      const updatedBalance = account ? (account.totalEffortScore + effortScore).toFixed(2) : "0.00";

      setLastSession({
        accountName: account?.name ?? "Unknown",
        accountType: account?.type ?? "knowledge",
        durationHours,
        durationMinutes,
        difficulty,
        focus,
        effortScore,
        notes,
        updatedBalance,
      });
    } catch (err) {
      console.error(err);
    }
  }

  function resetForm() {
    setAccountId("");
    setDurationHours(0);
    setDurationMinutes(0);
    setDifficulty(3);
    setFocus(3);
    setNotes("");
    setLastSession(null);
  }

  function goHome() {
    window.location.href = "/dashboard";
  }

  if (lastSession) {
    return (
      <div className="max-w-lg mx-auto space-y-8">
        <div className="text-center space-y-4">
          <checkCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Session Logged!</h2>
            <p className="text-sm text-slate-500 mt-1">
              Posted to the ledger successfully.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <BookOpen className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-400">Account</p>
              <p className="font-semibold text-slate-900">{lastSession.accountName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-400">Duration</p>
              <p className="font-semibold text-slate-900">
                {lastSession.durationHours > 0 && `${lastSession.durationHours}h `}
                {lastSession.durationMinutes}m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Zap className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-400">Effort Score</p>
              <p className="text-2xl font-bold font-mono text-slate-900">
                {lastSession.effortScore.toFixed(2)} pts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-400">Difficulty / Focus</p>
              <p className="font-semibold text-slate-900">
                {lastSession.difficulty} / {lastSession.focus}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Account Balance</p>
            <p className="text-xl font-bold font-mono text-slate-900">
              {lastSession.updatedBalance} pts
            </p>
          </div>

          {lastSession.notes && (
            <p className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3">
              "{lastSession.notes}"
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={goHome} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button onClick={resetForm} className="flex-1">
            Log Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Log Study Session</h2>
        <p className="text-sm text-slate-500 mt-1">
          Record your effort and post it to the ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Form — takes up 2/3 */}
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          {/* Account selector */}
          <div className="space-y-2">
            <Label>Account to Credit</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a knowledge or goal account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.type === "knowledge" ? "📚 " : "🎯 "}
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={durationHours || ""}
                  onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                  hrs
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={durationMinutes || ""}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <RatingSelector
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            color="blue"
          />

          {/* Focus */}
          <RatingSelector
            label="Focus"
            value={focus}
            onChange={setFocus}
            color="violet"
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label>Journal Notes</Label>
            <Textarea
              placeholder="What did you work on? Any breakthroughs or blockers?"
              className="resize-none"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {isLoading ? "Posting to Ledger..." : "Log Session"}
          </Button>
        </form>

        {/* Effort preview — takes up 1/3 */}
        <EffortPreview
          durationHours={durationHours}
          durationMinutes={durationMinutes}
          difficulty={difficulty}
          focus={focus}
        />
      </div>
    </div>
  );
}
