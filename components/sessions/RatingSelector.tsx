"use client";

import { cn } from "@/lib/utils";

interface Props {
  label:    string;
  value:    number;        // 1–5
  onChange: (v: number) => void;
  color?:   "blue" | "violet";
}

const LABELS: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Very high",
};

export default function RatingSelector({ label, value, onChange, color = "blue" }: Props) {
  const activeClass =
    color === "violet"
      ? "bg-violet-500 border-violet-500 text-white"
      : "bg-blue-500 border-blue-500 text-white";

  const hoverClass =
    color === "violet"
      ? "hover:border-violet-400 hover:text-violet-600"
      : "hover:border-blue-400 hover:text-blue-600";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{LABELS[value]}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 h-10 rounded-lg border-2 text-sm font-semibold transition-all duration-150",
              value === n
                ? activeClass
                : cn("border-slate-200 text-slate-400 bg-white", hoverClass)
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}