"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, ChartPie, CircleDollarSign, FolderKanban, Landmark, LayoutDashboard, LogOut, Menu, Plus, ReceiptText, Settings, WalletCards } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { QuickAddSheet } from "@/components/transactions/quick-add-sheet";
import { ThemeMenu } from "./theme-menu";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ReceiptText },
  { href: "/accounts", label: "Akun", icon: WalletCards },
  { href: "/categories", label: "Kategori", icon: FolderKanban },
  { href: "/assistant", label: "Assistant", icon: Bot },
];

function openQuickAdd() {
  window.dispatchEvent(new CustomEvent("cost-track:quick-add"));
}

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-background lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-sidebar p-4 lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2 py-2 font-heading text-lg font-bold">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-5" /></span>
          Cost Track
        </Link>
        <nav className="space-y-1" aria-label="Navigasi utama">
          {navigation.map((item) => <NavLink key={item.href} {...item} active={pathname === item.href} />)}
        </nav>
        <button className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground" onClick={openQuickAdd} type="button">
          <Plus className="size-4" /> Tambah Transaksi
        </button>
        <div className="mt-auto space-y-3">
          <NavLink href="/settings" label="Pengaturan" icon={Settings} active={pathname === "/settings"} />
          <ThemeMenu />
          <div className="rounded-xl border bg-card p-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <button className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={logout} type="button"><LogOut className="size-4" /> Keluar</button>
          </div>
        </div>
      </aside>

      <div className="min-h-dvh">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-heading font-bold"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-4" /></span>Cost Track</Link>
          <Link href="/settings" className="tap-target grid place-items-center rounded-xl text-muted-foreground" aria-label="Buka pengaturan"><Settings className="size-5" /></Link>
        </header>
        <div id="main-content" className="safe-bottom mx-auto max-w-[1440px] lg:pb-10">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden" aria-label="Navigasi bawah">
        <MobileLink href="/dashboard" label="Home" icon={ChartPie} active={pathname === "/dashboard"} />
        <MobileLink href="/transactions" label="Transaksi" icon={ReceiptText} active={pathname === "/transactions"} />
        <button className="relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium" onClick={openQuickAdd} type="button" aria-label="Tambah transaksi">
          <span className="absolute -top-5 grid size-14 place-items-center rounded-2xl border-4 border-background bg-primary text-primary-foreground shadow-lg"><Plus className="size-6" /></span><span className="mt-8">Tambah</span>
        </button>
        <MobileLink href="/assistant" label="Assistant" icon={Bot} active={pathname === "/assistant"} />
        <MobileLink href="/accounts" label="Lainnya" icon={Menu} active={["/accounts", "/categories", "/settings"].includes(pathname)} />
      </nav>
      <QuickAddSheet />
    </div>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof CircleDollarSign; active: boolean }) {
  return <Link href={href} className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}><Icon className="size-4" />{label}</Link>;
}

function MobileLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof CircleDollarSign; active: boolean }) {
  return <Link href={href} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-5" /><span>{label}</span></Link>;
}
