"use client";

import { useState, useMemo } from "react";
import { useAccountStore } from "@/store/accountStore";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import type { Account } from "@/types";
import CreateAccountModal from "@/components/accounts/CreateAccountModal";
import AccountDetailPanel from "@/components/accounts/AccountDetailPanel";
import AccountTreeItem    from "@/components/accounts/AccountTreeItem";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const accounts       = useAccountStore((s) => s.accounts);
  const getAccountTree = useAccountStore((s) => s.getAccountTree);
  const isLoading      = useAccountStore((s) => s.isLoading);

  const tree = useMemo(() => getAccountTree(), [accounts, getAccountTree]);

  const [modalOpen,        setModalOpen]        = useState(false);
  const [defaultParentId,  setDefaultParentId]  = useState<string | undefined>();
  const [selectedAccount,  setSelectedAccount]  = useState<Account | null>(null);

  function openModalWithParent(parentId: string) {
    setDefaultParentId(parentId);
    setModalOpen(true);
  }

  function openModalFresh() {
    setDefaultParentId(undefined);
    setModalOpen(true);
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Account tree */}
      <div className={cn(
        "flex flex-col transition-all duration-300",
        selectedAccount ? "flex-1" : "w-full max-w-3xl mx-auto"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Accounts</h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage your knowledge and goal accounts
            </p>
          </div>
          <Button onClick={openModalFresh}>
            <Plus className="w-4 h-4 mr-2" />
            New account
          </Button>
        </div>

        {/* Tree */}
        {isLoading ? (
          <p className="text-slate-400 text-sm">Loading accounts...</p>
        ) : tree.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No accounts yet</p>
            <p className="text-sm mt-1">
              Create your first knowledge or goal account to get started
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {tree.map((node) => (
              <AccountTreeItem
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedAccount?.id ?? null}
                onSelect={setSelectedAccount}
                onAddChild={openModalWithParent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: Detail panel */}
      {selectedAccount && (
        <div className="w-80 shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm self-start sticky top-0">
          <AccountDetailPanel
            account={selectedAccount}
            onClose={() => setSelectedAccount(null)}
          />
        </div>
      )}

      <CreateAccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultParentId={defaultParentId}
      />
    </div>
  );
}