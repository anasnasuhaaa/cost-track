"use client";

import { useCallback, useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Shapes, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = { id: string; name: string; type: "INCOME" | "EXPENSE"; isSystem: boolean };

export function CategoriesClient() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [archiveCandidate, setArchiveCandidate] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setItems(await response.json());
    } catch {
      toast.error("Kategori gagal dimuat.");
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
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.get("name"), type: data.get("type") }),
    });
    setBusy(false);
    if (!response.ok) {
      toast.error("Gagal menambah kategori.");
      return;
    }
    form.reset();
    toast.success("Kategori berhasil ditambahkan.");
    void load();
  }

  async function rename() {
    if (!editing) return;
    const name = renameValue.trim();
    if (!name || name === editing.name) {
      setEditing(null);
      return;
    }
    setBusy(true);
    const response = await fetch(`/api/categories/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Gagal memperbarui kategori.");
      return;
    }
    toast.success("Kategori diperbarui.");
    setEditing(null);
    void load();
  }

  async function archive() {
    if (!archiveCandidate) return;
    setBusy(true);
    const response = await fetch(`/api/categories/${archiveCandidate.id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Gagal menghapus kategori.");
      return;
    }
    toast.success("Kategori dihapus.");
    setArchiveCandidate(null);
    void load();
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Tabs defaultValue="EXPENSE">
          <TabsList className="h-11 w-full max-w-sm grid-cols-2">
            <TabsTrigger value="EXPENSE"><TrendingDown /> Pengeluaran</TabsTrigger>
            <TabsTrigger value="INCOME"><TrendingUp /> Pemasukan</TabsTrigger>
          </TabsList>
          {(["EXPENSE", "INCOME"] as const).map((type) => (
            <TabsContent key={type} value={type}>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div><CardTitle>{type === "EXPENSE" ? "Kategori pengeluaran" : "Kategori pemasukan"}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{items.filter((item) => item.type === type).length} kategori aktif</p></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? [0, 1, 2, 3].map((item) => <Skeleton className="h-14 rounded-xl" key={item} />) : items.filter((item) => item.type === type).map((item) => <CategoryRow item={item} key={item.id} onArchive={setArchiveCandidate} onEdit={(category) => { setEditing(category); setRenameValue(category.name); }} />)}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="h-fit xl:sticky xl:top-8">
          <CardHeader><CardTitle>Kategori baru</CardTitle><p className="text-sm text-muted-foreground">Tambahkan klasifikasi yang sesuai dengan kebiasaanmu.</p></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={create}>
              <div className="space-y-2"><Label htmlFor="category-name">Nama kategori</Label><Input id="category-name" name="name" maxLength={60} required placeholder="Kebutuhan rumah" /></div>
              <div className="space-y-2">
                <Label>Jenis kategori</Label>
                <Select defaultValue="EXPENSE" name="type">
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="EXPENSE">Pengeluaran</SelectItem><SelectItem value="INCOME">Pemasukan</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="w-full" disabled={busy} size="lg" type="submit"><Plus /> Tambah kategori</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ubah nama kategori</DialogTitle><DialogDescription>Perubahan nama juga akan terlihat pada transaksi lama.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="rename-category">Nama kategori</Label><Input id="rename-category" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={60} autoFocus /></div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button disabled={busy || !renameValue.trim()} onClick={() => void rename()}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(archiveCandidate)} onOpenChange={(open) => { if (!open) setArchiveCandidate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2 /></AlertDialogMedia><AlertDialogTitle>Hapus kategori?</AlertDialogTitle><AlertDialogDescription>Kategori “{archiveCandidate?.name}” tidak lagi tersedia untuk transaksi baru. Riwayat yang sudah ada tetap tersimpan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel><AlertDialogAction disabled={busy} variant="destructive" onClick={() => void archive()}>Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CategoryRow({ item, onArchive, onEdit }: { item: Category; onArchive: (item: Category) => void; onEdit: (item: Category) => void }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-xl border bg-background px-3 transition-colors hover:bg-muted/40">
      <span className={`grid size-9 place-items-center rounded-lg ${item.type === "INCOME" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}><Shapes className="size-4" /></span>
      <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
      {item.isSystem ? <Badge variant="secondary">Bawaan</Badge> : null}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button aria-label={`Aksi untuk ${item.name}`} size="icon" variant="ghost" />}><MoreHorizontal /></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="h-11" onClick={() => onEdit(item)}><Pencil /> Ubah nama</DropdownMenuItem>
          <DropdownMenuItem className="h-11" onClick={() => onArchive(item)} variant="destructive"><Trash2 /> Hapus</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
