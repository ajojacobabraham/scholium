"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/store/accountStore";
import type { Account, AccountTreeNode } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Target,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Pencil,
  ScrollText,
  PowerOff,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  node:       AccountTreeNode;
  depth:      number;
  selectedId: string | null;
  onSelect:   (account: Account) => void;
  onAddChild: (parentId: string) => void;  // triggers CreateAccountModal with parent pre-set
}

export default function AccountTreeItem({
  node, depth, selectedId, onSelect, onAddChild,
}: Props) {
  const router            = useRouter();
  const deactivateAccount = useAccountStore((s) => s.deactivateAccount);
  const updateAccount     = useAccountStore((s) => s.updateAccount);

  const [expanded,     setExpanded]     = useState(true);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [editName,     setEditName]     = useState(node.name);
  const [confirmDeact, setConfirmDeact] = useState(false);

  const menuRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChildren = node.children.length > 0;
  const isSelected  = node.id === selectedId;

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDeact(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when edit mode starts
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function handleSaveEdit() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === node.name) { setEditing(false); return; }
    await updateAccount(node.id, { name: trimmed });
    setEditing(false);
  }

  async function handleDeactivate() {
    await deactivateAccount(node.id);
    setMenuOpen(false);
    setConfirmDeact(false);
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 pr-3 py-2.5 cursor-pointer transition-colors group",
          isSelected ? "bg-slate-100" : "hover:bg-slate-50"
        )}
        style={{ paddingLeft: `${0.75 + depth * 1.5}rem` }}
        onClick={() => !editing && onSelect(node)}
      >
        {/* Expand / collapse */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="w-5 h-5 flex items-center justify-center text-slate-400 shrink-0"
        >
          {hasChildren
            ? expanded
              ? <ChevronDown  className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
            : <span className="w-4 h-4" />}
        </button>

        {/* Icon */}
        {node.type === "knowledge"
          ? <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
          : <Target   className="w-4 h-4 text-emerald-500 shrink-0" />}

        {/* Name / edit input */}
        {editing ? (
          <div
            className="flex items-center gap-1.5 flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")  handleSaveEdit();
                if (e.key === "Escape") { setEditing(false); setEditName(node.name); }
              }}
              className="h-7 text-sm py-0"
            />
            <button onClick={handleSaveEdit}     className="text-emerald-500 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditing(false); setEditName(node.name); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-medium text-slate-800 truncate">
            {node.name}
          </span>
        )}

        {!editing && (
          <>
            {/* Effort score */}
            <span className="text-xs text-slate-400 font-mono shrink-0">
              {node.totalEffortScore.toFixed(2)} pts
            </span>

            {/* Type badge */}
            <Badge
              variant="secondary"
              className={cn(
                "text-xs capitalize shrink-0",
                node.type === "knowledge"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-emerald-50 text-emerald-600"
              )}
            >
              {node.type}
            </Badge>

            {/* Options menu trigger */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                  setConfirmDeact(false);
                }}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-md text-slate-400 transition-all",
                  "opacity-0 group-hover:opacity-100",
                  menuOpen && "opacity-100 bg-slate-100 text-slate-600"
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-8 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-48 py-1 text-sm">
                  {/* Add sub-account */}
                  <MenuItem
                    icon={Plus}
                    label="Add sub-account"
                    onClick={() => {
                      setMenuOpen(false);
                      onAddChild(node.id);
                    }}
                  />

                  {/* Edit name */}
                  <MenuItem
                    icon={Pencil}
                    label="Edit name"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                  />

                  {/* View sessions */}
                  <MenuItem
                    icon={ScrollText}
                    label="View sessions"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(`/sessions?accountId=${node.id}`);
                    }}
                  />

                  <div className="border-t border-slate-100 my-1" />

                  {/* Deactivate */}
                  {confirmDeact ? (
                    <div className="px-3 py-2 space-y-2">
                      <p className="text-xs text-slate-500">Deactivate this account?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeactivate}
                          className="flex-1 text-xs bg-red-500 text-white rounded-md py-1 hover:bg-red-600"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeact(false)}
                          className="flex-1 text-xs bg-slate-100 text-slate-600 rounded-md py-1 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MenuItem
                      icon={PowerOff}
                      label="Deactivate"
                      onClick={() => setConfirmDeact(true)}
                      danger
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}
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
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon, label, onClick, danger = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left",
        danger ? "text-red-500 hover:bg-red-50" : "text-slate-700"
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </button>
  );
}