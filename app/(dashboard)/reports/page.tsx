import Link from "next/link";
import {
  BarChart2,
  TrendingUp,
  Target,
  PieChart,
  Activity,
  Scale,
} from "lucide-react";

const REPORTS = [
  {
    href:        "/reports/balance-sheet",
    icon:        BarChart2,
    title:       "Effort Balance Sheet",
    description: "All accounts with session counts and total effort.",
    color:       "text-blue-500 bg-blue-50",
  },
  {
    href:        "/reports/knowledge-growth",
    icon:        TrendingUp,
    title:       "Knowledge Growth",
    description: "Effort accumulation over time per knowledge account.",
    color:       "text-violet-500 bg-violet-50",
  },
  {
    href:        "/reports/goal-progress",
    icon:        Target,
    title:       "Goal Progress",
    description: "Each goal with effort, sessions, and linked accounts.",
    color:       "text-emerald-500 bg-emerald-50",
  },
  {
    href:        "/reports/effort-distribution",
    icon:        PieChart,
    title:       "Effort Distribution",
    description: "Donut chart of effort spread across all accounts.",
    color:       "text-amber-500 bg-amber-50",
  },
  {
    href:        "/reports/focus-difficulty-trends",
    icon:        Activity,
    title:       "Focus & Difficulty Trends",
    description: "Average focus and difficulty over time.",
    color:       "text-rose-500 bg-rose-50",
  },
  {
    href:        "/reports/trial-balance",
    icon:        Scale,
    title:       "Trial Balance",
    description: "Full debit/credit table with balance confirmation.",
    color:       "text-slate-500 bg-slate-100",
  },
];

export default function ReportsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500 mt-1">
          Analyse your study habits and track progress across all accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map(({ href, icon: Icon, title, description, color }) => (
          <Link key={href} href={href}>
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all group h-full">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm group-hover:text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}