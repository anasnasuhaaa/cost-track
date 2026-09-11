import type { Metadata } from "next";
import { Globe2, UserRound } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ThemeMenu } from "@/components/layout/theme-menu";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pengaturan" };
export default async function SettingsPage() { const user = await requireUser(); return <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageHeader eyebrow="Preferensi" title="Pengaturan" description="Preferensi dasar untuk pengalaman Cost Track." /><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border bg-card p-5"><div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" /></span><div><h2 className="font-semibold">Profil</h2><p className="text-sm text-muted-foreground">Informasi akun aktif</p></div></div><dl className="space-y-4 text-sm"><div><dt className="text-muted-foreground">Nama</dt><dd className="mt-1 font-medium">{user.name}</dd></div><div><dt className="text-muted-foreground">Email</dt><dd className="mt-1 font-medium">{user.email}</dd></div></dl></section><section className="rounded-2xl border bg-card p-5"><div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Globe2 className="size-5" /></span><div><h2 className="font-semibold">Regional & tampilan</h2><p className="text-sm text-muted-foreground">IDR · id-ID · Asia/Jakarta</p></div></div><ThemeMenu /></section></div></div>; }
