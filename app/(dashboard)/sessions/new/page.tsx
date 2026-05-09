"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import { useSessionStore } from "@/store/sessionStore";
import { getEffortBreakdown } from "@/lib/calculations/effort";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Need to install this component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewSessionPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accounts = useAccountStore((s) => s.accounts).filter(a => a.isActive);
  const logSession = useSessionStore((s) => s.logSession);
  const isLoading = useSessionStore((s) => s.isLoading);

  const [accountId, setAccountId] = useState("");
  const [durationHours, setDurationHours] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [focus, setFocus] = useState<number>(3);
  const [notes, setNotes] = useState("");

  const breakdown = getEffortBreakdown(durationHours, durationMinutes, difficulty, focus);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !accountId) return;

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
      router.push("/accounts");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Log Study Session</h2>
        <p className="text-sm text-slate-500 mt-1">Record your effort and post it to the ledger.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <Label>Account to Credit</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                type="number"
                min="0"
                value={durationHours}
                onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Minutes</Label>
              <Input
                type="number"
                min="0"
                max="59"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Focus (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={focus}
                onChange={(e) => setFocus(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Journal Notes</Label>
            <Textarea
              placeholder="What did you work on?"
              className="resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !accountId || (durationHours === 0 && durationMinutes === 0)}>
            {isLoading ? "Posting to Ledger..." : "Log Session"}
          </Button>
        </form>

        {/* Live Preview Panel */}
        <div className="bg-slate-900 text-white p-6 rounded-xl h-fit sticky top-8">
          <h3 className="font-semibold mb-4 text-slate-300">Effort Calculation</h3>
          
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Time (hrs)</span>
              <span>{breakdown.durationInHours.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">× Difficulty</span>
              <span>{breakdown.difficulty.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">× Focus</span>
              <span>{breakdown.focus.toFixed(2)}</span>
            </div>
            
            <div className="border-t border-slate-700 my-3 pt-3 flex justify-between font-bold text-lg text-emerald-400">
              <span>Points</span>
              <span>{breakdown.score.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}