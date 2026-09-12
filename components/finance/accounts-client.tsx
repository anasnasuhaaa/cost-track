"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Check, CircleEllipsis, Landmark, MoreHorizontal, Pencil, Plus, Smartphone, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/finance/calculations";

type Account = {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "EWALLET" | "OTHER";
  openingBalance: number;
  income: number;
  expense: number;
  isDefault: boolean;
};

const accountType = {
  CASH: { label: "Cash", icon: WalletCards },
  BANK: { label: "Bank", icon: Landmark },
  EWALLET: { label: "E-wallet", icon: Smartphone },
  OTHER: { label: "Lainnya", icon: CircleEllipsis },
};

export function AccountsClient() {
  const [items, setItems] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [archiveCandidate, setArchiveCandidate] = useState<Account | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/accounts", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setItems(await response.json());
    } catch {
      toast.error("Akun gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        type: data.get("type"),
        openingBalance: Number(String(data.get("openingBalance")).replace(/\D/g, "")),
        isDefault: items.length === 0,
      }),
    });
    setBusy(false);
    if (!response.ok) {
      toast.error("Gagal menambah akun.");
      return;
    }
    form.reset();
    toast.success("Akun berhasil ditambahkan.");
    void load();
  }

  async function update(item: Account, patch: Record<string, unknown>, message: string) {
    setBusy(true);
    const response = await fetch(`/api/accounts/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Gagal memperbarui akun.");
      return false;
    }
    toast.success(message);
    void load();
    return true;
  }

  async function rename() {
    if (!editing) return;
    const name = renameValue.trim();
    if (!name || name === editing.name) {
      setEditing(null);
      return;
    }
    if (await update(editing, { name }, "Nama akun diperbarui.")) setEditing(null);
  }

  async function archive() {
    if (!archiveCandidate) return;
    setBusy(true);
    const response = await fetch(`/api/accounts/${archiveCandidate.id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Gagal mengarsipkan akun.");
      return;
    }
    toast.success("Akun diarsipkan.");
    setArchiveCandidate(null);
    void load();
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Daftar akun">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((item) => <Skeleton className="h-48 rounded-2xl" key={item} />)}</div>
          ) : items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => {
                const meta = accountType[item.type];
                const Icon = meta.icon;
                return (
                  <Card className="overflow-hidden transition-shadow hover:shadow-md" key={item.id}>
                    <CardHeader className="flex-row items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                      <div className="flex items-center gap-2">
                        {item.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button aria-label={`Aksi untuk ${item.name}`} size="icon" variant="ghost" />}><MoreHorizontal /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="h-11" onClick={() => { setEditing(item); setRenameValue(item.name); }}><Pencil /> Ubah nama</DropdownMenuItem>
                            {!item.isDefault ? <DropdownMenuItem className="h-11" onClick={() => void update(item, { isDefault: true }, "Akun default diperbarui.")}><Check /> Jadikan default</DropdownMenuItem> : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="h-11" disabled={item.isDefault} onClick={() => setArchiveCandidate(item)} variant="destructive"><Archive /> Arsipkan akun</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{meta.label} · {item.name}</p>
                      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">{formatRupiah(item.openingBalance + item.income - item.expense)}</p>
                      <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-xs">
                        <div><p className="text-muted-foreground">Pemasukan</p><p className="mt-1 font-semibold text-success">+{formatRupiah(item.income)}</p></div>
                        <div><p className="text-muted-foreground">Pengeluaran</p><p className="mt-1 font-semibold text-destructive">-{formatRupiah(item.expense)}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-card py-14 text-center text-muted-foreground">
              <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-muted"><WalletCards className="size-5" /></span>
              <p className="font-medium text-foreground">Belum ada akun</p><p className="mt-1 text-sm">Tambahkan akun pertama dari formulir di samping.</p>
            </div>
          )}
        </section>

        <Card className="h-fit xl:sticky xl:top-8">
          <CardHeader><CardTitle>Tambah akun</CardTitle><p className="text-sm text-muted-foreground">Pisahkan cash, bank, dan e-wallet agar saldo mudah dipantau.</p></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={create}>
              <div className="space-y-2"><Label htmlFor="account-name">Nama akun</Label><Input id="account-name" name="name" required maxLength={60} placeholder="BCA Utama" /></div>
              <div className="space-y-2">
                <Label>Jenis akun</Label>
                <Select defaultValue="CASH" name="type">
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="CASH">Cash</SelectItem><SelectItem value="BANK">Bank</SelectItem><SelectItem value="EWALLET">E-wallet</SelectItem><SelectItem value="OTHER">Lainnya</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="opening-balance">Saldo awal</Label><Input id="opening-balance" name="openingBalance" inputMode="numeric" defaultValue="0" required /></div>
              <Button className="w-full" disabled={busy} size="lg" type="submit"><Plus /> Tambah akun</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ubah nama akun</DialogTitle><DialogDescription>Nama baru akan tampil di seluruh transaksi terkait.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="rename-account">Nama akun</Label><Input id="rename-account" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={60} autoFocus /></div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button disabled={busy || !renameValue.trim()} onClick={() => void rename()}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(archiveCandidate)} onOpenChange={(open) => { if (!open) setArchiveCandidate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogMedia className="bg-destructive/10 text-destructive"><Archive /></AlertDialogMedia><AlertDialogTitle>Arsipkan akun?</AlertDialogTitle><AlertDialogDescription>Akun “{archiveCandidate?.name}” tidak lagi muncul sebagai pilihan transaksi baru. Riwayat transaksi tetap tersimpan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel><AlertDialogAction disabled={busy} variant="destructive" onClick={() => void archive()}>Arsipkan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
