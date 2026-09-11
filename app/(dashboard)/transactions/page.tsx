import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { TransactionsClient } from "@/components/transactions/transactions-client";

export const metadata: Metadata = { title: "Transaksi" };

export default function TransactionsPage() {
  return <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageHeader eyebrow="Riwayat" title="Transaksi" description="Cari, filter, edit, dan kelola semua pemasukan serta pengeluaranmu." /><TransactionsClient /></div>;
}
