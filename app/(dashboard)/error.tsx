"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

export default function DashboardError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="grid min-h-[70dvh] place-items-center p-6"><div className="max-w-md text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive"><CircleAlert className="size-5" /></span><h1 className="mt-5 font-heading text-2xl font-semibold">Halaman belum dapat dimuat</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Periksa koneksi database lalu coba kembali. Detail internal tidak ditampilkan demi keamanan.</p><button className="tap-target mx-auto mt-5 flex items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={reset}><RotateCcw className="size-4" />Coba lagi</button></div></main>;
}
