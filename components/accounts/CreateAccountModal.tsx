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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const accounts = useAccountStore((s) => s.accounts);
  const createAccount = useAccountStore((s) => s.createAccount);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("knowledge");
  const [parentId, setParentId] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);

  // Reset form state when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setType("knowledge");
      setParentId("none");
    }
  }, [open]);

  // Filter available parent accounts (must be active and of the same type)
  const availableParents = accounts.filter(
    (a) => a.isActive && a.type === type
  );

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
        [] // We can add linked accounts (Goal -> Knowledge) functionality later
      );
      onClose();
    } catch (error) {
      console.error("Failed to create account", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>
              Add a new knowledge subject or open-ended goal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                placeholder="e.g., JavaScript or React Certification"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select
                value={type}
                onValueChange={(val: AccountType) => {
                  setType(val);
                  setParentId("none"); // Reset parent when type changes
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

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Account (Optional)</Label>
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