"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="grid min-h-[70dvh] place-items-center p-6"><div className="max-w-md text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive"><CircleAlert className="size-5" /></span><h1 className="mt-5 font-heading text-2xl font-semibold">Halaman belum dapat dimuat</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Periksa koneksi database lalu coba kembali. Detail internal tidak ditampilkan demi keamanan.</p><Button className="mt-5" onClick={reset}><RotateCcw />Coba lagi</Button></div></main>;
}
