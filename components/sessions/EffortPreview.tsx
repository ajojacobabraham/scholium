"use client";

import { useMemo } from "react";
import { getEffortBreakdown } from "@/lib/calculations/effort";
import { cn } from "@/lib/utils";

interface Props {
  durationHours:   number;
  durationMinutes: number;
  difficulty:      number;
  focus:           number;
}

// Contextual label based on score
function getScoreLabel(score: number): string {
  if (score === 0)   return "Fill in the form to see your score";
  if (score < 5)     return "Light session";
  if (score < 10)    return "Solid session";
  if (score < 20)    return "Deep work";
  if (score < 35)    return "High intensity";
  return "Exceptional effort";
}

// Color theme based on score intensity
function getScoreTheme(score: number): {
  bg: string; bar: string; score: string; label: string;
} {
  if (score === 0)  return { bg: "bg-slate-900",    bar: "bg-slate-700",   score: "text-slate-500",  label: "text-slate-500" };
  if (score < 5)    return { bg: "bg-slate-900",    bar: "bg-blue-600",    score: "text-blue-400",   label: "text-slate-400" };
  if (score < 10)   return { bg: "bg-slate-900",    bar: "bg-blue-500",    score: "text-blue-300",   label: "text-slate-300" };
  if (score < 20)   return { bg: "bg-slate-900",    bar: "bg-violet-500",  score: "text-violet-300", label: "text-slate-300" };
  if (score < 35)   return { bg: "bg-slate-900",    bar: "bg-amber-500",   score: "text-amber-300",  label: "text-slate-200" };
  return              { bg: "bg-slate-900",    bar: "bg-emerald-400", score: "text-emerald-300",label: "text-slate-100" };
}

// Max score for the progress bar (2hrs × 5 × 5 = 50)
const MAX_SCORE = 50;

export default function EffortPreview({ durationHours, durationMinutes, difficulty, focus }: Props) {
  const breakdown = useMemo(
    () => getEffortBreakdown(durationHours, durationMinutes, difficulty, focus),
    [durationHours, durationMinutes, difficulty, focus]
  );

  const theme      = getScoreTheme(breakdown.score);
  const barPercent = Math.min((breakdown.score / MAX_SCORE) * 100, 100);
  const label      = getScoreLabel(breakdown.score);

  return (
    <div className={cn("rounded-xl p-6 space-y-5 h-fit sticky top-8", theme.bg)}>
      {/* Score */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">
          Effort Score
        </p>
        <div className={cn("text-5xl font-bold font-mono tabular-nums transition-colors duration-300", theme.score)}>
          {breakdown.score.toFixed(2)}
        </div>
        <p className={cn("text-sm mt-1.5 transition-colors duration-300", theme.label)}>
          {label}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", theme.bar)}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      {/* Formula breakdown */}
      <div className="space-y-2.5 pt-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          Breakdown
        </p>

        <FormulaRow label="Duration" value={`${breakdown.durationInHours.toFixed(2)} hrs`} />
        <div className="text-slate-600 text-xs pl-1">×</div>
        <FormulaRow label="Difficulty" value={`${breakdown.difficulty}`} />
        <div className="text-slate-600 text-xs pl-1">×</div>
        <FormulaRow label="Focus" value={`${breakdown.focus}`} />

        <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">Total</span>
          <span className={cn("text-sm font-bold font-mono", theme.score)}>
            {breakdown.score.toFixed(2)} pts
          </span>
        </div>
      </div>
    </div>
  );
}

function FormulaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-mono text-slate-200">{value}</span>
    </div>
  );
}