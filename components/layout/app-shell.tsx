"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, ChartPie, ChevronRight, CircleDollarSign, FolderKanban, Landmark, LogOut, Menu, Plus, ReceiptText, Settings, UserRound, WalletCards } from "lucide-react";

import { QuickAddSheet } from "@/components/transactions/quick-add-sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { ThemeMenu } from "./theme-menu";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: ChartPie },
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
    <div className="min-h-dvh bg-background lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar px-3 py-4 lg:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-3 rounded-xl px-2 py-2 font-heading text-lg font-bold tracking-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"><Landmark className="size-5" /></span>
          <span>Cost Track</span>
        </Link>

        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Menu utama</p>
        <nav className="space-y-1" aria-label="Navigasi utama">
          {navigation.map((item) => <NavLink key={item.href} {...item} active={pathname === item.href} />)}
        </nav>

        <Button className="mt-5 w-full shadow-sm" size="lg" onClick={openQuickAdd} type="button">
          <Plus className="size-4" /> Tambah transaksi
        </Button>

        <div className="mt-auto space-y-2 border-t pt-3">
          <NavLink href="/settings" label="Pengaturan" icon={Settings} active={pathname === "/settings"} />
          <div className="px-1 py-1"><ThemeMenu /></div>
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/65 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"><UserRound className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button className="text-muted-foreground hover:bg-card hover:text-destructive" onClick={logout} type="button" aria-label="Keluar dari akun" size="icon" variant="ghost"><LogOut className="size-4" /></Button>
          </div>
        </div>
      </aside>

      <div className="min-h-dvh">
        <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-heading font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-4" /></span>
            Cost Track
          </Link>
          <Link href="/settings" className="grid size-10 place-items-center rounded-full bg-card text-sm font-semibold text-primary shadow-sm ring-1 ring-border" aria-label="Buka pengaturan">
            {user.name.slice(0, 1).toUpperCase()}
          </Link>
        </header>
        <main id="main-content" className="safe-bottom mx-auto min-h-[calc(100dvh-3.75rem)] max-w-[1440px] lg:min-h-dvh lg:pb-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/92 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(3_4_94_/_0.08)] backdrop-blur-xl lg:hidden" aria-label="Navigasi bawah">
        <MobileLink href="/dashboard" label="Home" icon={ChartPie} active={pathname === "/dashboard"} />
        <MobileLink href="/transactions" label="Transaksi" icon={ReceiptText} active={pathname === "/transactions"} />
        <Button className="relative h-auto min-h-16 flex-col items-center justify-center gap-1 rounded-none text-xs font-semibold text-primary hover:bg-transparent hover:text-primary" onClick={openQuickAdd} type="button" aria-label="Tambah transaksi" variant="ghost">
          <span className="absolute -top-5 grid size-14 place-items-center rounded-2xl border-4 border-background bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-95"><Plus className="size-6" /></span>
          <span className="mt-8">Tambah</span>
        </Button>
        <MobileLink href="/assistant" label="Assistant" icon={Bot} active={pathname === "/assistant"} />
        <DropdownMenu>
          <DropdownMenuTrigger className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium outline-none ${["/accounts", "/categories", "/settings"].includes(pathname) ? "text-primary" : "text-muted-foreground"}`}>
            <Menu className="size-5" /><span>Lainnya</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={10} className="mb-[env(safe-area-inset-bottom)] min-w-52 p-2">
            <DropdownMenuLabel>Navigasi lainnya</DropdownMenuLabel>
            <DropdownMenuItem className="h-11 gap-3" render={<Link href="/accounts" />}><WalletCards />Akun<ChevronRight className="ml-auto" /></DropdownMenuItem>
            <DropdownMenuItem className="h-11 gap-3" render={<Link href="/categories" />}><FolderKanban />Kategori<ChevronRight className="ml-auto" /></DropdownMenuItem>
            <DropdownMenuItem className="h-11 gap-3" render={<Link href="/settings" />}><Settings />Pengaturan<ChevronRight className="ml-auto" /></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="h-11 gap-3" variant="destructive" onClick={logout}><LogOut />Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <QuickAddSheet />
    </div>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof CircleDollarSign; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}>
      {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary" /> : null}
      <Icon className="size-4.5" />{label}
    </Link>
  );
}

function MobileLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof CircleDollarSign; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition active:bg-muted ${active ? "text-primary" : "text-muted-foreground"}`}>
      <Icon className="size-5" /><span>{label}</span>
    </Link>
  );
}
