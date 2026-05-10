"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import { useSessionStore } from "@/store/sessionStore";
import { fetchSessionsForAccount } from "@/lib/firebase/sessions";
import type { Session } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SessionsPage() {
  const searchParams    = useSearchParams();
  const filterAccountId = searchParams.get("accountId");

  const user          = useAuthStore((s) => s.user);
  const accounts      = useAccountStore((s) => s.accounts);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const editNotes     = useSessionStore((s) => s.editSessionNotes);
  const isLoading     = useSessionStore((s) => s.isLoading);

  const [sessions,       setSessions]       = useState<Session[]>([]);
  const [fetching,       setFetching]       = useState(true);
  const [editTarget,     setEditTarget]     = useState<Session | null>(null);
  const [editNotesDraft, setEditNotesDraft] = useState("");
  const [deleteTarget,   setDeleteTarget]   = useState<Session | null>(null);

  // Accounts to fetch — either one specific account or all active accounts
  const accountsToFetch = filterAccountId
    ? accounts.filter((a) => a.id === filterAccountId)
    : accounts.filter((a) => a.isActive);

  useEffect(() => {
    if (!user || accounts.length === 0) return;
    setFetching(true);
    Promise.all(accountsToFetch.map((a) => fetchSessionsForAccount(a.id, 50)))
      .then((results) => {
        const all = results
          .flat()
          .filter((s) => !(s as Session & { isDeleted?: boolean }).isDeleted)
          .sort((a, b) => {
            const da = a.date?.toDate ? a.date.toDate() : new Date();
            const db = b.date?.toDate ? b.date.toDate() : new Date();
            return db.getTime() - da.getTime();
          });
        setSessions(all);
      })
      .finally(() => setFetching(false));
  }, [user, accounts, filterAccountId]);

  function getAccountName(id: string) {
    return accounts.find((a) => a.id === id)?.name ?? "Unknown";
  }

  async function handleSaveNotes() {
    if (!editTarget) return;
    await editNotes(editTarget.id, editNotesDraft);
    setSessions((prev) =>
      prev.map((s) => s.id === editTarget.id ? { ...s, notes: editNotesDraft } : s)
    );
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget || !user) return;
    await deleteSession(user.uid, deleteTarget.id);
    setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const fmt = (s: Session) => {
    const d = s.date?.toDate ? s.date.toDate() : new Date();
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
  };

  const duration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Sessions</h2>
        <p className="text-sm text-slate-500 mt-1">
          {filterAccountId
            ? `Showing sessions for: ${accounts.find((a) => a.id === filterAccountId)?.name ?? "account"}`
            : "All logged study sessions. Edit notes or delete a session to create a reversal entry."}
        </p>
      </div>

      {fetching ? (
        <p className="text-slate-400 text-sm">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-slate-400 text-sm">No sessions logged yet.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              {/* Date */}
              <div className="w-24 shrink-0 text-xs text-slate-400 pt-0.5">{fmt(s)}</div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">
                    {getAccountName(s.accountId)}
                  </span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full capitalize",
                    accounts.find((a) => a.id === s.accountId)?.type === "knowledge"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-emerald-50 text-emerald-600"
                  )}>
                    {accounts.find((a) => a.id === s.accountId)?.type}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>{duration(s.duration)}</span>
                  <span>·</span>
                  <span>Difficulty {s.difficulty}</span>
                  <span>·</span>
                  <span>Focus {s.focus}</span>
                  <span>·</span>
                  <span className="font-mono font-medium text-slate-600">
                    {s.effortScore.toFixed(2)} pts
                  </span>
                </div>
                {s.notes && (
                  <p className="text-xs text-slate-500 italic">"{s.notes}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                  onClick={() => { setEditTarget(s); setEditNotesDraft(s.notes ?? ""); }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                  onClick={() => setDeleteTarget(s)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit notes modal */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
            <DialogDescription>
              Only the notes field can be edited after a session is logged.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editNotesDraft}
            onChange={(e) => setEditNotesDraft(e.target.value)}
            rows={4}
            className="resize-none"
            placeholder="What did you work on?"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleSaveNotes} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              This will create a reversal entry in the ledger to preserve integrity.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 flex items-start gap-3">
            <RotateCcw className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p>
              A reversal of{" "}
              <span className="font-mono font-semibold">
                -{deleteTarget?.effortScore.toFixed(2)} pts
              </span>{" "}
              will be posted to the ledger and all affected account balances will be corrected.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Reversing..." : "Delete Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}