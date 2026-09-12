import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { TransactionsClient } from "@/components/transactions/transactions-client";
import { QuickAddButton } from "@/components/transactions/quick-add-button";

export const metadata: Metadata = { title: "Transaksi" };

export default function TransactionsPage() {
  return <div className="page-container"><PageHeader eyebrow="Riwayat" title="Transaksi" description="Cari, filter, edit, dan kelola semua pemasukan serta pengeluaranmu." action={<QuickAddButton />} /><TransactionsClient /></div>;
}
