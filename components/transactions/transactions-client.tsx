"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatRupiah } from "@/lib/finance/calculations";

type Transaction = { id: string; type: "INCOME" | "EXPENSE"; amount: number; description: string; transactionDate: string; source: "MANUAL" | "AI"; accountId: string; accountName: string; categoryId: string; categoryName: string };
type Result = { items: Transaction[]; total: number; page: number; pages: number };
type FilterOption = { id: string; name: string };

export function TransactionsClient() {
  const [result, setResult] = useState<Result>({ items: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [accounts, setAccounts] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (accountId) params.set("accountId", accountId);
    if (categoryId) params.set("categoryId", categoryId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const response = await fetch(`/api/transactions?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      setResult(await response.json());
    } catch { toast.error("Daftar transaksi gagal dimuat."); }
    finally { setLoading(false); }
  }, [accountId, categoryId, from, page, search, to, type]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([fetch("/api/accounts"), fetch("/api/categories")]).then(async ([accountResponse, categoryResponse]) => {
        if (accountResponse.ok) setAccounts(await accountResponse.json());
        if (categoryResponse.ok) setCategories(await categoryResponse.json());
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener("cost-track:transactions-changed", refresh);
    return () => window.removeEventListener("cost-track:transactions-changed", refresh);
  }, [load]);

  async function remove(item: Transaction) {
    if (!window.confirm(`Hapus transaksi “${item.description}”?`)) return;
    const response = await fetch(`/api/transactions/${item.id}`, { method: "DELETE" });
    if (!response.ok) { toast.error("Gagal menghapus transaksi."); return; }
    toast.success("Transaksi berhasil dihapus");
    void load();
  }

  function edit(item: Transaction) {
    window.dispatchEvent(new CustomEvent("cost-track:quick-add", { detail: item }));
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl border bg-card p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <label className="relative"><span className="sr-only">Cari transaksi</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-11 w-full rounded-xl border bg-background pl-9 pr-3" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari deskripsi..." /></label>
          <select className="h-11 rounded-xl border bg-background px-3" aria-label="Filter jenis" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option value="">Semua jenis</option><option value="EXPENSE">Pengeluaran</option><option value="INCOME">Pemasukan</option></select>
          <button className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground sm:flex" onClick={() => window.dispatchEvent(new CustomEvent("cost-track:quick-add"))} type="button"><Plus className="size-4" />Tambah</button>
        </div>
        <details className="group"><summary className="tap-target flex cursor-pointer list-none items-center text-sm font-medium text-muted-foreground">Filter lanjutan <span className="ml-auto text-xs group-open:hidden">Buka</span><span className="ml-auto hidden text-xs group-open:inline">Tutup</span></summary><div className="grid gap-3 border-t pt-3 sm:grid-cols-2 xl:grid-cols-4"><select className="h-11 rounded-xl border bg-background px-3 text-sm" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} aria-label="Filter kategori"><option value="">Semua kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="h-11 rounded-xl border bg-background px-3 text-sm" value={accountId} onChange={(event) => { setAccountId(event.target.value); setPage(1); }} aria-label="Filter akun"><option value="">Semua akun</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><label className="space-y-1 text-xs text-muted-foreground"><span>Dari tanggal</span><input className="h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label><label className="space-y-1 text-xs text-muted-foreground"><span>Sampai tanggal</span><input className="h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label></div></details>
      </div>

      {loading ? <LoadingRows /> : result.items.length === 0 ? <div className="rounded-2xl border border-dashed bg-card px-5 py-16 text-center"><ReceiptEmpty /><h2 className="font-heading text-lg font-semibold">Belum ada transaksi yang sesuai.</h2><p className="mt-1 text-sm text-muted-foreground">Ubah filter atau catat transaksi pertamamu.</p></div> : (
        <>
          <div className="space-y-3 md:hidden">{result.items.map((item) => <TransactionCard key={item.id} item={item} onEdit={() => edit(item)} onDelete={() => remove(item)} />)}</div>
          <div className="hidden overflow-hidden rounded-2xl border bg-card md:block"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-4">Transaksi</th><th className="px-5 py-4">Akun</th><th className="px-5 py-4">Tanggal</th><th className="px-5 py-4 text-right">Nominal</th><th className="w-24 px-5 py-4"><span className="sr-only">Aksi</span></th></tr></thead><tbody className="divide-y">{result.items.map((item) => <tr key={item.id} className="hover:bg-muted/30"><td className="px-5 py-4"><strong className="block font-medium">{item.description}</strong><span className="text-xs text-muted-foreground">{item.categoryName} · {item.source === "AI" ? "AI" : "Manual"}</span></td><td className="px-5 py-4 text-muted-foreground">{item.accountName}</td><td className="px-5 py-4 text-muted-foreground">{formatDate(item.transactionDate)}</td><td className={`px-5 py-4 text-right font-semibold ${item.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{item.type === "INCOME" ? "+" : "−"}{formatRupiah(item.amount)}</td><td className="px-5 py-4"><div className="flex justify-end"><IconButton label="Edit" onClick={() => edit(item)}><Pencil /></IconButton><IconButton label="Hapus" onClick={() => remove(item)} destructive><Trash2 /></IconButton></div></td></tr>)}</tbody></table></div>
        </>
      )}
      <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{result.total} transaksi</span><div className="flex items-center gap-2"><button className="tap-target grid place-items-center rounded-xl border disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Halaman sebelumnya"><ChevronLeft className="size-4" /></button><span>{page} / {result.pages}</span><button className="tap-target grid place-items-center rounded-xl border disabled:opacity-40" disabled={page >= result.pages} onClick={() => setPage((value) => value + 1)} aria-label="Halaman berikutnya"><ChevronRight className="size-4" /></button></div></div>
    </div>
  );
}

function TransactionCard({ item, onEdit, onDelete }: { item: Transaction; onEdit: () => void; onDelete: () => void }) { return <article className="rounded-2xl border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-medium">{item.description}</h2><p className="mt-1 text-xs text-muted-foreground">{item.categoryName} · {item.accountName}</p></div><p className={`shrink-0 font-semibold ${item.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{item.type === "INCOME" ? "+" : "−"}{formatRupiah(item.amount)}</p></div><div className="mt-4 flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">{formatDate(item.transactionDate)}</span><div className="flex"><IconButton label="Edit" onClick={onEdit}><Pencil /></IconButton><IconButton label="Hapus" onClick={onDelete} destructive><Trash2 /></IconButton></div></div></article>; }
function IconButton({ label, children, onClick, destructive = false }: { label: string; children: React.ReactNode; onClick: () => void; destructive?: boolean }) { return <button className={`tap-target grid place-items-center rounded-lg [&>svg]:size-4 ${destructive ? "text-destructive" : "text-muted-foreground"}`} onClick={onClick} aria-label={label} type="button">{children}</button>; }
function LoadingRows() { return <div className="space-y-3" aria-label="Memuat transaksi">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>; }
function ReceiptEmpty() { return <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-muted"><LoaderCircle className="size-5 text-muted-foreground" /></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`)); }
