import type { EffortScoreBreakdown } from "@/types";

// Core formula: (duration in minutes / 60) × difficulty × focus
export function calculateEffortScore(
  durationMinutes: number,
  difficulty: number,
  focus: number
): number {
  const hours = durationMinutes / 60;
  return parseFloat((hours * difficulty * focus).toFixed(2));
}

// Returns the full breakdown for the live preview on the session form
export function getEffortBreakdown(
  durationHours: number,
  durationMinutes: number,
  difficulty: number,
  focus: number
): EffortScoreBreakdown {
  const totalMinutes = durationHours * 60 + durationMinutes;
  const durationInHours = parseFloat((totalMinutes / 60).toFixed(2));
  const score = calculateEffortScore(totalMinutes, difficulty, focus);
  return { durationInHours, difficulty, focus, score };
}