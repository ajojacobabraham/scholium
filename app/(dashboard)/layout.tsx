"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useAccountStore } from "@/store/accountStore";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  ScrollText,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts",   label: "Accounts",  icon: BookOpen },
  { href: "/sessions/new", label: "Log Session", icon: PenLine },
  { href: "/ledger",     label: "Ledger",    icon: ScrollText },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const user         = useAuthStore((s) => s.user);
  const isLoading    = useAuthStore((s) => s.isLoading);
  const signOut      = useAuthStore((s) => s.signOut);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  // Load accounts once we have a user
  useEffect(() => {
    if (user) fetchAccounts(user.uid);
  }, [user, fetchAccounts]);

  if (isLoading || !user) return null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-slate-900">Scholium</h1>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
        </div>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <Separator />

        {/* Sign out */}
        <div className="px-3 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-500"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
