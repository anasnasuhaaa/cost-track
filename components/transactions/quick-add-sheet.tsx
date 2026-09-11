"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bot, LoaderCircle, PenLine, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { jakartaToday } from "@/lib/finance/calculations";

type Account = { id: string; name: string; isDefault: boolean };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };
type EditableTransaction = {
  id?: string;
  type?: "INCOME" | "EXPENSE";
  amount?: number;
  accountId?: string;
  categoryId?: string;
  description?: string;
  transactionDate?: string;
  source?: "MANUAL" | "AI";
};

export function QuickAddSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choice" | "manual" | "ai">("choice");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<EditableTransaction | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function handle(event: Event) {
      const detail = (event as CustomEvent<EditableTransaction>).detail;
      setEditing(detail ?? null);
      setMode(detail ? "manual" : "choice");
      setOpen(true);
    }
    window.addEventListener("cost-track:quick-add", handle);
    return () => window.removeEventListener("cost-track:quick-add", handle);
  }, []);

  useEffect(() => {
    if (!open) return;
    Promise.all([fetch("/api/accounts", { cache: "no-store" }), fetch("/api/categories", { cache: "no-store" })])
      .then(async ([accountResponse, categoryResponse]) => {
        if (!accountResponse.ok || !categoryResponse.ok) throw new Error();
        setAccounts(await accountResponse.json());
        setCategories(await categoryResponse.json());
      })
      .catch(() => toast.error("Pilihan akun dan kategori gagal dimuat."));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const defaultAccount = useMemo(() => accounts.find((item) => item.isDefault)?.id ?? accounts[0]?.id ?? "", [accounts]);
  if (!open) return null;

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      type: form.get("type"),
      amount: Number(String(form.get("amount")).replace(/\D/g, "")),
      accountId: form.get("accountId"),
      categoryId: form.get("categoryId"),
      description: form.get("description"),
      transactionDate: form.get("transactionDate"),
      source: editing?.source ?? "MANUAL",
    };
    const response = await fetch(editing?.id ? `/api/transactions/${editing.id}` : "/api/transactions", {
      method: editing?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Gagal menyimpan transaksi.");
      return;
    }
    toast.success(editing?.id ? "Transaksi berhasil diperbarui" : "Transaksi berhasil ditambahkan");
    setOpen(false);
    setEditing(null);
    router.refresh();
    window.dispatchEvent(new CustomEvent("cost-track:transactions-changed"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
      <button className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} aria-label="Tutup" />
      <section className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <div><p className="text-sm font-semibold text-primary">Quick Add</p><h2 id="quick-add-title" className="font-heading text-2xl font-semibold">{editing ? "Edit transaksi" : mode === "choice" ? "Mau catat bagaimana?" : mode === "ai" ? "Catat dengan AI" : "Input manual"}</h2></div>
          <button className="tap-target grid place-items-center rounded-xl hover:bg-muted" onClick={() => setOpen(false)} type="button" aria-label="Tutup Quick Add"><X className="size-5" /></button>
        </div>
        {mode === "choice" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="min-h-32 rounded-2xl border bg-primary/5 p-5 text-left transition hover:border-primary" onClick={() => setMode("ai")} type="button"><Sparkles className="mb-5 size-6 text-primary" /><strong className="block">Catat dengan AI</strong><span className="mt-1 block text-sm text-muted-foreground">Tulis “kopi 15k” lalu tinjau.</span></button>
            <button className="min-h-32 rounded-2xl border p-5 text-left transition hover:border-primary" onClick={() => setMode("manual")} type="button"><PenLine className="mb-5 size-6" /><strong className="block">Input Manual</strong><span className="mt-1 block text-sm text-muted-foreground">Isi detail transaksi langsung.</span></button>
          </div>
        ) : mode === "ai" ? (
          <SmartInputForm onResult={(draft) => { setEditing(draft); setMode("manual"); }} onManual={() => setMode("manual")} />
        ) : (
          <ManualForm key={editing ? `${editing.id ?? "ai"}-${editing.description}` : "new"} accounts={accounts} categories={categories} defaultAccount={defaultAccount} editing={editing} pending={pending} onSubmit={save} />
        )}
      </section>
    </div>
  );
}

function ManualForm({ accounts, categories, defaultAccount, editing, pending, onSubmit }: { accounts: Account[]; categories: Category[]; defaultAccount: string; editing: EditableTransaction | null; pending: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">(editing?.type ?? "EXPENSE");
  const visibleCategories = categories.filter((item) => item.type === type);
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {editing?.source === "AI" && !editing.id ? <div className="flex gap-3 rounded-xl bg-primary/10 p-3 text-sm"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" /><p><strong className="block">Hasil analisis AI</strong><span className="text-muted-foreground">Periksa dan edit detail sebelum menyimpan.</span></p></div> : null}
      <fieldset><legend className="mb-2 text-sm font-medium">Jenis</legend><div className="grid grid-cols-2 rounded-xl bg-muted p-1">{(["EXPENSE", "INCOME"] as const).map((value) => <label key={value} className={`flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold ${type === value ? "bg-card shadow-sm" : "text-muted-foreground"}`}><input className="sr-only" type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} />{value === "EXPENSE" ? "− Pengeluaran" : "+ Pemasukan"}</label>)}</div></fieldset>
      <Field label="Nominal"><input className="h-12 w-full rounded-xl border bg-background px-3 text-lg font-semibold" inputMode="numeric" name="amount" defaultValue={editing?.amount} placeholder="18.000" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Akun"><select className="h-12 w-full rounded-xl border bg-background px-3" name="accountId" defaultValue={editing?.accountId ?? defaultAccount} required><option value="" disabled>Pilih akun</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Kategori"><select key={type} className="h-12 w-full rounded-xl border bg-background px-3" name="categoryId" defaultValue={editing?.type === type ? editing.categoryId : ""} required><option value="" disabled>Pilih kategori</option>{visibleCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      </div>
      <Field label="Deskripsi"><input className="h-12 w-full rounded-xl border bg-background px-3" name="description" defaultValue={editing?.description} maxLength={160} placeholder="Ayam geprek" required /></Field>
      <Field label="Tanggal"><input className="h-12 w-full rounded-xl border bg-background px-3" type="date" name="transactionDate" defaultValue={editing?.transactionDate ?? jakartaToday()} required /></Field>
      <button className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60" disabled={pending || !accounts.length || !visibleCategories.length} type="submit">{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Menyimpan..." : "Simpan transaksi"}</button>
    </form>
  );
}

function SmartInputForm({ onResult, onManual }: { onResult: (draft: EditableTransaction) => void; onManual: () => void }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const response = await fetch("/api/ai/smart-input", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const body = await response.json().catch(() => null); setPending(false);
    if (!response.ok) { setError(body?.error ?? "AI sedang tidak tersedia. Kamu masih bisa mencatat transaksi secara manual."); return; }
    onResult(body);
  }
  return <form className="space-y-4" onSubmit={analyze}><div className="rounded-2xl bg-primary/10 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-primary"><Bot className="size-4" />Smart Input</div><p className="mt-2 text-sm text-muted-foreground">Tulis transaksi dengan bahasa sehari-hari. Tidak ada transaksi yang disimpan sebelum kamu meninjau hasilnya.</p></div><label className="block space-y-2 text-sm font-medium"><span>Transaksimu</span><textarea className="min-h-28 w-full resize-none rounded-2xl border bg-background p-3" value={text} onChange={(event) => setText(event.target.value)} minLength={2} maxLength={300} required autoFocus placeholder="Contoh: kemarin ayam geprek 18k pakai cash" /></label>{error ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p> : null}<button className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60" disabled={pending || text.trim().length < 2}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{pending ? "Menganalisis transaksi..." : "Analisis transaksi"}</button><button className="tap-target w-full rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted" type="button" onClick={onManual}>Gunakan input manual</button></form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2 text-sm font-medium"><span>{label}</span>{children}</label>; }
