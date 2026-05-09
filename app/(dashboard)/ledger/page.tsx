"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useAccountStore } from "@/store/accountStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import TrialBalanceSummary from "@/components/ledger/TrialBalanceSummary";
import type { LedgerEntry } from "@/types";
import { cn } from "@/lib/utils";

// ── Date range helpers ────────────────────────────────────────────────────────

type DateRange = "today" | "7d" | "30d" | "all";

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "Today",   value: "today" },
  { label: "7 days",  value: "7d"    },
  { label: "30 days", value: "30d"   },
  { label: "All",     value: "all"   },
];

function getStartDate(range: DateRange): Date | null {
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "7d") {
    const d = new Date(now); d.setDate(d.getDate() - 7); return d;
  }
  if (range === "30d") {
    const d = new Date(now); d.setDate(d.getDate() - 30); return d;
  }
  return null; // "all"
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const user         = useAuthStore((s) => s.user);
  const entries      = useLedgerStore((s) => s.entries);
  const isLoading    = useLedgerStore((s) => s.isLoading);
  const fetchEntries = useLedgerStore((s) => s.fetchEntries);
  const accounts     = useAccountStore((s) => s.accounts);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [dateRange,  setDateRange]  = useState<DateRange>("all");
  const [accountId,  setAccountId]  = useState<string>("all");
  const [entryType,  setEntryType]  = useState<string>("all"); // "all" | "knowledge" | "goal"
  const [search,     setSearch]     = useState("");

  useEffect(() => {
    if (user) fetchEntries(user.uid);
  }, [user, fetchEntries]);

  // ── Filtered entries ────────────────────────────────────────────────────────
  const filtered = useMemo<LedgerEntry[]>(() => {
    const startDate = getStartDate(dateRange);

    return entries.filter((e) => {
      // Date range
      if (startDate) {
        const entryDate = e.date?.toDate ? e.date.toDate() : new Date();
        if (entryDate < startDate) return false;
      }

      // Account
      if (accountId !== "all" && e.creditAccountId !== accountId) return false;

      // Entry type
      if (entryType !== "all") {
        const acc = accounts.find((a) => a.id === e.creditAccountId);
        if (!acc || acc.type !== entryType) return false;
      }

      // Search (notes)
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!e.notes?.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [entries, dateRange, accountId, entryType, search, accounts]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function getAccountName(id: string) {
    if (id === "timeAndEffort") return "Time & Effort";
    return accounts.find((a) => a.id === id)?.name ?? "Unknown";
  }

  function hasActiveFilters() {
    return (
      dateRange !== "all" ||
      accountId !== "all" ||
      entryType !== "all" ||
      search.trim() !== ""
    );
  }

  function clearFilters() {
    setDateRange("all");
    setAccountId("all");
    setEntryType("all");
    setSearch("");
  }

  if (isLoading) {
    return <div className="text-slate-500 text-sm">Loading general ledger...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">General Ledger</h2>
        <p className="text-sm text-slate-500 mt-1">
          Double-entry record of all your invested time and effort.
        </p>
      </div>

      {/* Trial balance — always reflects full ledger, not filtered view */}
      <TrialBalanceSummary entries={entries} />

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        {/* Date range pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {DATE_RANGE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDateRange(value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                dateRange === value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dropdowns + search */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Account filter */}
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-48 h-9 text-sm">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.filter((a) => a.isActive).map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.type === "knowledge" ? "📚 " : "🎯 "}
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Entry type filter */}
          <Select value={entryType} onValueChange={setEntryType}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="knowledge">📚 Knowledge</SelectItem>
              <SelectItem value="goal">🎯 Goal</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-slate-500 gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-slate-400">
          {filtered.length === entries.length
            ? `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`
            : `${filtered.length} of ${entries.length} entries`}
        </p>
      </div>

      {/* Ledger table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[200px]">Account</TableHead>
              <TableHead className="text-right w-[100px]">Debit</TableHead>
              <TableHead className="text-right w-[100px]">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                  {hasActiveFilters()
                    ? "No entries match your filters."
                    : "No ledger entries yet. Log a study session to see it here."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => {
                const dateObj = entry.date?.toDate ? entry.date.toDate() : new Date();
                const dateStr = new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day:   "numeric",
                  year:  "numeric",
                }).format(dateObj);

                return (
                  <React.Fragment key={entry.id}>
                    {/* Debit row */}
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableCell className="align-top font-medium text-slate-600 text-sm">
                        {dateStr}
                      </TableCell>
                      <TableCell className="align-top text-slate-500 text-sm">
                        {entry.notes || "—"}
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium text-sm">
                        {getAccountName(entry.debitAccount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-800 text-sm">
                        {entry.effortScore.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-300 text-sm">
                        —
                      </TableCell>
                    </TableRow>

                    {/* Credit row */}
                    <TableRow className="bg-slate-50/40">
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-slate-500 text-sm pl-8">
                        {getAccountName(entry.creditAccountId)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-300 text-sm">
                        —
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-800 text-sm">
                        {entry.effortScore.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}