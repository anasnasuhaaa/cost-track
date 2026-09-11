"use client";

import { Plus } from "lucide-react";

export function QuickAddButton() {
  return <button className="tap-target flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#102a25]" onClick={() => window.dispatchEvent(new CustomEvent("cost-track:quick-add"))} type="button"><Plus className="size-4" />Tambah transaksi</button>;
}
