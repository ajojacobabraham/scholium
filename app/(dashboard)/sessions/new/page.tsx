"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewSessionPage() {
  const router     = useRouter();
  const user       = useAuthStore((s) => s.user);
  const accounts   = useAccountStore((s) => s.accounts).filter((a) => a.isActive);
  const logSession = useSessionStore((s) => s.logSession);
  const isLoading  = useSessionStore((s) => s.isLoading);

  const [accountId,       setAccountId]       = useState("");
  const [durationHours,   setDurationHours]   = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [difficulty,      setDifficulty]      = useState<number>(3);
  const [focus,           setFocus]           = useState<number>(3);
  const [notes,           setNotes]           = useState("");

  const canSubmit =
    !!accountId && (durationHours > 0 || durationMinutes > 0) && !isLoading;

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
      router.push("/accounts");
    } catch (err) {
      console.error(err);
    }
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
            {isLoading ? "Posting to ledger..." : "Log Session"}
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