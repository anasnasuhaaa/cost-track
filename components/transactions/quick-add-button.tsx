"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

export function QuickAddButton({ inverse = false }: { inverse?: boolean }) {
  return <Button className={cn(inverse && "bg-white text-violet-950 hover:bg-white/90")} size="lg" onClick={() => window.dispatchEvent(new CustomEvent("cost-track:quick-add"))} type="button"><Plus className="size-4" />Tambah transaksi</Button>;
}
