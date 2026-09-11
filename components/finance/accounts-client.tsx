"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Check, Landmark, Pencil, Plus, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { formatRupiah } from "@/lib/finance/calculations";

type Account = { id: string; name: string; type: "CASH" | "BANK" | "EWALLET" | "OTHER"; openingBalance: number; income: number; expense: number; isDefault: boolean };

export function AccountsClient() {
  const [items, setItems] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const response = await fetch("/api/accounts", { cache: "no-store" }); if (!response.ok) throw new Error(); setItems(await response.json()); } catch { toast.error("Akun gagal dimuat."); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const response = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), type: data.get("type"), openingBalance: Number(String(data.get("openingBalance")).replace(/\D/g, "")), isDefault: items.length === 0 }) });
    if (!response.ok) { toast.error("Gagal menambah akun."); return; } form.reset(); toast.success("Akun berhasil ditambahkan"); void load();
  }
  async function update(item: Account, patch: Record<string, unknown>, message: string) { const response = await fetch(`/api/accounts/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }); if (!response.ok) { const body = await response.json().catch(() => null); toast.error(body?.error ?? "Gagal memperbarui akun."); return; } toast.success(message); void load(); }
  async function rename(item: Account) { const name = window.prompt("Nama akun baru", item.name)?.trim(); if (name && name !== item.name) await update(item, { name }, "Nama akun diperbarui"); }
  async function archive(item: Account) { if (!window.confirm(`Arsipkan akun “${item.name}”?`)) return; const response = await fetch(`/api/accounts/${item.id}`, { method: "DELETE" }); if (!response.ok) { const body = await response.json().catch(() => null); toast.error(body?.error ?? "Gagal mengarsipkan akun."); return; } toast.success("Akun diarsipkan"); void load(); }

  return <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
    <section>{loading ? <div className="grid gap-4 sm:grid-cols-2"><div className="h-40 animate-pulse rounded-2xl bg-muted" /><div className="h-40 animate-pulse rounded-2xl bg-muted" /></div> : items.length ? <div className="grid gap-4 sm:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border bg-card p-5"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">{item.type === "CASH" ? <WalletCards className="size-5" /> : <Landmark className="size-5" />}</span>{item.isDefault ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Default</span> : null}</div><p className="mt-5 text-sm text-muted-foreground">{item.name}</p><p className="mt-1 font-heading text-2xl font-semibold">{formatRupiah(item.openingBalance + item.income - item.expense)}</p><div className="mt-5 flex gap-1 border-t pt-3"><button className="tap-target grid place-items-center rounded-lg text-muted-foreground hover:bg-muted" onClick={() => rename(item)} aria-label={`Ubah nama ${item.name}`}><Pencil className="size-4" /></button>{!item.isDefault ? <button className="tap-target flex items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted" onClick={() => update(item, { isDefault: true }, "Akun default diperbarui")}><Check className="size-4" /> Jadikan default</button> : null}<button className="tap-target ml-auto grid place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" disabled={item.isDefault} onClick={() => archive(item)} aria-label={`Arsipkan ${item.name}`}><Archive className="size-4" /></button></div></article>)}</div> : <Empty icon={<WalletCards />} text="Belum ada akun." />}</section>
    <form className="h-fit space-y-4 rounded-2xl border bg-card p-5" onSubmit={create}><div><h2 className="font-heading text-lg font-semibold">Tambah akun</h2><p className="mt-1 text-sm text-muted-foreground">Pisahkan cash, bank, dan e-wallet.</p></div><Field label="Nama"><input className="h-11 w-full rounded-xl border bg-background px-3" name="name" required maxLength={60} placeholder="BCA" /></Field><Field label="Jenis"><select className="h-11 w-full rounded-xl border bg-background px-3" name="type"><option value="CASH">Cash</option><option value="BANK">Bank</option><option value="EWALLET">E-wallet</option><option value="OTHER">Lainnya</option></select></Field><Field label="Saldo awal"><input className="h-11 w-full rounded-xl border bg-background px-3" name="openingBalance" inputMode="numeric" defaultValue="0" required /></Field><button className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"><Plus className="size-4" />Tambah akun</button></form>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2 text-sm font-medium"><span>{label}</span>{children}</label>; }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="rounded-2xl border border-dashed bg-card py-14 text-center text-muted-foreground"><span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-muted [&>svg]:size-5">{icon}</span><p>{text}</p></div>; }
