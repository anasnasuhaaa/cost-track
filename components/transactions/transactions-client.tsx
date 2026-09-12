"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, ReceiptText, Search, SlidersHorizontal, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    } catch {
      toast.error("Daftar transaksi gagal dimuat.");
    } finally {
      setLoading(false);
    }
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

  async function remove() {
    if (!deleteCandidate) return;
    setDeleting(true);
    const response = await fetch(`/api/transactions/${deleteCandidate.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!response.ok) {
      toast.error("Gagal menghapus transaksi.");
      return;
    }
    setDeleteCandidate(null);
    toast.success("Transaksi berhasil dihapus.");
    void load();
  }

  function edit(item: Transaction) {
    window.dispatchEvent(new CustomEvent("cost-track:quick-add", { detail: item }));
  }

  function resetFilters() {
    setType(""); setAccountId(""); setCategoryId(""); setFrom(""); setTo(""); setPage(1);
  }

  const typeItems = [{ value: "", label: "Semua jenis" }, { value: "EXPENSE", label: "Pengeluaran" }, { value: "INCOME", label: "Pemasukan" }];
  const categoryItems = [{ value: "", label: "Semua kategori" }, ...categories.map((item) => ({ value: item.id, label: item.name }))];
  const accountItems = [{ value: "", label: "Semua akun" }, ...accounts.map((item) => ({ value: item.id, label: item.name }))];
  const activeFilters = [type, accountId, categoryId, from, to].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <section className="surface-card space-y-3 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto_auto]">
          <label className="relative"><span className="sr-only">Cari transaksi</span><Search className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 bg-background pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari deskripsi..." /></label>
          <Select value={type} onValueChange={(value) => { setType(value ?? ""); setPage(1); }} items={typeItems}>
            <SelectTrigger className="h-11 w-full bg-background px-3"><SelectValue /></SelectTrigger>
            <SelectContent>{typeItems.map((item) => <SelectItem key={item.value || "all"} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setFiltersOpen((value) => !value)} type="button"><SlidersHorizontal />Filter{activeFilters ? <Badge className="ml-1 h-5 min-w-5 px-1.5">{activeFilters}</Badge> : null}</Button>
          <Button className="hidden sm:inline-flex" onClick={() => window.dispatchEvent(new CustomEvent("cost-track:quick-add"))} type="button"><Plus />Tambah</Button>
        </div>

        {filtersOpen ? (
          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select value={categoryId} onValueChange={(value) => { setCategoryId(value ?? ""); setPage(1); }} items={categoryItems}>
              <SelectTrigger className="h-11 w-full bg-background px-3"><SelectValue /></SelectTrigger>
              <SelectContent>{categoryItems.map((item) => <SelectItem key={item.value || "all"} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={accountId} onValueChange={(value) => { setAccountId(value ?? ""); setPage(1); }} items={accountItems}>
              <SelectTrigger className="h-11 w-full bg-background px-3"><SelectValue /></SelectTrigger>
              <SelectContent>{accountItems.map((item) => <SelectItem key={item.value || "all"} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
            <DatePicker ariaLabel="Filter dari tanggal" placeholder="Dari tanggal" value={from} onChange={(value) => { setFrom(value); setPage(1); }} />
            <DatePicker ariaLabel="Filter sampai tanggal" placeholder="Sampai tanggal" value={to} onChange={(value) => { setTo(value); setPage(1); }} />
            {activeFilters ? <Button className="sm:col-span-2 xl:col-span-4 xl:justify-self-end" variant="ghost" onClick={resetFilters} type="button">Reset semua filter</Button> : null}
          </div>
        ) : null}
      </section>

      {loading ? <LoadingRows /> : result.items.length === 0 ? (
        <div className="surface-card border-dashed px-5 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><ReceiptText className="size-6" /></span>
          <h2 className="mt-4 font-heading text-lg font-semibold">Belum ada transaksi yang sesuai</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ubah filter atau catat transaksi pertamamu.</p>
          <Button className="mt-5" onClick={() => window.dispatchEvent(new CustomEvent("cost-track:quick-add"))}><Plus />Tambah transaksi</Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">{result.items.map((item) => <TransactionCard key={item.id} item={item} onEdit={() => edit(item)} onDelete={() => setDeleteCandidate(item)} />)}</div>
          <div className="surface-card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b bg-muted/55 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3.5">Tanggal</th><th className="px-5 py-3.5">Deskripsi</th><th className="px-5 py-3.5">Kategori</th><th className="px-5 py-3.5">Akun</th><th className="px-5 py-3.5">Sumber</th><th className="px-5 py-3.5 text-right">Nominal</th><th className="w-16 px-4 py-3.5"><span className="sr-only">Aksi</span></th></tr></thead>
              <tbody className="divide-y">{result.items.map((item) => (
                <tr key={item.id} className="transition hover:bg-muted/35">
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatDate(item.transactionDate)}</td>
                  <td className="max-w-56 px-5 py-4 font-semibold"><span className="block truncate">{item.description}</span></td>
                  <td className="px-5 py-4 text-muted-foreground">{item.categoryName}</td>
                  <td className="px-5 py-4 text-muted-foreground">{item.accountName}</td>
                  <td className="px-5 py-4"><Badge variant={item.source === "AI" ? "default" : "secondary"}>{item.source === "AI" ? <Sparkles /> : null}{item.source === "AI" ? "AI" : "Manual"}</Badge></td>
                  <td className={`whitespace-nowrap px-5 py-4 text-right font-bold ${item.type === "INCOME" ? "text-success" : "text-foreground"}`}><span className="sr-only">{item.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</span>{item.type === "INCOME" ? "+" : "−"}{formatRupiah(item.amount)}</td>
                  <td className="px-4 py-4"><ActionMenu onEdit={() => edit(item)} onDelete={() => setDeleteCandidate(item)} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{result.total} transaksi</span><div className="flex items-center gap-2"><Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Halaman sebelumnya"><ChevronLeft /></Button><span className="min-w-12 text-center">{page} / {result.pages}</span><Button size="icon" variant="outline" disabled={page >= result.pages} onClick={() => setPage((value) => value + 1)} aria-label="Halaman berikutnya"><ChevronRight /></Button></div></div>

      <AlertDialog open={Boolean(deleteCandidate)} onOpenChange={(open) => { if (!open && !deleting) setDeleteCandidate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2 /></AlertDialogMedia><AlertDialogTitle>Hapus transaksi?</AlertDialogTitle><AlertDialogDescription>Transaksi “{deleteCandidate?.description}” akan dihapus permanen dan tidak dapat dikembalikan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void remove()}>{deleting ? "Menghapus..." : "Hapus"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TransactionCard({ item, onEdit, onDelete }: { item: Transaction; onEdit: () => void; onDelete: () => void }) {
  return (
    <article className="surface-card p-4">
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.type === "INCOME" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{item.type === "INCOME" ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}</span>
        <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{item.description}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{item.categoryName} · {item.accountName}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.transactionDate)} · {item.source === "AI" ? "Dicatat AI" : "Manual"}</p></div>
        <div className="flex shrink-0 items-start gap-1"><p className={`pt-2 text-sm font-bold ${item.type === "INCOME" ? "text-success" : "text-foreground"}`}>{item.type === "INCOME" ? "+" : "−"}{formatRupiah(item.amount)}</p><ActionMenu onEdit={onEdit} onDelete={onDelete} /></div>
      </div>
    </article>
  );
}

function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger render={<Button aria-label="Buka menu transaksi" size="icon" variant="ghost" />}><MoreHorizontal className="size-5" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem className="h-11 gap-2" onClick={onEdit}><Pencil />Edit</DropdownMenuItem><DropdownMenuItem className="h-11 gap-2" variant="destructive" onClick={onDelete}><Trash2 />Hapus</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function LoadingRows() {
  return <div className="space-y-3" aria-label="Memuat transaksi">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`));
}
