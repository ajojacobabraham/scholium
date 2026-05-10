"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import type { AccountType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateAccountModal({
  open,
  onClose,
  defaultParentId,
}: {
  open: boolean;
  onClose: () => void;
  defaultParentId?: string;
}) {
  const user          = useAuthStore((s) => s.user);
  const accounts      = useAccountStore((s) => s.accounts);
  const createAccount = useAccountStore((s) => s.createAccount);

  const [name,             setName]             = useState("");
  const [type,             setType]             = useState<AccountType>("knowledge");
  const [parentId,         setParentId]         = useState<string>("none");
  const [linkedAccountIds, setLinkedAccountIds] = useState<string[]>([]);
  const [isLoading,        setIsLoading]        = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setType("knowledge");
      setParentId(defaultParentId ?? "none");
      setLinkedAccountIds([]);
    }
  }, [open, defaultParentId]);

  // Parent accounts must be active and same type
  const availableParents = accounts.filter(
    (a) => a.isActive && a.type === type
  );

  // Only active knowledge accounts can be linked to a goal
  const linkableKnowledgeAccounts = accounts.filter(
    (a) => a.isActive && a.type === "knowledge"
  );

  function toggleLink(accountId: string) {
    setLinkedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      await createAccount(
        user.uid,
        name,
        type,
        parentId === "none" ? null : parentId,
        type === "goal" ? linkedAccountIds : []
      );
      onClose();
    } catch (err) {
      console.error("Failed to create account", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>
              Add a new knowledge subject or open-ended goal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                placeholder="e.g. JavaScript or React Certification"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select
                value={type}
                onValueChange={(val: AccountType) => {
                  setType(val);
                  setParentId("none");
                  setLinkedAccountIds([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="knowledge">Knowledge 📚</SelectItem>
                  <SelectItem value="goal">Goal 🎯</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Parent account */}
            <div className="space-y-2">
              <Label>Parent Account <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root level)</SelectItem>
                  {availableParents.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link to knowledge accounts — only shown for Goal type */}
            {type === "goal" && (
              <div className="space-y-2">
                <Label>
                  Link to Knowledge Accounts{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-slate-500">
                  Effort logged against this goal will also flow to the selected
                  knowledge accounts.
                </p>

                {linkableKnowledgeAccounts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No knowledge accounts yet. Create one first.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {linkableKnowledgeAccounts.map((acc) => {
                      const isLinked = linkedAccountIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleLink(acc.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                            isLinked
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <BookOpen
                            className={cn(
                              "w-4 h-4 shrink-0",
                              isLinked ? "text-blue-500" : "text-slate-300"
                            )}
                          />
                          <span
                            className={cn(
                              "flex-1 text-sm",
                              isLinked ? "text-blue-700 font-medium" : "text-slate-600"
                            )}
                          >
                            {acc.name}
                          </span>
                          {isLinked && (
                            <Badge className="bg-blue-100 text-blue-600 text-xs">
                              Linked
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected links summary */}
                {linkedAccountIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {linkedAccountIds.map((id) => {
                      const acc = accounts.find((a) => a.id === id);
                      return acc ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                        >
                          {acc.name}
                          <button
                            type="button"
                            onClick={() => toggleLink(id)}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}