"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, CalendarCheck, CircleDollarSign, LoaderCircle, PenLine, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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

  const defaultAccount = useMemo(() => accounts.find((item) => item.isDefault)?.id ?? accounts[0]?.id ?? "", [accounts]);

  function close() {
    setOpen(false);
    setEditing(null);
    setMode("choice");
  }

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
    toast.success(editing?.id ? "Transaksi berhasil diperbarui." : "Transaksi berhasil ditambahkan.");
    close();
    router.refresh();
    window.dispatchEvent(new CustomEvent("cost-track:transactions-changed"));
  }

  const title = editing ? "Edit transaksi" : mode === "choice" ? "Tambah transaksi" : mode === "ai" ? "Catat dengan AI" : "Input manual";

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:p-6">
        <SheetHeader className="p-0 pr-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary"><CircleDollarSign className="size-4" />Quick Add</div>
          <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
          <SheetDescription>{editing ? "Perbarui detail lalu simpan perubahan." : mode === "choice" ? "Pilih cara tercepat untuk mencatat transaksi." : mode === "ai" ? "Tulis seperti kamu biasa bercerita." : "Lengkapi detail transaksi."}</SheetDescription>
        </SheetHeader>

        {mode !== "choice" && !editing ? <Button className="w-fit px-0" variant="ghost" onClick={() => { setMode("choice"); setEditing(null); }}><ArrowLeft />Kembali</Button> : null}

        {mode === "choice" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="group h-auto min-h-36 flex-col items-start whitespace-normal rounded-xl border bg-primary/5 p-5 text-left text-foreground hover:border-primary hover:bg-primary/10" onClick={() => setMode("ai")} type="button" variant="outline">
              <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-5" /></span>
              <strong className="mt-5 block">Catat dengan AI</strong>
              <span className="mt-1 block text-sm leading-5 text-muted-foreground">Tulis “kopi 15k” lalu tinjau hasilnya.</span>
            </Button>
            <Button className="group h-auto min-h-36 flex-col items-start whitespace-normal rounded-xl border bg-card p-5 text-left text-foreground hover:border-primary hover:bg-accent/45" onClick={() => setMode("manual")} type="button" variant="outline">
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><PenLine className="size-5" /></span>
              <strong className="mt-5 block">Input manual</strong>
              <span className="mt-1 block text-sm leading-5 text-muted-foreground">Isi nominal dan detail transaksi langsung.</span>
            </Button>
          </div>
        ) : mode === "ai" ? (
          <SmartInputForm onResult={(draft) => { setEditing(draft); setMode("manual"); }} onManual={() => setMode("manual")} />
        ) : (
          <ManualForm key={editing ? `${editing.id ?? "ai"}-${editing.description}` : "new"} accounts={accounts} categories={categories} defaultAccount={defaultAccount} editing={editing} pending={pending} onSubmit={save} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ManualForm({ accounts, categories, defaultAccount, editing, pending, onSubmit }: { accounts: Account[]; categories: Category[]; defaultAccount: string; editing: EditableTransaction | null; pending: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">(editing?.type ?? "EXPENSE");
  const [date, setDate] = useState(editing?.transactionDate ?? jakartaToday());
  const visibleCategories = categories.filter((item) => item.type === type);
  const accountItems = accounts.map((item) => ({ value: item.id, label: item.name }));
  const categoryItems = visibleCategories.map((item) => ({ value: item.id, label: item.name }));

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {editing?.source === "AI" && !editing.id ? (
        <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/8 p-3 text-sm">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
          <p><strong className="block">Hasil analisis AI</strong><span className="text-muted-foreground">Periksa detail sebelum menyimpan.</span></p>
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Jenis transaksi</legend>
        <input type="hidden" name="type" value={type} />
        <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
          {(["EXPENSE", "INCOME"] as const).map((value) => (
            <Button key={value} className={`h-11 rounded-lg text-sm font-semibold transition ${type === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} type="button" variant="ghost" aria-pressed={type === value} onClick={() => setType(value)}>
              {value === "EXPENSE" ? "Pengeluaran" : "Pemasukan"}
            </Button>
          ))}
        </div>
      </fieldset>

      <Field label="Nominal" htmlFor="transaction-amount"><Input id="transaction-amount" className="h-12 text-lg font-bold" inputMode="numeric" name="amount" defaultValue={editing?.amount} placeholder="18.000" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Akun">
          <Select name="accountId" defaultValue={editing?.accountId ?? defaultAccount} items={accountItems} required>
            <SelectTrigger className="h-11 w-full bg-background px-3"><SelectValue placeholder="Pilih akun" /></SelectTrigger>
            <SelectContent>{accounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Kategori">
          <Select key={type} name="categoryId" defaultValue={editing?.type === type ? editing.categoryId : null} items={categoryItems} required>
            <SelectTrigger className="h-11 w-full bg-background px-3"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent>{visibleCategories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Deskripsi" htmlFor="transaction-description"><Input id="transaction-description" className="h-11" name="description" defaultValue={editing?.description} maxLength={160} placeholder="Ayam geprek" required /></Field>
      <Field label="Tanggal"><DatePicker name="transactionDate" value={date} onChange={setDate} /></Field>
      <Button className="w-full" size="lg" disabled={pending || !accounts.length || !visibleCategories.length} type="submit">
        {pending ? <LoaderCircle className="animate-spin" /> : <CalendarCheck />}{pending ? "Menyimpan..." : "Simpan transaksi"}
      </Button>
    </form>
  );
}

function SmartInputForm({ onResult, onManual }: { onResult: (draft: EditableTransaction) => void; onManual: () => void }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/ai/smart-input", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const body = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(body?.error ?? "AI sedang tidak tersedia. Kamu masih bisa mencatat transaksi secara manual.");
      return;
    }
    onResult(body);
  }

  return (
    <form className="space-y-4" onSubmit={analyze}>
      <div className="rounded-xl bg-secondary p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground"><Bot className="size-4" />Smart Input</div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Contoh: “ayam geprek 18k” atau “kemarin beli bensin 30rb pakai cash”.</p>
      </div>
      <Field label="Transaksimu" htmlFor="smart-transaction"><Textarea id="smart-transaction" className="min-h-32 resize-none" value={text} onChange={(event) => setText(event.target.value)} minLength={2} maxLength={300} required autoFocus placeholder="Ketik transaksi dengan bahasa sehari-hari..." /></Field>
      {error ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p> : null}
      <Button className="w-full" size="lg" disabled={pending || text.trim().length < 2} type="submit">{pending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}{pending ? "Menganalisis transaksi..." : "Analisis transaksi"}</Button>
      <Button className="w-full" variant="ghost" type="button" onClick={onManual}>Gunakan input manual</Button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
