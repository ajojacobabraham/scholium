"use client";

import { useState, useMemo } from "react";
import { useAccountStore } from "@/store/accountStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, ChevronDown, BookOpen, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account, AccountTreeNode } from "@/types";
import CreateAccountModal from "@/components/accounts/CreateAccountModal";
import AccountDetailPanel from "@/components/accounts/AccountDetailPanel";

export default function AccountsPage() {
  const accounts       = useAccountStore((s) => s.accounts);
  const getAccountTree = useAccountStore((s) => s.getAccountTree);
  const isLoading      = useAccountStore((s) => s.isLoading);

  const tree = useMemo(() => getAccountTree(), [accounts, getAccountTree]);

  const [modalOpen,      setModalOpen]      = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Account tree */}
      <div className={cn("flex flex-col transition-all duration-300", selectedAccount ? "flex-1" : "w-full max-w-3xl mx-auto")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Accounts</h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage your knowledge and goal accounts
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: Detail panel (slide in) */}
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
      />
    </div>
  );
}

function AccountTreeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: AccountTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (account: Account) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
          isSelected
            ? "bg-slate-100"
            : "hover:bg-slate-50"
        )}
        style={{ paddingLeft: `${1 + depth * 1.5}rem` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand / collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="w-5 h-5 flex items-center justify-center text-slate-400 shrink-0"
        >
          {hasChildren ? (
            expanded
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4" />
          )}
        </button>

        {/* Icon */}
        {node.type === "knowledge" ? (
          <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
        ) : (
          <Target className="w-4 h-4 text-emerald-500 shrink-0" />
        )}

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-slate-800">{node.name}</span>

        {/* Effort score */}
        <span className="text-xs text-slate-400 font-mono">
          {node.totalEffortScore.toFixed(2)} pts
        </span>

        {/* Type badge */}
        <Badge
          variant="secondary"
          className={cn(
            "text-xs capitalize",
            node.type === "knowledge"
              ? "bg-blue-50 text-blue-600"
              : "bg-emerald-50 text-emerald-600"
          )}
        >
          {node.type}
        </Badge>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <AccountTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}